# Gmail Highlighter Chrome Extension — Design Spec

**Date:** 2026-04-16

## Overview

A Chrome extension that highlights Gmail inbox rows with background colors based on email attributes. The primary signal is starred status; secondary signals are read/unread state and user-configured label/sender rules. Colors are fully customizable via a popup UI.

---

## Goals

- Make important emails visually distinct at a glance
- Zero friction: no login, no OAuth, works the moment it's installed
- Colors sync across devices via Chrome's built-in storage sync
- Changes in the popup take effect immediately — no page reload required

---

## Non-Goals

- Does not modify email content or compose behavior
- Does not interact with the Gmail REST API
- Does not support views other than the inbox list (e.g., search results, individual email threads) in v1

---

## Architecture

### File Structure

```
highlight-gmail/
├── manifest.json         # Chrome Manifest V3
├── content.js            # Core highlighting logic
├── popup.html            # Settings UI shell
├── popup.js              # Settings UI logic
├── background.js         # Minimal MV3 service worker
└── vendor/
    └── gmail.js          # Bundled locally (not CDN)
```

### Key Design Decisions

- **gmail.js** (not raw DOM scraping) is used to observe inbox rows. This abstracts Gmail's internal HTML structure, making the extension resilient to Gmail UI updates.
- **`chrome.storage.sync`** is the single source of truth for all user settings. Both `popup.js` and `content.js` read/write to it. `content.js` listens for `chrome.storage.onChanged` to re-highlight live when settings change.
- **No build step required.** All files are plain JS/HTML — installable directly as an unpacked extension.
- `gmail.js` is bundled locally (in `vendor/`) to comply with Chrome Web Store's policy against remotely hosted code.

---

## Highlighting Logic

### Priority Chain

For every inbox row, the content script evaluates conditions in this order and applies the **first matching** color:

| Priority | Condition         | Default Color |
|----------|-------------------|---------------|
| 1        | Starred           | `#fff8c5` (soft yellow) |
| 2        | Unread            | `#e8f0fe` (soft blue) |
| 3        | Label/sender rule | User-defined per rule |
| —        | No match          | No highlight (Gmail default) |

### Implementation

gmail.js fires an event for each row as the inbox loads and when it refreshes. The content script:

1. Reads `email.starred`, `email.is_unread`, and `email.labels` from the gmail.js event payload
2. Walks the priority chain
3. Sets `element.style.backgroundColor` on the row DOM node
4. Re-runs this logic whenever `chrome.storage.onChanged` fires (settings changed in popup)

---

## Settings Popup

### Structure

**Conditions section** (top):
- One row per built-in condition (Starred, Unread)
- Each row: color picker + on/off toggle + priority badge
- Starred is always Priority 1, Unread is always Priority 2

**Label/Sender Rules section** (bottom):
- Ordered list of user-created rules (Priority 3+)
- Each rule: color swatch + name (label or sender domain/email) + delete button
- Rules are evaluated top-to-bottom; list order = priority
- Rules are reordered via drag-and-drop (⠿ drag handle on the left of each rule row)
- "+ Add label or sender rule" button opens an inline form (label name or sender domain/email + color picker)

**Master toggle** (top of popup):
- On/off switch for the entire extension
- When off, all injected `backgroundColor` styles are removed from current rows

**Save button**: writes all settings to `chrome.storage.sync`

### Storage Schema

```json
{
  "enabled": true,
  "conditions": {
    "starred": { "enabled": true, "color": "#fff8c5" },
    "unread":  { "enabled": true, "color": "#e8f0fe" }
  },
  "rules": [
    { "id": "uuid", "type": "label",  "value": "Work",       "color": "#e6f4ea" },
    { "id": "uuid", "type": "sender", "value": "github.com", "color": "#fce8e6" }
  ]
}
```

---

## Error Handling & Edge Cases

| Scenario | Behavior |
|----------|----------|
| gmail.js fails to detect rows (Gmail redesign) | Extension silently does nothing; Gmail is unaffected |
| Email matches multiple label/sender rules | First rule in popup list wins |
| Extension toggled off | All injected `backgroundColor` styles immediately removed |
| `chrome.storage.sync` quota exceeded (~100KB) | Chrome API returns an error; popup shows a warning toast |
| Inbox refreshes or user navigates between folders | gmail.js re-fires row events; highlights reapplied automatically |

---

## Permissions Required (manifest.json)

```json
{
  "permissions": ["storage"],
  "host_permissions": ["https://mail.google.com/*"]
}
```

No OAuth. No identity permission. No access to email content.

---

## Verification

### Manual testing checklist

1. Load extension as unpacked in `chrome://extensions`
2. Open Gmail inbox — starred rows should highlight yellow, unread rows blue
3. Open popup → change starred color → inbox updates immediately without reload
4. Toggle an email's star in Gmail → row highlight updates dynamically
5. Add a sender rule (e.g., `github.com`) → emails from that domain highlight with the chosen color
6. Add a Gmail label rule → emails with that label highlight correctly
7. Toggle master off → all highlights disappear; toggle back on → they return
8. Open Gmail in a second Chrome window/profile using sync → settings match

### Edge case testing

- Email that is both starred + unread: starred color wins
- Two label rules that both match: first rule in list wins
- Rule list reordering: change order in popup, confirm priority changes in inbox
