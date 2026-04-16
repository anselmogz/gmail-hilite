(function (global) {
  const DEFAULT_SETTINGS = {
    enabled: true,
    conditions: {
      starred: { enabled: true, color: '#fff8c5' },
      unread:  { enabled: true, color: '#e8f0fe' },
    },
    rules: [],
  };

  function getSettings(callback) {
    chrome.storage.sync.get({ highlightGmailSettings: DEFAULT_SETTINGS }, result => {
      callback(result.highlightGmailSettings);
    });
  }

  function saveSettings(settings, callback) {
    chrome.storage.sync.set({ highlightGmailSettings: settings }, callback);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_SETTINGS, getSettings, saveSettings };
  } else {
    global.HighlightGmail = global.HighlightGmail || {};
    global.HighlightGmail.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    global.HighlightGmail.getSettings = getSettings;
    global.HighlightGmail.saveSettings = saveSettings;
  }
})(typeof window !== 'undefined' ? window : global);
