/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Admin Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = auth.requireRole('admin');
  if (!session) return;

  ui.initNavigation();

  const admin = auth.getCurrentUser();
  if (!admin) return;

  // Sidebar profile
  const sidebarAdminName = document.getElementById('sidebar-admin-name');
  const sidebarAdminRole = document.getElementById('sidebar-admin-role');
  if (sidebarAdminName) sidebarAdminName.textContent = admin.fullName;
  if (sidebarAdminRole) sidebarAdminRole.textContent = admin.designation || 'Head of Department';

  // Fetch collections
  const students = store.getAll('students');
  const assignments = store.getAll('assignments');
  const submissions = store.getAll('submissions');
  const announcements = store.getAll('announcements');
  const fees = store.getAll('fee_statements');
  const activityLogs = store.getAll('activity_log');

  // Update nav counters
  const navStudents = document.getElementById('nav-students-count');
  if (navStudents) navStudents.textContent = students.length;
  const navAsg = document.getElementById('nav-assignments-count');
  if (navAsg) navAsg.textContent = assignments.length;
  const navSubs = document.getElementById('nav-submissions-count');
  if (navSubs) navSubs.textContent = submissions.length;
  const navAnn = document.getElementById('nav-announcements-count');
  if (navAnn) navAnn.textContent = announcements.length;

  // 1. Summary Stat Row
  // 1) Total Students
  const statStudents = document.getElementById('stat-total-students');
  if (statStudents) statStudents.textContent = students.length;

  // 2) Active Assignments
  const statAsg = document.getElementById('stat-active-assignments');
  if (statAsg) statAsg.textContent = assignments.length;

  // 3) Submissions Today
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const subsToday = submissions.filter(s => {
    if (!s.submittedAt) return false;
    return s.submittedAt.startsWith(todayStr);
  });
  const statSubsToday = document.getElementById('stat-submissions-today');
  if (statSubsToday) statSubsToday.textContent = subsToday.length;

  // 4) Total Fees Outstanding in KES
  let totalBilled = 0;
  let totalPaid = 0;
  fees.forEach(f => {
    totalBilled += (Number(f.debit) || 0);
    totalPaid += (Number(f.credit) || 0);
  });
  const totalOutstanding = Math.max(0, totalBilled - totalPaid);

  const statFees = document.getElementById('stat-fees-outstanding');
  if (statFees) statFees.textContent = ui.formatKES(totalOutstanding);

  const statFeesSub = document.getElementById('stat-fees-sub');
  if (statFeesSub) {
    const rate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    statFeesSub.textContent = `${rate}% collected`;
  }

  // 2. Plain Handcrafted SVG Chart (Fee Ledger Revenue Distribution)
  const chartContainer = document.getElementById('svg-chart-container');
  if (chartContainer) {
    const maxVal = Math.max(totalBilled, totalPaid + totalOutstanding, 100000);
    const billedW = Math.max(20, Math.round((totalBilled / maxVal) * 500));
    const paidW = Math.max(20, Math.round((totalPaid / maxVal) * 500));
    const outW = Math.max(20, Math.round((totalOutstanding / maxVal) * 500));

    chartContainer.innerHTML = `
      <svg viewBox="0 0 760 170" width="100%" height="170" style="font-family:var(--font-sans);" aria-label="Fee Collection Chart">
        <!-- Grid guidelines -->
        <line x1="180" y1="20" x2="180" y2="140" stroke="#C9CEC9" stroke-width="1" />
        <line x1="330" y1="20" x2="330" y2="140" stroke="#E4E7E4" stroke-dasharray="3,3" />
        <line x1="480" y1="20" x2="480" y2="140" stroke="#E4E7E4" stroke-dasharray="3,3" />
        <line x1="630" y1="20" x2="630" y2="140" stroke="#E4E7E4" stroke-dasharray="3,3" />

        <!-- Bar 1: Total Billed -->
        <text x="165" y="46" font-size="12" font-weight="500" fill="#5F6761" text-anchor="end">Billed</text>
        <rect x="180" y="32" width="${billedW}" height="20" fill="#17412F" rx="3" />
        <text x="${190 + billedW}" y="47" font-size="12" font-weight="500" fill="#17412F">${ui.formatKES(totalBilled)}</text>

        <!-- Bar 2: Total Collected -->
        <text x="165" y="86" font-size="12" font-weight="500" fill="#5F6761" text-anchor="end">Collected</text>
        <rect x="180" y="72" width="${paidW}" height="20" fill="#3F7A5E" rx="3" />
        <text x="${190 + paidW}" y="87" font-size="12" font-weight="500" fill="#3F7A5E">${ui.formatKES(totalPaid)}</text>

        <!-- Bar 3: Outstanding -->
        <text x="165" y="126" font-size="12" font-weight="500" fill="#5F6761" text-anchor="end">Outstanding</text>
        <rect x="180" y="112" width="${outW}" height="20" fill="#B42318" rx="3" />
        <text x="${190 + outW}" y="127" font-size="12" font-weight="500" fill="#B42318">${ui.formatKES(totalOutstanding)}</text>
      </svg>
    `;
  }

  // 3. List 1: Recent Registrations
  const regTbody = document.getElementById('dash-registrations-body');
  if (regTbody) {
    const sortedStudents = [...students].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
    if (sortedStudents.length === 0) {
      regTbody.innerHTML = '<tr><td colspan="4" class="ledger-empty">No students yet.</td></tr>';
    } else {
      regTbody.innerHTML = sortedStudents.map(s => `
        <tr>
          <td class="font-semibold text-mono" style="color:var(--color-ink);">${s.admissionNumber}</td>
          <td><strong>${s.fullName}</strong></td>
          <td style="text-align:center;">${ui.badge(s.status || 'Active')}</td>
        </tr>
      `).join('');
    }
  }

  // 4. List 2: Recent Activity
  const actTbody = document.getElementById('dash-activity-body');
  if (actTbody) {
    const sortedLogs = [...activityLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 6);
    if (sortedLogs.length === 0) {
      actTbody.innerHTML = '<tr><td colspan="3" class="ledger-empty">No activity yet.</td></tr>';
    } else {
      actTbody.innerHTML = sortedLogs.map(log => `
        <tr>
          <td>
            <div style="font-size:0.875rem; font-weight:500;">${log.action}</div>
            <div style="font-size:0.8125rem; color:var(--color-text-muted);">${log.actorName}${log.details ? ' · ' + log.details : ''}</div>
          </td>
          <td style="font-size:0.8125rem; color:var(--color-text-muted); white-space:nowrap;">${ui.formatDate(log.timestamp)}</td>
        </tr>
      `).join('');
    }
  }
});
