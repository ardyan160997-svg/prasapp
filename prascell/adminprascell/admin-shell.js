const adminSecondaryLinks = [
  ['index.html', 'Dashboard'], ['models.html', 'Database HP'], ['services.html', 'Biaya'],
  ['guides.html', 'Panduan'], ['stock.html', 'Stok Barang'], ['members.html', 'Member'],
];
const adminBottomLinks = [
  ['index.html', 'Home', 'home', '<path d="M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3Z"></path>'],
  ['warranties.html', 'Garansi', 'warranties', '<path d="M12 3 5 6v5c0 4.8 3 8.1 7 10 4-1.9 7-5.2 7-10V6Z"></path><path d="m9 12 2 2 4-5"></path>'],
  ['chat.html', 'Chat', 'chats', '<path d="M4 5h16v11H9l-5 4Z"></path><path d="M8 9h8M8 12h5"></path>'],
  ['orders.html', 'Order', 'orders', '<circle cx="12" cy="12" r="8"></circle><path d="m12 7 3 5-3 5"></path>'],
];
const currentAdminPage = location.pathname.split('/').pop() || 'index.html';
const secondary = document.querySelector('.admin-menu-slider');
if (secondary) secondary.innerHTML = adminSecondaryLinks.map(([href, label]) => `<a href="${href}" ${href === currentAdminPage ? 'aria-current="page"' : ''}>${label}</a>`).join('');
const bottom = document.querySelector('.admin-bottom-nav');
if (bottom) bottom.innerHTML = adminBottomLinks.map(([href, label, badge, icon]) => `<a class="admin-bottom-nav-item ${href === currentAdminPage ? 'active' : ''}" href="${href}" aria-label="${label}"><span class="nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><b class="nav-badge" data-nav-badge="${badge}" hidden>0</b></span><span>${label}</span></a>`).join('');
window.updateAdminNavBadges = (counts = {}) => {
  document.querySelectorAll('[data-nav-badge]').forEach((badge) => {
    const value = Number(counts[badge.dataset.navBadge] || 0);
    badge.textContent = value > 99 ? '99+' : value;
    badge.hidden = value < 1;
  });
};
