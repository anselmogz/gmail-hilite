(function () {
  let currentSettings = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const RULE_META = {
    starred:   { icon: '⭐', label: 'Starred', builtin: true },
    unread:    { icon: '🔵', label: 'Unread',  builtin: true },
    label:     { icon: '🏷', sublabel: 'Gmail label' },
    sender:    { icon: '✉', sublabel: 'sender domain' },
    'star-type': { icon: '★', sublabel: 'star type' },
  };

  const STAR_TYPE_LABELS = {
    'star':             '⭐ Yellow star',
    'blue-star':        '🔵 Blue star',
    'red-bang':         '❗ Red bang',
    'orange-guillemet': '» Orange guillemet',
    'green-check':      '✅ Green check',
    'purple-question':  '❓ Purple question',
    'red-star':         '★ Red star',
    'orange-star':      '★ Orange star',
    'green-star':       '★ Green star',
    'blue-info':        'ℹ Blue info',
    'yellow-bang':      '❕ Yellow bang',
  };

  function renderRules(rules) {
    const list = document.getElementById('rules-list');
    list.innerHTML = '';

    rules.forEach((rule, index) => {
      const meta = RULE_META[rule.type] || { icon: '?', label: rule.type };
      const isBuiltin = !!(meta.builtin);
      const hasTextColor = !!rule.textColor;

      const displayName = meta.label || (rule.type === 'star-type' ? (STAR_TYPE_LABELS[rule.value] || rule.value) : rule.value);
      const sublabel = meta.sublabel || '';

      const li = document.createElement('li');
      li.className = 'rule-item';
      li.draggable = true;
      li.dataset.index = index;

      // Use escapeHtml on all user-supplied values injected into innerHTML
      li.innerHTML = `
        <span class="rule-drag-handle" title="Drag to reorder">⠿</span>
        <div class="color-pair">
          <div class="text-color-wrap">
            <span class="color-pair-label">bg</span>
            <input type="color" value="${escapeHtml(rule.color)}" data-rule-index="${index}" class="rule-color-picker">
          </div>
          <div class="text-color-wrap" title="Custom text color">
            <span class="color-pair-label">Aa</span>
            <input type="color" value="${escapeHtml(rule.textColor || '#000000')}" data-rule-index="${index}" class="rule-text-color-picker" ${hasTextColor ? '' : 'disabled'}>
            <input type="checkbox" class="rule-text-enabled" data-rule-index="${index}" ${hasTextColor ? 'checked' : ''} style="width:10px;height:10px;margin:0;">
          </div>
        </div>
        <div class="rule-info">
          <div class="rule-name">${escapeHtml(meta.icon + ' ' + displayName)}</div>
          ${sublabel ? `<div class="rule-type">${escapeHtml(sublabel)}</div>` : ''}
        </div>
        <input type="checkbox" class="rule-enabled" data-rule-index="${index}" ${rule.enabled ? 'checked' : ''} title="Enable/disable this rule">
        ${isBuiltin
          ? '<span class="rule-builtin-badge">built-in</span>'
          : `<button class="rule-delete" data-rule-index="${index}" title="Remove rule">×</button>`}
      `;
      list.appendChild(li);
    });

    wireRuleDragDrop();
    wireRuleInteractions();
  }

  function wireRuleInteractions() {
    document.querySelectorAll('.rule-color-picker').forEach(input => {
      input.addEventListener('change', () => {
        currentSettings.rules[parseInt(input.dataset.ruleIndex, 10)].color = input.value;
      });
    });

    document.querySelectorAll('.rule-text-color-picker').forEach(input => {
      input.addEventListener('change', () => {
        currentSettings.rules[parseInt(input.dataset.ruleIndex, 10)].textColor = input.value;
      });
    });

    document.querySelectorAll('.rule-text-enabled').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const idx = parseInt(checkbox.dataset.ruleIndex, 10);
        const picker = checkbox.closest('.text-color-wrap').querySelector('input[type=color]');
        picker.disabled = !checkbox.checked;
        currentSettings.rules[idx].textColor = checkbox.checked ? picker.value : '';
      });
    });

    document.querySelectorAll('.rule-enabled').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        currentSettings.rules[parseInt(checkbox.dataset.ruleIndex, 10)].enabled = checkbox.checked;
      });
    });

    document.querySelectorAll('.rule-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSettings.rules.splice(parseInt(btn.dataset.ruleIndex, 10), 1);
        renderRules(currentSettings.rules);
      });
    });
  }

  function wireRuleDragDrop() {
    const items = document.querySelectorAll('.rule-item');
    let dragSrcIndex = null;

    items.forEach(item => {
      item.addEventListener('dragstart', () => {
        dragSrcIndex = parseInt(item.dataset.index, 10);
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', e => { e.preventDefault(); item.classList.add('drag-over'); });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const targetIndex = parseInt(item.dataset.index, 10);
        if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;
        const [moved] = currentSettings.rules.splice(dragSrcIndex, 1);
        currentSettings.rules.splice(targetIndex, 0, moved);
        dragSrcIndex = null;
        renderRules(currentSettings.rules);
      });
    });
  }

  function loadSettingsIntoUI(settings) {
    currentSettings = JSON.parse(JSON.stringify(settings));
    document.getElementById('master-toggle').checked = currentSettings.enabled;
    renderRules(currentSettings.rules);
  }

  function collectSettingsFromUI() {
    currentSettings.enabled = document.getElementById('master-toggle').checked;
    // rules array is mutated directly by all interactions
    return currentSettings;
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
  }

  function wireAddRuleForm() {
    const form = document.getElementById('add-rule-form');
    const typeSelect = document.getElementById('new-rule-type');
    const valueLabel = document.getElementById('new-rule-value-label');
    const valueInput = document.getElementById('new-rule-value');
    const starTypeSelect = document.getElementById('new-rule-star-type');
    const textEnabledCb = document.getElementById('new-rule-text-enabled');
    const textColorPicker = document.getElementById('new-rule-text-color');

    function updateValueField() {
      const isStarType = typeSelect.value === 'star-type';
      valueLabel.style.display = isStarType ? 'none' : 'block';
      valueInput.style.display = isStarType ? 'none' : 'block';
      starTypeSelect.style.display = isStarType ? 'block' : 'none';
      if (!isStarType) {
        valueLabel.textContent = typeSelect.value === 'label' ? 'Label name' : 'Sender domain or email';
        valueInput.placeholder = typeSelect.value === 'label' ? 'e.g. Work' : 'e.g. github.com';
      }
    }

    textEnabledCb.addEventListener('change', () => {
      textColorPicker.disabled = !textEnabledCb.checked;
    });

    typeSelect.addEventListener('change', updateValueField);

    document.getElementById('add-rule-open').addEventListener('click', () => {
      form.style.display = 'block';
    });

    document.getElementById('add-rule-cancel').addEventListener('click', () => {
      form.style.display = 'none';
      typeSelect.value = 'label';
      valueInput.value = '';
      textEnabledCb.checked = false;
      textColorPicker.disabled = true;
      updateValueField();
    });

    document.getElementById('add-rule-confirm').addEventListener('click', () => {
      const isStarType = typeSelect.value === 'star-type';
      const value = isStarType ? starTypeSelect.value : valueInput.value.trim();
      if (!value) return;
      currentSettings.rules.push({
        id: Date.now().toString(),
        type: typeSelect.value,
        value,
        enabled: true,
        color: document.getElementById('new-rule-color').value,
        textColor: textEnabledCb.checked ? textColorPicker.value : '',
      });
      valueInput.value = '';
      textEnabledCb.checked = false;
      textColorPicker.disabled = true;
      form.style.display = 'none';
      renderRules(currentSettings.rules);
    });
  }

  function init(callback) {
    HighlightGmail.getSettings(settings => {
      loadSettingsIntoUI(settings);
      if (callback) callback();
    });

    document.getElementById('save-btn').addEventListener('click', () => {
      HighlightGmail.saveSettings(collectSettingsFromUI(), () => showToast('Settings saved'));
    });

    wireAddRuleForm();
  }

  if (typeof global !== 'undefined') global.PopupInit = init;
  document.addEventListener('DOMContentLoaded', () => init());
})();
