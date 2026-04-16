const { getHighlightColor } = require('../src/highlighter');

const BASE_SETTINGS = {
  enabled: true,
  conditions: {
    starred: { enabled: true, color: '#fff8c5' },
    unread:  { enabled: true, color: '#e8f0fe' },
  },
  rules: [],
};

function email(overrides = {}) {
  return { is_starred: false, is_unread: false, labels: [], from: '', ...overrides };
}

describe('getHighlightColor', () => {
  test('returns null when extension is disabled', () => {
    const settings = { ...BASE_SETTINGS, enabled: false };
    expect(getHighlightColor(email({ is_starred: true }), settings)).toBeNull();
  });

  test('returns starred color for a starred email', () => {
    expect(getHighlightColor(email({ is_starred: true }), BASE_SETTINGS)).toBe('#fff8c5');
  });

  test('returns unread color for an unread non-starred email', () => {
    expect(getHighlightColor(email({ is_unread: true }), BASE_SETTINGS)).toBe('#e8f0fe');
  });

  test('starred wins over unread when both are true', () => {
    expect(getHighlightColor(email({ is_starred: true, is_unread: true }), BASE_SETTINGS)).toBe('#fff8c5');
  });

  test('returns null when email is read and not starred', () => {
    expect(getHighlightColor(email(), BASE_SETTINGS)).toBeNull();
  });

  test('returns label rule color when email has matching label', () => {
    const settings = {
      ...BASE_SETTINGS,
      rules: [{ id: '1', type: 'label', value: 'Work', color: '#e6f4ea' }],
    };
    expect(getHighlightColor(email({ labels: ['Work'] }), settings)).toBe('#e6f4ea');
  });

  test('returns sender rule color when from contains matching domain', () => {
    const settings = {
      ...BASE_SETTINGS,
      rules: [{ id: '1', type: 'sender', value: 'github.com', color: '#fce8e6' }],
    };
    expect(getHighlightColor(email({ from: 'noreply@github.com' }), settings)).toBe('#fce8e6');
  });

  test('first matching rule wins when multiple rules match', () => {
    const settings = {
      ...BASE_SETTINGS,
      rules: [
        { id: '1', type: 'label', value: 'Work', color: '#aaa' },
        { id: '2', type: 'label', value: 'Work', color: '#bbb' },
      ],
    };
    expect(getHighlightColor(email({ labels: ['Work'] }), settings)).toBe('#aaa');
  });

  test('starred overrides label rules', () => {
    const settings = {
      ...BASE_SETTINGS,
      rules: [{ id: '1', type: 'label', value: 'Work', color: '#e6f4ea' }],
    };
    expect(getHighlightColor(email({ is_starred: true, labels: ['Work'] }), settings)).toBe('#fff8c5');
  });

  test('returns null when starred condition is disabled and email is starred', () => {
    const settings = {
      ...BASE_SETTINGS,
      conditions: { ...BASE_SETTINGS.conditions, starred: { enabled: false, color: '#fff8c5' } },
    };
    expect(getHighlightColor(email({ is_starred: true }), settings)).toBeNull();
  });
});
