export class NewsProvider {
  async searchCategory() { throw new Error('searchCategory must be implemented by a provider.'); }
  get name() { return 'abstract'; }
}
