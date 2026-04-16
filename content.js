(function () {
  // Exposed on global for unit-testability
  function applyHighlightToRow(row, callback) {
    const threadId = row.getAttribute('data-thread-id');
    if (!threadId) { if (callback) callback(); return; }

    const emailData = gmail.get.email_data(threadId);
    if (!emailData) { if (callback) callback(); return; }

    HighlightGmail.getSettings(settings => {
      const color = HighlightGmail.getHighlightColor(emailData, settings);
      row.style.backgroundColor = color || '';
      if (callback) callback();
    });
  }

  function highlightAllRows(callback) {
    const rows = Array.from(document.querySelectorAll('tr[data-thread-id]'));
    if (rows.length === 0) { if (callback) callback(); return; }
    let remaining = rows.length;
    rows.forEach(row => {
      applyHighlightToRow(row, () => {
        remaining--;
        if (remaining === 0 && callback) callback();
      });
    });
  }

  function start() {
    const main = document.querySelector('div[role="main"]');
    if (!main) { setTimeout(start, 500); return; }

    highlightAllRows();

    let debounceTimer;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(highlightAllRows, 100);
    });
    observer.observe(main, { childList: true, subtree: true });

    chrome.storage.onChanged.addListener(highlightAllRows);
  }

  // Expose for tests
  if (typeof global !== 'undefined' && typeof module !== 'undefined') {
    global.HighlightGmail_applyHighlightToRow = applyHighlightToRow;
    global.HighlightGmail_highlightAllRows = highlightAllRows;
  }

  // Only auto-start in browser context
  if (typeof window !== 'undefined' && typeof gmail !== 'undefined') {
    start();
  }
})();
