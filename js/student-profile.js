/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Student Profile & Settings Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const session = auth.requireRole('student');
  if (!session) return;

  ui.initNavigation();

  let student = auth.getCurrentUser();
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

  // Form Fields
  const admInput = document.getElementById('prof-admission');
  const idInput = document.getElementById('prof-national-id');
  const nameInput = document.getElementById('prof-name');
  const emailInput = document.getElementById('prof-email');
  const phoneInput = document.getElementById('prof-phone');
  const genderInput = document.getElementById('prof-gender');

  const courseLabel = document.getElementById('prof-course-label');
  const sponsorLabel = document.getElementById('prof-sponsor-label');
  const termLabel = document.getElementById('prof-term-label');

  // Populate Values
  if (admInput) admInput.value = student.admissionNumber || '';
  if (idInput) idInput.value = student.nationalId || 'N/A';
  if (nameInput) nameInput.value = student.fullName || '';
  if (emailInput) emailInput.value = student.email || '';
  if (phoneInput) phoneInput.value = student.phone || '';
  if (genderInput) genderInput.value = student.gender || 'Male';

  if (courseLabel) courseLabel.textContent = student.course || 'Diploma in Information Communication Technology (DICT)';
  if (sponsorLabel) sponsorLabel.textContent = student.sponsor || 'KUCCPS / Government Sponsored';
  if (termLabel) termLabel.textContent = `${student.yearOfStudy || 'Year 2'}, ${student.currentTerm || 'Term 1'}`;

  // Profile Edit Form Submit
  const profileForm = document.getElementById('profile-edit-form');
  const btnSaveProfile = document.getElementById('btn-save-profile');

  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newName = nameInput.value.trim();
      const newEmail = emailInput.value.trim().toLowerCase();
      const newPhone = phoneInput.value.trim();
      const newGender = genderInput.value;

      if (!newName || !newEmail || !newPhone) {
        ui.toast('Name, email and phone are required.', 'warning');
        return;
      }

      btnSaveProfile.disabled = true;
      btnSaveProfile.textContent = 'Saving Changes...';

      // Update in store
      const updated = store.update('students', student.id, {
        fullName: newName,
        email: newEmail,
        phone: newPhone,
        gender: newGender
      });

      if (updated) {
        student = updated;
        auth.setSession(student, 'student');

        // Update UI
        if (sidebarName) sidebarName.textContent = newName;
        document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = newName);

        store.logActivity(
          student.fullName,
          'student',
          'Profile Updated',
          `Updated personal contact and gender details`
        );

        ui.toast('Profile updated.', 'success');
      } else {
        ui.toast('Could not save changes.', 'error');
      }

      btnSaveProfile.disabled = false;
      btnSaveProfile.textContent = 'Save Profile Changes';
    });
  }

  // Password Change Form Submit
  const passwordForm = document.getElementById('password-change-form');
  const pwdCurrent = document.getElementById('pwd-current');
  const pwdNew = document.getElementById('pwd-new');
  const pwdConfirm = document.getElementById('pwd-confirm');
  const btnChangePwd = document.getElementById('btn-change-password');

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const current = pwdCurrent.value;
      const newPwd = pwdNew.value;
      const confirmPwd = pwdConfirm.value;

      if (!current || !newPwd || !confirmPwd) {
        ui.toast('Fill in all password fields.', 'warning');
        return;
      }

      if (newPwd.length < 6) {
        ui.toast('Password must be at least 6 characters.', 'warning');
        pwdNew.focus();
        return;
      }

      if (newPwd !== confirmPwd) {
        ui.toast('Passwords do not match.', 'error');
        pwdConfirm.focus();
        return;
      }

      btnChangePwd.disabled = true;
      btnChangePwd.textContent = 'Verifying & Updating...';

      // Verify current password hash
      const currentHash = await auth.hashPassword(current);
      if (currentHash !== student.passwordHash) {
        ui.toast('Current password is incorrect.', 'error');
        pwdCurrent.focus();
        btnChangePwd.disabled = false;
        btnChangePwd.textContent = 'Update Password';
        return;
      }

      // Hash new password
      const newHash = await auth.hashPassword(newPwd);
      const updated = store.update('students', student.id, {
        passwordHash: newHash
      });

      if (updated) {
        student = updated;
        store.logActivity(
          student.fullName,
          'student',
          'Password Changed',
          `Updated account portal security password`
        );

        pwdCurrent.value = '';
        pwdNew.value = '';
        pwdConfirm.value = '';

        ui.toast('Password updated.', 'success');
      } else {
        ui.toast('Could not update password.', 'error');
      }

      btnChangePwd.disabled = false;
      btnChangePwd.textContent = 'Update Password';
    });
  }
});
