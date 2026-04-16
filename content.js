(function () {

  let started = false;

  function readEmailDataFromRow(row) {
    // Unread: Gmail adds class 'zE' to unread rows
    const isUnread = row.classList.contains('zE');

    // Starred: the star toggle element has aria-label="Starred" when starred,
    // "Not starred" when not. Query for either and check the actual label value.
    const starEl = row.querySelector('[aria-label="Starred"], [aria-label="Not starred"]');
    const isStarred = !!starEl && starEl.getAttribute('aria-label') === 'Starred';

    // Labels: Gmail renders label chips with class 'av' and a data-tooltip
    const labelEls = row.querySelectorAll('.av[data-tooltip]');
    const labels = Array.from(labelEls).map(el => el.getAttribute('data-tooltip') || el.textContent.trim()).filter(Boolean);

    // From: the sender name element — Gmail uses class 'yX' or 'zF' for senders
    const fromEl = row.querySelector('.yX') || row.querySelector('.zF');
    const from = fromEl ? (fromEl.getAttribute('email') || fromEl.textContent.trim()) : '';

    return { is_starred: isStarred, is_unread: isUnread, labels, from };
  }

  function applyHighlightToRow(row, callback) {
    const emailData = readEmailDataFromRow(row);

    HighlightGmail.getSettings(settings => {
      const color = HighlightGmail.getHighlightColor(emailData, settings);
      row.style.backgroundColor = color || '';
      if (callback) callback();
    });
  }

  function highlightAllRows(callback) {
    // Gmail inbox thread rows have class 'zA'
    // Also include tr[data-thread-id] as a broader fallback
    const seen = new Set();
    const rows = [];
    document.querySelectorAll('tr.zA, tr[data-thread-id]').forEach(el => {
      if (!seen.has(el)) { seen.add(el); rows.push(el); }
    });

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
    if (started) return;
    started = true;
    const main = document.querySelector('div[role="main"]');
    if (!main) { setTimeout(start, 500); return; }

    highlightAllRows();

    let debounceTimer;
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(highlightAllRows, 150);
    });
    observer.observe(main, { childList: true, subtree: true });

    chrome.storage.onChanged.addListener(highlightAllRows);
  }

  // Expose for tests
  if (typeof global !== 'undefined' && typeof module !== 'undefined') {
    global.HighlightGmail_applyHighlightToRow = applyHighlightToRow;
    global.HighlightGmail_highlightAllRows = highlightAllRows;
  }

  // Start whenever running in a browser context
  if (typeof window !== 'undefined') {
    start();
  }

})();
