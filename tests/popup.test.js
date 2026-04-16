global.HighlightGmail = require('../src/storage');

// Minimal DOM matching popup.html's structure
document.body.innerHTML = `
  <input type="checkbox" id="master-toggle">
  <input type="color"    id="starred-color">
  <input type="checkbox" id="starred-toggle">
  <input type="color"    id="unread-color">
  <input type="checkbox" id="unread-toggle">
  <ul id="rules-list"></ul>
  <div id="add-rule-form" style="display:none"></div>
  <input type="text"     id="new-rule-value" placeholder="e.g. Work">
  <input type="color"    id="new-rule-color" value="#fffde7">
  <select id="new-rule-type"><option value="label">Label</option><option value="sender">Sender</option></select>
  <label id="new-rule-value-label">Label name</label>
  <button id="add-rule-open">+ Add</button>
  <button id="add-rule-confirm">Add</button>
  <button id="add-rule-cancel">Cancel</button>
  <button id="save-btn">Save</button>
  <div id="toast"></div>
`;

// popup.js exposes PopupInit globally for testability
require('../popup');

beforeEach(() => {
  chrome.storage.sync._reset();
});

describe('loadSettings into UI', () => {
  test('populates starred color from storage', done => {
    const settings = JSON.parse(JSON.stringify(HighlightGmail.DEFAULT_SETTINGS));
    settings.conditions.starred.color = '#aabbcc';
    chrome.storage.sync._store.highlightGmailSettings = settings;

    PopupInit(() => {
      expect(document.getElementById('starred-color').value).toBe('#aabbcc');
      done();
    });
  });

  test('checks master toggle when enabled is true', done => {
    chrome.storage.sync._store.highlightGmailSettings = HighlightGmail.DEFAULT_SETTINGS;
    PopupInit(() => {
      expect(document.getElementById('master-toggle').checked).toBe(true);
      done();
    });
  });
});

describe('save button', () => {
  test('saves updated starred color to storage', done => {
    chrome.storage.sync._store.highlightGmailSettings = JSON.parse(JSON.stringify(HighlightGmail.DEFAULT_SETTINGS));
    PopupInit(() => {
      document.getElementById('starred-color').value = '#ff0000';
      document.getElementById('save-btn').click();
      setTimeout(() => {
        const saved = chrome.storage.sync._store.highlightGmailSettings;
        expect(saved.conditions.starred.color).toBe('#ff0000');
        done();
      }, 0);
    });
  });

  test('shows toast after save', done => {
    chrome.storage.sync._store.highlightGmailSettings = JSON.parse(JSON.stringify(HighlightGmail.DEFAULT_SETTINGS));
    PopupInit(() => {
      document.getElementById('save-btn').click();
      setTimeout(() => {
        expect(document.getElementById('toast').style.display).toBe('block');
        done();
      }, 0);
    });
  });
});
