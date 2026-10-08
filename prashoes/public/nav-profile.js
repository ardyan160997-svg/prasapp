(() => {
  const ADMIN_BASE = 'https://adminprashoes.prasapp.com';

  function resolveProfilePhoto(value) {
    const url = String(value || '').trim();
    if (!url) return '';
    return url.startsWith('/uploads/') ? `${ADMIN_BASE}${url}` : url;
  }

  function updateBottomProfileAvatar() {
    const photo = resolveProfilePhoto(localStorage.getItem('prashoes_member_photo'));
    document.querySelectorAll('[data-bottom-profile-shell]').forEach((shell) => {
      const image = shell.querySelector('[data-bottom-profile-avatar]');
      if (!image) return;
      image.onerror = () => {
        image.onerror = null;
        image.removeAttribute('src');
        shell.classList.remove('has-photo');
      };
      if (photo) {
        image.src = photo;
        shell.classList.add('has-photo');
      } else {
        image.removeAttribute('src');
        shell.classList.remove('has-photo');
      }
    });
  }

  window.updateBottomProfileAvatar = updateBottomProfileAvatar;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateBottomProfileAvatar);
  else updateBottomProfileAvatar();
  window.addEventListener('storage', updateBottomProfileAvatar);
})();