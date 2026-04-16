chrome.runtime.onInstalled.addListener(details => {
  if (details.reason !== 'install') return;
  HighlightGmail.getSettings(existing => {
    // getSettings returns DEFAULT_SETTINGS if nothing is stored yet;
    // saving it explicitly ensures storage is populated on first install.
    HighlightGmail.saveSettings(existing);
  });
});
