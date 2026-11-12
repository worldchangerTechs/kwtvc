/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Portal Login Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if session already exists, redirect accordingly
  const session = auth.getSession();
  if (session && session.user && session.role) {
    if (session.role === 'admin') {
      window.location.replace('admin/dashboard.html');
      return;
    } else if (session.role === 'student') {
      window.location.replace('student/dashboard.html');
      return;
    }
  }

  // DOM Elements
  const btnRoleStudent = document.getElementById('btn-role-student');
  const btnRoleAdmin = document.getElementById('btn-role-admin');
  const roleInput = document.getElementById('login-role');
  const identifierLabel = document.getElementById('identifier-label');
  const identifierInput = document.getElementById('login-identifier');
  const passwordInput = document.getElementById('login-password');
  const passwordToggle = document.getElementById('password-toggle');
  const form = document.getElementById('login-form');
  const btnSubmit = document.getElementById('btn-submit');
  const alertBox = document.getElementById('auth-alert');
  const alertMsg = document.getElementById('auth-alert-message');
  const studentRegisterFooter = document.getElementById('student-register-footer');


  /**
   * Switch between Student and Staff roles
   * @param {'student'|'admin'} role 
   */
  function setRole(role) {
    roleInput.value = role;
    hideAlert();

    if (role === 'student') {
      btnRoleStudent.classList.add('active');
      btnRoleStudent.setAttribute('aria-selected', 'true');
      btnRoleAdmin.classList.remove('active');
      btnRoleAdmin.setAttribute('aria-selected', 'false');

      identifierLabel.textContent = 'Admission number';
      studentRegisterFooter.style.display = 'block';
    } else {
      btnRoleAdmin.classList.add('active');
      btnRoleAdmin.setAttribute('aria-selected', 'true');
      btnRoleStudent.classList.remove('active');
      btnRoleStudent.setAttribute('aria-selected', 'false');

      identifierLabel.textContent = 'Email';
      studentRegisterFooter.style.display = 'none';
    }
    identifierInput.focus();
  }

  // Event Listeners for Role Switch
  btnRoleStudent.addEventListener('click', () => setRole('student'));
  btnRoleAdmin.addEventListener('click', () => setRole('admin'));

  // Password Visibility Toggle
  passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    passwordToggle.innerHTML = isPassword ? ui.icon('eye-off', 'icon', 18) : ui.icon('eye', 'icon', 18);
    passwordToggle.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  });

  function showAlert(msg) {
    alertMsg.textContent = msg;
    alertBox.classList.add('is-visible');
  }

  function hideAlert() {
    alertBox.classList.remove('is-visible');
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const role = roleInput.value;
    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;

    if (!identifier) {
      showAlert(role === 'admin' ? 'Enter your email.' : 'Enter your admission number.');
      identifierInput.focus();
      return;
    }

    if (!password) {
      showAlert('Enter your password.');
      passwordInput.focus();
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Signing in…';

    try {
      const res = await auth.login(identifier, password, role);

      if (!res.success) {
        showAlert(res.error || 'Incorrect details.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Sign in';
        return;
      }

            setTimeout(() => {
        if (role === 'admin') {
          window.location.href = 'admin/dashboard.html';
        } else {
          window.location.href = 'student/dashboard.html';
        }
      }, 350);

    } catch (err) {
      console.error('Login error:', err);
      showAlert('Something went wrong. Try again.');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Sign in';
    }
  });

});
