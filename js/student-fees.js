/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Student Fee Statement Controller
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

  // Print Header Elements
  const printName = document.getElementById('print-student-name');
  const printAdm = document.getElementById('print-student-adm');
  const printCourse = document.getElementById('print-student-course');
  const printDate = document.getElementById('print-date');
  const paybillAccount = document.getElementById('paybill-account-no');

  if (printName) printName.textContent = student.fullName;
  if (printAdm) printAdm.textContent = student.admissionNumber;
  if (printCourse) printCourse.textContent = student.course || 'Diploma in Information Communication Technology (DICT)';
  if (printDate) printDate.textContent = ui.formatDate(new Date(), true);
  if (paybillAccount) paybillAccount.textContent = student.admissionNumber;

  // Fetch student transactions
  const allRecords = store.getAll('fee_statements');
  const studentRecords = allRecords.filter(f => f.studentId === student.id || f.admissionNumber === student.admissionNumber);

  // Update nav counters
  const navAsg = document.getElementById('nav-assignments-count');
  if (navAsg) navAsg.textContent = store.getAll('assignments').length;
  const navAnn = document.getElementById('nav-announcements-count');
  if (navAnn) navAnn.textContent = store.getAll('announcements').length;

  // Sort chronological by date
  studentRecords.sort((a, b) => new Date(a.date) - new Date(b.date));

  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  let lastUpdated = null;

  const tbody = document.getElementById('fee-ledger-body');
  const countEl = document.getElementById('fee-items-count');

  if (studentRecords.length === 0) {
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="ledger-empty">No transactions yet.</td></tr>';
    }
  } else {
    if (countEl) countEl.textContent = `${studentRecords.length} recorded ledger entries`;

    const rowsHtml = studentRecords.map(rec => {
      const debit = Number(rec.debit) || 0;
      const credit = Number(rec.credit) || 0;

      totalDebit += debit;
      totalCredit += credit;
      runningBalance += (debit - credit);

      if (!lastUpdated || new Date(rec.date) > new Date(lastUpdated)) {
        lastUpdated = rec.date;
      }

      const isReceipt = credit > 0 || (rec.type && rec.type.toLowerCase() === 'receipt');
      const typeBadge = isReceipt ? '<span class="badge badge-success">Receipt</span>' : '<span class="badge badge-brick">Invoice</span>';

      const debitText = debit > 0 ? ui.formatKES(debit, false) : '—';
      const creditText = credit > 0 ? ui.formatKES(credit, false) : '—';
      const balanceText = ui.formatKES(runningBalance, false);

      return `
        <tr>
          <td class="text-mono" style="font-size:0.8rem;">${ui.formatDate(rec.date)}</td>
          <td class="text-mono font-semibold" style="color:var(--color-ink);">${rec.reference || '—'}</td>
          <td>${rec.description}</td>
          <td style="text-align:center;">${typeBadge}</td>
          <td class="num">${debitText}</td>
          <td class="num font-semibold" style="color:var(--color-ink);">${creditText}</td>
          <td class="num font-bold">${balanceText}</td>
        </tr>
      `;
    }).join('');

    if (tbody) tbody.innerHTML = rowsHtml;
  }

  // Update Summary Tiles
  const totalBilledEl = document.getElementById('fee-total-billed');
  const totalPaidEl = document.getElementById('fee-total-paid');
  const balanceEl = document.getElementById('fee-balance');
  const lastUpdatedEl = document.getElementById('fee-last-updated');
  const statusBadgeEl = document.getElementById('fee-status-badge');
  const statTileBalance = document.getElementById('stat-tile-balance');

  if (totalBilledEl) totalBilledEl.textContent = ui.formatKES(totalDebit);
  if (totalPaidEl) totalPaidEl.textContent = ui.formatKES(totalCredit);
  if (balanceEl) balanceEl.textContent = ui.formatKES(runningBalance);
  if (lastUpdatedEl) lastUpdatedEl.textContent = lastUpdated ? ui.formatDate(lastUpdated) : 'Current Term';

  if (statusBadgeEl) {
    if (runningBalance <= 0) {
      statusBadgeEl.innerHTML = '<span class="badge badge-success">Fully Cleared</span> Examination card granted';
      if (statTileBalance) statTileBalance.classList.remove('accent-ochre');
    } else {
      statusBadgeEl.innerHTML = `<span class="badge badge-ochre">Balance Due</span> Clear prior to exam week`;
    }
  }

  // Foot Totals
  const footDebit = document.getElementById('foot-total-debit');
  const footCredit = document.getElementById('foot-total-credit');
  const footBal = document.getElementById('foot-final-balance');

  if (footDebit) footDebit.textContent = ui.formatKES(totalDebit, false);
  if (footCredit) footCredit.textContent = ui.formatKES(totalCredit, false);
  if (footBal) footBal.textContent = ui.formatKES(runningBalance, false);

  // Print Button Handler
  const printBtn = document.getElementById('btn-print-fees');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});
