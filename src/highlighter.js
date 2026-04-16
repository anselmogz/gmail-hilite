(function (global) {
  function getHighlightColor(emailData, settings) {
    if (!settings.enabled) return null;

    const { conditions, rules } = settings;

    if (conditions.starred.enabled && emailData.is_starred) {
      return conditions.starred.color;
    }
    if (conditions.unread.enabled && emailData.is_unread) {
      return conditions.unread.color;
    }
    for (const rule of rules) {
      if (rule.type === 'label' && Array.isArray(emailData.labels) && emailData.labels.includes(rule.value)) {
        return rule.color;
      }
      if (rule.type === 'sender' && typeof emailData.from === 'string' && emailData.from.includes(rule.value)) {
        return rule.color;
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
