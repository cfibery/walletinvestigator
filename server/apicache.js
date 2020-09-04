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
  }
  isValid(key) {
    return Date.now() - this.cache[key]?.timestamp < this.maxAge;
  }
  delete(key) {
    delete this.cache[key];
  }
}

module.exports = ApiCache;
