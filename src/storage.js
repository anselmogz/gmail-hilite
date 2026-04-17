(function (global) {
  const DEFAULT_SETTINGS = {
    enabled: true,
    rules: [
      { id: 'builtin:starred', type: 'starred', enabled: true, color: '#fff8c5', textColor: '' },
      { id: 'builtin:unread',  type: 'unread',  enabled: true, color: '#e8f0fe', textColor: '' },
    ],
  };

  // Converts old { conditions: { starred, unread }, rules: [] } shape to flat rules array
  function migrateSettings(stored) {
    if (!stored.conditions) return stored;
    const rules = [];
    if (stored.conditions.starred) {
      rules.push({ id: 'builtin:starred', type: 'starred', ...stored.conditions.starred });
    }
    if (stored.conditions.unread) {
      rules.push({ id: 'builtin:unread', type: 'unread', ...stored.conditions.unread });
    }
    (stored.rules || []).forEach(r => rules.push(r));
    return { enabled: stored.enabled !== false, rules };
  }

  function getSettings(callback) {
    chrome.storage.sync.get({ highlightGmailSettings: DEFAULT_SETTINGS }, result => {
      const stored = result.highlightGmailSettings;
      if (stored.conditions) {
        // Old format detected — migrate and persist so this only runs once
        const migrated = migrateSettings(stored);
        chrome.storage.sync.set({ highlightGmailSettings: migrated }, () => callback(migrated));
      } else {
        callback(stored);
      }
    });
  }

  function saveSettings(settings, callback) {
    chrome.storage.sync.set({ highlightGmailSettings: settings }, callback);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DEFAULT_SETTINGS, getSettings, saveSettings, migrateSettings };
  } else {
    global.HighlightGmail = global.HighlightGmail || {};
    global.HighlightGmail.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
    global.HighlightGmail.getSettings = getSettings;
    global.HighlightGmail.saveSettings = saveSettings;
  }
})(typeof window !== 'undefined' ? window : global);
