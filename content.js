(function () {

  let started = false;
  let cachedSettings = null;

  function getSettings(callback) {
    if (cachedSettings) { callback(cachedSettings); return; }
    HighlightGmail.getSettings(settings => {
      cachedSettings = settings;
      callback(settings);
    });
  }

  function readEmailDataFromRow(row) {
    // Unread: Gmail adds class 'zE' to unread rows
    const isUnread = row.classList.contains('zE');

    // Starred: aria-label is "Starred" (yellow star), "Starred with \"TYPE\"" (other types),
    // or "Not starred". Use ^= (starts-with) to catch all starred variants.
    const starEl = row.querySelector('[aria-label^="Starred"], [aria-label="Not starred"]');
    const starLabel = starEl ? starEl.getAttribute('aria-label') : '';
    const isStarred = starLabel.startsWith('Starred');
    // Extract star type slug: "Starred with \"blue-star\"" → "blue-star", "Starred" → "star"
    const starTypeMatch = starLabel.match(/Starred with "(.+?)"/);
    const starType = isStarred ? (starTypeMatch ? starTypeMatch[1] : 'star') : null;

    // Labels: Gmail renders label chips with class 'at'; text content is the label name
    const labelEls = row.querySelectorAll('.at');
    const labels = Array.from(labelEls).map(el => el.textContent.trim()).filter(Boolean);

    // From: prefer elements that carry an explicit 'email' attribute (avoids full-row text bleed)
    const fromEl = row.querySelector('[email]');
    const from = fromEl ? fromEl.getAttribute('email') : '';

    return { is_starred: isStarred, star_type: starType, is_unread: isUnread, labels, from };
  }

  function applyHighlightToRow(row, callback) {
    const emailData = readEmailDataFromRow(row);
    getSettings(settings => {
      const result = HighlightGmail.getHighlightColor(emailData, settings);
      row.style.backgroundColor = result ? result.backgroundColor : '';
      row.style.color = result ? result.textColor : '';
      if (callback) callback();
    });
  }

  function highlightAllRows(callback) {
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
    const main = document.querySelector('div[role="main"]');
    if (!main) { setTimeout(start, 500); return; }
    started = true;

    highlightAllRows();

    // Observe document.body rather than div[role="main"] — Gmail replaces main on
    // page/label navigation, which would leave an observer on a detached node.
    // document.body is never replaced, so the observer survives SPA navigation.
    const observer = new MutationObserver(mutations => {
      const rowsToUpdate = new Set();
      let needsFullRefresh = false;

      for (const m of mutations) {
        if (m.type === 'childList') {
          // New <tr> rows added → full refresh
          const hasNewRows = Array.from(m.addedNodes).some(n =>
            n.nodeType === 1 && (n.matches('tr') || n.querySelector('tr'))
          );
          if (hasNewRows) { needsFullRefresh = true; break; }

          // Gmail replaces the star button element on toggle (childList inside the row),
          // rather than mutating its aria-label in place. Walk up to find the parent row.
          const row = m.target.closest('tr.zA, tr[data-thread-id]');
          if (row) rowsToUpdate.add(row);
        }

        // Catch any cases where aria-label is mutated rather than the element replaced
        if (m.type === 'attributes' && m.attributeName === 'aria-label') {
          const row = m.target.closest('tr.zA, tr[data-thread-id]');
          if (row) rowsToUpdate.add(row);
        }
      }

      if (needsFullRefresh) {
        highlightAllRows();
      } else {
        for (const row of rowsToUpdate) {
          applyHighlightToRow(row);
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });

    // Belt-and-suspenders: Gmail uses hash-based routing (#inbox, #inbox/p2, #label/...).
    // Re-highlight after a short delay to let Gmail finish rendering the new rows.
    window.addEventListener('hashchange', () => {
      setTimeout(highlightAllRows, 300);
    });

    chrome.storage.onChanged.addListener(() => {
      cachedSettings = null;
      highlightAllRows();
    });
  }

  // Expose for tests
  if (typeof global !== 'undefined' && typeof module !== 'undefined') {
    global.HighlightGmail_applyHighlightToRow = applyHighlightToRow;
    global.HighlightGmail_highlightAllRows = highlightAllRows;
  }

  if (typeof window !== 'undefined') {
    start();
  }

})();
