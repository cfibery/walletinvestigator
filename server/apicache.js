class ApiCache {
  constructor(maxAge) {
    this.cache = {};
    this.maxAge = maxAge;
  }
  get(key) {
    return this.cache[key];
  }
  set(key, value, timestamp = Date.now()) {
    this.cache[key] = { payload: value, timestamp };
    const elapsed = Date.now() - timestamp;
    setTimeout(() => this.delete(key), this.maxAge - elapsed);
  }
  delete(key) {
    delete this.cache[key];
  }
}

module.exports = ApiCache;
