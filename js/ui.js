/**
 * Kajiado West Technical and Vocational College (Ngong, Kenya)
 * Department of Computing and Informatics - Student Portal
 * 
 * Shared UI Layer: Hand-crafted 1.5px stroke SVGs, toast notifications,
 * accessible modal manager, mobile sidebar navigation controller,
 * currency and date formatting, and ledger helpers.
 * NO emojis used anywhere.
 */

(function (root) {
  'use strict';

  // Hand-crafted SVG Icon Registry (1.5px stroke, no emoji)
  const ICONS = {
    'home': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
    'dashboard': '<rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect>',
    'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>',
    'bell': '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>',
    'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
    'graduation-cap': '<path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path>',
    'user': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
    'users': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
    'check': '<polyline points="20 6 9 17 4 12"></polyline>',
    'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    'info': '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
    'x': '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
    'plus': '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
    'search': '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>',
    'printer': '<polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect>',
    'log-out': '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>',
    'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>',
    'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
    'menu': '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>',
    'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
    'eye-off': '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>',
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"></polyline>',
    'chevron-left': '<polyline points="15 18 9 12 15 6"></polyline>',
    'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
    'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>'
  };

  const ui = {
    /**
     * Render inline SVG icon with 1.5px stroke
     * @param {string} name Icon key from registry
     * @param {string} className Additional CSS classes
     * @param {number} size Width & height in px (default: 18)
     * @returns {string} SVG HTML string
     */
    icon(name, className = 'icon', size = 18) {
      const inner = ICONS[name] || ICONS['info'];
      return `<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
    },

    /**
     * Display a flat institutional toast notification
     * @param {string} message 
     * @param {'info'|'success'|'warning'|'error'} type 
     * @param {number} duration Duration in ms (default 3500)
     */
    toast(message, type = 'info', duration = 3500) {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
      }

      const toastEl = document.createElement('div');
      toastEl.className = `toast toast-${type}`;

      let iconName = 'info';
      if (type === 'success') iconName = 'check-circle';
      else if (type === 'error') iconName = 'alert-triangle';
      else if (type === 'warning') iconName = 'alert-triangle';

      toastEl.innerHTML = `
        <span class="toast-icon">${this.icon(iconName, 'icon', 18)}</span>
        <div class="toast-content">${message}</div>
        <button type="button" class="toast-close" aria-label="Dismiss">${this.icon('x', 'icon', 14)}</button>
      `;

      container.appendChild(toastEl);

      // Trigger animation
      requestAnimationFrame(() => {
        toastEl.classList.add('toast-visible');
      });

      const removeToast = () => {
        toastEl.classList.remove('toast-visible');
        setTimeout(() => {
          if (toastEl.parentNode) {
            toastEl.parentNode.removeChild(toastEl);
          }
        }, 220);
      };

      const closeBtn = toastEl.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', removeToast);
      }

      if (duration > 0) {
        setTimeout(removeToast, duration);
      }
    },

    /**
     * Open an accessible modal dialog by element ID
     * @param {string} modalId 
     */
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');

      // Trap focus
      const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) {
        focusable[0].focus();
      }

      // Close on escape
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeModal(modalId);
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);

      // Close on backdrop click
      modal.onclick = (e) => {
        if (e.target === modal) {
          this.closeModal(modalId);
        }
      };
    },

    /**
     * Close an open modal dialog by element ID
     * @param {string} modalId 
     */
    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    },

    /**
     * Format currency in Kenyan Shillings (KES)
     * @param {number} amount 
     * @param {boolean} showCurrencyPrefix (default true)
     * @returns {string} e.g. "KES 22,500.00"
     */
    formatKES(amount, showCurrencyPrefix = true) {
      const num = Number(amount) || 0;
      const formatted = num.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return showCurrencyPrefix ? `KES ${formatted}` : formatted;
    },

    /**
     * Format date in clean institutional style
     * @param {string|Date} dateStr 
     * @param {boolean} includeTime 
     * @returns {string} e.g. "15 Nov 2024" or "15 Nov 2024, 04:30 PM"
     */
    formatDate(dateStr, includeTime = false) {
      if (!dateStr) return '—';
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);

        const day = d.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();

        if (!includeTime) {
          return `${day} ${month} ${year}`;
        }

        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 12 instead of 0
        return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
      } catch (e) {
        return String(dateStr);
      }
    },

    /**
     * Render a standardized status badge HTML
     * @param {string} status 
     * @param {string} explicitClass 
     * @returns {string}
     */
    badge(status, explicitClass = null) {
      if (!status) return '';
      let badgeClass = explicitClass || 'badge-neutral';
      const s = status.toLowerCase();

      if (s.includes('clear') || s.includes('graded') || s.includes('active') || s.includes('distinction') || s.includes('receipt') || s.includes('completed')) {
        badgeClass = 'badge-success';
      } else if (s.includes('pending') || s.includes('credit') || s.includes('submitted') || s.includes('medium')) {
        badgeClass = 'badge-ochre';
      } else if (s.includes('overdue') || s.includes('high') || s.includes('danger') || s.includes('fail') || s.includes('debit') || s.includes('invoice')) {
        badgeClass = 'badge-brick';
      } else if (s.includes('low') || s.includes('info')) {
        badgeClass = 'badge-ink';
      }

      return `<span class="badge ${badgeClass}">${status}</span>`;
    },

    /**
     * Initialize app navigation:
     * - Mobile sidebar toggle and backdrop handling
     * - Highlight active link based on current path
     * - Populate user name & role from session
     * - Wire up logout buttons
     */
    initNavigation() {
      // 1. Sidebar toggle
      const toggleBtn = document.getElementById('sidebar-toggle');
      const sidebar = document.querySelector('.app-sidebar');
      const backdrop = document.querySelector('.sidebar-backdrop');

      if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
          const isOpen = sidebar.classList.toggle('is-open');
          if (backdrop) backdrop.classList.toggle('is-open', isOpen);
          toggleBtn.setAttribute('aria-expanded', String(isOpen));
        });
      }

      if (backdrop && sidebar) {
        backdrop.addEventListener('click', () => {
          sidebar.classList.remove('is-open');
          backdrop.classList.remove('is-open');
          if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
        });
      }

      // 2. Active link highlight
      const currentPath = window.location.pathname.replace(/\\/g, '/');
      const navLinks = document.querySelectorAll('.app-sidebar .nav-link');
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.endsWith(href)) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      // 3. User session badge binding
      if (root.auth) {
        const session = root.auth.getSession();
        if (session && session.user) {
          const nameEls = document.querySelectorAll('[data-user-name]');
          const roleEls = document.querySelectorAll('[data-user-role]');
          const idEls = document.querySelectorAll('[data-user-id]');

          nameEls.forEach(el => el.textContent = session.user.fullName || 'User');
          roleEls.forEach(el => el.textContent = session.role === 'admin' ? 'Staff / Admin' : 'Student');
          idEls.forEach(el => el.textContent = session.user.admissionNumber || session.user.email || '');
        }
      }

      // 4. Wire logout buttons
      const logoutBtns = document.querySelectorAll('[data-action="logout"]');
      logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (root.auth) {
            root.auth.logout();
          }
        });
      });
    }
  };

  root.ui = ui;

})(typeof window !== 'undefined' ? window : this);
