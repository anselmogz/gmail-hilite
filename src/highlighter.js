(function (global) {
  function getHighlightColor(emailData, settings) {
    if (!settings.enabled) return null;

    for (const rule of (settings.rules || [])) {
      if (!rule.enabled) continue;

      let matches = false;
      if (rule.type === 'starred') {
        matches = emailData.is_starred;
      } else if (rule.type === 'star-type') {
        matches = emailData.star_type === rule.value;
      } else if (rule.type === 'unread') {
        matches = emailData.is_unread;
      } else if (rule.type === 'label') {
        matches = Array.isArray(emailData.labels) && emailData.labels.includes(rule.value);
      } else if (rule.type === 'sender') {
        matches = typeof emailData.from === 'string' && emailData.from.includes(rule.value);
      }

      if (matches) {
        return { backgroundColor: rule.color, textColor: rule.textColor || '' };
      }
    }
    return null;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getHighlightColor };
  } else {
    global.HighlightGmail = global.HighlightGmail || {};
    global.HighlightGmail.getHighlightColor = getHighlightColor;
  }
})(typeof window !== 'undefined' ? window : global);
