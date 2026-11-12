/**
 * Kajiado West Technical and Vocational College (Ngong, Kenya)
 * Department of Computing and Informatics - Student Portal
 * 
 * Authentication Layer: Role-based session management, Web Crypto SHA-256
 * password hashing, access control guard (requireRole), and audit logging.
 */

(function (root) {
  'use strict';

  const SESSION_KEY = 'kwtvc_session';

  /**
   * Determine relative path to root index.html based on current URL path
   * Supports both web server paths (/student/...) and local file:/// paths
   * @returns {string}
   */
  function getRootLoginPath() {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (path.includes('/student/') || path.includes('/admin/')) {
      return '../index.html';
    }
    return 'index.html';
  }

  const auth = {
    /**
     * Compute SHA-256 hash using native browser Web Crypto API
     * @param {string} plainText 
     * @returns {Promise<string>} Hex encoded hash string
     */
    async hashPassword(plainText) {
      if (!plainText) return '';
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Get active session from sessionStorage
     * @returns {Object|null}
     */
    getSession() {
      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (err) {
        console.error('auth.getSession parse error:', err);
        return null;
      }
    },

    /**
     * Get the up-to-date user object from store based on session
     * @returns {Object|null}
     */
    getCurrentUser() {
      const session = this.getSession();
      if (!session || !session.user || !session.role) return null;

      if (!root.store) return session.user;

      const collection = session.role === 'admin' ? 'admins' : 'students';
      const freshUser = root.store.getById(collection, session.user.id);
      return freshUser || session.user;
    },

    /**
     * Set active user session
     * @param {Object} user 
     * @param {'student'|'admin'} role 
     */
    setSession(user, role) {
      const sessionPayload = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: role,
          admissionNumber: user.admissionNumber || null,
          department: user.department || 'Department of Computing and Informatics',
          course: user.course || null,
          designation: user.designation || null
        },
        role: role,
        loggedInAt: new Date().toISOString()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
      return sessionPayload;
    },

    /**
     * Clear session and log out
     */
    logout() {
      const session = this.getSession();
      if (session && root.store) {
        root.store.logActivity(
          session.user.fullName,
          session.role,
          'User Logout',
          `Logged out of ${session.role} portal`
        );
      }
      sessionStorage.removeItem(SESSION_KEY);
      window.location.replace(getRootLoginPath());
    },

    /**
     * Role-based access control guard.
     * Must be called at top of every protected page.
     * Redirects to index.html if unauthenticated or role is mismatched.
     * @param {'student'|'admin'} expectedRole 
     * @returns {Object|null} Session if valid
     */
    requireRole(expectedRole) {
      const session = this.getSession();

      if (!session || !session.role || !session.user) {
        console.warn(`Access denied: No active session. Redirecting to login.`);
        window.location.replace(getRootLoginPath());
        return null;
      }

      if (session.role !== expectedRole) {
        console.warn(`Access denied: Required [${expectedRole}], found [${session.role}]. Redirecting.`);
        window.location.replace(getRootLoginPath());
        return null;
      }

      return session;
    },

    /**
     * Authenticate student or admin
     * @param {string} identifier Admission number or email
     * @param {string} password Plain text password
     * @param {'student'|'admin'} role Selected portal role
     * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
     */
    async login(identifier, password, role) {
      if (!identifier || !password) {
        return { success: false, error: 'Please enter both your identifier and password.' };
      }

      const cleanIdentifier = identifier.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Ensure store is loaded
      if (!root.store) {
        return { success: false, error: 'System storage unavailable. Please refresh.' };
      }

      // Hash input password with SHA-256
      const hashedInput = await this.hashPassword(cleanPassword);

      if (role === 'admin') {
        const admins = root.store.getAll('admins');
        const admin = admins.find(a => a.email && a.email.toLowerCase() === cleanIdentifier);

        if (!admin) {
          return { success: false, error: 'Staff account not found. Please verify your staff email.' };
        }

        if (admin.passwordHash !== hashedInput) {
          return { success: false, error: 'Invalid staff password. Please check your credentials.' };
        }

        this.setSession(admin, 'admin');
        root.store.logActivity(
          admin.fullName,
          'admin',
          'Staff Login',
          'Logged into Computing & Informatics Admin Portal'
        );
        return { success: true, user: admin, role: 'admin' };
      }

      if (role === 'student') {
        const students = root.store.getAll('students');
        const student = students.find(s => {
          const admMatch = s.admissionNumber && s.admissionNumber.toLowerCase() === cleanIdentifier;
          const emailMatch = s.email && s.email.toLowerCase() === cleanIdentifier;
          return admMatch || emailMatch;
        });

        if (!student) {
          return {
            success: false,
            error: 'Student record not found. Use your admission number (e.g. 834/DICT/2023) or student email.'
          };
        }

        if (student.passwordHash !== hashedInput) {
          return { success: false, error: 'Incorrect student password. Please try again.' };
        }

        if (student.status && student.status.toLowerCase() !== 'active') {
          return { success: false, error: 'Your student account is currently inactive. Contact the registrar.' };
        }

        this.setSession(student, 'student');
        root.store.logActivity(
          student.fullName,
          'student',
          'Student Login',
          `Logged into Student Portal (${student.admissionNumber})`
        );
        return { success: true, user: student, role: 'student' };
      }

      return { success: false, error: 'Invalid portal role selected.' };
    },

    /**
     * Register a new student into the portal
     * @param {Object} studentData 
     * @returns {Promise<{success: boolean, student?: Object, error?: string}>}
     */
    async registerStudent(studentData) {
      if (!root.store) {
        return { success: false, error: 'System storage unavailable.' };
      }

      const {
        fullName,
        admissionNumber,
        email,
        phone,
        password,
        course,
        nationalId,
        sponsor
      } = studentData;

      if (!fullName || !admissionNumber || !email || !password) {
        return { success: false, error: 'Full name, admission number, email, and password are required.' };
      }

      const cleanAdm = admissionNumber.trim().toUpperCase();
      const cleanEmail = email.trim().toLowerCase();

      // Validate admission number format (e.g. 834/DICT/2023)
      const admRegex = /^\d{3,4}\/[A-Z]{3,5}\/\d{4}$/;
      if (!admRegex.test(cleanAdm)) {
        return {
          success: false,
          error: 'Admission number must follow the institutional format, e.g. 834/DICT/2023'
        };
      }

      // Check duplicates
      const existing = root.store.getAll('students');
      if (existing.some(s => s.admissionNumber && s.admissionNumber.toUpperCase() === cleanAdm)) {
        return { success: false, error: `Admission number ${cleanAdm} is already registered in the portal.` };
      }
      if (existing.some(s => s.email && s.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: `Email address ${cleanEmail} is already registered.` };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }

      const passwordHash = await this.hashPassword(password);

      const newStudent = {
        id: root.store.nextId('students', 'stud-'),
        admissionNumber: cleanAdm,
        fullName: fullName.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : '',
        nationalId: nationalId ? nationalId.trim() : '',
        course: course || 'Diploma in Information Communication Technology (DICT)',
        courseCode: 'DICT',
        department: 'Department of Computing and Informatics',
        level: 'Level 6 (TVET CDACC)',
        yearOfStudy: 'Year 1',
        currentTerm: 'Term 1',
        admissionYear: parseInt(cleanAdm.split('/')[2], 10) || new Date().getFullYear(),
        sponsor: sponsor || 'KUCCPS / Government Sponsored',
        status: 'Active',
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
      };

      root.store.insert('students', newStudent);

      // Create default starter fee invoice
      root.store.insert('fee_statements', {
        id: root.store.nextId('fee_statements', 'fee-'),
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

      root.store.logActivity(
        newStudent.fullName,
        'student',
        'Student Registration',
        `Registered admission number ${newStudent.admissionNumber}`
      );

      return { success: true, student: newStudent };
    }
  };

  root.auth = auth;

})(typeof window !== 'undefined' ? window : this);
