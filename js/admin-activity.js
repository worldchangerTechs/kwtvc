/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Admin Activity Log Controller
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

  // Update nav counters
  const navStudents = document.getElementById('nav-students-count');
  if (navStudents) navStudents.textContent = store.getAll('students').length;
  const navAsg = document.getElementById('nav-assignments-count');
  if (navAsg) navAsg.textContent = store.getAll('assignments').length;
  const navSubs = document.getElementById('nav-submissions-count');
  if (navSubs) navSubs.textContent = store.getAll('submissions').length;
  const navAnn = document.getElementById('nav-announcements-count');
  if (navAnn) navAnn.textContent = store.getAll('announcements').length;

  const tbody = document.getElementById('activity-table-body');
  const searchInput = document.getElementById('search-activity');
  const roleFilterBtns = document.querySelectorAll('.role-filter-btn');

  let activeRoleFilter = 'ALL';
  let searchTerm = '';

  function renderTable() {
    const logs = store.getAll('activity_log');

    // Sort reverse-chronologically (latest first)
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Filter
    const filtered = sorted.filter(log => {
      const matchRole = activeRoleFilter === 'ALL' || (log.actorRole && log.actorRole.toLowerCase() === activeRoleFilter.toLowerCase());
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        (log.actorName && log.actorName.toLowerCase().includes(term)) ||
        (log.action && log.action.toLowerCase().includes(term)) ||
        (log.details && log.details.toLowerCase().includes(term));
      return matchRole && matchSearch;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="ledger-empty">No activity found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(log => {
      const isStaff = log.actorRole === 'admin';
      const roleBadge = isStaff
        ? '<span class="badge badge-ink">Staff / Admin</span>'
        : '<span class="badge badge-neutral">Student</span>';

      return `
        <tr>
          <td class="text-mono" style="font-size:0.8rem;">${ui.formatDate(log.timestamp, true)}</td>
          <td><strong>${log.actorName || 'System'}</strong></td>
          <td style="text-align:center;">${roleBadge}</td>
          <td class="font-semibold" style="color:var(--color-ink);">${log.action}</td>
          <td style="font-size:0.8125rem; color:var(--color-text);">${log.details || '—'}</td>
        </tr>
      `;
    }).join('');
  }

  // Search input listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      renderTable();
    });
  }

  // Role filter buttons
  roleFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roleFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRoleFilter = btn.getAttribute('data-role');
      renderTable();
    });
  });

  renderTable();
});
