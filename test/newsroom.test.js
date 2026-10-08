import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGdeltUrl, deduplicateByUrl, normalizeGdeltArticle, parseGdeltDate, titleSimilarity } from '../server/newsroom/gdelt.js';
import { checkEditorialConsistency } from '../server/newsroom/editorial.js';
import { clusterResults } from '../server/newsroom/store.js';

const source = (title, url) => ({ source: { title, url }, canonicalUrl: url, categoryId: 'sport.football', category: 'Sport', subcategory: 'Football' });

test('normalise un résultat GDELT et garde une image comme métadonnée sans la déclarer libre', () => {
  const result = normalizeGdeltArticle({ title: 'Équipe X official announcement', url: 'https://www.example.com/story?utm_source=test#top', seendate: '20261008T140000Z', socialimage: 'https://img.example.com/news.jpg', language: 'English', sourcecountry: 'France' }, { categoryId: 'sport.football' });
  assert.equal(result.source.url, 'https://example.com/story');
  assert.equal(result.source.publishedAt, '2026-10-08T14:00:00.000Z');
  assert.equal(result.source.rightsStatus, 'CHECK_REQUIRED');
  assert.equal(result.source.level, 'UNASSESSED');
});

test('rejette une URL non HTTP et gère les dates GDELT invalides', () => {
  assert.equal(normalizeGdeltArticle({ title: 'Sujet', url: 'javascript:alert(1)' }, { categoryId: 'music.rap' }), null);
  assert.equal(parseGdeltDate('bad-date'), null);
});

test('construit les paramètres officiels avec limite maxrecords et fenêtre de recherche', () => {
  const url = new URL(buildGdeltUrl('(football OR soccer)', { maxRecords: 900, timespan: '24h', sort: 'datedesc' }));
  assert.equal(url.origin, 'https://api.gdeltproject.org');
  assert.equal(url.searchParams.get('mode'), 'artlist');
  assert.equal(url.searchParams.get('format'), 'json');
  assert.equal(url.searchParams.get('maxrecords'), '250');
  assert.equal(url.searchParams.get('timespan'), '24h');
});

test('déduplique les URL identiques sans effacer deux sources distinctes d’un même événement', () => {
  const candidates = [source('Artist confirms a new album', 'https://a.example/story'), source('Artist confirms a new album', 'https://b.example/story'), source('Artist confirms a new album', 'https://a.example/story')];
  const unique = deduplicateByUrl(candidates);
  assert.equal(unique.length, 2);
  assert.equal(clusterResults(unique).length, 1);
});

test('mesure la similarité de titres sans fusionner des sujets sans rapport', () => {
  assert.ok(titleSimilarity('Artist X announces a new album', 'Artist X reveals a new album') > 0.5);
  assert.equal(titleSimilarity('Artist X announces a new album', 'Rugby club confirms player transfer'), 0);
});

test('bloque un titre trop catégorique quand ses sources restent prudentes', () => {
  const result = checkEditorialConsistency({ category: 'Sport', title: 'Joueur X rejoint officiellement le club Y', articleBody: 'Le joueur X pourrait rejoindre le club Y selon plusieurs informations.', sources: [{ title: 'Joueur X pourrait rejoindre le club Y', url: 'https://example.com/a' }], image: null });
  assert.equal(result.checks.titleCertainty.pass, false);
  assert.ok(result.blockers.includes('TITLE TOO CERTAIN'));
});

test('détecte le mélange d’un article sportif avec un corps consacré à la musique', () => {
  const result = checkEditorialConsistency({ category: 'Sport', title: 'Joueur X blessé', articleBody: 'La chanteuse prépare son nouvel album et une tournée internationale.', sources: [{ title: 'Joueur X blessé', url: 'https://example.com/a' }], image: null });
  assert.equal(result.checks.titleBody.pass, false);
  assert.equal(result.checks.categoryMatch.pass, false);
});

test('ne considère pas les sources GDELT comme confirmation et bloque les droits image inconnus', () => {
  const result = checkEditorialConsistency({ category: 'Music', title: 'Artiste annonce un nouvel album', articleBody: 'Cet artiste annonce un nouvel album cette semaine.', sources: [{ title: 'Artiste annonce un nouvel album', url: 'https://example.com/a', verificationStatus: 'UNVERIFIED' }], image: { imageUrl: 'https://img.example/a.jpg', rightsStatus: 'CHECK_REQUIRED' } });
  assert.equal(result.checks.sourcesPresent.pass, true);
  assert.equal(result.checks.imageRights.pass, false);
});
