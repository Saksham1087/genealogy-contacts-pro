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
  let genealogyViewMode = 'tree'; // 'tree' | 'list'
  let treeRootId = null;
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
    els.importJsonBtn = $('#importJsonBtn');
    els.importJsonInput = $('#importJsonInput');

    els.tabGenealogy = $('#tabGenealogy');
    els.tabContacts = $('#tabContacts');
    els.tabExport = $('#tabExport');
    els.genealogyPanel = $('#genealogyPanel');
    els.contactsPanel = $('#contactsPanel');
    els.exportPanel = $('#exportPanel');
    els.contactTableBody = $('#contactTableBody');
    els.genealogyCanvas = $('#genealogyCanvas');
    els.genealogyEmpty = $('#genealogyEmpty');
    els.genealogyTitle = $('#genealogyTitle');
    els.graphSvg = $('#graphSvg');
    els.graphNodes = $('#graphNodes');
    els.graphLinks = $('#graphLinks');
    els.contactsEmpty = $('#contactsEmpty');

    els.viewTreeBtn = $('#viewTreeBtn');
    els.viewListBtn = $('#viewListBtn');
    els.familyListPanel = $('#familyListPanel');
    els.familyList = $('#familyList');
    els.familyListEmpty = $('#familyListEmpty');

    els.sidebarExportBtn = $('#sidebarExportBtn');
    els.exportVcfAllBtn = $('#exportVcfAllBtn');
    els.exportVcfSelectedBtn = $('#exportVcfSelectedBtn');
    els.exportJsonFullBtn = $('#exportJsonFullBtn');
    els.importJsonFromExportBtn = $('#importJsonFromExportBtn');

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
    els.formAddress = $('#formAddress');
    els.formBirthPlace = $('#formBirthPlace');
    els.formTags = $('#formTags');
    els.formRelations = $('#formRelations');
    els.addRelationRowBtn = $('#addRelationRowBtn');
    els.formSaveBtn = $('#formSaveBtn');
    els.formCancelBtn = $('#formCancelBtn');

    els.linkRelativeSearch = $('#linkRelativeSearch');
    els.linkRelativeResults = $('#linkRelativeResults');
    els.linkRelativeType = $('#linkRelativeType');
    els.linkRelativeBtn = $('#linkRelativeBtn');
    els.linkRelativeFeedback = $('#linkRelativeFeedback');
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
      { id: 1, firstName: 'John', lastName: 'Doe', phone: '+1-555-0101', email: 'john.doe@example.com', address: '742 Evergreen Terrace, Springfield', birthDate: '1945-03-12', birthPlace: 'Springfield, IL', deathDate: '', gender: 'male', group: '', tags: ['paternal', 'ancestor'], notes: 'Family patriarch.' },
      { id: 2, firstName: 'Jane', lastName: 'Doe', phone: '+1-555-0102', email: 'jane.doe@example.com', address: '742 Evergreen Terrace, Springfield', birthDate: '1948-07-25', birthPlace: 'Shelbyville, IL', deathDate: '', gender: 'female', group: '', tags: ['maternal', 'ancestor'], notes: '' },
      { id: 3, firstName: 'Michael', lastName: 'Doe', phone: '+1-555-0103', email: 'michael.doe@example.com', address: '456 Oak Ave, Springfield', birthDate: '1972-11-03', birthPlace: 'Springfield, IL', deathDate: '', gender: 'male', group: 'immediate-family', tags: ['paternal'], notes: '' },
      { id: 4, firstName: 'Sarah', lastName: 'Doe', phone: '+1-555-0104', email: 'sarah.doe@example.com', address: '456 Oak Ave, Springfield', birthDate: '1975-06-18', birthPlace: 'Portland, OR', deathDate: '', gender: 'female', group: 'immediate-family', tags: ['maternal'], notes: '' },
      { id: 5, firstName: 'Emily', lastName: 'Doe', phone: '+1-555-0105', email: 'emily.doe@example.com', address: '456 Oak Ave, Springfield', birthDate: '2001-09-30', birthPlace: 'Springfield, IL', deathDate: '', gender: 'female', group: 'immediate-family', tags: ['custom'], notes: '' },
      { id: 6, firstName: 'Robert', lastName: 'Smith', phone: '+1-555-0201', email: 'robert.smith@example.com', address: '890 Pine St, Metropolis', birthDate: '1980-01-15', birthPlace: 'Metropolis, NY', deathDate: '', gender: 'male', group: 'work', tags: ['colleague'], notes: 'Colleague at Acme Corp.' },
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

  function tagColor(tag) {
    const map = {
      paternal: '#6c8cff',
      maternal: '#f472b6',
      custom: '#a78bfa',
      friend: '#34d399',
      colleague: '#fbbf24',
      ancestor: '#f87171',
    };
    return map[tag] || '#5c687f';
  }

  function renderTagBadges(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return '';
    return tags.map(t =>
      `<span class="tag-badge" style="background:${tagColor(t)}">${t.charAt(0).toUpperCase() + t.slice(1)}</span>`
    ).join('');
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
        c.address,
        c.birthPlace,
        c.notes,
        getGroupLabel(c.group),
        ...(Array.isArray(c.tags) ? c.tags : []),
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
      const tagsHtml = renderTagBadges(c.tags);
      return `
        <li class="contact-item${isSelected ? ' selected' : ''}" data-id="${c.id}" role="option" aria-selected="${isSelected}" tabindex="0">
          <span class="contact-item-avatar" style="background:${avatarColor(c.id)}">${initials(c)}</span>
          <div class="contact-item-info">
            <div class="contact-item-name">${fullName(c)}</div>
            <div class="contact-item-meta">${c.phone || c.email || ''} ${c.birthDate ? ageFromBirth(c.birthDate) : ''}</div>
            ${tagsHtml ? `<div class="contact-item-tags">${tagsHtml}</div>` : ''}
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

  // ---- Genealogy View Dispatcher ----
  function renderGenealogyGraph() {
    if (genealogyViewMode === 'list') {
      renderFamilyListView();
    } else {
      if (treeRootId) {
        renderTree(treeRootId);
      } else {
        const list = getFilteredList();
        if (list.length > 0) {
          renderTree(list[0].id);
        } else {
          els.genealogyEmpty.hidden = false;
          els.graphSvg.setAttribute('viewBox', '0 0 100 100');
          els.graphNodes.innerHTML = '';
          els.graphLinks.innerHTML = '';
        }
      }
    }
  }

  // ---- Render: Focused Family Tree (SVG) ----
  function renderTree(rootContactId) {
    const root = getContact(rootContactId);
    if (!root) return;

    treeRootId = rootContactId;
    selectedContactId = rootContactId;
    els.genealogyEmpty.hidden = true;
    els.familyListPanel.hidden = true;
    els.genealogyCanvas.hidden = false;
    els.genealogyTitle.textContent = `Family Tree — ${fullName(root)}`;

    const svg = els.graphSvg;
    const rect = svg.getBoundingClientRect();
    const w = Math.max(rect.width || 800, 600);
    const h = Math.max(rect.height || 600, 400);

    const cardW = 140;
    const cardH = 70;
    const rowGap = 100;
    const colGap = 30;
    const topY = 40;

    const involved = new Set();
    involved.add(rootContactId);

    const parents = [];
    const children = [];
    let spouse = null;

    const rels = getRelationsFor(rootContactId);
    rels.forEach(r => {
      const otherId = r.fromId === rootContactId ? r.toId : r.fromId;
      const displayType = r.fromId === rootContactId ? r.type : getInverseType(r.type);
      involved.add(otherId);
      if (displayType === 'parent') parents.push(otherId);
      else if (displayType === 'child') children.push(otherId);
      else if (displayType === 'spouse') spouse = otherId;
    });

    // Walk up one more generation for displayed parents
    const grandParents = [];
    parents.forEach(pid => {
      getRelationsFor(pid).forEach(r => {
        const otherId = r.fromId === pid ? r.toId : r.fromId;
        const dt = r.fromId === pid ? r.type : getInverseType(r.type);
        if (dt === 'parent' && !involved.has(otherId)) {
          grandParents.push(otherId);
          involved.add(otherId);
        }
      });
    });

    // Build the three rows
    const rows = [];
    const topRow = [...new Set([...grandParents, ...parents])];
    rows.push(topRow);
    const midRow = spouse ? [rootContactId, spouse] : [rootContactId];
    rows.push(midRow);
    rows.push(children);

    const maxCols = Math.max(topRow.length, midRow.length, children.length, 1);
    const totalW = Math.max(w, maxCols * (cardW + colGap) + 80);
    const totalH = Math.max(h, 3 * (cardH + rowGap) + 80);

    svg.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);

    const positions = {};
    const rowCenters = [topY, topY + cardH + rowGap, topY + 2 * (cardH + rowGap)];

    rows.forEach((row, ri) => {
      const count = row.length;
      const startX = (totalW - count * cardW - (count - 1) * colGap) / 2;
      row.forEach((id, ci) => {
        positions[id] = { x: startX + ci * (cardW + colGap), y: rowCenters[ri], row: ri };
      });
    });

    // Render nodes as cards
    const allIds = [...involved];
    els.graphNodes.innerHTML = allIds.map(id => {
      const c = getContact(id);
      if (!c) return '';
      const pos = positions[id];
      if (!pos) return '';
      const isRoot = id === rootContactId;
      const isSpouse = id === spouse;
      const borderColor = isRoot ? 'var(--accent-primary)' : (isSpouse ? 'var(--accent-warning)' : 'var(--slate-600)');
      const borderWidth = isRoot ? 2.5 : 1.5;
      const label = fullName(c);
      const yearLabel = c.birthDate ? c.birthDate.slice(0, 4) : '';
      const info = c.birthPlace ? c.birthPlace : (c.phone || '');
      return `
        <g class="graph-node tree-card" data-id="${c.id}" transform="translate(${pos.x},${pos.y})">
          <rect x="0" y="0" width="${cardW}" height="${cardH}" rx="10" fill="var(--slate-800)" stroke="${borderColor}" stroke-width="${borderWidth}" />
          <circle cx="22" cy="${cardH / 2}" r="16" fill="${avatarColor(c.id)}" />
          <text x="46" y="26" font-size="12" font-weight="600" fill="var(--slate-100)">${label}</text>
          <text x="46" y="44" font-size="10" fill="var(--slate-400)">${yearLabel}${info ? ' · ' + info.slice(0, 18) : ''}</text>
          ${isRoot ? '<text x="' + (cardW - 8) + '" y="12" font-size="9" fill="var(--accent-primary)" text-anchor="end">ROOT</text>' : ''}
        </g>
      `;
    }).join('');

    // Render links as SVG paths
    els.graphLinks.innerHTML = '';
    rels.forEach(r => {
      const fromPos = positions[r.fromId];
      const toPos = positions[r.toId];
      if (!fromPos || !toPos) return;

      const x1 = fromPos.x + cardW / 2;
      const y1 = fromPos.y + cardH;
      const x2 = toPos.x + cardW / 2;
      const y2 = toPos.y;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const midY = (y1 + y2) / 2;
      const d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
      path.setAttribute('d', d);
      path.setAttribute('class', 'tree-link');
      path.setAttribute('data-from', r.fromId);
      path.setAttribute('data-to', r.toId);
      path.setAttribute('data-type', r.type);
      els.graphLinks.appendChild(path);
    });

    // Draw spouse connections (curved)
    if (spouse) {
      const rootPos = positions[rootContactId];
      const spPos = positions[spouse];
      if (rootPos && spPos && rootPos.row === spPos.row) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const x1 = rootPos.x + cardW;
        const y1 = rootPos.y + cardH / 2;
        const x2 = spPos.x;
        const y2 = spPos.y + cardH / 2;
        const mx = (x1 + x2) / 2;
        const my = Math.min(y1, y2) - 20;
        const d = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
        path.setAttribute('d', d);
        path.setAttribute('class', 'tree-link spouse-link');
        path.setAttribute('data-type', 'spouse');
        els.graphLinks.appendChild(path);

        // Label
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const lx = (x1 + x2) / 2;
        const ly = my - 6;
        label.setAttribute('x', lx);
        label.setAttribute('y', ly);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '9');
        label.setAttribute('fill', 'var(--accent-warning)');
        label.textContent = 'SPOUSE';
        els.graphLinks.appendChild(label);
      }
    }

    // Connect parents to grandparents
    grandParents.forEach(gpId => {
      parents.forEach(pId => {
        const relCheck = relationships.find(r =>
          (r.fromId === gpId && r.toId === pId) || (r.fromId === pId && r.toId === gpId)
        );
        if (!relCheck) return;
        const fromPos = positions[gpId];
        const toPos = positions[pId];
        if (!fromPos || !toPos) return;
        const x1 = fromPos.x + cardW / 2;
        const y1 = fromPos.y + cardH;
        const x2 = toPos.x + cardW / 2;
        const y2 = toPos.y;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midY = (y1 + y2) / 2;
        const d = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
        path.setAttribute('d', d);
        path.setAttribute('class', 'tree-link');
        els.graphLinks.appendChild(path);
      });
    });
  }

  // ---- Render: Family List View ----
  function renderFamilyListView() {
    const list = getFilteredList();
    els.genealogyEmpty.hidden = true;
    els.genealogyCanvas.hidden = true;
    els.familyListPanel.hidden = false;
    els.genealogyTitle.textContent = 'Family Relationships';

    if (list.length === 0) {
      els.familyListEmpty.hidden = false;
      els.familyList.innerHTML = '';
      return;
    }
    els.familyListEmpty.hidden = true;

    const items = [];
    list.forEach(c => {
      const rels = getRelationsFor(c.id);
      if (rels.length === 0) return;
      const related = rels.map(r => {
        const otherId = r.fromId === c.id ? r.toId : r.fromId;
        const other = getContact(otherId);
        if (!other) return null;
        const displayType = r.fromId === c.id ? r.type : getInverseType(r.type);
        return { id: other.id, name: fullName(other), type: displayType, initials: initials(other), color: avatarColor(other.id) };
      }).filter(Boolean);

      items.push({ id: c.id, name: fullName(c), initials: initials(c), color: avatarColor(c.id), relatives: related, notes: c.notes });
    });

    if (items.length === 0) {
      els.familyListEmpty.hidden = false;
      els.familyList.innerHTML = '';
      return;
    }

    els.familyList.innerHTML = items.map(item => `
      <li class="family-list-item" data-id="${item.id}">
        <div class="family-list-header">
          <span class="family-list-avatar" style="background:${item.color}">${item.initials}</span>
          <span class="family-list-name">${item.name}</span>
        </div>
        <ul class="family-list-relatives">
          ${item.relatives.map(rel => `
            <li class="family-relative-item" data-id="${rel.id}">
              <span class="family-relative-avatar" style="background:${rel.color}">${rel.initials}</span>
              <span class="family-relative-name">${rel.name}</span>
              <span class="relation-badge ${rel.type}">${rel.type.charAt(0).toUpperCase() + rel.type.slice(1)}</span>
            </li>
          `).join('')}
        </ul>
      </li>
    `).join('');
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

    const tagsHtml = renderTagBadges(c.tags);

    els.detailFields.innerHTML = `
      <div class="detail-field"><span class="detail-field-label">Full Name</span><span class="detail-field-value">${fullName(c)}</span></div>
      ${c.phone ? `<div class="detail-field"><span class="detail-field-label">Phone</span><span class="detail-field-value">${c.phone}</span></div>` : ''}
      ${c.email ? `<div class="detail-field"><span class="detail-field-label">Email</span><span class="detail-field-value">${c.email}</span></div>` : ''}
      ${c.address ? `<div class="detail-field"><span class="detail-field-label">Address</span><span class="detail-field-value">${c.address}</span></div>` : ''}
      ${c.birthDate ? `<div class="detail-field"><span class="detail-field-label">Birth Date</span><span class="detail-field-value">${c.birthDate} ${ageFromBirth(c.birthDate)}</span></div>` : ''}
      ${c.birthPlace ? `<div class="detail-field"><span class="detail-field-label">Birth Place</span><span class="detail-field-value">${c.birthPlace}</span></div>` : ''}
      ${c.deathDate ? `<div class="detail-field"><span class="detail-field-label">Death Date</span><span class="detail-field-value">${c.deathDate}</span></div>` : ''}
      ${c.gender ? `<div class="detail-field"><span class="detail-field-label">Gender</span><span class="detail-field-value">${c.gender.charAt(0).toUpperCase() + c.gender.slice(1)}</span></div>` : ''}
      ${c.group ? `<div class="detail-field"><span class="detail-field-label">Group</span><span class="detail-field-value">${getGroupLabel(c.group)}</span></div>` : ''}
      ${tagsHtml ? `<div class="detail-field"><span class="detail-field-label">Tags</span><span class="detail-field-value">${tagsHtml}</span></div>` : ''}
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
    els.formAddress.value = c ? (c.address || '') : '';
    els.formBirthDate.value = c ? (c.birthDate || '') : '';
    els.formBirthPlace.value = c ? (c.birthPlace || '') : '';
    els.formDeathDate.value = c ? (c.deathDate || '') : '';
    els.formGender.value = c ? (c.gender || '') : '';
    els.formGroup.value = c ? (c.group || '') : '';
    els.formNotes.value = c ? (c.notes || '') : '';

    const tags = Array.isArray(c && c.tags) ? c.tags : [];
    els.formTags.querySelectorAll('.tag-input').forEach(inp => {
      inp.checked = tags.includes(inp.value);
    });

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

    const tagInputs = els.formTags.querySelectorAll('.tag-input:checked');
    const tags = Array.from(tagInputs).map(inp => inp.value);

    const data = {
      firstName: els.formFirstName.value.trim(),
      lastName: els.formLastName.value.trim(),
      phone: els.formPhone.value.trim(),
      email: els.formEmail.value.trim(),
      address: els.formAddress.value.trim(),
      birthDate: els.formBirthDate.value,
      birthPlace: els.formBirthPlace.value.trim(),
      deathDate: els.formDeathDate.value,
      gender: els.formGender.value,
      group: els.formGroup.value,
      tags: tags,
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
      bindRelationship(actualId, rel.targetId, rel.type);
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

  // ---- Relationship Binding ----
  function bindRelationship(personId, relativeId, type) {
    if (personId === relativeId) {
      console.warn('Cannot relate a contact to themselves');
      return false;
    }
    const existing = relationships.find(r =>
      (r.fromId === personId && r.toId === relativeId) ||
      (r.fromId === relativeId && r.toId === personId)
    );
    if (existing) return false;

    const inverse = getInverseType(type);
    const relId = generateId();

    if (type === 'parent') {
      relationships.push({ id: relId, fromId: personId, toId: relativeId, type: 'parent' });
      relationships.push({ id: generateId(), fromId: relativeId, toId: personId, type: 'child' });
    } else if (type === 'child') {
      relationships.push({ id: relId, fromId: personId, toId: relativeId, type: 'child' });
      relationships.push({ id: generateId(), fromId: relativeId, toId: personId, type: 'parent' });
    } else if (type === 'spouse') {
      relationships.push({ id: relId, fromId: personId, toId: relativeId, type: 'spouse' });
      relationships.push({ id: generateId(), fromId: relativeId, toId: personId, type: 'spouse' });
    }

    saveState();
    return true;
  }

  // ---- Export Studios ----

  function exportToVCard(contact) {
    const lines = [];
    lines.push('BEGIN:VCARD');
    lines.push('VERSION:3.0');
    lines.push(`FN:${fullName(contact)}`);
    lines.push(`N:${contact.lastName};${contact.firstName};;;`);
    if (contact.phone) lines.push(`TEL;TYPE=CELL:${contact.phone}`);
    if (contact.email) lines.push(`EMAIL;TYPE=INTERNET:${contact.email}`);
    if (contact.address) lines.push(`ADR;TYPE=HOME:;;${contact.address};;;`);
    if (contact.birthDate) lines.push(`BDAY:${contact.birthDate}`);
    if (contact.notes) lines.push(`NOTE:${contact.notes.replace(/\n/g, '\\n')}`);
    lines.push(`UID:${contact.id}@progeny`);
    lines.push('END:VCARD');
    return lines.join('\n');
  }

  function exportVcf(ids) {
    const list = ids ? getContactsByIds(ids) : getFilteredList();
    if (list.length === 0) {
      alert('No contacts to export.');
      return;
    }
    const vcardStr = list.map(c => exportToVCard(c)).join('\n');
    const blob = new Blob([vcardStr], { type: 'text/vcard;charset=utf-8' });
    downloadBlob(blob, 'contacts.vcf');
  }

  function exportVcfSelected() {
    if (!detailContactId) {
      alert('Open a contact detail view first to export a single contact.');
      return;
    }
    exportVcf([detailContactId]);
  }

  function exportJson() {
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      contacts,
      relationships,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    downloadBlob(blob, `progeny-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }

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
    if (currentTab === 'genealogy') renderGenealogyGraph();
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

    // Graph node / tree card click — re-root tree or open detail
    els.graphNodes.addEventListener('click', function (e) {
      const node = e.target.closest('.graph-node');
      if (!node) return;
      const id = parseInt(node.dataset.id, 10);
      if (genealogyViewMode === 'tree' && id !== treeRootId) {
        renderTree(id);
      } else {
        openDetail(id);
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

    // ---- Link Relative (detail panel) ----
    let linkSelectedId = null;

    els.linkRelativeSearch.addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      linkSelectedId = null;
      if (!q || !detailContactId) {
        els.linkRelativeResults.hidden = true;
        return;
      }
      const candidates = contacts.filter(c =>
        c.id !== detailContactId &&
        (c.firstName.toLowerCase().includes(q) ||
         c.lastName.toLowerCase().includes(q) ||
         fullName(c).toLowerCase().includes(q))
      );
      if (candidates.length === 0) {
        els.linkRelativeResults.hidden = true;
        return;
      }
      els.linkRelativeResults.hidden = false;
      els.linkRelativeResults.innerHTML = candidates.map(c =>
        `<li data-id="${c.id}">
          <span class="result-avatar" style="background:${avatarColor(c.id)}">${initials(c)}</span>
          <span>${fullName(c)}</span>
        </li>`
      ).join('');
    });

    els.linkRelativeResults.addEventListener('click', function (e) {
      const li = e.target.closest('li');
      if (!li) return;
      linkSelectedId = parseInt(li.dataset.id, 10);
      const c = getContact(linkSelectedId);
      els.linkRelativeSearch.value = fullName(c);
      els.linkRelativeResults.hidden = true;
      els.linkRelativeResults.querySelectorAll('li').forEach(l => l.classList.remove('selected'));
      li.classList.add('selected');
    });

    els.linkRelativeResults.addEventListener('mouseleave', function () {
      this.hidden = true;
    });

    els.linkRelativeBtn.addEventListener('click', function () {
      if (!detailContactId || !linkSelectedId) {
        els.linkRelativeFeedback.textContent = 'Search and select a contact first.';
        els.linkRelativeFeedback.className = 'link-relative-feedback error';
        return;
      }
      const type = els.linkRelativeType.value;
      const success = bindRelationship(detailContactId, linkSelectedId, type);
      if (success) {
        els.linkRelativeFeedback.textContent = `Linked as ${type.charAt(0).toUpperCase() + type.slice(1)}.`;
        els.linkRelativeFeedback.className = 'link-relative-feedback success';
        linkSelectedId = null;
        els.linkRelativeSearch.value = '';
        openDetail(detailContactId);
      } else {
        els.linkRelativeFeedback.textContent = 'Relationship already exists or invalid.';
        els.linkRelativeFeedback.className = 'link-relative-feedback error';
      }
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

    // View toggle (Tree / List)
    els.viewTreeBtn.addEventListener('click', function () {
      genealogyViewMode = 'tree';
      els.viewTreeBtn.classList.add('active');
      els.viewListBtn.classList.remove('active');
      renderGenealogyGraph();
    });

    els.viewListBtn.addEventListener('click', function () {
      genealogyViewMode = 'list';
      els.viewListBtn.classList.add('active');
      els.viewTreeBtn.classList.remove('active');
      renderGenealogyGraph();
    });

    // Family list item clicks — open detail
    els.familyList.addEventListener('click', function (e) {
      const item = e.target.closest('.family-relative-item') || e.target.closest('.family-list-item');
      if (!item) return;
      openDetail(parseInt(item.dataset.id, 10));
    });

    // Tabs
    function switchTab(tab) {
      [els.tabGenealogy, els.tabContacts, els.tabExport].forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      [els.genealogyPanel, els.contactsPanel, els.exportPanel].forEach(p => {
        p.classList.remove('active');
        p.hidden = true;
      });

      currentTab = tab;
      const activeTabBtn = tab === 'genealogy' ? els.tabGenealogy : (tab === 'contacts' ? els.tabContacts : els.tabExport);
      const activePanel = tab === 'genealogy' ? els.genealogyPanel : (tab === 'contacts' ? els.contactsPanel : els.exportPanel);
      activeTabBtn.classList.add('active');
      activeTabBtn.setAttribute('aria-selected', 'true');
      activePanel.classList.add('active');
      activePanel.hidden = false;

      if (tab === 'genealogy') setTimeout(renderGenealogyGraph, 50);
    }

    els.tabGenealogy.addEventListener('click', function () { switchTab('genealogy'); });
    els.tabContacts.addEventListener('click', function () { switchTab('contacts'); });
    els.tabExport.addEventListener('click', function () { switchTab('export'); });

    // Sidebar toggle (responsive)
    els.sidebarToggle.addEventListener('click', function () {
      els.sidebar.classList.toggle('open');
    });

    // Sidebar export button → switch to Export tab
    els.sidebarExportBtn.addEventListener('click', function () {
      switchTab('export');
      if (window.innerWidth <= 1024) els.sidebar.classList.remove('open');
    });

    // Export Studio buttons
    els.exportVcfAllBtn.addEventListener('click', function () { exportVcf(); });
    els.exportVcfSelectedBtn.addEventListener('click', exportVcfSelected);
    els.exportJsonFullBtn.addEventListener('click', exportJson);
    els.importJsonFromExportBtn.addEventListener('click', function () {
      els.importJsonInput.click();
    });

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

  // ---- Init ----
  function init() {
    cacheDom();
    loadState();
    seedDemoData();
    bindEvents();
    fullRender();
    els.genealogyPanel.classList.add('active');
    els.genealogyPanel.hidden = false;
    els.contactsPanel.classList.remove('active');
    els.contactsPanel.hidden = true;
    els.exportPanel.classList.remove('active');
    els.exportPanel.hidden = true;
    setTimeout(renderGenealogyGraph, 100);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
