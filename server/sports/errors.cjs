const STATUS_BY_CODE = Object.freeze({
  API_ERROR: 502, RATE_LIMIT: 503, TIMEOUT: 504, INVALID_RESPONSE: 502,
  MISSING_DATA: 502, STALE_DATA: 503, AUTHENTICATION_ERROR: 503,
  NO_MATCHES: 200, UNKNOWN_COMPETITION: 400, UNKNOWN_SPORT: 400,
  PROVIDER_NOT_CONFIGURED: 503, CACHE_REFRESHING: 503,
});

class SportsError extends Error {
  constructor(code, message = code, options = {}) {
    super(message, options);
    this.name = "SportsError";
    this.code = code;
    this.status = STATUS_BY_CODE[code] || 500;
  }
}

function publicError(error) {
  const code = STATUS_BY_CODE[error?.code] ? error.code : "API_ERROR";
  const messages = {
    RATE_LIMIT: "Le service sportif a atteint sa limite de requêtes.",
    TIMEOUT: "Le service sportif met trop de temps à répondre.",
    INVALID_RESPONSE: "La réponse du service sportif est invalide.",
    MISSING_DATA: "Certaines données sportives sont indisponibles.",
    STALE_DATA: "Les données sportives ne sont plus assez récentes.",
    AUTHENTICATION_ERROR: "Le service de données sportives est mal configuré.",
    NO_MATCHES: "Aucun match disponible.",
    UNKNOWN_COMPETITION: "Compétition inconnue.",
    UNKNOWN_SPORT: "Sport inconnu.",
    PROVIDER_NOT_CONFIGURED: "Les données en direct sont momentanément indisponibles.",
    CACHE_REFRESHING: "Les données en direct sont momentanément indisponibles.",
    API_ERROR: "Les données en direct sont momentanément indisponibles.",
  };
  return { code, message: messages[code] };
}

module.exports = { SportsError, publicError };
