const SPORTS_SERVER_URL = String(import.meta.env.VITE_SPORTS_SERVER_URL || import.meta.env.VITE_SMS_SERVER_URL || "").replace(/\/$/, "");

export class SportsApiError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "SportsApiError";
    this.code = code;
    this.status = status;
  }
}

export async function getSportsData(path, { params = {}, signal } = {}) {
  if (!SPORTS_SERVER_URL) throw new SportsApiError("API_ERROR", "Le service de données sportives est indisponible.");
  const url = new URL(`/sports/${path.replace(/^\//, "")}`, SPORTS_SERVER_URL);
  Object.entries(params).forEach(([key, value]) => { if (value) url.searchParams.set(key, value); });
  let response;
  try {
    response = await fetch(url, { method: "GET", headers: { Accept: "application/json" }, signal, credentials: "omit" });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new SportsApiError("API_ERROR", "Les données en direct sont momentanément indisponibles.");
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const code = payload?.error?.code || (response.status === 429 ? "RATE_LIMIT" : "API_ERROR");
    throw new SportsApiError(code, payload?.error?.message || "Les données en direct sont momentanément indisponibles.", response.status);
  }
  if (!payload || !Object.hasOwn(payload, "data")) throw new SportsApiError("INVALID_RESPONSE", "La réponse sportive est invalide.", response.status);
  return payload;
}
