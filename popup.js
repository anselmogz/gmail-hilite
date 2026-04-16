(function () {
  let currentSettings = null;

  function renderRules(rules) {
    const list = document.getElementById('rules-list');
    list.innerHTML = '';
    rules.forEach((rule, index) => {
      const li = document.createElement('li');
      li.className = 'rule-item';
      li.draggable = true;
      li.dataset.index = index;
      li.innerHTML = `
        <span class="rule-drag-handle" title="Drag to reorder">⠿</span>
        <input type="color" value="${rule.color}" data-rule-index="${index}" class="rule-color-picker">
        <div class="rule-info">
          <div class="rule-name">${rule.value}</div>
          <div class="rule-type">${rule.type === 'label' ? 'Gmail label' : 'sender domain'}</div>
        </div>
        <button class="rule-delete" data-rule-index="${index}" title="Remove rule">×</button>
      `;
      list.appendChild(li);
    });
    wireRuleDragDrop();
    wireRuleDeletes();
    wireRuleColorPickers();
  }

  function wireRuleColorPickers() {
    document.querySelectorAll('.rule-color-picker').forEach(input => {
      input.addEventListener('change', () => {
        const idx = parseInt(input.dataset.ruleIndex, 10);
        currentSettings.rules[idx].color = input.value;
      });
    });
  }

  function wireRuleDeletes() {
    document.querySelectorAll('.rule-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.ruleIndex, 10);
        currentSettings.rules.splice(idx, 1);
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
        const rules = currentSettings.rules;
        const [moved] = rules.splice(dragSrcIndex, 1);
        rules.splice(targetIndex, 0, moved);
        dragSrcIndex = null;
        renderRules(rules);
      });
    });
  }

  function loadSettingsIntoUI(settings) {
    currentSettings = JSON.parse(JSON.stringify(settings)); // deep clone
    document.getElementById('master-toggle').checked = settings.enabled;
    document.getElementById('starred-color').value = settings.conditions.starred.color;
    document.getElementById('starred-toggle').checked = settings.conditions.starred.enabled;
    document.getElementById('unread-color').value = settings.conditions.unread.color;
    document.getElementById('unread-toggle').checked = settings.conditions.unread.enabled;
    renderRules(settings.rules);
  }

  function collectSettingsFromUI() {
    currentSettings.enabled = document.getElementById('master-toggle').checked;
    currentSettings.conditions.starred.color = document.getElementById('starred-color').value;
    currentSettings.conditions.starred.enabled = document.getElementById('starred-toggle').checked;
    currentSettings.conditions.unread.color = document.getElementById('unread-color').value;
    currentSettings.conditions.unread.enabled = document.getElementById('unread-toggle').checked;
    // rules are mutated directly by interactions
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

    document.getElementById('add-rule-open').addEventListener('click', () => {
      form.style.display = 'block';
    });
    document.getElementById('add-rule-cancel').addEventListener('click', () => {
      form.style.display = 'none';
      document.getElementById('new-rule-value').value = '';
    });
    typeSelect.addEventListener('change', () => {
      valueLabel.textContent = typeSelect.value === 'label' ? 'Label name' : 'Sender domain or email';
    });
    document.getElementById('add-rule-confirm').addEventListener('click', () => {
      const value = document.getElementById('new-rule-value').value.trim();
      if (!value) return;
      currentSettings.rules.push({
        id: Date.now().toString(),
        type: typeSelect.value,
        value,
        color: document.getElementById('new-rule-color').value,
      });
      document.getElementById('new-rule-value').value = '';
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
      const settings = collectSettingsFromUI();
      HighlightGmail.saveSettings(settings, () => showToast('Settings saved'));
    });

    wireAddRuleForm();
  }

  // Expose for tests and DOMContentLoaded
  if (typeof global !== 'undefined') global.PopupInit = init;
  document.addEventListener('DOMContentLoaded', () => init());
})();
