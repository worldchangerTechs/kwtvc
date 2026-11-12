/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Admin Students Directory Controller
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

  // DOM Elements
  const tbody = document.getElementById('students-table-body');
  const searchInput = document.getElementById('search-students');
  const courseFilter = document.getElementById('filter-course');
  const sponsorFilter = document.getElementById('filter-sponsor');
  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnOpenAdd = document.getElementById('btn-open-add-student');

  // Modal elements
  const modalStudent = document.getElementById('modal-student');
  const formStudent = document.getElementById('student-form');
  const studentFormId = document.getElementById('student-form-id');
  const modalStudentTitle = document.getElementById('modal-student-title');
  const studAdm = document.getElementById('stud-adm');
  const studName = document.getElementById('stud-name');
  const studEmail = document.getElementById('stud-email');
  const studPhone = document.getElementById('stud-phone');
  const studIdno = document.getElementById('stud-idno');
  const studCourse = document.getElementById('stud-course');
  const studSponsor = document.getElementById('stud-sponsor');
  const studPwd = document.getElementById('stud-pwd');
  const pwdFieldGroup = document.getElementById('pwd-field-group');
  const pwdHint = document.getElementById('pwd-hint');

  // Reset Pwd Modal
  const modalResetPwd = document.getElementById('modal-reset-pwd');
  const formResetPwd = document.getElementById('reset-pwd-form');
  const resetStudentId = document.getElementById('reset-student-id');
  const resetStudentInfo = document.getElementById('reset-student-info');
  const resetNewPwd = document.getElementById('reset-new-pwd');

  // Delete Modal
  const modalDelete = document.getElementById('modal-delete-student');
  const deletePromptMsg = document.getElementById('delete-prompt-msg');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  let studentPendingDelete = null;

  let searchTerm = '';
  let selectedCourse = 'ALL';
  let selectedSponsor = 'ALL';

  function renderTable() {
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

    // Filter
    const filtered = students.filter(s => {
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(term)) ||
        (s.fullName && s.fullName.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.phone && s.phone.includes(term));

      const matchCourse = selectedCourse === 'ALL' || (s.courseCode && s.courseCode === selectedCourse) || (s.course && s.course.includes(selectedCourse));
      const matchSponsor = selectedSponsor === 'ALL' || (s.sponsor && s.sponsor.toLowerCase().includes(selectedSponsor.toLowerCase()));

      return matchSearch && matchCourse && matchSponsor;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="ledger-empty">No students found.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(s => `
      <tr>
        <td class="font-semibold text-mono" style="color:var(--color-ink);">${s.admissionNumber}</td>
        <td style="font-weight:500; white-space:nowrap;">${s.fullName}</td>
        <td style="font-size:0.8125rem;">${s.email}</td>
        <td style="text-align:center;">${ui.badge(s.status || 'Active')}</td>
        <td style="text-align:right;">
          <div style="display:inline-flex; gap:4px;">
            <button type="button" class="btn btn-secondary btn-sm btn-edit-student" data-id="${s.id}" >Edit</button>
            <button type="button" class="btn btn-secondary btn-sm btn-reset-pwd" data-id="${s.id}" >Reset</button>
            <button type="button" class="btn btn-secondary btn-sm btn-delete-student" style="color:var(--color-brick);" data-id="${s.id}" >Delete</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach row button events
    document.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.addEventListener('click', () => openEditStudent(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-reset-pwd').forEach(btn => {
      btn.addEventListener('click', () => openResetPassword(btn.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', () => openDeleteConfirm(btn.getAttribute('data-id')));
    });
  }

  // Search & Filter Listeners
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      renderTable();
    });
  }

  if (courseFilter) {
    courseFilter.addEventListener('change', (e) => {
      selectedCourse = e.target.value;
      renderTable();
    });
  }

  if (sponsorFilter) {
    sponsorFilter.addEventListener('change', (e) => {
      selectedSponsor = e.target.value;
      renderTable();
    });
  }

  // Open Add Student Modal
  btnOpenAdd.addEventListener('click', () => {
    studentFormId.value = '';
    modalStudentTitle.textContent = 'Register New Student';
    studAdm.readOnly = false;
    studAdm.value = '';
    studName.value = '';
    studEmail.value = '';
    studPhone.value = '';
    studIdno.value = '';
    studCourse.value = 'Diploma in Information Communication Technology (DICT)';
    studSponsor.value = 'KUCCPS / Government Sponsored';
    studPwd.value = 'Student@123';
    pwdHint.textContent = 'Default initial password: Student@123';
    ui.openModal('modal-student');
  });

  // Open Edit Student Modal
  function openEditStudent(studentId) {
    const s = store.getById('students', studentId);
    if (!s) return;

    studentFormId.value = s.id;
    modalStudentTitle.textContent = `Edit Student: ${s.fullName}`;
    studAdm.readOnly = true;
    studAdm.value = s.admissionNumber;
    studName.value = s.fullName;
    studEmail.value = s.email;
    studPhone.value = s.phone || '';
    studIdno.value = s.nationalId || '';
    studCourse.value = s.course || 'Diploma in Information Communication Technology (DICT)';
    studSponsor.value = s.sponsor || 'KUCCPS / Government Sponsored';
    studPwd.value = '';
    pwdHint.textContent = 'Leave empty to keep existing password.';

    ui.openModal('modal-student');
  }

  // Open Reset Password Modal
  function openResetPassword(studentId) {
    const s = store.getById('students', studentId);
    if (!s) return;

    resetStudentId.value = s.id;
    resetStudentInfo.innerHTML = `Setting new portal password for <strong>${s.fullName}</strong> (${s.admissionNumber}).`;
    resetNewPwd.value = '';

    ui.openModal('modal-reset-pwd');
  }

  // Open Delete Confirm Modal
  function openDeleteConfirm(studentId) {
    const s = store.getById('students', studentId);
    if (!s) return;

    studentPendingDelete = s;
    deletePromptMsg.innerHTML = `Are you sure you want to permanently delete <strong>${s.fullName}</strong> (Admission No: <code>${s.admissionNumber}</code>)?`;
    ui.openModal('modal-delete-student');
  }

  // Close modals
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.closeModal('modal-student');
      ui.closeModal('modal-reset-pwd');
      ui.closeModal('modal-delete-student');
    });
  });

  // Handle Save Student (Create or Update)
  formStudent.addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEdit = Boolean(studentFormId.value);
    const adm = studAdm.value.trim().toUpperCase();
    const name = studName.value.trim();
    const email = studEmail.value.trim().toLowerCase();
    const phone = studPhone.value.trim();
    const idno = studIdno.value.trim();
    const course = studCourse.value;
    const sponsor = studSponsor.value;
    const pwd = studPwd.value;

    if (!adm || !name || !email || !phone) {
      ui.toast('Fill in all required fields.', 'warning');
      return;
    }

    const admRegex = /^\d{3,4}\/[A-Z]{3,5}\/\d{4}$/;
    if (!admRegex.test(adm)) {
      ui.toast('Use the format 838/DICT/2023.', 'error');
      studAdm.focus();
      return;
    }

    if (!isEdit) {
      // Check duplicate
      const existing = store.getAll('students');
      if (existing.some(s => s.admissionNumber === adm)) {
        ui.toast(`Admission number ${adm} already exists.`, 'error');
        return;
      }

      const passwordHash = await auth.hashPassword(pwd || 'Student@123');
      const newStudent = {
        id: store.nextId('students', 'stud-'),
        admissionNumber: adm,
        fullName: name,
        email: email,
        phone: phone,
        nationalId: idno,
        course: course,
        courseCode: course.includes('DICT') ? 'DICT' : 'CICT',
        department: 'Department of Computing and Informatics',
        level: 'Level 6 (TVET CDACC)',
        yearOfStudy: 'Year 1',
        currentTerm: 'Term 1',
        admissionYear: parseInt(adm.split('/')[2], 10) || new Date().getFullYear(),
        sponsor: sponsor,
        status: 'Active',
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
      };

      store.insert('students', newStudent);

      // Seed starter tuition fee
      store.insert('fee_statements', {
        id: store.nextId('fee_statements', 'fee-'),
        studentId: newStudent.id,
        admissionNumber: newStudent.admissionNumber,
        date: new Date().toISOString().split('T')[0],
        reference: `INV-INIT-${newStudent.admissionNumber.replace(/\//g, '-')}`,
        description: 'Term 1 Tuition & Departmental Registration Levies',
        type: 'Invoice',
        debit: 34500,
        credit: 0,
        balance: 34500
      });

      store.logActivity(
        admin.fullName,
        'admin',
        'Student Created',
        `Registered student ${name} (${adm})`
      );

      ui.toast(`${name} added.`, 'success');
    } else {
      // Edit existing
      const updates = {
        fullName: name,
        email: email,
        phone: phone,
        nationalId: idno,
        course: course,
        courseCode: course.includes('DICT') ? 'DICT' : 'CICT',
        sponsor: sponsor
      };

      if (pwd) {
        updates.passwordHash = await auth.hashPassword(pwd);
      }

      store.update('students', studentFormId.value, updates);

      store.logActivity(
        admin.fullName,
        'admin',
        'Student Profile Updated',
        `Updated details for student ${name} (${adm})`
      );

      ui.toast(`${name} updated.`, 'success');
    }

    ui.closeModal('modal-student');
    renderTable();
  });

  // Handle Reset Password Submit
  formResetPwd.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentId = resetStudentId.value;
    const newPassword = resetNewPwd.value.trim();

    if (!newPassword || newPassword.length < 6) {
      ui.toast('Password must be at least 6 characters.', 'warning');
      resetNewPwd.focus();
      return;
    }

    const s = store.getById('students', studentId);
    if (!s) return;

    const newHash = await auth.hashPassword(newPassword);
    store.update('students', studentId, { passwordHash: newHash });

    store.logActivity(
      admin.fullName,
      'admin',
      'Student Password Reset',
      `Administrative password reset for student ${s.fullName} (${s.admissionNumber})`
    );

    ui.toast(`Password reset for ${s.fullName}.`, 'success');
    ui.closeModal('modal-reset-pwd');
  });

  // Handle Confirm Delete
  btnConfirmDelete.addEventListener('click', () => {
    if (!studentPendingDelete) return;

    const s = studentPendingDelete;
    store.delete('students', s.id);

    // Clean associated records
    const submissions = store.getAll('submissions').filter(sub => sub.studentId !== s.id && sub.admissionNumber !== s.admissionNumber);
    store.set('submissions', submissions);

    const feeStatements = store.getAll('fee_statements').filter(f => f.studentId !== s.id && f.admissionNumber !== s.admissionNumber);
    store.set('fee_statements', feeStatements);

    const academics = store.getAll('academics').filter(a => a.studentId !== s.id && a.admissionNumber !== s.admissionNumber);
    store.set('academics', academics);

    store.logActivity(
      admin.fullName,
      'admin',
      'Student Record Deleted',
      `Permanently deleted student ${s.fullName} (${s.admissionNumber}) and all linked records`
    );

    ui.toast(`${s.fullName} deleted.`, 'info');
    studentPendingDelete = null;
    ui.closeModal('modal-delete-student');
    renderTable();
  });

  // Handle Export to CSV
  btnExportCsv.addEventListener('click', () => {
    const students = store.getAll('students');
    if (students.length === 0) {
      ui.toast('No students to export.', 'warning');
      return;
    }

    const headers = ['Admission Number', 'Full Name', 'Email', 'Phone', 'National ID', 'Course', 'Level', 'Year of Study', 'Sponsorship', 'Status', 'Registered Date'];
    const rows = students.map(s => [
      `"${s.admissionNumber || ''}"`,
      `"${s.fullName || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.nationalId || ''}"`,
      `"${s.course || ''}"`,
      `"${s.level || ''}"`,
      `"${s.yearOfStudy || ''}"`,
      `"${s.sponsor || ''}"`,
      `"${s.status || ''}"`,
      `"${s.createdAt || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kwtvc_computing_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    store.logActivity(
      admin.fullName,
      'admin',
      'Student Directory Exported',
      `Exported directory of ${students.length} students to CSV`
    );

    ui.toast(`Exported ${students.length} students.`, 'success');
  });

  renderTable();
});
