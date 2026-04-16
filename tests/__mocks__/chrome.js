const storage = {};

const chrome = {
  storage: {
    sync: {
      get(keys, callback) {
        const defaults = typeof keys === 'object' && !Array.isArray(keys) ? keys : {};
        const result = {};
        const queryKeys = Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : Object.keys(defaults);
        queryKeys.forEach(k => {
          result[k] = storage[k] !== undefined ? storage[k] : defaults[k];
        });
        callback(result);
      },
      set(items, callback) {
        Object.assign(storage, items);
        if (callback) callback();
      },
      _reset() { Object.keys(storage).forEach(k => delete storage[k]); },
      _store: storage,
    },
    onChanged: {
      _listeners: [],
      addListener(fn) { this._listeners.push(fn); },
      removeListener(fn) { this._listeners = this._listeners.filter(l => l !== fn); },
      _trigger(changes) { this._listeners.forEach(fn => fn(changes, 'sync')); },
    },
  },
  runtime: {
    onInstalled: {
      _listeners: [],
      addListener(fn) { this._listeners.push(fn); },
      _trigger(details) { this._listeners.forEach(fn => fn(details)); },
    },
  },
};

module.exports = chrome;
