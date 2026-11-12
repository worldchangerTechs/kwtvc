/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Admin Submissions & Grading Controller
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

  // URL Query Param preselection (e.g. submissions.html?asg=asg-1)
  const urlParams = new URLSearchParams(window.location.search);
  let selectedAsgId = urlParams.get('asg') || 'ALL';
  let activeStatusFilter = 'ALL';

  // DOM Elements
  const asgSelect = document.getElementById('filter-by-assignment');
  const tbody = document.getElementById('admin-submissions-body');
  const statusFilterBtns = document.querySelectorAll('.sub-filter-btn');

  // Modal elements
  const modalGrade = document.getElementById('modal-grade');
  const formGrade = document.getElementById('grade-form');
  const gradeSubId = document.getElementById('grade-sub-id');
  const gradeStudentName = document.getElementById('grade-student-name');
  const gradeStudentAdm = document.getElementById('grade-student-adm');
  const gradeSubmittedTime = document.getElementById('grade-submitted-time');
  const gradeAsgTitle = document.getElementById('grade-asg-title');
  const gradeFileInfo = document.getElementById('grade-file-info');
  const gradeStudentText = document.getElementById('grade-student-text');
  const inputGradeScore = document.getElementById('input-grade-score');
  const gradeMaxLabel = document.getElementById('grade-max-label');
  const inputGradeFeedback = document.getElementById('input-grade-feedback');
  const gradeEvaluator = document.getElementById('grade-evaluator');

  if (gradeEvaluator) gradeEvaluator.value = admin.fullName;

  function initAsgFilter() {
    const assignments = store.getAll('assignments');

    // Update nav counters
    const navStudents = document.getElementById('nav-students-count');
    if (navStudents) navStudents.textContent = store.getAll('students').length;
    const navAsg = document.getElementById('nav-assignments-count');
    if (navAsg) navAsg.textContent = assignments.length;
    const navSubs = document.getElementById('nav-submissions-count');
    if (navSubs) navSubs.textContent = store.getAll('submissions').length;
    const navAnn = document.getElementById('nav-announcements-count');
    if (navAnn) navAnn.textContent = store.getAll('announcements').length;

    asgSelect.innerHTML = '<option value="ALL">All assignments</option>' +
      assignments.map(a => `<option value="${a.id}" ${a.id === selectedAsgId ? 'selected' : ''}>${a.unitCode}: ${a.title}</option>`).join('');

    renderSubmissions();
  }

  asgSelect.addEventListener('change', (e) => {
    selectedAsgId = e.target.value;
    renderSubmissions();
  });

  statusFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.getAttribute('data-status');
      renderSubmissions();
    });
  });

  function renderSubmissions() {
    const submissions = store.getAll('submissions');
    const assignments = store.getAll('assignments');

    const filtered = submissions.filter(s => {
      const matchAsg = selectedAsgId === 'ALL' || s.assignmentId === selectedAsgId;
      const matchStatus = activeStatusFilter === 'ALL' ||
        (activeStatusFilter === 'Submitted' && s.status !== 'Graded') ||
        (activeStatusFilter === 'Graded' && s.status === 'Graded');
      return matchAsg && matchStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="ledger-empty">No submissions found.</td></tr>';
      return;
    }

    // Sort by submission time descending
    filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    tbody.innerHTML = filtered.map(sub => {
      const asg = assignments.find(a => a.id === sub.assignmentId);
      const asgTitle = asg ? `${asg.unitCode}: ${asg.title}` : 'Continuous Assessment Task';

      const scoreText = sub.score !== null && sub.score !== undefined
        ? `<strong class="text-mono" style="color:var(--color-ink);">${sub.score}/${sub.maxScore || 30}</strong>`
        : '—';

      const statusBadge = ui.badge(sub.status || 'Submitted');

      return `
        <tr>
          <td class="font-semibold text-mono" style="color:var(--color-ink);">${sub.admissionNumber}</td>
          <td style="font-weight:500; white-space:nowrap;">${sub.studentName}</td>
          <td>
            <div style="font-size:0.875rem;">${asgTitle}</div>
          </td>
          <td style="font-size:0.8125rem; white-space:nowrap;">${ui.formatDate(sub.submittedAt)}</td>
          <td class="num">${scoreText}</td>
          <td style="text-align:center;">${statusBadge}</td>
          <td style="text-align:right;">
            <button type="button" class="btn btn-secondary btn-sm btn-open-grade" data-id="${sub.id}">
              ${sub.status === 'Graded' ? 'Edit grade' : 'Grade'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach grade click listeners
    document.querySelectorAll('.btn-open-grade').forEach(btn => {
      btn.addEventListener('click', () => {
        openGradeModal(btn.getAttribute('data-id'));
      });
    });
  }

  function openGradeModal(submissionId) {
    const sub = store.getById('submissions', submissionId);
    if (!sub) return;

    const asg = store.getById('assignments', sub.assignmentId);
    const maxMarks = asg ? asg.maxScore : (sub.maxScore || 30);

    gradeSubId.value = sub.id;
    gradeStudentName.textContent = sub.studentName;
    gradeStudentAdm.textContent = sub.admissionNumber;
    gradeSubmittedTime.textContent = ui.formatDate(sub.submittedAt);
    gradeAsgTitle.textContent = asg ? `${asg.unitCode}: ${asg.title}` : 'Assignment';

    if (sub.fileName) {
      gradeFileInfo.innerHTML = `<span class="badge badge-ink">${sub.fileName} (${sub.fileSize || 'N/A'})</span>`;
    } else {
      gradeFileInfo.textContent = 'No file attached';
    }

    gradeStudentText.textContent = sub.notes || 'No written text was provided for this submission.';
    inputGradeScore.max = maxMarks;
    inputGradeScore.value = sub.score !== null && sub.score !== undefined ? sub.score : '';
    gradeMaxLabel.textContent = `/ ${maxMarks} Marks`;
    inputGradeFeedback.value = sub.feedback || '';

    ui.openModal('modal-grade');
  }

  // Close modals
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.closeModal('modal-grade');
    });
  });

  // Handle Grade Form Submit & Sync with Academics Page
  formGrade.addEventListener('submit', (e) => {
    e.preventDefault();

    const subId = gradeSubId.value;
    const sub = store.getById('submissions', subId);
    if (!sub) return;

    const asg = store.getById('assignments', sub.assignmentId);
    const maxScore = asg ? asg.maxScore : (sub.maxScore || 30);
    const score = Number(inputGradeScore.value);
    const feedback = inputGradeFeedback.value.trim();

    if (isNaN(score) || score < 0 || score > maxScore) {
      ui.toast(`Enter a mark between 0 and ${maxScore}.`, 'warning');
      inputGradeScore.focus();
      return;
    }

    if (!feedback) {
      ui.toast('Add a comment.', 'warning');
      inputGradeFeedback.focus();
      return;
    }

    // 1. Update the submission record in store
    store.update('submissions', sub.id, {
      score,
      maxScore,
      feedback,
      gradedBy: admin.fullName,
      gradedAt: new Date().toISOString(),
      status: 'Graded'
    });

    // 2. Synchronize mark to student's academics record in store
    const unitCode = asg ? asg.unitCode : 'DICT 201';
    const unitTitle = asg ? asg.unitTitle || asg.title : 'Continuous Assessment Task';
    syncGradeToStudentAcademics(sub.studentId, sub.admissionNumber, unitCode, unitTitle, score, maxScore);

    // 3. Log Activity
    store.logActivity(
      admin.fullName,
      'admin',
      'Coursework Graded',
      `Awarded ${score}/${maxScore} to ${sub.studentName} (${sub.admissionNumber}) for ${unitCode}`
    );

    ui.toast(`Grade saved for ${sub.studentName}.`, 'success');
    ui.closeModal('modal-grade');
    renderSubmissions();
  });

  /**
   * Synchronize coursework score directly into student's academics module ledger
   */
  function syncGradeToStudentAcademics(studentId, admissionNumber, unitCode, unitTitle, score, maxScore) {
    const academicsList = store.getAll('academics');
    let studentAcad = academicsList.find(a => a.studentId === studentId || a.admissionNumber === admissionNumber);

    if (!studentAcad) {
      studentAcad = {
        id: store.nextId('academics', 'acad-'),
        studentId,
        admissionNumber,
        cumulativeMean: 80.0,
        standing: 'Good Standing (Distinction Range)',
        terms: [
          {
            termTitle: 'Year 2 - Term 1 (In Progress - Continuous Assessment)',
            status: 'In Progress',
            units: []
          }
        ]
      };
      academicsList.push(studentAcad);
    }

    // Find current active term or first term
    let activeTerm = studentAcad.terms.find(t => t.status === 'In Progress') || studentAcad.terms[studentAcad.terms.length - 1];
    if (!activeTerm) {
      activeTerm = {
        termTitle: 'Current Term Assessment Series',
        status: 'In Progress',
        units: []
      };
      studentAcad.terms.push(activeTerm);
    }

    if (!activeTerm.units) activeTerm.units = [];

    // Find matching unit
    let unitEntry = activeTerm.units.find(u => u.code === unitCode);
    if (!unitEntry) {
      unitEntry = {
        code: unitCode,
        title: unitTitle,
        cat: score,
        exam: null,
        total: score,
        grade: 'Pending Final Exam'
      };
      activeTerm.units.push(unitEntry);
    } else {
      unitEntry.cat = score;
      if (unitEntry.exam !== null && unitEntry.exam !== undefined) {
        unitEntry.total = Number(unitEntry.cat) + Number(unitEntry.exam);
        if (unitEntry.total >= 80) unitEntry.grade = 'Distinction';
        else if (unitEntry.total >= 65) unitEntry.grade = 'Credit';
        else if (unitEntry.total >= 50) unitEntry.grade = 'Pass';
        else unitEntry.grade = 'Fail';
      } else {
        unitEntry.total = score;
        unitEntry.grade = 'Pending Final Exam';
      }
    }

    store.set('academics', academicsList);
  }

  initAsgFilter();
});
