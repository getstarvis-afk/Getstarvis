import { randomUUID } from 'node:crypto';
import { requireNewsroomEditor, sendError } from '../../server/newsroom/auth.js';
import { getAdminServices } from '../../server/newsroom/firebase.js';
import { checkEditorialConsistency, validHttpUrl } from '../../server/newsroom/editorial.js';

const maxLengths = { title: 180, standfirst: 360, articleBody: 18000, context: 3000, whyItMatters: 2000, whatWeKnow: 2000, whatToConfirm: 2000, socialCopy: 1500 };

export default async function handler(req, res) {
  if (!['GET','PATCH','POST'].includes(req.method)) return res.status(405).setHeader('Allow', 'GET, PATCH, POST').json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' } });
  try {
    const editor = await requireNewsroomEditor(req);
    const id = String(req.query?.id || '').replace(/[^a-f0-9-]/gi, '').slice(0, 80);
    if (!id) return res.status(400).json({ error: { code: 'MISSING_ID', message: 'Sujet introuvable.' } });
    const { db } = getAdminServices();
    const ref = db.collection('newsroomItems').doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return res.status(404).json({ error: { code: 'ITEM_NOT_FOUND', message: 'Ce sujet n’existe plus.' } });
    const current = { id, ...snapshot.data() };
    if (req.method === 'GET') return res.status(200).setHeader('Cache-Control', 'private, no-store').json({ item: current, consistency: checkEditorialConsistency(current) });
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const now = new Date().toISOString();
    let patch = {};
    let action = 'SAVE_DRAFT';
    if (req.method === 'PATCH') {
      if (current.status === 'PUBLISHED') return res.status(409).json({ error: { code: 'PUBLISHED_ITEM_LOCKED', message: 'Un article publié est verrouillé. Toute correction devra suivre un nouveau flux éditorial.' } });
      for (const [key, limit] of Object.entries(maxLengths)) if (typeof body[key] === 'string') patch[key] = body[key].trim().slice(0, limit);
      if (body.sources !== undefined) patch.sources = normalizeSources(body.sources);
      if (body.image !== undefined) patch.image = normalizeImage(body.image);
      if (body.visualPlan !== undefined) patch.visualPlan = String(body.visualPlan || '').slice(0, 1000);
      if (body.review !== undefined) patch.review = normalizeReview(body.review);
      if (body.confidence !== undefined) patch.confidence = Number.isFinite(Number(body.confidence)) ? Math.max(0, Math.min(100, Number(body.confidence))) : null;
      if (current.starverify === 'VERIFIED' || current.status === 'APPROVED') {
        patch.starverify = 'PENDING';
        patch.status = 'VERIFYING';
        patch.review = { sourceClaimsConfirmed: false, primarySourceVerified: false, independentCorroborationVerified: false, titleCertaintyReviewed: false, articleConsistencyReviewed: false, highRiskReviewed: false, imageMatchConfirmed: false, imageRightsReviewed: false };
        patch.reviewedAt = null; patch.reviewedBy = null; patch.approvedAt = null; patch.approvedBy = null;
      }
    } else {
      if (current.status === 'PUBLISHED') return res.status(409).json({ error: { code: 'PUBLISHED_ITEM_LOCKED', message: 'Un article publié est verrouillé.' } });
      action = String(body.action || '');
      const review = current.review || {};
      if (action === 'verify') {
        if (current.status === 'PUBLISHED' || current.status === 'APPROVED') return res.status(409).json({ error: { code: 'INVALID_TRANSITION', message: 'Un article déjà approuvé ou publié ne peut pas être revalidé par cette action.' } });
        const verifiedSources = (current.sources || []).filter((source) => source.verificationStatus === 'CONFIRMED_BY_EDITOR');
        const hasPrimary = review.primarySourceVerified === true && verifiedSources.some((source) => source.level === 'A_PRIMARY_CANDIDATE');
        const independentDomains = new Set(verifiedSources.filter((source) => source.independence === 'CONFIRMED_INDEPENDENT').map((source) => source.domain));
        const hasIndependentCorroboration = review.independentCorroborationVerified === true && independentDomains.size >= 2;
        if (!verifiedSources.length || !review.sourceClaimsConfirmed || (!hasPrimary && !hasIndependentCorroboration) || !review.titleCertaintyReviewed) return res.status(409).json({ error: { code: 'VERIFICATION_CHECKS_REQUIRED', message: 'Marque les sources effectivement consultées, vérifie les affirmations et le titre, et indique une source primaire ou deux sources indépendantes.' } });
        patch = { starverify: 'VERIFIED', status: 'VERIFIED', reviewedAt: now, reviewedBy: editor.email };
      } else if (action === 'reject') {
        patch = { starverify: 'REJECTED', status: 'REJECTED', rejectedAt: now, rejectedBy: editor.email, rejectionReason: String(body.reason || '').slice(0, 500) };
      } else if (action === 'watch') {
        patch = { status: 'WATCH', watchReason: String(body.reason || '').slice(0, 500) };
      } else if (action === 'approve') {
        if (current.status === 'PUBLISHED') return res.status(409).json({ error: { code: 'INVALID_TRANSITION', message: 'Cet article est déjà publié.' } });
        const consistency = checkEditorialConsistency(current);
        const verifiedSources = (current.sources || []).filter((source) => source.verificationStatus === 'CONFIRMED_BY_EDITOR');
        const primaryPassed = review.primarySourceVerified === true && verifiedSources.some((source) => source.level === 'A_PRIMARY_CANDIDATE');
        const independentDomains = new Set(verifiedSources.filter((source) => source.independence === 'CONFIRMED_INDEPENDENT').map((source) => source.domain));
        const independentPassed = review.independentCorroborationVerified === true && independentDomains.size >= 2;
        const imagePassed = !current.image || (review.imageMatchConfirmed === true && review.imageRightsReviewed === true && current.image.rightsStatus === 'LICENSE_KNOWN' && Boolean(current.image.credit) && Boolean(current.image.rightsEvidenceUrl));
        const sourceReviewPassed = verifiedSources.length > 0 && (primaryPassed || independentPassed) && review.sourceClaimsConfirmed === true && review.titleCertaintyReviewed === true && review.articleConsistencyReviewed === true && imagePassed;
        const highRiskReviewed = !consistency.highRisk || review.highRiskReviewed === true;
        if (current.starverify !== 'VERIFIED' || !sourceReviewPassed || !highRiskReviewed || !consistency.pass || !current.title || !current.articleBody) {
          return res.status(409).json({ error: { code: 'NOT_READY_FOR_REVIEW', message: 'Validation impossible : confirme les sources, le titre, le corps, la cohérence et les contrôles de risque.', blockers: [...consistency.blockers, ...(!sourceReviewPassed ? ['Contrôle éditorial des sources, du titre, de la cohérence et du visuel requis'] : []), ...(!highRiskReviewed ? ['Validation renforcée du sujet sensible requise'] : [])] } });
        }
        patch = { status: 'APPROVED', approvedAt: now, approvedBy: editor.email };
      } else if (action === 'publish') {
        if (current.status !== 'APPROVED') return res.status(409).json({ error: { code: 'APPROVAL_REQUIRED', message: 'Fais approuver cet article avant publication.' } });
        const baseSlug = slugify(current.title);
        const slug = baseSlug ? `${baseSlug}-${id.slice(0, 6)}`.slice(0, 90) : '';
        if (!slug || !current.articleBody || current.starverify !== 'VERIFIED') return res.status(409).json({ error: { code: 'PUBLICATION_BLOCKED', message: 'Le titre, le contenu original et la validation STARVERIFY sont obligatoires.' } });
        patch = { status: 'PUBLISHED', publishedAt: now, publishedBy: editor.email, slug };
      } else return res.status(400).json({ error: { code: 'UNKNOWN_ACTION', message: 'Action éditoriale inconnue.' } });
    }
    patch.updatedAt = now;
    const nextItem = { ...current, ...patch };
    const batch = db.batch();
    batch.set(ref, patch, { merge: true });
    batch.create(db.collection('newsroomAudit').doc(randomUUID()), { itemId: id, action, actorUid: editor.uid, actorEmail: editor.email, createdAt: now, previousStatus: current.status || null, nextStatus: patch.status || current.status || null });
    if (patch.status === 'PUBLISHED') {
      const publicArticle = toPublicArticle(nextItem, patch);
      batch.set(db.collection('publishedArticles').doc(patch.slug), publicArticle);
    }
    await batch.commit();
    const result = { ...nextItem, ...patch };
    return res.status(200).setHeader('Cache-Control', 'private, no-store').json({ item: result, consistency: checkEditorialConsistency(result) });
  } catch (error) { return sendError(res, error); }
}

