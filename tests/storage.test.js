const { DEFAULT_SETTINGS, getSettings, saveSettings } = require('../src/storage');

beforeEach(() => {
  chrome.storage.sync._reset();
});

describe('DEFAULT_SETTINGS', () => {
  test('has enabled true', () => {
    expect(DEFAULT_SETTINGS.enabled).toBe(true);
  });
  test('has starred condition with default color', () => {
    expect(DEFAULT_SETTINGS.conditions.starred).toEqual({ enabled: true, color: '#fff8c5' });
  });
  test('has unread condition with default color', () => {
    expect(DEFAULT_SETTINGS.conditions.unread).toEqual({ enabled: true, color: '#e8f0fe' });
  });
  test('has empty rules array', () => {
    expect(DEFAULT_SETTINGS.rules).toEqual([]);
  });
});

describe('getSettings', () => {
  test('returns defaults when storage is empty', done => {
    getSettings(settings => {
      expect(settings.enabled).toBe(true);
      expect(settings.conditions.starred.color).toBe('#fff8c5');
      done();
    });
  });

  test('returns saved settings when present', done => {
    const custom = { ...DEFAULT_SETTINGS, enabled: false };
    chrome.storage.sync._store.highlightGmailSettings = custom;
    getSettings(settings => {
      expect(settings.enabled).toBe(false);
      done();
    });
  });
});

describe('saveSettings', () => {
  test('writes settings to chrome.storage.sync', done => {
    const custom = { ...DEFAULT_SETTINGS, enabled: false };
    saveSettings(custom, () => {
      expect(chrome.storage.sync._store.highlightGmailSettings).toEqual(custom);
      done();
    });
  });
});
