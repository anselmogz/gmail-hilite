/**
 * @jest-environment node
 */
// background.js uses global chrome and HighlightGmail — set them up
global.HighlightGmail = require('../src/storage');

beforeEach(() => {
  chrome.storage.sync._reset();
  chrome.runtime.onInstalled._listeners = [];
  require('../background'); // re-require to re-register listener
});

afterEach(() => {
  jest.resetModules();
});

test('sets default settings on fresh install', done => {
  chrome.runtime.onInstalled._trigger({ reason: 'install' });
  // give the async set a tick
  setImmediate(() => {
    expect(chrome.storage.sync._store.highlightGmailSettings).toEqual(
      HighlightGmail.DEFAULT_SETTINGS
    );
    done();
  });
});

test('does not overwrite existing settings on update', done => {
  const existing = { ...HighlightGmail.DEFAULT_SETTINGS, enabled: false };
  chrome.storage.sync._store.highlightGmailSettings = existing;

  chrome.runtime.onInstalled._trigger({ reason: 'update' });

  setImmediate(() => {
    // getSettings returns existing (not default) → no overwrite
    expect(chrome.storage.sync._store.highlightGmailSettings.enabled).toBe(false);
    done();
  });
});
