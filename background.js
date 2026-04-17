// Service workers cannot load content_scripts files, so defaults are inlined here.
const DEFAULT_SETTINGS = {
  enabled: true,
  rules: [
    { id: 'builtin:starred', type: 'starred', enabled: true, color: '#fff8c5', textColor: '' },
    { id: 'builtin:unread',  type: 'unread',  enabled: true, color: '#e8f0fe', textColor: '' },
  ],
};

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason !== 'install') return;
  chrome.storage.sync.get({ highlightGmailSettings: DEFAULT_SETTINGS }, result => {
    chrome.storage.sync.set({ highlightGmailSettings: result.highlightGmailSettings });
  });
});
