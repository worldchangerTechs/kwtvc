/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Student Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Role Security Check
  const session = auth.requireRole('student');
  if (!session) return;

  // Initialize UI navigation and user profile badges
  ui.initNavigation();

  const student = auth.getCurrentUser();
  if (!student) return;

  // 2. Populate Sidebar Student Profile Info
  const sidebarName = document.getElementById('sidebar-student-name');
  const sidebarAdm = document.getElementById('sidebar-student-adm');
  if (sidebarName) sidebarName.textContent = student.fullName;
  if (sidebarAdm) sidebarAdm.textContent = student.admissionNumber;

  const greetingEl = document.getElementById('dash-greeting');
  if (greetingEl) greetingEl.textContent = `Welcome, ${student.fullName.split(' ')[0]}`;

  const subtitleEl = document.getElementById('dash-subtitle');
  if (subtitleEl) subtitleEl.textContent = `${student.course || 'Diploma in Information Communication Technology'} • ${student.admissionNumber}`;

  // 3. Panel 1: Upcoming Assignments (next 3 due dates + days-left count)
  const assignments = store.getAll('assignments');
  const submissions = store.getAll('submissions').filter(s => s.studentId === student.id || s.admissionNumber === student.admissionNumber);

  // Update nav counters
  const navAsg = document.getElementById('nav-assignments-count');
  if (navAsg) navAsg.textContent = assignments.length;
  const navAnn = document.getElementById('nav-announcements-count');
  if (navAnn) navAnn.textContent = store.getAll('announcements').length;

  const panelAsgList = document.getElementById('panel-assignments-list');
  if (panelAsgList) {
    const sortedAsg = [...assignments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 3);

    if (sortedAsg.length === 0) {
      panelAsgList.innerHTML = '<div class="ledger-empty">No assignments yet.</div>';
    } else {
      const now = new Date();
      panelAsgList.innerHTML = sortedAsg.map(asg => {
        const dueDate = new Date(asg.dueDate);
        const diffMs = dueDate - now;
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let daysBadge = '';
        if (daysLeft < 0) {
          daysBadge = `<span class="badge badge-brick">${Math.abs(daysLeft)}d overdue</span>`;
        } else if (daysLeft === 0) {
          daysBadge = `<span class="badge badge-ochre">Due today</span>`;
        } else if (daysLeft === 1) {
          daysBadge = `<span class="badge badge-ochre">1 day left</span>`;
        } else {
          daysBadge = `<span class="badge badge-ink">${daysLeft} days left</span>`;
        }

        const isSubmitted = submissions.some(s => s.assignmentId === asg.id);
        const statusBadge = isSubmitted ? '<span class="badge badge-success">Submitted</span>' : '<span class="badge badge-neutral">Pending</span>';

        return `
          <div style="border-bottom: 1px solid var(--color-border-light); padding-bottom: 10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
              <span class="font-semibold" style="font-size:0.875rem; color:var(--color-ink);">${asg.unitCode}: ${asg.title}</span>
              ${daysBadge}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.775rem; color:var(--color-text-muted);">
              <span>Due: ${ui.formatDate(asg.dueDate, true)}</span>
              ${statusBadge}
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 4. Panel 2: Fee Balance (Large KES Number + Thin Progress Bar of Paid vs Total)
  const feeRecords = store.getAll('fee_statements').filter(f => f.studentId === student.id || f.admissionNumber === student.admissionNumber);

  let totalBilled = 0;
  let totalPaid = 0;
  feeRecords.forEach(r => {
    totalBilled += (Number(r.debit) || 0);
    totalPaid += (Number(r.credit) || 0);
  });
  const balance = totalBilled - totalPaid;

  const balanceEl = document.getElementById('dash-fee-balance');
  const paidEl = document.getElementById('dash-fee-paid');
  const totalEl = document.getElementById('dash-fee-total');
  const progressFill = document.getElementById('dash-fee-progress-fill');
  const statusNote = document.getElementById('dash-fee-status-note');

  if (balanceEl) balanceEl.textContent = ui.formatKES(balance);
  if (paidEl) paidEl.textContent = ui.formatKES(totalPaid);
  if (totalEl) totalEl.textContent = ui.formatKES(totalBilled);

  const percentPaid = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 100;
  if (progressFill) {
    progressFill.style.width = `${percentPaid}%`;
    if (balance > 0) {
      progressFill.classList.add('accent-ochre');
    }
  }

  if (statusNote) {
    if (balance <= 0) {
      statusNote.innerHTML = '<span class="badge badge-success">Cleared</span>';
    } else {
      statusNote.innerHTML = `${percentPaid}% paid`;
    }
  }

  // 5. Panel 3: Recent Announcements (latest 3 with dates)
  const announcements = store.getAll('announcements');
  const panelAnnList = document.getElementById('panel-announcements-list');
  if (panelAnnList) {
    const sortedAnn = [...announcements].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    if (sortedAnn.length === 0) {
      panelAnnList.innerHTML = '<div class="ledger-empty">No announcements yet.</div>';
    } else {
      panelAnnList.innerHTML = sortedAnn.map(ann => `
        <div style="border-bottom: 1px solid var(--color-border-light); padding-bottom: 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
            <span class="badge badge-ink">${ann.category}</span>
            <span style="font-size:0.75rem; color:var(--color-text-subtle);">${ui.formatDate(ann.date)}</span>
          </div>
          <div class="font-semibold" style="font-size:0.85rem; color:var(--color-ink); line-height:1.3; margin-bottom:4px;">
            <a href="announcements.html" style="text-decoration:none; color:inherit;">${ann.title}</a>
          </div>
        </div>
      `).join('');
    }
  }

  // 6. Under them: Short "My Submissions" Table
  const subBody = document.getElementById('my-submissions-body');
  if (subBody) {
    if (submissions.length === 0) {
      subBody.innerHTML = '<tr><td colspan="6" class="ledger-empty">No submissions yet.</td></tr>';
    } else {
      subBody.innerHTML = submissions.map(sub => {
        const asg = assignments.find(a => a.id === sub.assignmentId);
        const unit = asg ? asg.unitCode : 'DICT';
        const title = asg ? asg.title : 'Continuous Assessment Task';
        const scoreText = sub.score !== null && sub.score !== undefined ? `${sub.score} / ${sub.maxScore || 30}` : '—';
        const statusBadge = ui.badge(sub.status || 'Submitted');
        const fileDisplay = sub.fileName ? `<span class="text-mono" style="font-size:0.75rem;">${sub.fileName} (${sub.fileSize || 'N/A'})</span>` : '<span class="text-muted">Text response only</span>';

        return `
          <tr>
            <td class="font-semibold" style="color:var(--color-ink);">${unit}</td>
            <td>${title}</td>
            <td class="text-mono" style="font-size:0.8rem;">${ui.formatDate(sub.submittedAt, true)}</td>
            <td>${fileDisplay}</td>
            <td class="num">${scoreText}</td>
            <td style="text-align:center;">${statusBadge}</td>
          </tr>
        `;
      }).join('');
    }
  }
});
