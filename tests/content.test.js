global.HighlightGmail = require('../src/storage');
global.HighlightGmail.getHighlightColor = require('../src/highlighter').getHighlightColor;

require('../content');

beforeEach(() => {
  chrome.storage.sync._reset();
  document.body.innerHTML = '';
});

function makeRow({ threadId, starred = false, unread = false, labels = [] } = {}) {
  const tr = document.createElement('tr');
  tr.className = 'zA' + (unread ? ' zE' : '');
  if (threadId) tr.setAttribute('data-thread-id', threadId);

  // Star element
  const starTd = document.createElement('td');
  const starBtn = document.createElement('div');
  starBtn.setAttribute('aria-label', starred ? 'Starred' : 'Not starred');
  starTd.appendChild(starBtn);
  tr.appendChild(starTd);

  // Label chips
  labels.forEach(label => {
    const chip = document.createElement('span');
    chip.className = 'av';
    chip.setAttribute('data-tooltip', label);
    chip.textContent = label;
    tr.appendChild(chip);
  });

  document.body.appendChild(tr);
  return tr;
}

describe('applyHighlightToRow', () => {
  test('sets starred background color on a starred row', done => {
    const row = makeRow({ threadId: 't1', starred: true });
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;
    HighlightGmail_applyHighlightToRow(row, () => {
      expect(row.style.backgroundColor).toBe('rgb(255, 248, 197)');
      done();
    });
  });

  test('sets unread background color on an unread non-starred row', done => {
    const row = makeRow({ threadId: 't2', unread: true });
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;
    HighlightGmail_applyHighlightToRow(row, () => {
      expect(row.style.backgroundColor).toBe('rgb(232, 240, 254)');
      done();
    });
  });

  test('clears background color on a read, non-starred row', done => {
    const row = makeRow({ threadId: 't3' });
    row.style.backgroundColor = '#fff8c5';
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;
    HighlightGmail_applyHighlightToRow(row, () => {
      expect(row.style.backgroundColor).toBe('');
      done();
    });
  });

  test('does not throw on rows without explicit thread-id attribute', done => {
    const row = makeRow({ starred: false }); // no threadId — but still appended
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;
    // Should not throw
    HighlightGmail_applyHighlightToRow(row, done);
  });
});

describe('highlightAllRows', () => {
  test('highlights all tr.zA rows in the document', done => {
    const row1 = makeRow({ threadId: 't1', starred: true });
    const row2 = makeRow({ threadId: 't2', starred: true });
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;
    HighlightGmail_highlightAllRows(() => {
      expect(row1.style.backgroundColor).toBe('rgb(255, 248, 197)');
      expect(row2.style.backgroundColor).toBe('rgb(255, 248, 197)');
      done();
    });
  });
});
