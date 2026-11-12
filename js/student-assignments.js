/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Student Coursework Controller
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

  const container = document.getElementById('assignments-container');
  const countEl = document.getElementById('asg-summary-count');

  // Modal elements
  const modalSubmit = document.getElementById('modal-submit');
  const form = document.getElementById('submission-form');
  const modalAsgId = document.getElementById('modal-asg-id');
  const modalHeading = document.getElementById('modal-asg-heading');
  const modalDeadline = document.getElementById('modal-asg-deadline');
  const modalResubmitAlert = document.getElementById('modal-asg-resubmit-alert');
  const textAnswer = document.getElementById('sub-text-answer');
  const fileInput = document.getElementById('sub-file-input');
  const prevFileWrapper = document.getElementById('modal-previous-file');
  const prevFileName = document.getElementById('prev-file-name');
  const btnSubmitAction = document.getElementById('btn-submit-action');

  let activeSubmission = null;

  function renderAssignments() {
    const assignments = store.getAll('assignments');
    const submissions = store.getAll('submissions').filter(s => s.studentId === student.id || s.admissionNumber === student.admissionNumber);

    // Update nav counters
    const navAsg = document.getElementById('nav-assignments-count');
    if (navAsg) navAsg.textContent = assignments.length;
    const navAnn = document.getElementById('nav-announcements-count');
    if (navAnn) navAnn.textContent = store.getAll('announcements').length;

    if (countEl) countEl.textContent = `${assignments.length} assigned`;

    if (assignments.length === 0) {
      container.innerHTML = '<div class="ledger-empty">No assignments yet.</div>';
      return;
    }

    const now = new Date();

    container.innerHTML = assignments.map(asg => {
      const existingSub = submissions.find(s => s.assignmentId === asg.id);
      const dueDate = new Date(asg.dueDate);
      const isPastDue = now > dueDate;

      let statusBadge = '';
      let actionBtn = '';

      if (existingSub) {
        if (existingSub.status === 'Graded') {
          statusBadge = `<span class="badge badge-success">Graded: ${existingSub.score}/${asg.maxScore}</span>`;
        } else if (existingSub.status === 'Late') {
          statusBadge = '<span class="badge badge-brick">Submitted Late</span>';
        } else {
          statusBadge = '<span class="badge badge-success">Submitted</span>';
        }

        // Can resubmit before deadline if not yet graded
        if (!isPastDue && existingSub.status !== 'Graded') {
          actionBtn = `<button type="button" class="btn btn-secondary btn-sm btn-open-submit" data-asg-id="${asg.id}">Resubmit Work</button>`;
        } else {
          actionBtn = `<button type="button" class="btn btn-secondary btn-sm btn-open-submit" data-asg-id="${asg.id}">View Submission</button>`;
        }
      } else {
        if (isPastDue) {
          statusBadge = '<span class="badge badge-brick">Late / Overdue</span>';
          actionBtn = `<button type="button" class="btn btn-danger btn-sm btn-open-submit" data-asg-id="${asg.id}">Submit Late</button>`;
        } else {
          statusBadge = '<span class="badge badge-ochre">Pending</span>';
          actionBtn = `<button type="button" class="btn btn-primary btn-sm btn-open-submit" data-asg-id="${asg.id}">Submit Work</button>`;
        }
      }

      // Existing feedback block
      let feedbackHtml = '';
      if (existingSub && existingSub.feedback) {
        feedbackHtml = `
          <div style="margin-top:10px; padding:10px 12px; background-color:var(--color-paper-light); border-radius:var(--radius); font-size:0.8125rem;">
            <div class="font-semibold" style="color:var(--color-ink); margin-bottom:2px;">Feedback</div>
            <div style="color:var(--color-text);">${existingSub.feedback}</div>
          </div>
        `;
      } else if (existingSub && existingSub.notes) {
        feedbackHtml = `
          <div style="margin-top:10px; padding:8px 12px; background-color:var(--color-paper-light); border:1px solid var(--color-border); border-radius:var(--radius); font-size:0.8125rem;">
            <span class="text-muted">Your answer:</span> "${existingSub.notes}"
            ${existingSub.fileName ? ` • <span class="text-mono">${existingSub.fileName} (${existingSub.fileSize || 'N/A'})</span>` : ''}
          </div>
        `;
      }

      return `
        <article style="border: 1px solid var(--color-border); border-radius: var(--radius); background-color: var(--color-surface); padding: 24px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
            <div>
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <span class="badge badge-ink">${asg.unitCode}</span>
                <span style="font-size:0.8125rem; color:var(--color-text-muted);">${asg.lecturer}</span>
              </div>
              <h3 style="font-size:1.0625rem; color:var(--color-ink); margin-bottom:4px;">${asg.title}</h3>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              ${statusBadge}
              ${actionBtn}
            </div>
          </div>

          <p style="font-size:0.875rem; color:var(--color-text-muted); line-height:1.65; margin-bottom:16px;">
            ${asg.instructions}
          </p>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8125rem; color:var(--color-text-muted); border-top:1px solid var(--color-border-light); padding-top:8px;">
            <span>Due <strong style="color:var(--color-text);">${ui.formatDate(asg.dueDate, true)}</strong></span>
            <span>Marks: <strong style="color:var(--color-text);">${asg.maxScore}</strong></span>
          </div>

          ${feedbackHtml}
        </article>
      `;
    }).join('');

    // Attach click listeners to open modal
    document.querySelectorAll('.btn-open-submit').forEach(btn => {
      btn.addEventListener('click', () => {
        const asgId = btn.getAttribute('data-asg-id');
        openSubmitModal(asgId);
      });
    });
  }

  function openSubmitModal(asgId) {
    const assignments = store.getAll('assignments');
    const asg = assignments.find(a => a.id === asgId);
    if (!asg) return;

    const submissions = store.getAll('submissions').filter(s => s.studentId === student.id || s.admissionNumber === student.admissionNumber);
    activeSubmission = submissions.find(s => s.assignmentId === asg.id) || null;

    modalAsgId.value = asg.id;
    modalHeading.textContent = `${asg.unitCode}: ${asg.title}`;
    modalDeadline.textContent = `Deadline: ${ui.formatDate(asg.dueDate, true)} (Max ${asg.maxScore} marks)`;

    const now = new Date();
    const isPastDue = now > new Date(asg.dueDate);

    if (activeSubmission) {
      textAnswer.value = activeSubmission.notes || '';
      btnSubmitAction.textContent = 'Resubmit Assignment';
      modalResubmitAlert.style.display = 'block';

      if (activeSubmission.fileName) {
        prevFileWrapper.style.display = 'block';
        prevFileName.textContent = `${activeSubmission.fileName} (${activeSubmission.fileSize || 'N/A'})`;
      } else {
        prevFileWrapper.style.display = 'none';
      }

      if (isPastDue) {
        btnSubmitAction.disabled = true;
        btnSubmitAction.textContent = 'Deadline Passed — Submissions Closed';
      } else {
        btnSubmitAction.disabled = false;
      }
    } else {
      textAnswer.value = '';
      fileInput.value = '';
      btnSubmitAction.textContent = isPastDue ? 'Submit Late Assignment' : 'Submit Assignment';
      btnSubmitAction.disabled = false;
      modalResubmitAlert.style.display = 'none';
      prevFileWrapper.style.display = 'none';
    }

    ui.openModal('modal-submit');
  }

  // Handle Close Modals
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.closeModal('modal-submit');
    });
  });

  // Handle Submission Form
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const asgId = modalAsgId.value;
    const assignments = store.getAll('assignments');
    const asg = assignments.find(a => a.id === asgId);
    if (!asg) return;

    const answer = textAnswer.value.trim();
    if (!answer) {
      ui.toast('Write a short answer.', 'warning');
      textAnswer.focus();
      return;
    }

    const now = new Date();
    const isLate = now > new Date(asg.dueDate);

    // Extract file metadata without storing file contents in localStorage
    let fileName = null;
    let fileSize = null;

    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileName = file.name;
      const bytes = file.size;
      if (bytes < 1024) fileSize = `${bytes} B`;
      else if (bytes < 1024 * 1024) fileSize = `${(bytes / 1024).toFixed(1)} KB`;
      else fileSize = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (activeSubmission && activeSubmission.fileName) {
      // Retain previously attached file if not replaced
      fileName = activeSubmission.fileName;
      fileSize = activeSubmission.fileSize;
    }

    const subPayload = {
      assignmentId: asg.id,
      studentId: student.id,
      studentName: student.fullName,
      admissionNumber: student.admissionNumber,
      submittedAt: now.toISOString(),
      fileName: fileName,
      fileSize: fileSize,
      notes: answer,
      status: isLate ? 'Late' : 'Submitted',
      score: activeSubmission ? activeSubmission.score : null,
      maxScore: asg.maxScore,
      feedback: activeSubmission ? activeSubmission.feedback : null,
      gradedBy: activeSubmission ? activeSubmission.gradedBy : null,
      gradedAt: activeSubmission ? activeSubmission.gradedAt : null
    };

    if (activeSubmission) {
      store.update('submissions', activeSubmission.id, subPayload);
      store.logActivity(
        student.fullName,
        'student',
        'Assignment Resubmitted',
        `Resubmitted work for ${asg.unitCode} (${asg.title})`
      );
      ui.toast('Resubmitted.', 'success');
    } else {
      subPayload.id = store.nextId('submissions', 'sub-');
      store.insert('submissions', subPayload);
      store.logActivity(
        student.fullName,
        'student',
        isLate ? 'Late Assignment Submitted' : 'Assignment Submitted',
        `Submitted work for ${asg.unitCode} (${asg.title})`
      );
      ui.toast(isLate ? 'Submitted late.' : 'Submitted.', isLate ? 'warning' : 'success');
    }

    ui.closeModal('modal-submit');
    renderAssignments();
  });

  renderAssignments();
});
