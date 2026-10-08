const { SportsError } = require("./errors.cjs");

const registry = new Map();

function registerSportsProvider(name, factory) {
  if (!name || typeof factory !== "function") throw new TypeError("A provider name and factory are required.");
  registry.set(name, factory);
}

function getSportsProvider(config = process.env) {
  const name = String(config.SPORTS_PROVIDER || "").trim();
  const factory = registry.get(name);
  if (!name || !factory) throw new SportsError("PROVIDER_NOT_CONFIGURED");
  if (!config.SPORTS_API_BASE_URL || !config.SPORTS_API_KEY) throw new SportsError("PROVIDER_NOT_CONFIGURED");
  return factory({
    baseUrl: config.SPORTS_API_BASE_URL,
    apiKey: config.SPORTS_API_KEY,
    host: config.SPORTS_API_HOST,
    version: config.SPORTS_API_VERSION,
  });
}

module.exports = { registerSportsProvider, getSportsProvider };
