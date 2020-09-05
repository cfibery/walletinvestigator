class ApiCache {
  constructor(maxAge) {
    this.cache = {};
    this.maxAge = maxAge;
  }
  get(key) {
    return this.cache[key];
  }
  set(key, value) {
    this.cache[key] = { payload: value, timestamp: Date.now() };
    setTimeout(() => this.delete(key), this.maxAge);
  }
  delete(key) {
    delete this.cache[key];
  }
}

module.exports = ApiCache;
