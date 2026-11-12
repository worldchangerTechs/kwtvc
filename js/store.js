/**
 * Kajiado West Technical and Vocational College (Ngong, Kenya)
 * Department of Computing and Informatics - Student Portal
 * 
 * Data Layer: localStorage wrapper with collections and demo seed data.
 * Collections: students, admins, assignments, submissions, announcements,
 * fee_statements, timetables, academics, activity_log.
 */

(function (root) {
  'use strict';

  const STORAGE_PREFIX = 'kwtvc_';
  const SEED_KEY = `${STORAGE_PREFIX}seeded_v3`;

  // Precomputed SHA-256 Hashes (Web Crypto SHA-256 API):
  // "Admin@123"   -> e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7
  // "Student@123" -> b2a1f4fd0a460606b34c8913e2981dac8d2e283d778aba586c416ee2629bfa54
  const HASH_ADMIN = 'e86f78a8a3caf0b60d8e74e5942aa6d86dc150cd3c03338aef25b7d2d7e3acc7';
  const HASH_STUDENT = 'b2a1f4fd0a460606b34c8913e2981dac8d2e283d778aba586c416ee2629bfa54';

  const store = {
    /**
     * Retrieve a value from localStorage
     * @param {string} key 
     * @param {*} defaultValue 
     * @returns {*}
     */
    get(key, defaultValue = null) {
      try {
        const fullKey = key.startsWith(STORAGE_PREFIX) ? key : STORAGE_PREFIX + key;
        const raw = localStorage.getItem(fullKey);
        if (raw === null || raw === undefined) {
          return defaultValue;
        }
        return JSON.parse(raw);
      } catch (err) {
        console.error(`store.get error for [${key}]:`, err);
        return defaultValue;
      }
    },

    /**
     * Store a value in localStorage
     * @param {string} key 
     * @param {*} value 
     */
    set(key, value) {
      try {
        const fullKey = key.startsWith(STORAGE_PREFIX) ? key : STORAGE_PREFIX + key;
        localStorage.setItem(fullKey, JSON.stringify(value));
        return true;
      } catch (err) {
        console.error(`store.set error for [${key}]:`, err);
        return false;
      }
    },

    /**
     * Remove a key from localStorage
     * @param {string} key 
     */
    remove(key) {
      try {
        const fullKey = key.startsWith(STORAGE_PREFIX) ? key : STORAGE_PREFIX + key;
        localStorage.removeItem(fullKey);
        return true;
      } catch (err) {
        console.error(`store.remove error for [${key}]:`, err);
        return false;
      }
    },

    /**
     * Generate the next auto-incremented ID for a collection
     * @param {string} collection 
     * @param {string} prefix Optional prefix like 'asg-', 'sub-', etc.
     * @returns {string|number}
     */
    nextId(collection, prefix = '') {
      const seqKey = `${STORAGE_PREFIX}seq_${collection}`;
      let current = parseInt(localStorage.getItem(seqKey), 10);
      if (isNaN(current) || current < 100) {
        // Find existing maximum id in collection if available
        const items = this.get(collection, []);
        let max = 100;
        if (Array.isArray(items)) {
          items.forEach(it => {
            if (typeof it.id === 'number' && it.id > max) max = it.id;
            if (typeof it.id === 'string') {
              const numMatch = it.id.match(/\d+$/);
              if (numMatch) {
                const parsed = parseInt(numMatch[0], 10);
                if (parsed > max) max = parsed;
              }
            }
          });
        }
        current = max;
      }
      current += 1;
      localStorage.setItem(seqKey, current.toString());
      return prefix ? `${prefix}${current}` : current;
    },

    /**
     * Get all items in a collection array
     * @param {string} collection 
     * @returns {Array}
     */
    getAll(collection) {
      const data = this.get(collection, []);
      return Array.isArray(data) ? data : [];
    },

    /**
     * Find item by id in a collection
     * @param {string} collection 
     * @param {string|number} id 
     * @returns {Object|null}
     */
    getById(collection, id) {
      const items = this.getAll(collection);
      return items.find(it => String(it.id) === String(id)) || null;
    },

    /**
     * Insert a new record into a collection
     * @param {string} collection 
     * @param {Object} item 
     * @returns {Object}
     */
    insert(collection, item) {
      const items = this.getAll(collection);
      if (!item.id) {
        item.id = this.nextId(collection, `${collection.slice(0, 3)}-`);
      }
      if (!item.createdAt) {
        item.createdAt = new Date().toISOString();
      }
      items.push(item);
      this.set(collection, items);
      return item;
    },

    /**
     * Update an existing record in a collection
     * @param {string} collection 
     * @param {string|number} id 
     * @param {Object} updates 
     * @returns {Object|null}
     */
    update(collection, id, updates) {
      const items = this.getAll(collection);
      const index = items.findIndex(it => String(it.id) === String(id));
      if (index === -1) return null;

      items[index] = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.set(collection, items);
      return items[index];
    },

    /**
     * Delete an item from a collection by id
     * @param {string} collection 
     * @param {string|number} id 
     * @returns {boolean}
     */
    delete(collection, id) {
      const items = this.getAll(collection);
      const filtered = items.filter(it => String(it.id) !== String(id));
      if (filtered.length !== items.length) {
        this.set(collection, filtered);
        return true;
      }
      return false;
    },

    /**
     * Append an activity log entry
     * @param {string} actorName 
     * @param {string} actorRole 
     * @param {string} action 
     * @param {string} details 
     */
    logActivity(actorName, actorRole, action, details) {
      const logs = this.getAll('activity_log');
      const entry = {
        id: this.nextId('activity_log', 'log-'),
        timestamp: new Date().toISOString(),
        actorName,
        actorRole,
        action,
        details
      };
      logs.unshift(entry);
      // Keep only last 100 logs
      if (logs.length > 100) logs.pop();
      this.set('activity_log', logs);
      return entry;
    },

    /**
     * Initialize and seed demo data on first load only
     */
    init() {
      if (localStorage.getItem(SEED_KEY)) {
        return; // Already seeded
      }
      this.seedDemoData();
      localStorage.setItem(SEED_KEY, 'true');
    },

    /**
     * Reset demo data to initial factory state
     */
    resetDemoData() {
      localStorage.removeItem(SEED_KEY);
      this.seedDemoData();
      localStorage.setItem(SEED_KEY, 'true');
    },

    /**
     * Populate full realistic seed datasets
     */
    seedDemoData() {
      // 1. Admins (1 staff member: admin@kwtvc.ac.ke / Admin@123)
      const admins = [
        {
          id: 'adm-1',
          fullName: 'Eng. Justus Mwangi',
          email: 'admin@kwtvc.ac.ke',
          phone: '0770 033765',
          role: 'admin',
          designation: 'Head of Department, Computing & Informatics',
          department: 'Department of Computing and Informatics',
          office: 'Block B, Faculty Office 04',
          passwordHash: HASH_ADMIN,
          createdAt: '2023-01-10T08:00:00Z'
        }
      ];

      // 2. Students (4 students with format 834/DICT/2023)
      const students = [
        {
          id: 'stud-1',
          admissionNumber: '834/DICT/2023',
          fullName: 'Dennis Kiprop Tanui',
          email: 'dennis.kiprop@student.kwtvc.ac.ke',
          phone: '0712 345678',
          nationalId: '38920144',
          course: 'Diploma in Information Communication Technology (DICT)',
          courseCode: 'DICT',
          department: 'Department of Computing and Informatics',
          level: 'Level 6 (TVET CDACC)',
          yearOfStudy: 'Year 2',
          currentTerm: 'Term 1',
          admissionYear: 2023,
          sponsor: 'KUCCPS / Government Sponsored',
          guardianName: 'Ezekiel Tanui',
          guardianPhone: '0722 890123',
          status: 'Active',
          passwordHash: HASH_STUDENT,
          createdAt: '2023-09-01T09:00:00Z'
        },
        {
          id: 'stud-2',
          admissionNumber: '835/DICT/2023',
          fullName: 'Faith Cherotich Langat',
          email: 'faith.cherotich@student.kwtvc.ac.ke',
          phone: '0723 456789',
          nationalId: '39481022',
          course: 'Diploma in Information Communication Technology (DICT)',
          courseCode: 'DICT',
          department: 'Department of Computing and Informatics',
          level: 'Level 6 (TVET CDACC)',
          yearOfStudy: 'Year 2',
          currentTerm: 'Term 1',
          admissionYear: 2023,
          sponsor: 'KUCCPS / Government Sponsored',
          guardianName: 'Grace Langat',
          guardianPhone: '0720 112233',
          status: 'Active',
          passwordHash: HASH_STUDENT,
          createdAt: '2023-09-01T09:15:00Z'
        },
        {
          id: 'stud-3',
          admissionNumber: '836/DICT/2023',
          fullName: 'Mercy Wanjiku Njeri',
          email: 'mercy.njeri@student.kwtvc.ac.ke',
          phone: '0734 567890',
          nationalId: '38104921',
          course: 'Diploma in Information Communication Technology (DICT)',
          courseCode: 'DICT',
          department: 'Department of Computing and Informatics',
          level: 'Level 6 (TVET CDACC)',
          yearOfStudy: 'Year 2',
          currentTerm: 'Term 1',
          admissionYear: 2023,
          sponsor: 'KUCCPS / Government Sponsored',
          guardianName: 'Peter Njeri',
          guardianPhone: '0721 998877',
          status: 'Active',
          passwordHash: HASH_STUDENT,
          createdAt: '2023-09-01T09:30:00Z'
        },
        {
          id: 'stud-4',
          admissionNumber: '837/DICT/2023',
          fullName: 'Brian Omondi Otieno',
          email: 'brian.omondi@student.kwtvc.ac.ke',
          phone: '0745 678901',
          nationalId: '39872134',
          course: 'Diploma in Information Communication Technology (DICT)',
          courseCode: 'DICT',
          department: 'Department of Computing and Informatics',
          level: 'Level 6 (TVET CDACC)',
          yearOfStudy: 'Year 1',
          currentTerm: 'Term 3',
          admissionYear: 2023,
          sponsor: 'Self-Sponsored',
          guardianName: 'Hellen Otieno',
          guardianPhone: '0724 665544',
          status: 'Active',
          passwordHash: HASH_STUDENT,
          createdAt: '2023-09-01T10:00:00Z'
        }
      ];

      // 3. Assignments (Realistic TVET DICT units)
      const assignments = [
        {
          id: 'asg-1',
          unitCode: 'DICT 201',
          unitTitle: 'Object Oriented Programming (Java)',
          title: 'Practical Task 1: Banking Ledger & Inheritance Hierarchy',
          lecturer: 'Eng. Justus Mwangi',
          dueDate: '2026-11-09T17:00:00',
          maxScore: 30,
          instructions: 'Implement a Java desktop application with abstract base class Account and subclasses SavingsAccount and CurrentAccount. Enforce monthly maintenance fee calculation, negative overdraft prevention with custom exceptions, and transaction history logging. Submit zipped source code and PDF test report.',
          createdAt: '2026-10-19T08:30:00Z',
          status: 'Active'
        },
        {
          id: 'asg-2',
          unitCode: 'DICT 202',
          unitTitle: 'Database Management Systems',
          title: 'Assignment 2: Schema Normalization & DDL Script (3NF)',
          lecturer: 'Ms. Sharon Wanjiku',
          dueDate: '2026-11-12T17:00:00',
          maxScore: 30,
          instructions: 'Given the case study of Ngong Sub-County Hospital pharmacy inventory, identify unnormalized data, map dependencies, normalize to Third Normal Form (3NF), draw the Crow Foot ER diagram, and write executable PostgreSQL/MySQL DDL scripts with primary and foreign key constraints.',
          createdAt: '2026-10-21T10:00:00Z',
          status: 'Active'
        },
        {
          id: 'asg-3',
          unitCode: 'DICT 203',
          unitTitle: 'Computer Networks & Data Communication',
          title: 'Lab Practical 3: Dual-Subnet Routing in Cisco Packet Tracer',
          lecturer: 'Mr. Patrick Odhiambo',
          dueDate: '2026-11-16T17:00:00',
          maxScore: 20,
          instructions: 'Design and configure a dual-subnet star topology connecting Computing Lab 1 (30 hosts) and Admin Block (14 hosts) using base network 192.168.10.0/24. Subnet using VLSM, configure Cisco 2911 router interfaces, and enable DHCP pools. Submit .pkt file and IP allocation ledger.',
          createdAt: '2026-10-23T11:15:00Z',
          status: 'Active'
        },
        {
          id: 'asg-4',
          unitCode: 'DICT 204',
          unitTitle: 'Web Development Principles',
          title: 'CAT 1: Semantic Institutional Staff Directory',
          lecturer: 'Eng. Justus Mwangi',
          dueDate: '2026-11-24T17:00:00',
          maxScore: 30,
          instructions: 'Construct a responsive, accessible staff directory for Kajiado West TVC using semantic HTML5, pure CSS layout (Flexbox/Grid), and vanilla JavaScript search filtering without external dependencies. Adhere to institutional color palette and WCAG AA contrast.',
          createdAt: '2026-10-25T09:00:00Z',
          status: 'Active'
        }
      ];

      // 4. Submissions
      const submissions = [
        {
          id: 'sub-101',
          assignmentId: 'asg-1',
          studentId: 'stud-1',
          studentName: 'Dennis Kiprop Tanui',
          admissionNumber: '834/DICT/2023',
          submittedAt: '2026-11-02T14:22:00',
          fileName: '834_DICT_2023_Java_Assignment1.zip',
          fileSize: '1.4 MB',
          notes: 'Full NetBeans solution with JUnit test cases and PDF documentation.',
          status: 'Graded',
          score: 27,
          maxScore: 30,
          feedback: 'Clean class architecture and proper inheritance hierarchy. Exception handling for overdraft attempts functions correctly.',
          gradedBy: 'Eng. Justus Mwangi',
          gradedAt: '2026-11-04T10:15:00'
        },
        {
          id: 'sub-102',
          assignmentId: 'asg-2',
          studentId: 'stud-1',
          studentName: 'Dennis Kiprop Tanui',
          admissionNumber: '834/DICT/2023',
          submittedAt: '2026-11-06T09:40:00',
          fileName: '834_DICT_2023_Hospital_DB_3NF.pdf',
          fileSize: '840 KB',
          notes: 'Normalization tables from 1NF to 3NF documented with relational schema.',
          status: 'Submitted',
          score: null,
          maxScore: 30,
          feedback: null,
          gradedBy: null,
          gradedAt: null
        },
        {
          id: 'sub-103',
          assignmentId: 'asg-1',
          studentId: 'stud-2',
          studentName: 'Faith Cherotich Langat',
          admissionNumber: '835/DICT/2023',
          submittedAt: '2026-11-03T11:05:00',
          fileName: '835_DICT_2023_Java_Swing.zip',
          fileSize: '1.8 MB',
          notes: 'Added interactive swing UI dialog for account ledger statements.',
          status: 'Graded',
          score: 29,
          maxScore: 30,
          feedback: 'Outstanding technical implementation and clean code comments throughout.',
          gradedBy: 'Eng. Justus Mwangi',
          gradedAt: '2026-11-04T11:30:00'
        },
        {
          id: 'sub-104',
          assignmentId: 'asg-3',
          studentId: 'stud-3',
          studentName: 'Mercy Wanjiku Njeri',
          admissionNumber: '836/DICT/2023',
          submittedAt: '2026-11-05T16:15:00',
          fileName: '836_DICT_2023_PacketTracer_Lab3.pkt',
          fileSize: '420 KB',
          notes: 'Cisco packet tracer file with running configuration tested on CLI.',
          status: 'Submitted',
          score: null,
          maxScore: 20,
          feedback: null,
          gradedBy: null,
          gradedAt: null
        }
      ];

      // 5. Announcements (Real TVET institutional copy)
      const announcements = [
        {
          id: 'ann-1',
          title: 'TVET CDACC / KNEC November 2026 Examination Timetable and Index Verification',
          category: 'Examinations',
          priority: 'High',
          author: 'Office of the Registrar',
          date: '2026-10-25',
          content: 'All Year 2 students registered for the upcoming TVET CDACC / KNEC examination series are required to confirm their examination index numbers and registered modules on the departmental notice board outside Office 04 before Friday, 30th October 2026, at 4:00 PM. Any discrepancies must be lodged with Eng. Mwangi immediately. Late revisions will not be accepted.',
          targetAudience: 'All Candidates'
        },
        {
          id: 'ann-2',
          title: 'Scheduled Computing Lab 2 Maintenance and Software Re-imaging',
          category: 'Departmental',
          priority: 'Medium',
          author: 'ICT Support Services',
          date: '2026-10-23',
          content: 'Computing Lab 2 will remain closed on Saturday, 31st October from 8:00 AM to 2:00 PM for scheduled server rack maintenance, Cisco packet tracer upgrades, and dual-boot Ubuntu Linux configuration. Practical sessions scheduled during this window have been moved to Computing Lab 1.',
          targetAudience: 'Computing Students'
        },
        {
          id: 'ann-3',
          title: 'Fee Clearance Deadline for End of Term Assessment Cards',
          category: 'Finance',
          priority: 'High',
          author: 'Finance & Accounts Office',
          date: '2026-10-20',
          content: 'Students are reminded that assessment exam cards will be issued starting Monday, 2nd November 2026. Students must have cleared at least 80% of their term tuition fees to be issued with valid examination clearance. Bank slips and M-Pesa paybill confirmation receipts must be validated at Accounts Office before 4:00 PM on weekdays.',
          targetAudience: 'All Students'
        },
        {
          id: 'ann-4',
          title: 'Annual Kajiado West TVC Inter-Departmental Sports & Tech Exhibition',
          category: 'Student Affairs',
          priority: 'Low',
          author: 'Dean of Students',
          date: '2026-10-12',
          content: 'The annual inter-departmental sports tournament and technology innovations showcase will take place on Friday, 13th November 2026 at Ngong Technical Grounds. Computing & Informatics students interested in showcasing robotics, IoT, or web applications should register their project brief with the Computer Club executive.',
          targetAudience: 'All Students'
        }
      ];

      // 6. Fee Statements (Ledger items for each student)
      const fee_statements = [
        // Dennis Kiprop Tanui (834/DICT/2023) - Balance: KES 6,000
        {
          id: 'fee-101',
          studentId: 'stud-1',
          admissionNumber: '834/DICT/2023',
          date: '2026-08-17',
          reference: 'INV-2026-834',
          description: 'Term 1 Tuition Fee (Year 2)',
          type: 'Invoice',
          debit: 22500,
          credit: 0,
          balance: 22500
        },
        {
          id: 'fee-102',
          studentId: 'stud-1',
          admissionNumber: '834/DICT/2023',
          date: '2026-08-17',
          reference: 'INV-2026-835',
          description: 'Computing Laboratory Practical & Internet Levy',
          type: 'Invoice',
          debit: 4500,
          credit: 0,
          balance: 27000
        },
        {
          id: 'fee-103',
          studentId: 'stud-1',
          admissionNumber: '834/DICT/2023',
          date: '2026-08-17',
          reference: 'INV-2026-836',
          description: 'TVET CDACC Assessment & Examination Levy',
          type: 'Invoice',
          debit: 5000,
          credit: 0,
          balance: 32000
        },
        {
          id: 'fee-104',
          studentId: 'stud-1',
          admissionNumber: '834/DICT/2023',
          date: '2026-08-17',
          reference: 'INV-2026-837',
          description: 'Student Activity & Medical Insurance Levy',
          type: 'Invoice',
          debit: 2500,
          credit: 0,
          balance: 34500
        },
        {
          id: 'fee-105',
          studentId: 'stud-1',
          admissionNumber: '834/DICT/2023',
          date: '2026-08-23',
          reference: 'REC-55421',
          description: 'M-Pesa Paybill 222111 Ref: QHJ83910KD',
          type: 'Receipt',
          debit: 0,
          credit: 18500,
          balance: 16000
        },
        {
          id: 'fee-106',
          studentId: 'stud-1',
          admissionNumber: '834/DICT/2023',
          date: '2026-09-29',
          reference: 'REC-57890',
          description: 'KCB Bank Ngong Branch Deposit Slip #449102',
          type: 'Receipt',
          debit: 0,
          credit: 10000,
          balance: 6000
        },

        // Faith Cherotich Langat (835/DICT/2023) - Balance: KES 0.00 (Cleared)
        {
          id: 'fee-201',
          studentId: 'stud-2',
          admissionNumber: '835/DICT/2023',
          date: '2026-08-17',
          reference: 'INV-2026-840',
          description: 'Term 1 Tuition & Departmental Levies (Year 2)',
          type: 'Invoice',
          debit: 34500,
          credit: 0,
          balance: 34500
        },
        {
          id: 'fee-202',
          studentId: 'stud-2',
          admissionNumber: '835/DICT/2023',
          date: '2026-08-20',
          reference: 'REC-55110',
          description: 'KCB Bank Ngong Branch Slip #448920 (Government Bursary)',
          type: 'Receipt',
          debit: 0,
          credit: 20000,
          balance: 14500
        },
        {
          id: 'fee-203',
          studentId: 'stud-2',
          admissionNumber: '835/DICT/2023',
          date: '2026-09-09',
          reference: 'REC-56420',
          description: 'M-Pesa Paybill 222111 Ref: QKL99321AB',
          type: 'Receipt',
          debit: 0,
          credit: 14500,
          balance: 0
        },

        // Mercy Wanjiku Njeri (836/DICT/2023) - Balance: KES 14,500
        {
          id: 'fee-301',
          studentId: 'stud-3',
          admissionNumber: '836/DICT/2023',
          date: '2026-08-17',
          reference: 'INV-2026-850',
          description: 'Term 1 Tuition & Departmental Levies (Year 2)',
          type: 'Invoice',
          debit: 34500,
          credit: 0,
          balance: 34500
        },
        {
          id: 'fee-302',
          studentId: 'stud-3',
          admissionNumber: '836/DICT/2023',
          date: '2026-08-27',
          reference: 'REC-55890',
          description: 'M-Pesa Paybill 222111 Ref: QMC71239TY',
          type: 'Receipt',
          debit: 0,
          credit: 20000,
          balance: 14500
        },

        // Brian Omondi Otieno (837/DICT/2023) - Balance: KES 0.00
        {
          id: 'fee-401',
          studentId: 'stud-4',
          admissionNumber: '837/DICT/2023',
          date: '2026-08-17',
          reference: 'INV-2026-860',
          description: 'Term 3 Tuition & Practical Levies (Year 1)',
          type: 'Invoice',
          debit: 36000,
          credit: 0,
          balance: 36000
        },
        {
          id: 'fee-402',
          studentId: 'stud-4',
          admissionNumber: '837/DICT/2023',
          date: '2026-08-19',
          reference: 'REC-55099',
          description: 'Cooperative Bank Ngong Slip #119283',
          type: 'Receipt',
          debit: 0,
          credit: 36000,
          balance: 0
        }
      ];

      // 7. Timetables (Department of Computing & Informatics, Term 1 2024)
      const timetables = [
        {
          day: 'Monday',
          sessions: [
            {
              time: '08:00 - 10:00',
              unitCode: 'DICT 201',
              unitTitle: 'Object Oriented Programming (Java) - Theory',
              venue: 'Lecture Theatre 1 (LT-1)',
              lecturer: 'Eng. Justus Mwangi',
              type: 'Lecture'
            },
            {
              time: '10:30 - 13:00',
              unitCode: 'DICT 201',
              unitTitle: 'Object Oriented Programming - Hands-on Lab',
              venue: 'Computing Lab 1',
              lecturer: 'Eng. Justus Mwangi',
              type: 'Lab'
            },
            {
              time: '14:00 - 16:00',
              unitCode: 'DICT 205',
              unitTitle: 'Communication Skills & Technical Reporting',
              venue: 'Room C-04',
              lecturer: 'Mrs. Emily Mutua',
              type: 'Lecture'
            }
          ]
        },
        {
          day: 'Tuesday',
          sessions: [
            {
              time: '08:30 - 11:00',
              unitCode: 'DICT 202',
              unitTitle: 'Database Management Systems (SQL)',
              venue: 'Computing Lab 2',
              lecturer: 'Ms. Sharon Wanjiku',
              type: 'Lab'
            },
            {
              time: '11:30 - 13:30',
              unitCode: 'DICT 206',
              unitTitle: 'Quantitative Techniques & Statistics',
              venue: 'Room LT-2',
              lecturer: 'Mr. Kenneth Kipkoech',
              type: 'Lecture'
            },
            {
              time: '14:30 - 16:30',
              unitCode: 'DICT 207',
              unitTitle: 'Entrepreneurship Education',
              venue: 'Room C-02',
              lecturer: 'Mr. David Kamau',
              type: 'Lecture'
            }
          ]
        },
        {
          day: 'Wednesday',
          sessions: [
            {
              time: '08:00 - 11:00',
              unitCode: 'DICT 203',
              unitTitle: 'Computer Networks (Packet Tracer & Cabling)',
              venue: 'Cisco Networking Lab',
              lecturer: 'Mr. Patrick Odhiambo',
              type: 'Lab'
            },
            {
              time: '11:30 - 13:30',
              unitCode: 'DICT 203',
              unitTitle: 'Computer Networks - Theory & Architecture',
              venue: 'Lecture Theatre 1 (LT-1)',
              lecturer: 'Mr. Patrick Odhiambo',
              type: 'Lecture'
            },
            {
              time: '14:00 - 16:00',
              unitCode: 'DEPT 200',
              unitTitle: 'Departmental Project Consultation & Mentorship',
              venue: 'Faculty Office 04',
              lecturer: 'Departmental Faculty',
              type: 'Consultation'
            }
          ]
        },
        {
          day: 'Thursday',
          sessions: [
            {
              time: '08:30 - 11:00',
              unitCode: 'DICT 204',
              unitTitle: 'Web Development Principles (HTML/CSS/JS)',
              venue: 'Computing Lab 1',
              lecturer: 'Eng. Justus Mwangi',
              type: 'Lab'
            },
            {
              time: '11:30 - 13:30',
              unitCode: 'DICT 208',
              unitTitle: 'Operating Systems Concepts & Linux CLI',
              venue: 'Room LT-1',
              lecturer: 'Ms. Sharon Wanjiku',
              type: 'Lecture'
            },
            {
              time: '14:00 - 16:30',
              unitCode: 'DICT 204',
              unitTitle: 'Web Practical Project Studio',
              venue: 'Computing Lab 1',
              lecturer: 'Eng. Justus Mwangi',
              type: 'Lab'
            }
          ]
        },
        {
          day: 'Friday',
          sessions: [
            {
              time: '08:30 - 11:00',
              unitCode: 'DICT 209',
              unitTitle: 'Systems Analysis & Design (SDLC)',
              venue: 'Room LT-2',
              lecturer: 'Mr. Patrick Odhiambo',
              type: 'Lecture'
            },
            {
              time: '11:30 - 13:00',
              unitCode: 'PE 101',
              unitTitle: 'Physical Education & Sports Activities',
              venue: 'College Sports Grounds',
              lecturer: 'Sports Department',
              type: 'Sports'
            },
            {
              time: '14:00 - 16:00',
              unitCode: 'CLUB 101',
              unitTitle: 'Computer Club & Technical Innovations Workshop',
              venue: 'Computing Lab 2',
              lecturer: 'Student Executives',
              type: 'Co-Curricular'
            }
          ]
        }
      ];

      // 8. Academics (Modular transcript records)
      const academics = [
        {
          studentId: 'stud-1',
          admissionNumber: '834/DICT/2023',
          cumulativeMean: 81.6,
          standing: 'Good Standing (Distinction Range)',
          terms: [
            {
              termTitle: 'Year 1 - Term 1 (KNEC Module I Series)',
              status: 'Completed',
              units: [
                { code: 'DICT 101', title: 'Introduction to ICT & Ethics', cat: 26, exam: 58, total: 84, grade: 'Distinction' },
                { code: 'DICT 102', title: 'Computer Applications I', cat: 28, exam: 62, total: 90, grade: 'Distinction' },
                { code: 'DICT 103', title: 'Structured Programming (C)', cat: 25, exam: 55, total: 80, grade: 'Distinction' },
                { code: 'DICT 104', title: 'Mathematics for Computing', cat: 22, exam: 52, total: 74, grade: 'Credit' }
              ]
            },
            {
              termTitle: 'Year 1 - Term 2 (KNEC Module I Series)',
              status: 'Completed',
              units: [
                { code: 'DICT 105', title: 'Computer Maintenance & Support', cat: 27, exam: 59, total: 86, grade: 'Distinction' },
                { code: 'DICT 106', title: 'Data Communication Principles', cat: 24, exam: 53, total: 77, grade: 'Credit' },
                { code: 'DICT 107', title: 'Visual Basic .NET Application', cat: 26, exam: 61, total: 87, grade: 'Distinction' }
              ]
            },
            {
              termTitle: 'Year 2 - Term 1 (In Progress - Continuous Assessment)',
              status: 'In Progress',
              units: [
                { code: 'DICT 201', title: 'Object Oriented Programming (Java)', cat: 27, exam: null, total: 27, grade: 'Pending Final Exam' },
                { code: 'DICT 202', title: 'Database Management Systems', cat: 25, exam: null, total: 25, grade: 'Pending Final Exam' },
                { code: 'DICT 203', title: 'Computer Networks', cat: 24, exam: null, total: 24, grade: 'Pending Final Exam' },
                { code: 'DICT 204', title: 'Web Development Principles', cat: 26, exam: null, total: 26, grade: 'Pending Final Exam' }
              ]
            }
          ]
        },
        {
          studentId: 'stud-2',
          admissionNumber: '835/DICT/2023',
          cumulativeMean: 84.2,
          standing: 'Good Standing (Distinction Range)',
          terms: [
            {
              termTitle: 'Year 1 - Term 1',
              status: 'Completed',
              units: [
                { code: 'DICT 101', title: 'Introduction to ICT & Ethics', cat: 28, exam: 60, total: 88, grade: 'Distinction' },
                { code: 'DICT 102', title: 'Computer Applications I', cat: 29, exam: 63, total: 92, grade: 'Distinction' },
                { code: 'DICT 103', title: 'Structured Programming (C)', cat: 27, exam: 58, total: 85, grade: 'Distinction' }
              ]
            }
          ]
        }
      ];

      // 9. Activity Log (Audit trail)
      const activity_log = [
        {
          id: 'log-101',
          timestamp: '2026-11-06T09:40:12Z',
          actorName: 'Dennis Kiprop Tanui',
          actorRole: 'student',
          action: 'Assignment Submitted',
          details: 'Submitted 834_DICT_2023_Hospital_DB_3NF.pdf for DICT 202'
        },
        {
          id: 'log-102',
          timestamp: '2026-11-04T10:15:30Z',
          actorName: 'Eng. Justus Mwangi',
          actorRole: 'admin',
          action: 'Score Graded',
          details: 'Awarded 27/30 to Dennis Kiprop Tanui for DICT 201 Practical 1'
        },
        {
          id: 'log-103',
          timestamp: '2026-11-03T11:05:00Z',
          actorName: 'Faith Cherotich Langat',
          actorRole: 'student',
          action: 'Assignment Submitted',
          details: 'Submitted 835_DICT_2023_Java_Swing.zip for DICT 201'
        },
        {
          id: 'log-104',
          timestamp: '2026-11-02T14:22:00Z',
          actorName: 'Dennis Kiprop Tanui',
          actorRole: 'student',
          action: 'Assignment Submitted',
          details: 'Submitted 834_DICT_2023_Java_Assignment1.zip for DICT 201'
        },
        {
          id: 'log-105',
          timestamp: '2026-10-25T08:00:00Z',
          actorName: 'Eng. Justus Mwangi',
          actorRole: 'admin',
          action: 'Announcement Published',
          details: 'Published notice regarding TVET CDACC / KNEC examination series'
        },
        {
          id: 'log-106',
          timestamp: '2026-09-29T10:30:00Z',
          actorName: 'Eng. Justus Mwangi',
          actorRole: 'admin',
          action: 'Fee Payment Recorded',
          details: 'Recorded KES 10,000 KCB deposit for Dennis Kiprop Tanui (REC-57890)'
        }
      ];

      // Save each collection to localStorage
      this.set('admins', admins);
      this.set('students', students);
      this.set('assignments', assignments);
      this.set('submissions', submissions);
      this.set('announcements', announcements);
      this.set('fee_statements', fee_statements);
      this.set('timetables', timetables);
      this.set('academics', academics);
      this.set('activity_log', activity_log);
    }
  };

  // Auto initialize on script load
  store.init();

  // Expose store globally
  root.store = store;

})(typeof window !== 'undefined' ? window : this);
