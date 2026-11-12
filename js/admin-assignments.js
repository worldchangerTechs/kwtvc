/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Admin Coursework Controller
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

  const tbody = document.getElementById('admin-assignments-body');
  const countIndicator = document.getElementById('asg-count-indicator');
  const btnOpenCreate = document.getElementById('btn-open-create-asg');

  // Modal elements
  const modalAsg = document.getElementById('modal-asg');
  const formAsg = document.getElementById('asg-form');
  const asgIdInput = document.getElementById('asg-id');
  const modalTitle = document.getElementById('modal-asg-title');
  const unitCodeInput = document.getElementById('asg-unit-code');
  const unitTitleInput = document.getElementById('asg-unit-title');
  const titleInput = document.getElementById('asg-title');
  const deptInput = document.getElementById('asg-department');
  const lecturerInput = document.getElementById('asg-lecturer');
  const dueDateInput = document.getElementById('asg-due-date');
  const maxScoreInput = document.getElementById('asg-max-score');
  const instructionsInput = document.getElementById('asg-instructions');

  // Delete modal
  const modalDelete = document.getElementById('modal-delete-asg');
  const deletePrompt = document.getElementById('delete-asg-prompt');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete-asg');
  let asgPendingDelete = null;

  function renderTable() {
    const assignments = store.getAll('assignments');
    const submissions = store.getAll('submissions');

    // Update nav counters
    const navStudents = document.getElementById('nav-students-count');
    if (navStudents) navStudents.textContent = store.getAll('students').length;
    const navAsg = document.getElementById('nav-assignments-count');
    if (navAsg) navAsg.textContent = assignments.length;
    const navSubs = document.getElementById('nav-submissions-count');
    if (navSubs) navSubs.textContent = submissions.length;
    const navAnn = document.getElementById('nav-announcements-count');
    if (navAnn) navAnn.textContent = store.getAll('announcements').length;

    if (countIndicator) countIndicator.textContent = `${assignments.length} total active modules`;

    if (assignments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="ledger-empty">No assignments yet.</td></tr>';
      return;
    }

    // Sort by due date ascending
    const sorted = [...assignments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    tbody.innerHTML = sorted.map(asg => {
      const subCount = submissions.filter(s => s.assignmentId === asg.id).length;

      return `
        <tr>
          <td class="font-semibold text-mono" style="color:var(--color-ink);">${asg.unitCode}</td>
          <td>
            <div class="font-semibold" style="color:var(--color-ink);">${asg.title}</div>
            <div style="font-size:0.775rem; color:var(--color-text-muted); line-height:1.35; max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${asg.instructions}
            </div>
          </td>
          <td style="font-size:0.8rem;">${asg.department || 'Computing & Informatics'}</td>
          <td style="font-size:0.8rem;">${asg.lecturer || 'Faculty'}</td>
          <td class="text-mono" style="font-size:0.8rem;">${ui.formatDate(asg.dueDate, true)}</td>
          <td class="num font-bold">${asg.maxScore || 30}</td>
          <td style="text-align:center;">
            <a href="submissions.html?asg=${asg.id}" class="badge badge-ink" style="text-decoration:none;" title="View Submissions">
              ${subCount} submissions
            </a>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:4px;">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-asg" data-id="${asg.id}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm btn-delete-asg" data-id="${asg.id}">Del</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row listeners
    document.querySelectorAll('.btn-edit-asg').forEach(btn => {
      btn.addEventListener('click', () => openEditAsg(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-delete-asg').forEach(btn => {
      btn.addEventListener('click', () => openDeleteAsg(btn.getAttribute('data-id')));
    });
  }

  // Open Create Modal
  btnOpenCreate.addEventListener('click', () => {
    asgIdInput.value = '';
    modalTitle.textContent = 'Create New Coursework Assignment';
    unitCodeInput.value = '';
    unitTitleInput.value = '';
    titleInput.value = '';
    deptInput.value = 'Department of Computing and Informatics';
    lecturerInput.value = admin.fullName;
    maxScoreInput.value = '30';
    instructionsInput.value = '';

    // Default due date: 7 days from now at 17:00
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const yyyy = nextWeek.getFullYear();
    const mm = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const dd = String(nextWeek.getDate()).padStart(2, '0');
    dueDateInput.value = `${yyyy}-${mm}-${dd}T17:00`;

    ui.openModal('modal-asg');
  });

  // Open Edit Modal
  function openEditAsg(id) {
    const asg = store.getById('assignments', id);
    if (!asg) return;

    asgIdInput.value = asg.id;
    modalTitle.textContent = `Edit Assignment: ${asg.unitCode}`;
    unitCodeInput.value = asg.unitCode || '';
    unitTitleInput.value = asg.unitTitle || '';
    titleInput.value = asg.title || '';
    deptInput.value = asg.department || 'Department of Computing and Informatics';
    lecturerInput.value = asg.lecturer || admin.fullName;
    maxScoreInput.value = asg.maxScore || 30;
    instructionsInput.value = asg.instructions || '';

    if (asg.dueDate) {
      dueDateInput.value = asg.dueDate.slice(0, 16);
    }

    ui.openModal('modal-asg');
  }

  // Open Delete Modal
  function openDeleteAsg(id) {
    const asg = store.getById('assignments', id);
    if (!asg) return;

    asgPendingDelete = asg;
    deletePrompt.innerHTML = `Are you sure you want to permanently delete <strong>${asg.unitCode}: ${asg.title}</strong>?`;
    ui.openModal('modal-delete-asg');
  }

  // Close modals
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.closeModal('modal-asg');
      ui.closeModal('modal-delete-asg');
    });
  });

  // Handle Save Assignment
  formAsg.addEventListener('submit', (e) => {
    e.preventDefault();

    const isEdit = Boolean(asgIdInput.value);
    const unitCode = unitCodeInput.value.trim().toUpperCase();
    const unitTitle = unitTitleInput.value.trim();
    const title = titleInput.value.trim();
    const dept = deptInput.value.trim();
    const lecturer = lecturerInput.value.trim();
    const dueDate = dueDateInput.value;
    const maxScore = parseInt(maxScoreInput.value, 10) || 30;
    const instructions = instructionsInput.value.trim();

    if (!unitCode || !title || !dueDate || !instructions) {
      ui.toast('Fill in all required fields.', 'warning');
      return;
    }

    const payload = {
      unitCode,
      unitTitle,
      title,
      department: dept,
      lecturer,
      dueDate,
      maxScore,
      instructions,
      status: 'Active'
    };

    if (!isEdit) {
      payload.id = store.nextId('assignments', 'asg-');
      payload.createdAt = new Date().toISOString();
      store.insert('assignments', payload);

      store.logActivity(
        admin.fullName,
        'admin',
        'Assignment Created',
        `Created coursework task ${unitCode}: ${title} (Due: ${dueDate})`
      );

      ui.toast(`Assignment ${unitCode} created.`, 'success');
    } else {
      store.update('assignments', asgIdInput.value, payload);

      store.logActivity(
        admin.fullName,
        'admin',
        'Assignment Updated',
        `Updated coursework task ${unitCode}: ${title}`
      );

      ui.toast(`Assignment ${unitCode} updated.`, 'success');
    }

    ui.closeModal('modal-asg');
    renderTable();
  });

  // Handle Delete Confirm
  btnConfirmDelete.addEventListener('click', () => {
    if (!asgPendingDelete) return;

    const asg = asgPendingDelete;
    store.delete('assignments', asg.id);

    // Also remove associated submissions
    const remainingSubs = store.getAll('submissions').filter(s => s.assignmentId !== asg.id);
    store.set('submissions', remainingSubs);

    store.logActivity(
      admin.fullName,
      'admin',
      'Assignment Deleted',
      `Deleted assignment ${asg.unitCode}: ${asg.title} and linked submissions`
    );

    ui.toast(`Assignment ${asg.unitCode} deleted.`, 'info');
    asgPendingDelete = null;
    ui.closeModal('modal-delete-asg');
    renderTable();
  });

  renderTable();
});
