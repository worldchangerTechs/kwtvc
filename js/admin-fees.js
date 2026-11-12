/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Admin Fees Controller
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

  const selectStudent = document.getElementById('select-student-fee');
  const btnOpenSetFee = document.getElementById('btn-open-set-fee');
  const btnOpenRecordPay = document.getElementById('btn-open-record-payment');

  // Summary elements
  const billedEl = document.getElementById('sel-total-billed');
  const paidEl = document.getElementById('sel-total-paid');
  const balanceEl = document.getElementById('sel-balance');
  const statusText = document.getElementById('sel-status-text');
  const clearanceBadge = document.getElementById('sel-clearance-badge');
  const balanceTile = document.getElementById('sel-stat-balance-tile');

  // Ledger elements
  const ledgerHeading = document.getElementById('ledger-student-heading');
  const historyCount = document.getElementById('fee-history-count');
  const tbody = document.getElementById('student-fee-history-body');
  const footDebit = document.getElementById('total-history-debit');
  const footCredit = document.getElementById('total-history-credit');
  const footBalance = document.getElementById('total-history-balance');

  // Set Fee Modal Elements
  const modalSetFee = document.getElementById('modal-set-fee');
  const formSetFee = document.getElementById('form-set-fee');
  const setFeeStudentDesc = document.getElementById('set-fee-student-desc');
  const billDesc = document.getElementById('bill-description');
  const billRef = document.getElementById('bill-ref');
  const billDate = document.getElementById('bill-date');
  const billAmount = document.getElementById('bill-amount');

  // Record Payment Modal Elements
  const modalPayment = document.getElementById('modal-payment');
  const formPayment = document.getElementById('form-payment');
  const payStudentDesc = document.getElementById('pay-student-desc');
  const payDate = document.getElementById('pay-date');
  const payRef = document.getElementById('pay-ref');
  const payDesc = document.getElementById('pay-description');
  const payAmount = document.getElementById('pay-amount');

  let currentStudentId = null;

  function initStudentDropdown() {
    const students = store.getAll('students');

    // Update nav counters
    const navStudents = document.getElementById('nav-students-count');
    if (navStudents) navStudents.textContent = students.length;
    const navAsg = document.getElementById('nav-assignments-count');
    if (navAsg) navAsg.textContent = store.getAll('assignments').length;
    const navSubs = document.getElementById('nav-submissions-count');
    if (navSubs) navSubs.textContent = store.getAll('submissions').length;
    const navAnn = document.getElementById('nav-announcements-count');
    if (navAnn) navAnn.textContent = store.getAll('announcements').length;

    if (students.length === 0) {
      selectStudent.innerHTML = '<option value="">No students registered</option>';
      return;
    }

    selectStudent.innerHTML = students.map(s => `
      <option value="${s.id}">${s.fullName} (${s.admissionNumber})</option>
    `).join('');

    currentStudentId = students[0].id;
    renderStudentLedger();
  }

  selectStudent.addEventListener('change', (e) => {
    currentStudentId = e.target.value;
    renderStudentLedger();
  });

  function renderStudentLedger() {
    if (!currentStudentId) return;

    const student = store.getById('students', currentStudentId);
    if (!student) return;

    if (ledgerHeading) ledgerHeading.textContent = `Fee Statement Ledger — ${student.fullName} (${student.admissionNumber})`;

    const allFees = store.getAll('fee_statements');
    const studentFees = allFees.filter(f => f.studentId === student.id || f.admissionNumber === student.admissionNumber);

    // Sort chronological
    studentFees.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    if (studentFees.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="ledger-empty">No transactions yet.</td></tr>';
      if (historyCount) historyCount.textContent = '0 records';
    } else {
      if (historyCount) historyCount.textContent = `${studentFees.length} ledger transactions`;

      tbody.innerHTML = studentFees.map(rec => {
        const debit = Number(rec.debit) || 0;
        const credit = Number(rec.credit) || 0;
        totalDebit += debit;
        totalCredit += credit;
        runningBalance += (debit - credit);

        const isReceipt = credit > 0 || (rec.type && rec.type.toLowerCase() === 'receipt');
        const badge = isReceipt ? '<span class="badge badge-success">Receipt</span>' : '<span class="badge badge-brick">Invoice</span>';

        return `
          <tr>
            <td class="text-mono" style="font-size:0.8rem;">${ui.formatDate(rec.date)}</td>
            <td class="text-mono font-semibold" style="color:var(--color-ink);">${rec.reference || '—'}</td>
            <td>${rec.description}</td>
            <td style="text-align:center;">${badge}</td>
            <td class="num">${debit > 0 ? ui.formatKES(debit, false) : '—'}</td>
            <td class="num font-semibold" style="color:var(--color-ink);">${credit > 0 ? ui.formatKES(credit, false) : '—'}</td>
            <td class="num font-bold">${ui.formatKES(runningBalance, false)}</td>
          </tr>
        `;
      }).join('');
    }

    // Update Summary Tiles
    if (billedEl) billedEl.textContent = ui.formatKES(totalDebit);
    if (paidEl) paidEl.textContent = ui.formatKES(totalCredit);
    if (balanceEl) balanceEl.textContent = ui.formatKES(runningBalance);

    if (runningBalance <= 0) {
      if (clearanceBadge) clearanceBadge.innerHTML = '<span class="badge badge-success">Fully Cleared</span>';
      if (statusText) statusText.textContent = 'Eligible for assessment card';
      if (balanceTile) balanceTile.classList.remove('accent-ochre');
    } else {
      const pct = totalDebit > 0 ? Math.round((totalCredit / totalDebit) * 100) : 0;
      if (clearanceBadge) clearanceBadge.innerHTML = `<span class="badge badge-ochre">${pct}% Paid</span>`;
      if (statusText) statusText.textContent = `Remaining: ${ui.formatKES(runningBalance)}`;
      if (balanceTile) balanceTile.classList.add('accent-ochre');
    }

    // Footers
    if (footDebit) footDebit.textContent = ui.formatKES(totalDebit, false);
    if (footCredit) footCredit.textContent = ui.formatKES(totalCredit, false);
    if (footBalance) footBalance.textContent = ui.formatKES(runningBalance, false);
  }

  // Open Set Fee Modal
  btnOpenSetFee.addEventListener('click', () => {
    const student = store.getById('students', currentStudentId);
    if (!student) {
      ui.toast('Select a student first.', 'warning');
      return;
    }

    setFeeStudentDesc.innerHTML = `Billing tuition / departmental fee for <strong>${student.fullName}</strong> (${student.admissionNumber}).`;
    billRef.value = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    billDate.value = new Date().toISOString().split('T')[0];
    billAmount.value = '';

    ui.openModal('modal-set-fee');
  });

  // Open Record Payment Modal
  btnOpenRecordPay.addEventListener('click', () => {
    const student = store.getById('students', currentStudentId);
    if (!student) {
      ui.toast('Select a student first.', 'warning');
      return;
    }

    payStudentDesc.innerHTML = `Receipting fee payment for <strong>${student.fullName}</strong> (${student.admissionNumber}).`;
    payDate.value = new Date().toISOString().split('T')[0];
    payRef.value = `Q${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    payAmount.value = '';

    ui.openModal('modal-payment');
  });

  // Close modals
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.closeModal('modal-set-fee');
      ui.closeModal('modal-payment');
    });
  });

  // Form Submit: Set Fee (Invoice Debit)
  formSetFee.addEventListener('submit', (e) => {
    e.preventDefault();

    const student = store.getById('students', currentStudentId);
    if (!student) return;

    const desc = billDesc.value.trim();
    const ref = billRef.value.trim().toUpperCase();
    const date = billDate.value;
    const amount = Number(billAmount.value);

    if (!desc || !ref || !date || isNaN(amount) || amount <= 0) {
      ui.toast('Enter a reference, date and amount.', 'warning');
      return;
    }

    const newInvoice = {
      id: store.nextId('fee_statements', 'fee-'),
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      date,
      reference: ref,
      description: desc,
      type: 'Invoice',
      debit: amount,
      credit: 0
    };

    store.insert('fee_statements', newInvoice);

    store.logActivity(
      admin.fullName,
      'admin',
      'Fee Invoiced',
      `Billed ${ui.formatKES(amount)} to ${student.fullName} (${student.admissionNumber}) Ref: ${ref}`
    );

    ui.toast(`Invoice of ${ui.formatKES(amount)} posted.`, 'success');
    ui.closeModal('modal-set-fee');
    renderStudentLedger();
  });

  // Form Submit: Record Payment (Receipt Credit)
  formPayment.addEventListener('submit', (e) => {
    e.preventDefault();

    const student = store.getById('students', currentStudentId);
    if (!student) return;

    const date = payDate.value;
    const ref = payRef.value.trim().toUpperCase();
    const desc = payDesc.value.trim();
    const amount = Number(payAmount.value);

    if (!ref || !date || isNaN(amount) || amount <= 0) {
      ui.toast('Enter a reference, date and amount.', 'warning');
      return;
    }

    const newReceipt = {
      id: store.nextId('fee_statements', 'fee-'),
      studentId: student.id,
      admissionNumber: student.admissionNumber,
      date,
      reference: ref,
      description: desc,
      type: 'Receipt',
      debit: 0,
      credit: amount
    };

    store.insert('fee_statements', newReceipt);

    store.logActivity(
      admin.fullName,
      'admin',
      'Fee Payment Recorded',
      `Recorded payment of ${ui.formatKES(amount)} for ${student.fullName} (${student.admissionNumber}) Ref: ${ref}`
    );

    ui.toast(`Payment of ${ui.formatKES(amount)} recorded.`, 'success');
    ui.closeModal('modal-payment');
    renderStudentLedger();
  });

  initStudentDropdown();
});