function normalizeSources(value) {
  if (!Array.isArray(value)) throw Object.assign(new Error('Sources invalides.'), { status: 400, code: 'INVALID_SOURCES' });
  return value.slice(0, 24).map((source) => {
    const url = String(source.url || '').slice(0, 1500);
    if (!validHttpUrl(url)) throw Object.assign(new Error('Chaque source doit avoir une URL HTTP ou HTTPS valide.'), { status: 400, code: 'INVALID_SOURCE_URL' });
    return { ...source, url, title: String(source.title || '').slice(0, 400), domain: new URL(url).hostname.replace(/^www\./, ''), level: String(source.level || 'UNASSESSED'), verificationStatus: source.verificationStatus === 'CONFIRMED_BY_EDITOR' ? 'CONFIRMED_BY_EDITOR' : 'UNVERIFIED', independence: source.independence === 'CONFIRMED_INDEPENDENT' ? source.independence : 'UNKNOWN' };
  });
}
function normalizeImage(value) {
  if (!value) return null;
  const imageUrl = String(value.imageUrl || '').trim();
  if (!validHttpUrl(imageUrl)) throw Object.assign(new Error('URL du visuel invalide.'), { status: 400, code: 'INVALID_IMAGE_URL' });
  const rightsStatus = ['LICENSE_KNOWN','CHECK_REQUIRED','DO_NOT_USE'].includes(value.rightsStatus) ? value.rightsStatus : 'CHECK_REQUIRED';
  return { imageUrl, articleUrl: String(value.articleUrl || '').slice(0, 1500), sourceUrl: String(value.sourceUrl || '').slice(0, 1500), sourceDomain: String(value.sourceDomain || new URL(imageUrl).hostname).slice(0, 160), imageType: String(value.imageType || 'social_image'), imageSource: String(value.imageSource || 'GDELT article metadata'), credit: String(value.credit || '').slice(0, 300), publicationDate: String(value.publicationDate || '').slice(0, 40), imageDateIfKnown: value.imageDateIfKnown || null, rightsStatus, rightsNotes: String(value.rightsNotes || '').slice(0, 1000), rightsEvidenceUrl: validHttpUrl(value.rightsEvidenceUrl) ? value.rightsEvidenceUrl : '', altText: String(value.altText || '').slice(0, 300), caption: String(value.caption || '').slice(0, 500), recommendedUse: rightsStatus === 'LICENSE_KNOWN' ? 'EDITORIAL_REVIEW' : 'NEWSROOM_PREVIEW_ONLY', verificationStatus: value.verificationStatus === 'MATCH_CONFIRMED' ? value.verificationStatus : 'UNVERIFIED', gdeltImageReference: value.gdeltImageReference || null };
}
function normalizeReview(value) {
  const keys = ['sourceClaimsConfirmed','primarySourceVerified','independentCorroborationVerified','titleCertaintyReviewed','articleConsistencyReviewed','highRiskReviewed','imageMatchConfirmed','imageRightsReviewed'];
  return Object.fromEntries(keys.map((key) => [key, value?.[key] === true]));
}
function slugify(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,90); }
function toPublicArticle(item, patch) {
  const imageAllowed = item.image?.rightsStatus === 'LICENSE_KNOWN' && item.image?.verificationStatus === 'MATCH_CONFIRMED' && item.image?.credit && item.image?.rightsEvidenceUrl;
  return {
    slug: patch.slug, title: item.title, standfirst: item.standfirst || '', articleBody: item.articleBody,
    context: item.context || '', whyItMatters: item.whyItMatters || '', whatWeKnow: item.whatWeKnow || '', whatToConfirm: item.whatToConfirm || '',
    category: item.category, subcategory: item.subcategory, categoryId: item.categoryId, starverify: item.starverify,
    publishedAt: patch.publishedAt, image: imageAllowed ? item.image : null, visualPlan: item.visualPlan || 'Visuel original GETSTARVIS à préparer.',
    sources: (item.sources || []).filter((source) => source.verificationStatus === 'CONFIRMED_BY_EDITOR').map(({ title, url, domain, level, publishedAt }) => ({ title, url, domain, level, publishedAt })),
  };
}
