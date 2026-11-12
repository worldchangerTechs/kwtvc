/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Admin Announcements Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = auth.requireRole('admin');
  if (!session) return;

  ui.initNavigation();

  const admin = auth.getCurrentUser();
  if (!admin) return;

  // Sidebar profile
  const sidebarAdminName = document.getElementById('sidebar-admin-name');
  if (sidebarAdminName) sidebarAdminName.textContent = admin.fullName;

  const tbody = document.getElementById('admin-announcements-body');
  const countIndicator = document.getElementById('ann-count-indicator');
  const btnOpenCreate = document.getElementById('btn-open-create-ann');

  // Modal elements
  const modalAnn = document.getElementById('modal-ann');
  const formAnn = document.getElementById('ann-form');
  const annIdInput = document.getElementById('ann-id');
  const modalTitle = document.getElementById('modal-ann-title');
  const titleInput = document.getElementById('ann-title-input');
  const categoryInput = document.getElementById('ann-category-input');
  const priorityInput = document.getElementById('ann-priority-input');
  const authorInput = document.getElementById('ann-author-input');
  const targetInput = document.getElementById('ann-target-input');
  const contentInput = document.getElementById('ann-content-input');
  const pinnedInput = document.getElementById('ann-pinned-input');

  // Delete modal
  const modalDelete = document.getElementById('modal-delete-ann');
  const deletePrompt = document.getElementById('delete-ann-prompt');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete-ann');
  let annPendingDelete = null;

  function renderTable() {
    const announcements = store.getAll('announcements');

    // Update nav counters
    const navStudents = document.getElementById('nav-students-count');
    if (navStudents) navStudents.textContent = store.getAll('students').length;
    const navAsg = document.getElementById('nav-assignments-count');
    if (navAsg) navAsg.textContent = store.getAll('assignments').length;
    const navSubs = document.getElementById('nav-submissions-count');
    if (navSubs) navSubs.textContent = store.getAll('submissions').length;
    const navAnn = document.getElementById('nav-announcements-count');
    if (navAnn) navAnn.textContent = announcements.length;

    if (countIndicator) countIndicator.textContent = `${announcements.length} published notices`;

    if (announcements.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="ledger-empty">No announcements yet.</td></tr>';
      return;
    }

    // Sort: pinned first, then by date descending
    const sorted = [...announcements].sort((a, b) => {
      const pinA = a.isPinned ? 1 : 0;
      const pinB = b.isPinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return new Date(b.date) - new Date(a.date);
    });

    tbody.innerHTML = sorted.map(ann => {
      const pinBadge = ann.isPinned
        ? '<span class="badge badge-ochre" style="font-size:0.65rem;">PINNED</span>'
        : '<span class="text-muted" style="font-size:0.75rem;">—</span>';

      let priorityBadge = '';
      if (ann.priority === 'High') priorityBadge = '<span class="badge badge-brick">High</span>';
      else if (ann.priority === 'Medium') priorityBadge = '<span class="badge badge-ochre">Medium</span>';
      else priorityBadge = '<span class="badge badge-neutral">Low</span>';

      return `
        <tr style="${ann.isPinned ? 'background-color: var(--color-paper-light);' : ''}">
          <td class="text-mono" style="font-size:0.8rem;">${ui.formatDate(ann.date)}</td>
          <td style="text-align:center;">${pinBadge}</td>
          <td>
            <div class="font-semibold" style="color:var(--color-ink);">${ann.title}</div>
            <div style="font-size:0.775rem; color:var(--color-text-muted); line-height:1.35; max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${ann.content}
            </div>
          </td>
          <td style="font-size:0.8rem;">${ann.category || 'General'}</td>
          <td style="text-align:center;">${priorityBadge}</td>
          <td style="font-size:0.8rem;">${ann.author || 'Administration'}</td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:4px;">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-ann" data-id="${ann.id}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm btn-delete-ann" data-id="${ann.id}">Del</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Row button listeners
    document.querySelectorAll('.btn-edit-ann').forEach(btn => {
      btn.addEventListener('click', () => openEditAnn(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-delete-ann').forEach(btn => {
      btn.addEventListener('click', () => openDeleteAnn(btn.getAttribute('data-id')));
    });
  }

  // Open Create Modal
  btnOpenCreate.addEventListener('click', () => {
    annIdInput.value = '';
    modalTitle.textContent = 'Post New Announcement';
    titleInput.value = '';
    categoryInput.value = 'Examinations';
    priorityInput.value = 'High';
    authorInput.value = admin.fullName;
    targetInput.value = 'All students';
    contentInput.value = '';
    pinnedInput.checked = false;

    ui.openModal('modal-ann');
  });

  // Open Edit Modal
  function openEditAnn(id) {
    const ann = store.getById('announcements', id);
    if (!ann) return;

    annIdInput.value = ann.id;
    modalTitle.textContent = `Edit Notice: ${ann.title.slice(0, 30)}...`;
    titleInput.value = ann.title || '';
    categoryInput.value = ann.category || 'General';
    priorityInput.value = ann.priority || 'Medium';
    authorInput.value = ann.author || admin.fullName;
    targetInput.value = ann.targetAudience || 'All students';
    contentInput.value = ann.content || '';
    pinnedInput.checked = Boolean(ann.isPinned);

    ui.openModal('modal-ann');
  }

  // Open Delete Modal
  function openDeleteAnn(id) {
    const ann = store.getById('announcements', id);
    if (!ann) return;

    annPendingDelete = ann;
    deletePrompt.innerHTML = `Are you sure you want to permanently delete the notice: <strong>"${ann.title}"</strong>?`;
    ui.openModal('modal-delete-ann');
  }

  // Close modals
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.closeModal('modal-ann');
      ui.closeModal('modal-delete-ann');
    });
  });

  // Handle Save Announcement
  formAnn.addEventListener('submit', (e) => {
    e.preventDefault();

    const isEdit = Boolean(annIdInput.value);
    const title = titleInput.value.trim();
    const category = categoryInput.value;
    const priority = priorityInput.value;
    const author = authorInput.value.trim();
    const target = targetInput.value.trim();
    const content = contentInput.value.trim();
    const isPinned = pinnedInput.checked;

    if (!title || !content || !author) {
      ui.toast('Title, content and author are required.', 'warning');
      return;
    }

    const payload = {
      title,
      category,
      priority,
      author,
      targetAudience: target,
      content,
      isPinned,
      date: new Date().toISOString().split('T')[0]
    };

    if (!isEdit) {
      payload.id = store.nextId('announcements', 'ann-');
      payload.createdAt = new Date().toISOString();
      store.insert('announcements', payload);

      store.logActivity(
        admin.fullName,
        'admin',
        'Announcement Published',
        `Published ${category} notice: "${title}" ${isPinned ? '(Pinned)' : ''}`
      );

      ui.toast('Announcement published.', 'success');
    } else {
      store.update('announcements', annIdInput.value, payload);

      store.logActivity(
        admin.fullName,
        'admin',
        'Announcement Updated',
        `Updated notice: "${title}"`
      );

      ui.toast('Announcement updated.', 'success');
    }

    ui.closeModal('modal-ann');
    renderTable();
  });

  // Handle Delete Confirm
  btnConfirmDelete.addEventListener('click', () => {
    if (!annPendingDelete) return;

    const ann = annPendingDelete;
    store.delete('announcements', ann.id);

    store.logActivity(
      admin.fullName,
      'admin',
      'Announcement Deleted',
      `Deleted notice: "${ann.title}"`
    );

    ui.toast('Announcement deleted.', 'info');
    annPendingDelete = null;
    ui.closeModal('modal-delete-ann');
    renderTable();
  });

  renderTable();
});
