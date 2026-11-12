/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Admin Timetable Controller
 * With Room Overlap Protection
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
  const tbody = document.getElementById('admin-timetable-body');
  const dayFilter = document.getElementById('filter-timetable-day');
  const btnOpenAddSlot = document.getElementById('btn-open-add-slot');

  // Modal elements
  const modalSlot = document.getElementById('modal-slot');
  const formSlot = document.getElementById('slot-form');
  const modalTitle = document.getElementById('modal-slot-title');
  const slotDayOrig = document.getElementById('slot-day-orig');
  const slotIndexOrig = document.getElementById('slot-index-orig');
  const conflictAlert = document.getElementById('slot-conflict-alert');
  const conflictMsg = document.getElementById('slot-conflict-msg');

  const slotDay = document.getElementById('slot-day');
  const slotDept = document.getElementById('slot-department');
  const slotStartTime = document.getElementById('slot-start-time');
  const slotEndTime = document.getElementById('slot-end-time');
  const slotUnitCode = document.getElementById('slot-unit-code');
  const slotUnitTitle = document.getElementById('slot-unit-title');
  const slotRoom = document.getElementById('slot-room');
  const slotLecturer = document.getElementById('slot-lecturer');
  const slotType = document.getElementById('slot-type');

  let activeDay = 'ALL';

  /**
   * Helper to convert "HH:MM" to minutes from midnight
   */
  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function renderTable() {
    const timetableData = store.getAll('timetables');

    // Update nav counters
    const navStudents = document.getElementById('nav-students-count');
    if (navStudents) navStudents.textContent = store.getAll('students').length;
    const navAsg = document.getElementById('nav-assignments-count');
    if (navAsg) navAsg.textContent = store.getAll('assignments').length;
    const navSubs = document.getElementById('nav-submissions-count');
    if (navSubs) navSubs.textContent = store.getAll('submissions').length;
    const navAnn = document.getElementById('nav-announcements-count');
    if (navAnn) navAnn.textContent = store.getAll('announcements').length;

    let entries = [];
    timetableData.forEach(dayRecord => {
      if (activeDay === 'ALL' || dayRecord.day.toLowerCase() === activeDay.toLowerCase()) {
        (dayRecord.sessions || []).forEach((session, idx) => {
          entries.push({
            day: dayRecord.day,
            index: idx,
            ...session
          });
        });
      }
    });

    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="ledger-empty">No sessions scheduled.</td></tr>';
      return;
    }

    tbody.innerHTML = entries.map(item => {
      const isLab = item.type === 'Lab' || item.venue.toLowerCase().includes('lab');

      return `
        <tr>
          <td class="font-semibold" style="color:var(--color-ink);">${item.day}</td>
          <td class="text-mono" style="font-size:0.8rem;">${item.time}</td>
          <td class="font-semibold text-mono" style="color:var(--color-ink);">${item.unitCode}</td>
          <td>${item.unitTitle}</td>
          <td><strong>${item.venue}</strong></td>
          <td style="font-size:0.8rem;">${item.lecturer}</td>
          <td style="text-align:center;">
            <span class="badge ${isLab ? 'badge-ochre' : 'badge-ink'}">${item.type || 'Lecture'}</span>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:4px;">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-slot" data-day="${item.day}" data-idx="${item.index}">Edit</button>
              <button type="button" class="btn btn-danger btn-sm btn-delete-slot" data-day="${item.day}" data-idx="${item.index}">Del</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Row edit listeners
    document.querySelectorAll('.btn-edit-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditSlot(btn.getAttribute('data-day'), parseInt(btn.getAttribute('data-idx'), 10));
      });
    });

    // Row delete listeners
    document.querySelectorAll('.btn-delete-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteSlot(btn.getAttribute('data-day'), parseInt(btn.getAttribute('data-idx'), 10));
      });
    });
  }

  dayFilter.addEventListener('change', (e) => {
    activeDay = e.target.value;
    renderTable();
  });

  // Open Add Slot Modal
  btnOpenAddSlot.addEventListener('click', () => {
    slotDayOrig.value = '';
    slotIndexOrig.value = '';
    modalTitle.textContent = 'Schedule New Timetable Session';
    conflictAlert.style.display = 'none';

    slotDay.value = activeDay === 'ALL' ? 'Monday' : activeDay;
    slotDept.value = 'Department of Computing and Informatics';
    slotStartTime.value = '08:30';
    slotEndTime.value = '11:00';
    slotUnitCode.value = '';
    slotUnitTitle.value = '';
    slotRoom.value = 'Computing Lab 1';
    slotLecturer.value = admin.fullName;
    slotType.value = 'Lab';

    ui.openModal('modal-slot');
  });

  // Open Edit Slot Modal
  function openEditSlot(day, index) {
    const timetableData = store.getAll('timetables');
    const dayRecord = timetableData.find(d => d.day.toLowerCase() === day.toLowerCase());
    if (!dayRecord || !dayRecord.sessions || !dayRecord.sessions[index]) return;

    const s = dayRecord.sessions[index];
    slotDayOrig.value = day;
    slotIndexOrig.value = String(index);
    modalTitle.textContent = `Edit Session: ${s.unitCode} (${day})`;
    conflictAlert.style.display = 'none';

    slotDay.value = day;
    slotDept.value = 'Department of Computing and Informatics';

    // Parse time window
    const parts = s.time.split('-');
    if (parts.length === 2) {
      slotStartTime.value = parts[0].trim();
      slotEndTime.value = parts[1].trim();
    } else {
      slotStartTime.value = '08:30';
      slotEndTime.value = '11:00';
    }

    slotUnitCode.value = s.unitCode || '';
    slotUnitTitle.value = s.unitTitle || '';
    slotRoom.value = s.venue || 'Computing Lab 1';
    slotLecturer.value = s.lecturer || admin.fullName;
    slotType.value = s.type || 'Lecture';

    ui.openModal('modal-slot');
  }

  // Delete Slot
  function deleteSlot(day, index) {
    const timetableData = store.getAll('timetables');
    const dayRecord = timetableData.find(d => d.day.toLowerCase() === day.toLowerCase());
    if (!dayRecord || !dayRecord.sessions) return;

    const removed = dayRecord.sessions.splice(index, 1)[0];
    store.set('timetables', timetableData);

    store.logActivity(
      admin.fullName,
      'admin',
      'Timetable Session Removed',
      `Removed ${removed ? removed.unitCode : 'session'} on ${day}`
    );

    ui.toast(`Session removed from ${day}.`, 'info');
    renderTable();
  }

  // Close modals
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.closeModal('modal-slot');
    });
  });

  // Handle Form Submit with Strict Room Overlap Prevention
  formSlot.addEventListener('submit', (e) => {
    e.preventDefault();
    conflictAlert.style.display = 'none';

    const origDay = slotDayOrig.value;
    const origIndex = slotIndexOrig.value !== '' ? parseInt(slotIndexOrig.value, 10) : null;

    const day = slotDay.value;
    const startStr = slotStartTime.value;
    const endStr = slotEndTime.value;
    const unitCode = slotUnitCode.value.trim().toUpperCase();
    const unitTitle = slotUnitTitle.value.trim();
    const room = slotRoom.value;
    const lecturer = slotLecturer.value.trim();
    const type = slotType.value;

    if (!startStr || !endStr || !unitCode || !unitTitle || !lecturer) {
      ui.toast('Fill in all session details.', 'warning');
      return;
    }

    const startMin = timeToMinutes(startStr);
    const endMin = timeToMinutes(endStr);

    if (endMin <= startMin) {
      conflictMsg.textContent = 'End time must be after start time.';
      conflictAlert.style.display = 'flex';
      return;
    }

    // CHECK ROOM OVERLAP
    const timetableData = store.getAll('timetables');
    const dayRecord = timetableData.find(d => d.day.toLowerCase() === day.toLowerCase());

    if (dayRecord && dayRecord.sessions) {
      for (let i = 0; i < dayRecord.sessions.length; i++) {
        // Skip current session if editing
        if (origDay && origDay.toLowerCase() === day.toLowerCase() && origIndex === i) {
          continue;
        }

        const existing = dayRecord.sessions[i];
        if (existing.venue.toLowerCase() === room.toLowerCase()) {
          // Check time overlap
          const parts = existing.time.split('-');
          if (parts.length === 2) {
            const exStart = timeToMinutes(parts[0]);
            const exEnd = timeToMinutes(parts[1]);

            // Intervals overlap if (start < exEnd && end > exStart)
            if (startMin < exEnd && endMin > exStart) {
              const errorText = `Room Conflict: "${room}" is already booked on ${day} from ${existing.time} for ${existing.unitCode} (${existing.lecturer}). Please pick an alternative venue or non-overlapping time slot.`;
              conflictMsg.textContent = errorText;
              conflictAlert.style.display = 'flex';
              ui.toast(`${room} is already booked at that time.`, 'error');
              return; // BLOCK OVERLAP!
            }
          }
        }
      }
    }

    const timeFormatted = `${startStr} - ${endStr}`;
    const newSession = {
      time: timeFormatted,
      unitCode,
      unitTitle,
      venue: room,
      lecturer,
      type
    };

    // Ensure day record exists
    let targetDayRecord = timetableData.find(d => d.day.toLowerCase() === day.toLowerCase());
    if (!targetDayRecord) {
      targetDayRecord = { day, sessions: [] };
      timetableData.push(targetDayRecord);
    }
    if (!targetDayRecord.sessions) targetDayRecord.sessions = [];

    if (origDay && origIndex !== null) {
      // Editing
      if (origDay.toLowerCase() === day.toLowerCase()) {
        targetDayRecord.sessions[origIndex] = newSession;
      } else {
        // Moved to a different day
        const oldDay = timetableData.find(d => d.day.toLowerCase() === origDay.toLowerCase());
        if (oldDay && oldDay.sessions) oldDay.sessions.splice(origIndex, 1);
        targetDayRecord.sessions.push(newSession);
      }

      store.logActivity(
        admin.fullName,
        'admin',
        'Timetable Session Updated',
        `Updated ${unitCode} session in ${room} on ${day} (${timeFormatted})`
      );
      ui.toast(`Session ${unitCode} updated.`, 'success');
    } else {
      // New session
      targetDayRecord.sessions.push(newSession);

      store.logActivity(
        admin.fullName,
        'admin',
        'Timetable Session Added',
        `Scheduled ${unitCode} (${type}) in ${room} on ${day} (${timeFormatted})`
      );
      ui.toast(`Session ${unitCode} added.`, 'success');
    }

    // Sort sessions in the day by start time
    targetDayRecord.sessions.sort((a, b) => timeToMinutes(a.time.split('-')[0]) - timeToMinutes(b.time.split('-')[0]));

    store.set('timetables', timetableData);
    ui.closeModal('modal-slot');
    renderTable();
  });

  renderTable();
});
