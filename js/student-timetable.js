/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Timetable Controller
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

  // Update nav counters
  const navAsg = document.getElementById('nav-assignments-count');
  if (navAsg) navAsg.textContent = store.getAll('assignments').length;
  const navAnn = document.getElementById('nav-announcements-count');
  if (navAnn) navAnn.textContent = store.getAll('announcements').length;

  const timetableData = store.getAll('timetables');
  const tbody = document.getElementById('timetable-slots-body');

  // Defined Time Slots (Rows)
  const timeSlots = [
    {
      label: '08:00 — 10:30',
      periodName: 'Session 1 (Morning)',
      isBreak: false,
      matcher: (timeStr) => timeStr.startsWith('08:') || timeStr.startsWith('08.00')
    },
    {
      label: '10:30 — 11:00',
      periodName: 'Health Break',
      isBreak: true,
      breakTitle: 'Tea & Morning Refreshment Break'
    },
    {
      label: '11:00 — 13:30',
      periodName: 'Session 2 (Mid-day)',
      isBreak: false,
      matcher: (timeStr) => timeStr.startsWith('10:30') || timeStr.startsWith('11:') || timeStr.startsWith('11:30')
    },
    {
      label: '13:30 — 14:00',
      periodName: 'Lunch Interval',
      isBreak: true,
      breakTitle: 'Lunch Interval'
    },
    {
      label: '14:00 — 16:30',
      periodName: 'Session 3 (Afternoon)',
      isBreak: false,
      matcher: (timeStr) => timeStr.startsWith('14:') || timeStr.startsWith('14.00') || timeStr.startsWith('14:30')
    }
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (tbody) {
    const rowsHtml = timeSlots.map(slot => {
      if (slot.isBreak) {
        return `
          <tr style="background-color:var(--color-paper-light);">
            <td class="time-col">
              <div style="font-weight:600;">${slot.label}</div>
              <div style="font-size:0.7rem; color:var(--color-text-subtle);">${slot.periodName}</div>
            </td>
            <td colspan="5" style="text-align:center; font-style:italic; color:var(--color-text-muted); font-size:0.8rem; padding:6px;">
              — ${slot.breakTitle} —
            </td>
          </tr>
        `;
      }

      // Standard Academic Slot across 5 days
      const daysCells = days.map(dayName => {
        const dayRecord = timetableData.find(d => d.day.toLowerCase() === dayName.toLowerCase());
        if (!dayRecord || !dayRecord.sessions) {
          return '<td style="color:var(--color-text-subtle); text-align:center;">—</td>';
        }

        const match = dayRecord.sessions.find(s => slot.matcher(s.time));
        if (!match) {
          return '<td style="color:var(--color-text-subtle); text-align:center; font-size:0.75rem;">Private Study</td>';
        }

        const isLab = match.type === 'Lab' || match.venue.toLowerCase().includes('lab');

        return `
          <td>
            <div class="timetable-cell-entry ${isLab ? 'lab' : ''}">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="entry-code">${match.unitCode}</span>
                <span class="badge ${isLab ? 'badge-ochre' : 'badge-ink'}" style="font-size:0.65rem; padding:1px 4px;">${match.type}</span>
              </div>
              <div class="entry-title">${match.unitTitle}</div>
              <div class="entry-venue">${match.venue}</div>
              <div class="entry-lecturer">${match.lecturer}</div>
            </div>
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td class="time-col">
            <div style="font-weight:600;">${slot.label}</div>
            <div style="font-size:0.7rem; color:var(--color-text-muted);">${slot.periodName}</div>
          </td>
          ${daysCells}
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rowsHtml;
  }

  // Print button
  const printBtn = document.getElementById('btn-print-timetable');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});
