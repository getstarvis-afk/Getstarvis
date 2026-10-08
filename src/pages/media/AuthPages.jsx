import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  browserSessionPersistence, createUserWithEmailAndPassword,
  sendPasswordResetEmail, setPersistence,
  signInWithEmailAndPassword, signOut, updateProfile,
} from "firebase/auth";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { auth } from "../../firebase/config.js";
import { useAuth } from "../../context/useAuth.js";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

function firebaseMessage(code, mode) {
  if (code === "auth/too-many-requests") return "Trop de tentatives. Réessaie un peu plus tard.";
  if (code === "auth/network-request-failed") return "Connexion impossible. Vérifie ta connexion Internet.";
  if (code === "auth/weak-password") return "Choisis un mot de passe plus robuste.";
  if (mode === "login" && ["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) return "Adresse e-mail ou mot de passe incorrect.";
  if (mode === "signup" && code === "auth/email-already-in-use") return "Impossible de créer le compte avec ces informations. Essaie de te connecter ou de réinitialiser ton mot de passe.";
  if (code === "auth/invalid-email") return "Saisis une adresse e-mail valide.";
  return "La demande n’a pas abouti. Réessaie dans quelques instants.";
}

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const mode = location.pathname === "/inscription" ? "signup" : location.pathname === "/mot-de-passe-oublie" ? "reset" : "login";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  if (!authLoading && user) return <Navigate to="/compte" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const cleanEmail = email.trim().toLowerCase();
    if (mode === "signup") {
      if (!strongPassword.test(password)) {
        setError("Utilise au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole.");
        return;
      }
      if (password !== confirmation) {
        setError("Les deux mots de passe ne correspondent pas.");
        return;
      }
    }
    setBusy(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      if (mode === "reset") {
        try { await sendPasswordResetEmail(auth, cleanEmail, { url: "https://getstarvis.com/connexion" }); } catch { /* Keep the result generic to prevent account discovery. */ }
        setNotice("Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.");
        return;
      }
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        navigate("/compte", { replace: true });
        return;
      }
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (name.trim()) await updateProfile(credential.user, { displayName: name.trim().slice(0, 80) });
      navigate("/compte", { replace: true });
    } catch (authError) {
      setError(firebaseMessage(authError?.code, mode));
    } finally {
      setBusy(false);
    }
  };

  const isSignup = mode === "signup";
  const isReset = mode === "reset";
  return (
    <div className="auth-page site-container">
      <Link className="auth-back" to="/"><ArrowLeft size={15} /> Retour au média</Link>
      <div className="auth-layout">
        <section className="auth-story">
          <span className="eyebrow"><ShieldCheck size={14} /> UN ESPACE GETSTARVIS</span>
          <h1>{isReset ? "Retrouver l’accès à ton compte." : isSignup ? "Le monde en mouvement. À ton rythme." : "Retrouve ton espace GETSTARVIS."}</h1>
          <p>{isReset ? "Un lien sécurisé te permettra de choisir un nouveau mot de passe." : "Crée ton compte ou connecte-toi pour retrouver tes préférences GETSTARVIS."}</p>
          <div className="auth-promise"><LockKeyhole size={18} /><span>Mot de passe protégé par Firebase Authentication.</span></div>
          <div className="auth-promise"><Mail size={18} /><span>La vérification de l’adresse renforce la sécurité du compte.</span></div>
          <img className="auth-emblem" src="/brand/getstarvis-emblem.png" alt="" />
        </section>
        <section className="auth-card" aria-labelledby="auth-title">
          {!isReset && <div className="auth-tabs" role="tablist" aria-label="Choisir une action">
            <Link role="tab" aria-selected={!isSignup} className={!isSignup ? "auth-tab selected" : "auth-tab"} to="/connexion">Connexion</Link>
            <Link role="tab" aria-selected={isSignup} className={isSignup ? "auth-tab selected" : "auth-tab"} to="/inscription">Créer un compte</Link>
          </div>}
          <div className="auth-card-heading">
            <span className="eyebrow">{isReset ? "RÉINITIALISATION SÉCURISÉE" : isSignup ? "REJOINDRE GETSTARVIS" : "BON RETOUR"}</span>
            <h2 id="auth-title">{isReset ? "Mot de passe oublié ?" : isSignup ? "Créer un compte" : "Se connecter"}</h2>
            <p>{isReset ? "Indique l’adresse e-mail liée à ton compte." : isSignup ? "Quelques instants suffisent pour ouvrir ton espace." : "Accède à ton espace GETSTARVIS."}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isSignup && <label className="auth-field"><span>Nom affiché <small>Facultatif</small></span><div className="auth-input-wrap"><UserRound size={16} /><input autoComplete="name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ton nom" /></div></label>}
            <label className="auth-field"><span>Adresse e-mail</span><div className="auth-input-wrap"><Mail size={16} /><input autoComplete="email" type="email" inputMode="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nom@exemple.com" /></div></label>
            {!isReset && <label className="auth-field"><span>Mot de passe</span><div className="auth-input-wrap"><LockKeyhole size={16} /><input autoComplete={isSignup ? "new-password" : "current-password"} type={showPassword ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? "12 caractères minimum" : "Ton mot de passe"} /><button className="password-toggle" type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}
            {isSignup && <><label className="auth-field"><span>Confirmer le mot de passe</span><div className="auth-input-wrap"><LockKeyhole size={16} /><input autoComplete="new-password" type={showPassword ? "text" : "password"} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Saisis-le une seconde fois" /></div></label><ul className="password-rules"><li className={password.length >= 12 ? "rule-met" : ""}><Check size={13} /> 12 caractères minimum</li><li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? "rule-met" : ""}><Check size={13} /> Majuscule et minuscule</li><li className={/\d/.test(password) && /[^A-Za-z0-9]/.test(password) ? "rule-met" : ""}><Check size={13} /> Un chiffre et un symbole</li></ul></>}
            {error && <p className="auth-message auth-error" role="alert">{error}</p>}
            {notice && <p className="auth-message auth-notice" role="status">{notice}</p>}
            <button className="auth-submit" type="submit" disabled={busy || !email.trim() || (!isReset && !password)}>{busy ? "Un instant…" : isReset ? "Envoyer le lien" : isSignup ? "Créer mon compte" : "Me connecter"}<ArrowRight size={16} /></button>
          </form>
          {!isReset && !isSignup && <Link className="auth-forgot" to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>}
          {isReset && <p className="auth-switch">Tu as retrouvé ton mot de passe ? <Link to="/connexion">Connexion</Link></p>}
          <p className="auth-privacy">Tes identifiants sont traités par Firebase Authentication. GETSTARVIS ne stocke pas ton mot de passe.</p>
        </section>
      </div>
    </div>
  );
}

export function AccountPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="account-loading" role="status">Chargement du compte…</div>;
  if (!user) return <Navigate to="/connexion" replace />;

  const handleSignOut = async () => { await signOut(auth); navigate("/", { replace: true }); };

  return <div className="account-page site-container">
    <span className="eyebrow">ESPACE PERSONNEL GETSTARVIS</span>
    <h1>Bonjour{user.displayName ? ", " + user.displayName.split(" ")[0] : ""}.</h1>
    <p className="account-email">{user.email}</p>
    <div className="verification-card is-verified">
      <div className="verification-icon"><ShieldCheck size={21} /></div>
      <div><h2>Compte actif</h2><p>Ton compte est prêt. Tu peux utiliser GETSTARVIS avec cette adresse e-mail.</p></div>
    </div>
    <div className="account-actions"><Link to="/actualites" className="button button-dark">Continuer vers le média <ArrowRight size={15} /></Link><button type="button" className="account-signout" onClick={handleSignOut}>Se déconnecter</button></div>
  </div>;
}
