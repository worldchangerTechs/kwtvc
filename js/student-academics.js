/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Student Academic Records Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = auth.requireRole('student');
  if (!session) return;

  ui.initNavigation();

  const student = auth.getCurrentUser();
  if (!student) return;

  // Sidebar profile info
  const sidebarName = document.getElementById('sidebar-student-name');
  const sidebarAdm = document.getElementById('sidebar-student-adm');
  if (sidebarName) sidebarName.textContent = student.fullName;
  if (sidebarAdm) sidebarAdm.textContent = student.admissionNumber;

  // Update nav counters
  const navAsg = document.getElementById('nav-assignments-count');
  if (navAsg) navAsg.textContent = store.getAll('assignments').length;
  const navAnn = document.getElementById('nav-announcements-count');
  if (navAnn) navAnn.textContent = store.getAll('announcements').length;

  const academics = store.getAll('academics');
  const studentAcad = academics.find(a => a.studentId === student.id || a.admissionNumber === student.admissionNumber);

  const meanScoreEl = document.getElementById('acad-mean-score');
  const standingEl = document.getElementById('acad-standing');
  const unitsCountEl = document.getElementById('acad-units-count');
  const termsContainer = document.getElementById('academic-terms-container');

  if (!studentAcad || !studentAcad.terms || studentAcad.terms.length === 0) {
    if (termsContainer) {
      termsContainer.innerHTML = '<div class="panel"><div class="ledger-empty">No results published yet.</div></div>';
    }
    return;
  }

  if (meanScoreEl) meanScoreEl.textContent = `${studentAcad.cumulativeMean || '80.0'}%`;
  if (standingEl) standingEl.textContent = studentAcad.standing || 'Good Standing';

  let totalCompletedUnits = 0;
  studentAcad.terms.forEach(term => {
    if (term.status === 'Completed') {
      totalCompletedUnits += (term.units ? term.units.length : 0);
    }
  });
  if (unitsCountEl) unitsCountEl.textContent = `${totalCompletedUnits} Units Completed`;

  // Render each term table
  const termsHtml = studentAcad.terms.map(term => {
    const isCompleted = term.status === 'Completed';
    const statusBadge = isCompleted ? '<span class="badge badge-success">Series Completed</span>' : '<span class="badge badge-ochre">Continuous Assessment In Progress</span>';

    const unitsRows = (term.units || []).map(unit => {
      const catText = unit.cat !== null && unit.cat !== undefined ? unit.cat : '—';
      const examText = unit.exam !== null && unit.exam !== undefined ? unit.exam : 'Pending Exam';
      const totalText = unit.total !== null && unit.total !== undefined ? `${unit.total}` : '—';

      let gradeBadge = '';
      if (unit.grade === 'Distinction') {
        gradeBadge = '<span class="badge badge-success">Distinction</span>';
      } else if (unit.grade === 'Credit') {
        gradeBadge = '<span class="badge badge-ochre">Credit</span>';
      } else if (unit.grade === 'Pass') {
        gradeBadge = '<span class="badge badge-ink">Pass</span>';
      } else {
        gradeBadge = `<span class="badge badge-neutral">${unit.grade || 'Pending'}</span>`;
      }

      return `
        <tr>
          <td class="font-semibold text-mono" style="color:var(--color-ink);">${unit.code}</td>
          <td>${unit.title}</td>
          <td class="num">${catText}</td>
          <td class="num">${examText}</td>
          <td class="num font-bold" style="color:var(--color-ink);">${totalText}</td>
          <td style="text-align:center;">${gradeBadge}</td>
        </tr>
      `;
    }).join('');

    return `
      <section class="panel">
        <div class="panel-header">
          <h2 class="panel-title">
            <svg class="icon icon-sm" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
              <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
            </svg>
            <span>${term.termTitle}</span>
          </h2>
          ${statusBadge}
        </div>
        <div class="panel-body" style="padding:0;">
          <div class="table-responsive" style="border:none;">
            <table class="ledger-table">
              <thead>
                <tr>
                  <th style="width: 110px;">Unit Code</th>
                  <th>Unit Module Title</th>
                  <th class="num" style="width: 100px;">CAT (/30)</th>
                  <th class="num" style="width: 120px;">Main Exam (/70)</th>
                  <th class="num" style="width: 110px;">Total (/100)</th>
                  <th style="width: 140px; text-align:center;">Grade Award</th>
                </tr>
              </thead>
              <tbody>
                ${unitsRows}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }).join('');

  if (termsContainer) termsContainer.innerHTML = termsHtml;

  // Print slip handler
  const printBtn = document.getElementById('btn-print-slip');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});
