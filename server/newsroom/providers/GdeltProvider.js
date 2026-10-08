import { NewsProvider } from './NewsProvider.js';
import { searchCategory } from '../gdelt.js';

export class GdeltProvider extends NewsProvider {
  get name() { return 'GDELT DOC 2.0'; }
  async searchCategory(input) { return searchCategory(input); }
}

export function getNewsProvider(name = process.env.NEWS_PROVIDER || 'gdelt') {
  if (name.toLowerCase() === 'gdelt') return new GdeltProvider();
  throw new Error(`Unknown news provider: ${name}`);
}
