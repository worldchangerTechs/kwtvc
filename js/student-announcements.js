/**
 * Kajiado West Technical and Vocational College
 * Department of Computing and Informatics - Announcements Controller
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

  const container = document.getElementById('announcements-list-container');
  const searchInput = document.getElementById('search-announcements');
  const filterBtns = document.querySelectorAll('.filter-category-btn');

  let activeCategory = 'ALL';
  let searchTerm = '';

  function renderList() {
    const rawAnnouncements = store.getAll('announcements');

    // Update nav counters
    const navAsg = document.getElementById('nav-assignments-count');
    if (navAsg) navAsg.textContent = store.getAll('assignments').length;
    const navAnn = document.getElementById('nav-announcements-count');
    if (navAnn) navAnn.textContent = rawAnnouncements.length;

    // Sort reverse-chronologically (latest first)
    const sorted = [...rawAnnouncements].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter by category and search term
    const filtered = sorted.filter(ann => {
      const matchCat = activeCategory === 'ALL' || (ann.category && ann.category.toLowerCase() === activeCategory.toLowerCase());
      const term = searchTerm.toLowerCase();
      const matchSearch = !term ||
        (ann.title && ann.title.toLowerCase().includes(term)) ||
        (ann.content && ann.content.toLowerCase().includes(term)) ||
        (ann.author && ann.author.toLowerCase().includes(term)) ||
        (ann.category && ann.category.toLowerCase().includes(term));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="panel" style="padding: 32px 16px; text-align: center; color: var(--color-text-muted);">
          No notices match the query "${searchTerm}". Try a different search term or category.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ann => {
      const urgent = ann.priority === 'High' ? '<span class="badge badge-brick">Urgent</span>' : '';

      return `
        <article class="panel" style="margin-bottom:0;">
          <div class="panel-body">
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
              <span class="badge badge-ink">${ann.category || 'General'}</span>
              ${urgent}
              <span style="margin-left:auto; font-size:0.8125rem; color:var(--color-text-muted);">${ui.formatDate(ann.date)}</span>
            </div>
            <h3 style="font-size:1.0625rem; margin-bottom:8px; line-height:1.4;">${ann.title}</h3>
            <p style="font-size:0.875rem; color:var(--color-text-muted); line-height:1.65; margin-bottom:12px; white-space:pre-line;">${ann.content}</p>
            <div style="font-size:0.8125rem; color:var(--color-text-subtle);">${ann.author || 'Administration'}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Search Input Listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim();
      renderList();
    });
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderList();
    });
  });

  renderList();
});
