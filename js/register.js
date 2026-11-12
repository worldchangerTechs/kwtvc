/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Student Registration Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const alertBox = document.getElementById('reg-alert');
  const alertMsg = document.getElementById('reg-alert-message');
  const btnSubmit = document.getElementById('btn-reg-submit');

  function showAlert(message) {
    alertMsg.textContent = message;
    alertBox.classList.add('is-visible');
  }

  function hideAlert() {
    alertBox.classList.remove('is-visible');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const admissionNumber = document.getElementById('reg-admission').value.trim();
    const fullName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const nationalId = document.getElementById('reg-national-id').value.trim();
    const course = document.getElementById('reg-course').value;
    const sponsor = document.getElementById('reg-sponsor').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const termsChecked = document.getElementById('reg-terms').checked;

    // Client-side validations
    if (!admissionNumber || !fullName || !email || !phone || !password) {
      showAlert('Fill in all required fields.');
      return;
    }

    // Admission number format check (e.g. 838/DICT/2023)
    const admRegex = /^\d{3,4}\/[A-Z]{3,5}\/\d{4}$/;
    if (!admRegex.test(admissionNumber)) {
      showAlert('Use the format 834/DICT/2023.');
      document.getElementById('reg-admission').focus();
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters.');
      document.getElementById('reg-password').focus();
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match.');
      document.getElementById('reg-confirm-password').focus();
      return;
    }

    if (!termsChecked) {
      showAlert('Accept the code of conduct to continue.');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Registering…';

    try {
      const res = await auth.registerStudent({
        admissionNumber,
        fullName,
        email,
        phone,
        nationalId,
        course,
        sponsor,
        password
      });

      if (!res.success) {
        showAlert(res.error || 'Registration failed.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Register';
        return;
      }

      ui.toast('Account created. Sign in to continue.', 'success');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);

    } catch (err) {
      console.error('Registration error:', err);
      showAlert('An unexpected error occurred during registration.');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Register';
    }
  });
});
