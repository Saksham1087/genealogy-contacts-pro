/* ============================================
   Progeny — Application Controller
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  const STATE_KEY = 'progeny_state';

  let contacts = [];
  let relationships = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let selectedContactId = null;
  let detailContactId = null;
  let currentTab = 'genealogy';
  let nextId = 1;

  // ---- DOM refs ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {};

  function cacheDom() {
    els.sidebar = $('#sidebar');
    els.sidebarToggle = $('#sidebarToggle');
    els.searchInput = $('#searchInput');
    els.searchClear = $('#searchClear');
    els.quickGroupList = $('#quickGroupList');
    els.contactList = $('#contactList');
    els.recordCount = $('#recordCount');
    els.addContactBtn = $('#addContactBtn');
    els.exportVcfBtn = $('#exportVcfBtn');
    els.exportJsonBtn = $('#exportJsonBtn');
    els.importJsonBtn = $('#importJsonBtn');
    els.importJsonInput = $('#importJsonInput');

    els.tabGenealogy = $('#tabGenealogy');
    els.tabContacts = $('#tabContacts');
    els.genealogyPanel = $('#genealogyPanel');
    els.contactsPanel = $('#contactsPanel');
    els.contactTableBody = $('#contactTableBody');
    els.genealogyCanvas = $('#genealogyCanvas');
    els.genealogyEmpty = $('#genealogyEmpty');
    els.graphSvg = $('#graphSvg');
    els.graphNodes = $('#graphNodes');
    els.graphLinks = $('#graphLinks');
    els.contactsEmpty = $('#contactsEmpty');

    els.detailPanel = $('#detailPanel');
    els.detailTitle = $('#detailTitle');
    els.detailBody = $('#detailBody');
    els.detailCloseBtn = $('#detailCloseBtn');
    els.detailAvatar = $('#detailAvatar');
    els.avatarPlaceholder = $('#avatarPlaceholder');
    els.detailFields = $('#detailFields');
    els.detailRelations = $('#detailRelations');
    els.detailEditBtn = $('#detailEditBtn');
    els.detailDeleteBtn = $('#detailDeleteBtn');

    els.modalOverlay = $('#modalOverlay');
    els.modalCloseBtn = $('#modalCloseBtn');
    els.modalTitle = $('#modalTitle');
    els.contactForm = $('#contactForm');
    els.formContactId = $('#formContactId');
    els.formFirstName = $('#formFirstName');
    els.formLastName = $('#formLastName');
    els.formPhone = $('#formPhone');
    els.formEmail = $('#formEmail');
    els.formBirthDate = $('#formBirthDate');
    els.formDeathDate = $('#formDeathDate');
    els.formGender = $('#formGender');
    els.formGroup = $('#formGroup');
    els.formNotes = $('#formNotes');
    els.formRelations = $('#formRelations');
    els.addRelationRowBtn = $('#addRelationRowBtn');
    els.formSaveBtn = $('#formSaveBtn');
    els.formCancelBtn = $('#formCancelBtn');
  }

  // ---- LocalStorage persistence ----
  function saveState() {
    const data = { contacts, relationships, nextId };
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        contacts = Array.isArray(data.contacts) ? data.contacts : [];
        relationships = Array.isArray(data.relationships) ? data.relationships : [];
        nextId = typeof data.nextId === 'number' ? data.nextId : 1;
        return true;
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
    return false;
  }

  function seedDemoData() {
    if (contacts.length > 0) return;

    contacts = [
      { id: 1, firstName: 'John', lastName: 'Doe', phone: '+1-555-0101', email: 'john.doe@example.com', birthDate: '1945-03-12', deathDate: '', gender: 'male', group: '', notes: 'Family patriarch.' },
      { id: 2, firstName: 'Jane', lastName: 'Doe', phone: '+1-555-0102', email: 'jane.doe@example.com', birthDate: '1948-07-25', deathDate: '', gender: 'female', group: '', notes: '' },
      { id: 3, firstName: 'Michael', lastName: 'Doe', phone: '+1-555-0103', email: 'michael.doe@example.com', birthDate: '1972-11-03', deathDate: '', gender: 'male', group: 'immediate-family', notes: '' },
      { id: 4, firstName: 'Sarah', lastName: 'Doe', phone: '+1-555-0104', email: 'sarah.doe@example.com', birthDate: '1975-06-18', deathDate: '', gender: 'female', group: 'immediate-family', notes: '' },
      { id: 5, firstName: 'Emily', lastName: 'Doe', phone: '+1-555-0105', email: 'emily.doe@example.com', birthDate: '2001-09-30', deathDate: '', gender: 'female', group: 'immediate-family', notes: '' },
      { id: 6, firstName: 'Robert', lastName: 'Smith', phone: '+1-555-0201', email: 'robert.smith@example.com', birthDate: '1980-01-15', deathDate: '', gender: 'male', group: 'work', notes: 'Colleague at Acme Corp.' },
    ];
    relationships = [
      { id: 1, fromId: 1, toId: 2, type: 'spouse' },
      { id: 2, fromId: 1, toId: 3, type: 'parent' },
      { id: 3, fromId: 1, toId: 4, type: 'parent' },
      { id: 4, fromId: 2, toId: 3, type: 'parent' },
      { id: 5, fromId: 2, toId: 4, type: 'parent' },
      { id: 6, fromId: 3, toId: 5, type: 'parent' },
      { id: 7, fromId: 4, toId: 5, type: 'parent' },
    ];
    nextId = 7;
    saveState();
  }

  // ---- Helpers ----
  function generateId() {
    return nextId++;
  }

  function getContact(id) {
    return contacts.find(c => c.id === id) || null;
  }

  function getContactsByIds(ids) {
    return contacts.filter(c => ids.includes(c.id));
  }

  function getRelationsFor(contactId) {
    return relationships.filter(r => r.fromId === contactId || r.toId === contactId);
  }

  function getRelatedContacts(contactId) {
    const rels = getRelationsFor(contactId);
    const ids = new Set();
    rels.forEach(r => {
      ids.add(r.fromId);
      ids.add(r.toId);
    });
    ids.delete(contactId);
    return getContactsByIds([...ids]);
  }

  function getRelationType(contactId, relatedId) {
    const rel = relationships.find(r =>
      (r.fromId === contactId && r.toId === relatedId) ||
      (r.toId === contactId && r.fromId === relatedId)
    );
    return rel ? rel.type : 'unknown';
  }

  function getInverseType(type) {
    switch (type) {
      case 'parent': return 'child';
      case 'child': return 'parent';
      case 'spouse': return 'spouse';
      default: return 'unknown';
    }
  }

  function fullName(c) {
    if (!c) return 'Unknown';
    return `${c.firstName} ${c.lastName}`.trim() || 'Unknown';
  }

  function initials(c) {
    if (!c) return '?';
    return ((c.firstName || '')[0] || '') + ((c.lastName || '')[0] || '') || '?';
  }

  function ageFromBirth(birthDate) {
    if (!birthDate) return '';
    const b = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return `(${age}y)`;
  }

  function getGroupLabel(group) {
    const labels = {
      'immediate-family': 'Immediate Family',
      'paternal-line': 'Paternal Line',
      'maternal-line': 'Maternal Line',
      'work': 'Work Contacts',
    };
    return labels[group] || '';
  }

  function avatarColor(id) {
    const colors = ['#6c8cff', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c'];
    return colors[(id || 0) % colors.length];
  }

  // ---- Search indexing ----
  function searchIndex(query) {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;

    return contacts.filter(c => {
      const haystack = [
        c.firstName,
        c.lastName,
        c.phone,
        c.email,
        c.notes,
        getGroupLabel(c.group),
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  function filterByGroup(list, group) {
    if (!group || group === 'all') return list;
    return list.filter(c => c.group === group);
  }

  function getFilteredList() {
    let list = searchIndex(searchQuery);
    list = filterByGroup(list, currentFilter);
    return list;
  }

  // ---- Render: Contact List (sidebar) ----
  function renderContactList() {
    const list = getFilteredList();
    els.recordCount.textContent = list.length;

    if (list.length === 0) {
      els.contactList.innerHTML = `<li class="contact-item" style="cursor:default;color:var(--slate-500);justify-content:center;padding:24px;">No records found</li>`;
      return;
    }

    els.contactList.innerHTML = list.map(c => {
      const isSelected = c.id === selectedContactId;
      return `
        <li class="contact-item${isSelected ? ' selected' : ''}" data-id="${c.id}" role="option" aria-selected="${isSelected}" tabindex="0">
          <span class="contact-item-avatar" style="background:${avatarColor(c.id)}">${initials(c)}</span>
          <div class="contact-item-info">
            <div class="contact-item-name">${fullName(c)}</div>
            <div class="contact-item-meta">${c.phone || c.email || ''} ${c.birthDate ? ageFromBirth(c.birthDate) : ''}</div>
          </div>
          <div class="contact-item-actions">
            <button class="btn btn-icon detail-action-btn" data-id="${c.id}" title="View details" type="button">&#9654;</button>
          </div>
        </li>
      `;
    }).join('');
  }

  // ---- Render: Contact Table (tab 2) ----
  function renderContactTable() {
    const list = getFilteredList();

    if (list.length === 0) {
      els.contactTableBody.innerHTML = '';
      els.contactsEmpty.hidden = false;
      return;
    }
    els.contactsEmpty.hidden = true;

    els.contactTableBody.innerHTML = list.map(c => {
      const groupLabel = getGroupLabel(c.group);
      return `
        <tr data-id="${c.id}">
          <td><strong>${fullName(c)}</strong></td>
          <td>${c.phone || '—'}</td>
          <td>${c.email || '—'}</td>
          <td>${groupLabel || '—'}</td>
          <td>
            <button class="btn btn-ghost btn-sm detail-action-btn" data-id="${c.id}" type="button">View</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ---- Render: Genealogy Graph ----
  function renderGenealogyGraph() {
    const list = getFilteredList();
    els.genealogyEmpty.hidden = list.length > 0;

    if (list.length === 0) {
      els.graphNodes.innerHTML = '';
      els.graphLinks.innerHTML = '';
      return;
    }

    const svg = els.graphSvg;
    const rect = svg.getBoundingClientRect();
    const w = rect.width || 800;
    const h = rect.height || 600;
    const cx = w / 2;
    const cy = h / 2;

    const nodeRadius = 28;
    const levelHeight = 110;
    const nodeSpacing = 140;

    const idMap = {};
    list.forEach((c, i) => { idMap[c.id] = i; });

    const nodePositions = {};
    const levels = {};
    const degree = {};

    list.forEach(c => { degree[c.id] = 0; });
    relationships.forEach(r => {
      if (idMap[r.fromId] !== undefined && idMap[r.toId] !== undefined) {
        degree[r.fromId] = (degree[r.fromId] || 0) + 1;
        degree[r.toId] = (degree[r.toId] || 0) + 1;
      }
    });

    list.forEach(c => {
      levels[c.id] = 0;
    });

    let changed = true;
    while (changed) {
      changed = false;
      relationships.forEach(r => {
        const fi = idMap[r.fromId];
        const ti = idMap[r.toId];
        if (fi === undefined || ti === undefined) return;
        if (r.type === 'parent') {
          if (levels[r.toId] <= levels[r.fromId]) {
            levels[r.toId] = levels[r.fromId] + 1;
            changed = true;
          }
        } else if (r.type === 'child') {
          if (levels[r.fromId] <= levels[r.toId]) {
            levels[r.fromId] = levels[r.toId] + 1;
            changed = true;
          }
        }
      });
    }

    const levelGroups = {};
    list.forEach(c => {
      const lv = levels[c.id] || 0;
      if (!levelGroups[lv]) levelGroups[lv] = [];
      levelGroups[lv].push(c.id);
    });

    const maxInLevel = Math.max(...Object.values(levelGroups).map(arr => arr.length), 1);
    const totalW = Math.max(w, maxInLevel * nodeSpacing + 100);

    Object.keys(levelGroups).forEach(lv => {
      const ids = levelGroups[lv];
      const count = ids.length;
      const startX = (totalW - (count - 1) * nodeSpacing) / 2;
      ids.forEach((id, idx) => {
        const y = 60 + parseInt(lv) * levelHeight;
        const x = startX + idx * nodeSpacing;
        nodePositions[id] = { x, y };
      });
    });

    list.forEach((c, idx) => {
      if (!nodePositions[c.id]) {
        nodePositions[c.id] = {
          x: 60 + (idx % 5) * nodeSpacing,
          y: 60 + Math.floor(idx / 5) * levelHeight,
        };
      }
    });

    const viewBox = `0 0 ${totalW} ${Math.max(h, Object.keys(levelGroups).length * levelHeight + 80)}`;
    svg.setAttribute('viewBox', viewBox);

    els.graphNodes.innerHTML = list.map(c => {
      const pos = nodePositions[c.id] || { x: cx, y: cy };
      return `
        <g class="graph-node" data-id="${c.id}" transform="translate(${pos.x},${pos.y})">
          <circle r="${nodeRadius}" fill="${avatarColor(c.id)}" stroke="${c.id === selectedContactId ? 'var(--accent-primary)' : 'var(--slate-700)'}" stroke-width="${c.id === selectedContactId ? 3 : 1.5}" />
          <text dy="1">${initials(c)}</text>
        </g>
      `;
    }).join('');

    els.graphLinks.innerHTML = '';
    relationships.forEach(r => {
      const fi = idMap[r.fromId];
      const ti = idMap[r.toId];
      if (fi === undefined || ti === undefined) return;

      const from = nodePositions[r.fromId];
      const to = nodePositions[r.toId];
      if (!from || !to) return;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return;

      const nx = dx / dist;
      const ny = dy / dist;
      const x1 = from.x + nx * nodeRadius;
      const y1 = from.y + ny * nodeRadius;
      const x2 = to.x - nx * nodeRadius;
      const y2 = to.y - ny * nodeRadius;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      let d;
      if (r.type === 'spouse') {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 30;
        d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
      } else {
        d = `M ${x1} ${y1} L ${x2} ${y2}`;
      }
      path.setAttribute('d', d);
      path.setAttribute('class', 'graph-link');
      path.setAttribute('data-from', r.fromId);
      path.setAttribute('data-to', r.toId);
      path.setAttribute('data-type', r.type);
      els.graphLinks.appendChild(path);
    });
  }

  // ---- Detail Panel ----
  function openDetail(contactId) {
    const c = getContact(contactId);
    if (!c) return;

    detailContactId = contactId;
    selectedContactId = contactId;
    els.detailTitle.textContent = fullName(c);
    els.avatarPlaceholder.textContent = initials(c);
    els.avatarPlaceholder.style.background = `linear-gradient(135deg, ${avatarColor(c.id)}, ${avatarColor(c.id + 3)})`;

    els.detailFields.innerHTML = `
      <div class="detail-field"><span class="detail-field-label">Full Name</span><span class="detail-field-value">${fullName(c)}</span></div>
      ${c.phone ? `<div class="detail-field"><span class="detail-field-label">Phone</span><span class="detail-field-value">${c.phone}</span></div>` : ''}
      ${c.email ? `<div class="detail-field"><span class="detail-field-label">Email</span><span class="detail-field-value">${c.email}</span></div>` : ''}
      ${c.birthDate ? `<div class="detail-field"><span class="detail-field-label">Birth Date</span><span class="detail-field-value">${c.birthDate} ${ageFromBirth(c.birthDate)}</span></div>` : ''}
      ${c.deathDate ? `<div class="detail-field"><span class="detail-field-label">Death Date</span><span class="detail-field-value">${c.deathDate}</span></div>` : ''}
      ${c.gender ? `<div class="detail-field"><span class="detail-field-label">Gender</span><span class="detail-field-value">${c.gender.charAt(0).toUpperCase() + c.gender.slice(1)}</span></div>` : ''}
      ${c.group ? `<div class="detail-field"><span class="detail-field-label">Group</span><span class="detail-field-value">${getGroupLabel(c.group)}</span></div>` : ''}
      ${c.notes ? `<div class="detail-field"><span class="detail-field-label">Notes</span><span class="detail-field-value">${c.notes}</span></div>` : ''}
    `;

    const rels = getRelationsFor(contactId);
    if (rels.length === 0) {
      els.detailRelations.innerHTML = '<li style="color:var(--slate-500);font-size:13px;">No relationships defined.</li>';
    } else {
      els.detailRelations.innerHTML = rels.map(r => {
        const relatedId = r.fromId === contactId ? r.toId : r.fromId;
        const related = getContact(relatedId);
        if (!related) return '';
        const displayType = r.fromId === contactId ? r.type : getInverseType(r.type);
        const label = displayType.charAt(0).toUpperCase() + displayType.slice(1);
        return `
          <li class="detail-relation-item" data-id="${related.id}">
            <span>${fullName(related)}</span>
            <span class="relation-badge ${displayType}">${label}</span>
          </li>
        `;
      }).join('');
    }

    els.detailPanel.classList.add('open');
    els.detailPanel.setAttribute('aria-hidden', 'false');

    renderContactList();
    renderContactTable();
    renderGenealogyGraph();
  }

  function closeDetail() {
    els.detailPanel.classList.remove('open');
    els.detailPanel.setAttribute('aria-hidden', 'true');
    detailContactId = null;
  }

  // ---- Modal ----
  function openModal(contactId) {
    const isEdit = contactId != null;
    const c = isEdit ? getContact(contactId) : null;

    els.modalTitle.textContent = isEdit ? 'Edit Contact' : 'Add Contact';
    els.formContactId.value = isEdit ? contactId : '';

    els.formFirstName.value = c ? c.firstName : '';
    els.formLastName.value = c ? c.lastName : '';
    els.formPhone.value = c ? (c.phone || '') : '';
    els.formEmail.value = c ? (c.email || '') : '';
    els.formBirthDate.value = c ? (c.birthDate || '') : '';
    els.formDeathDate.value = c ? (c.deathDate || '') : '';
    els.formGender.value = c ? (c.gender || '') : '';
    els.formGroup.value = c ? (c.group || '') : '';
    els.formNotes.value = c ? (c.notes || '') : '';

    renderRelationRows(contactId);
    els.modalOverlay.classList.add('open');
    els.modalOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    els.modalOverlay.classList.remove('open');
    els.modalOverlay.setAttribute('aria-hidden', 'true');
  }

  function renderRelationRows(contactId) {
    const container = els.formRelations;
    const allContacts = contacts.filter(c => c.id !== contactId);
    const existingRels = contactId ? getRelationsFor(contactId) : [];

    if (existingRels.length === 0) {
      container.innerHTML = `
        <div class="relation-row">
          <select class="form-input relation-type" aria-label="Relationship type">
            <option value="parent">Parent</option>
            <option value="child">Child</option>
            <option value="spouse">Spouse</option>
          </select>
          <select class="form-input relation-target" aria-label="Related contact">
            <option value="">— Select contact —</option>
            ${allContacts.map(ac => `<option value="${ac.id}">${fullName(ac)}</option>`).join('')}
          </select>
          <button class="btn btn-ghost btn-icon relation-remove" type="button" aria-label="Remove relation" disabled>&times;</button>
        </div>
      `;
      return;
    }

    container.innerHTML = existingRels.map(rel => {
      const relatedId = rel.fromId === contactId ? rel.toId : rel.fromId;
      const displayType = rel.fromId === contactId ? rel.type : getInverseType(rel.type);
      return `
        <div class="relation-row" data-rel-id="${rel.id}">
          <select class="form-input relation-type" aria-label="Relationship type">
            <option value="parent" ${displayType === 'parent' ? 'selected' : ''}>Parent</option>
            <option value="child" ${displayType === 'child' ? 'selected' : ''}>Child</option>
            <option value="spouse" ${displayType === 'spouse' ? 'selected' : ''}>Spouse</option>
          </select>
          <select class="form-input relation-target" aria-label="Related contact">
            <option value="">— Select contact —</option>
            ${allContacts.map(ac =>
              `<option value="${ac.id}" ${ac.id === relatedId ? 'selected' : ''}>${fullName(ac)}</option>`
            ).join('')}
          </select>
          <button class="btn btn-ghost btn-icon relation-remove" type="button" aria-label="Remove relation">&times;</button>
        </div>
      `;
    }).join('');
  }

  // ---- CRUD ----
  function handleFormSubmit(e) {
    e.preventDefault();

    const id = els.formContactId.value ? parseInt(els.formContactId.value, 10) : null;
    const data = {
      firstName: els.formFirstName.value.trim(),
      lastName: els.formLastName.value.trim(),
      phone: els.formPhone.value.trim(),
      email: els.formEmail.value.trim(),
      birthDate: els.formBirthDate.value,
      deathDate: els.formDeathDate.value,
      gender: els.formGender.value,
      group: els.formGroup.value,
      notes: els.formNotes.value.trim(),
    };

    if (!data.firstName || !data.lastName) return;

    const relationRows = els.formRelations.querySelectorAll('.relation-row');
    const newRels = [];
    relationRows.forEach(row => {
      const type = row.querySelector('.relation-type').value;
      const targetId = parseInt(row.querySelector('.relation-target').value, 10);
      if (targetId) {
        newRels.push({ type, targetId });
      }
    });

    const actualId = id || generateId();
    if (id) {
      const idx = contacts.findIndex(c => c.id === id);
      if (idx !== -1) {
        contacts[idx] = { ...contacts[idx], ...data };
      }
      relationships = relationships.filter(r => r.fromId !== id && r.toId !== id);
    } else {
      data.id = actualId;
      contacts.push(data);
    }
    newRels.forEach(rel => {
      const relId = generateId();
      if (rel.type === 'parent' || rel.type === 'spouse') {
        relationships.push({ id: relId, fromId: actualId, toId: rel.targetId, type: rel.type });
      } else {
        relationships.push({ id: relId, fromId: rel.targetId, toId: actualId, type: 'parent' });
      }
    });

    saveState();
    closeModal();
    fullRender();
    if (detailContactId) openDetail(detailContactId);
  }

  function deleteContact(id) {
    if (!confirm(`Delete ${fullName(getContact(id))}? This cannot be undone.`)) return;
    contacts = contacts.filter(c => c.id !== id);
    relationships = relationships.filter(r => r.fromId !== id && r.toId !== id);
    saveState();
    closeDetail();
    fullRender();
  }

  // ---- Export: vCard ----
  function exportVcf() {
    const list = getFilteredList();
    if (list.length === 0) {
      alert('No contacts to export.');
      return;
    }

    const lines = [];
    list.forEach(c => {
      lines.push('BEGIN:VCARD');
      lines.push('VERSION:3.0');
      lines.push(`FN:${fullName(c)}`);
      lines.push(`N:${c.lastName};${c.firstName};;;`);
      if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
      if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
      if (c.birthDate) lines.push(`BDAY:${c.birthDate}`);
      if (c.notes) lines.push(`NOTE:${c.notes.replace(/\n/g, '\\n')}`);
      lines.push(`UID:${c.id}@progeny`);
      lines.push('END:VCARD');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/vcard;charset=utf-8' });
    downloadBlob(blob, 'contacts.vcf');
  }

  // ---- Export: Full System Backup (.json) ----
  function exportJson() {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      contacts,
      relationships,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `progeny-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }

  // ---- Import: JSON ----
  function importJson(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.contacts)) {
          alert('Invalid backup file: missing contacts array.');
          return;
        }
        contacts = data.contacts;
        relationships = Array.isArray(data.relationships) ? data.relationships : [];
        const allIds = contacts.map(c => c.id).filter(id => typeof id === 'number');
        nextId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
        saveState();
        fullRender();
        alert(`Imported ${contacts.length} contacts successfully.`);
      } catch (err) {
        alert('Failed to parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ---- Utility ----
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function fullRender() {
    renderContactList();
    renderContactTable();
    renderGenealogyGraph();
  }

  // ---- Event Binding ----
  function bindEvents() {
    // Search
    els.searchInput.addEventListener('input', function () {
      searchQuery = this.value;
      els.searchClear.classList.toggle('visible', searchQuery.length > 0);
      selectedContactId = null;
      fullRender();
    });

    els.searchClear.addEventListener('click', function () {
      els.searchInput.value = '';
      searchQuery = '';
      this.classList.remove('visible');
      selectedContactId = null;
      fullRender();
    });

    // Quick groups
    els.quickGroupList.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-group');
      if (!btn) return;
      els.quickGroupList.querySelectorAll('.btn-group').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      selectedContactId = null;
      fullRender();
    });

    // Contact list item click
    els.contactList.addEventListener('click', function (e) {
      const item = e.target.closest('.contact-item');
      const detailBtn = e.target.closest('.detail-action-btn');
      if (detailBtn) {
        openDetail(parseInt(detailBtn.dataset.id, 10));
        return;
      }
      if (item && !e.target.closest('.contact-item-actions')) {
        openDetail(parseInt(item.dataset.id, 10));
      }
    });

    // Contact table row click
    els.contactTableBody.addEventListener('click', function (e) {
      const btn = e.target.closest('.detail-action-btn');
      if (btn) {
        openDetail(parseInt(btn.dataset.id, 10));
        return;
      }
      const row = e.target.closest('tr');
      if (row) {
        openDetail(parseInt(row.dataset.id, 10));
      }
    });

    // Graph node click
    els.graphNodes.addEventListener('click', function (e) {
      const node = e.target.closest('.graph-node');
      if (node) {
        openDetail(parseInt(node.dataset.id, 10));
      }
    });

    // Detail panel relationships click
    els.detailRelations.addEventListener('click', function (e) {
      const item = e.target.closest('.detail-relation-item');
      if (item) {
        openDetail(parseInt(item.dataset.id, 10));
      }
    });

    // Detail close
    els.detailCloseBtn.addEventListener('click', closeDetail);

    // Detail edit
    els.detailEditBtn.addEventListener('click', function () {
      if (detailContactId) {
        closeDetail();
        openModal(detailContactId);
      }
    });

    // Detail delete
    els.detailDeleteBtn.addEventListener('click', function () {
      if (detailContactId) deleteContact(detailContactId);
    });

    // Add contact
    els.addContactBtn.addEventListener('click', function () {
      openModal(null);
    });

    // Modal
    els.modalCloseBtn.addEventListener('click', closeModal);
    els.formCancelBtn.addEventListener('click', closeModal);
    els.modalOverlay.addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    els.contactForm.addEventListener('submit', handleFormSubmit);

    // Add relation row
    els.addRelationRowBtn.addEventListener('click', function () {
      const rows = els.formRelations.querySelectorAll('.relation-row');
      const lastRow = rows[rows.length - 1];
      const template = lastRow ? lastRow.cloneNode(true) : null;
      if (!template) return;

      template.querySelector('.relation-type').value = 'parent';
      template.querySelector('.relation-target').value = '';
      const removeBtn = template.querySelector('.relation-remove');
      removeBtn.disabled = false;
      els.formRelations.appendChild(template);
    });

    // Relation remove (delegated)
    els.formRelations.addEventListener('click', function (e) {
      const btn = e.target.closest('.relation-remove');
      if (!btn || btn.disabled) return;
      const row = btn.closest('.relation-row');
      if (row && els.formRelations.querySelectorAll('.relation-row').length > 1) {
        row.remove();
      }
    });

    // Tabs
    els.tabGenealogy.addEventListener('click', function () {
      currentTab = 'genealogy';
      els.tabGenealogy.classList.add('active');
      els.tabGenealogy.setAttribute('aria-selected', 'true');
      els.tabContacts.classList.remove('active');
      els.tabContacts.setAttribute('aria-selected', 'false');
      els.genealogyPanel.classList.add('active');
      els.genealogyPanel.hidden = false;
      els.contactsPanel.classList.remove('active');
      els.contactsPanel.hidden = true;
      setTimeout(renderGenealogyGraph, 50);
    });

    els.tabContacts.addEventListener('click', function () {
      currentTab = 'contacts';
      els.tabContacts.classList.add('active');
      els.tabContacts.setAttribute('aria-selected', 'true');
      els.tabGenealogy.classList.remove('active');
      els.tabGenealogy.setAttribute('aria-selected', 'false');
      els.contactsPanel.classList.add('active');
      els.contactsPanel.hidden = false;
      els.genealogyPanel.classList.remove('active');
      els.genealogyPanel.hidden = true;
    });

    // Sidebar toggle (responsive)
    els.sidebarToggle.addEventListener('click', function () {
      els.sidebar.classList.toggle('open');
    });

    // Export
    els.exportVcfBtn.addEventListener('click', exportVcf);
    els.exportJsonBtn.addEventListener('click', exportJson);

    // Import
    els.importJsonBtn.addEventListener('click', function () {
      els.importJsonInput.click();
    });
    els.importJsonInput.addEventListener('change', function (e) {
      if (this.files && this.files[0]) {
        importJson(this.files[0]);
      }
      this.value = '';
    });

    // Keyboard: Escape to close detail/modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (els.modalOverlay.classList.contains('open')) closeModal();
        else if (els.detailPanel.classList.contains('open')) closeDetail();
      }
    });
  }

  // ---- SVG Defs ----
  function initSvgDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="var(--slate-600)" />
      </marker>
    `;
    els.graphSvg.prepend(defs);
  }

  // ---- Init ----
  function init() {
    cacheDom();
    loadState();
    seedDemoData();
    initSvgDefs();
    bindEvents();
    fullRender();
    els.genealogyPanel.classList.add('active');
    els.genealogyPanel.hidden = false;
    els.contactsPanel.classList.remove('active');
    els.contactsPanel.hidden = true;
    setTimeout(renderGenealogyGraph, 100);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
