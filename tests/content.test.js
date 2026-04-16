// Provide browser globals that content.js needs
global.HighlightGmail = require('../src/storage');
global.HighlightGmail.getHighlightColor = require('../src/highlighter').getHighlightColor;

// Mock Gmail object
const mockEmailData = { is_starred: false, is_unread: false, labels: [], from: '' };
global.gmail = {
  get: {
    email_data: jest.fn(() => mockEmailData),
  },
};

// Load content.js (it attaches functions to global scope for testability)
require('../content');

beforeEach(() => {
  chrome.storage.sync._reset();
  gmail.get.email_data.mockReturnValue(mockEmailData);
  document.body.innerHTML = '';
});

function makeRow(threadId) {
  const tr = document.createElement('tr');
  tr.setAttribute('data-thread-id', threadId);
  document.body.appendChild(tr);
  return tr;
}

describe('applyHighlightToRow', () => {
  test('sets background color on a starred row', done => {
    const row = makeRow('thread1');
    gmail.get.email_data.mockReturnValue({ is_starred: true, is_unread: false, labels: [], from: '' });
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;

    HighlightGmail_applyHighlightToRow(row, done);
  });

  test('clears background color on a non-matching row', done => {
    const row = makeRow('thread2');
    row.style.backgroundColor = '#fff8c5';
    gmail.get.email_data.mockReturnValue({ is_starred: false, is_unread: false, labels: [], from: '' });
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;

    HighlightGmail_applyHighlightToRow(row, () => {
      expect(row.style.backgroundColor).toBe('');
      done();
    });
  });

  test('skips rows without data-thread-id', done => {
    const row = document.createElement('tr'); // no thread id
    document.body.appendChild(row);
    // Should not throw
    HighlightGmail_applyHighlightToRow(row, done);
  });
});

describe('highlightAllRows', () => {
  test('applies highlight to all tr[data-thread-id] in the document', done => {
    const row1 = makeRow('t1');
    const row2 = makeRow('t2');
    gmail.get.email_data.mockReturnValue({ is_starred: true, is_unread: false, labels: [], from: '' });
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;

    HighlightGmail_highlightAllRows(() => {
      expect(row1.style.backgroundColor).toBe('rgb(255, 248, 197)');
      expect(row2.style.backgroundColor).toBe('rgb(255, 248, 197)');
      done();
    });
  });
});
