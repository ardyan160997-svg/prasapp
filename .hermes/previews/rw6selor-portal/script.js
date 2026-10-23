(() => {
  const header = document.querySelector('#site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#primary-nav');
  const groups = [...document.querySelectorAll('.nav-group')];

  const closeGroups = (except = null) => {
    groups.forEach((group) => {
      if (group === except) return;
      group.classList.remove('open');
      group.querySelector('.nav-trigger')?.setAttribute('aria-expanded', 'false');
    });
  };

  const closeNavigation = () => {
    nav?.classList.remove('open');
    menuButton?.classList.remove('active');
    menuButton?.setAttribute('aria-expanded', 'false');
    closeGroups();
  };

  menuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    const open = nav.classList.toggle('open');
    menuButton.classList.toggle('active', open);
    menuButton.setAttribute('aria-expanded', String(open));
  });

  groups.forEach((group) => {
    const trigger = group.querySelector('.nav-trigger');
    trigger?.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !group.classList.contains('open');
      closeGroups(group);
      group.classList.toggle('open', open);
      trigger.setAttribute('aria-expanded', String(open));
    });
  });

  document.addEventListener('click', (event) => {
    if (header?.contains(event.target)) return;
    closeNavigation();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNavigation();
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 900) closeNavigation();
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      nav?.classList.remove('open');
      menuButton?.classList.remove('active');
      menuButton?.setAttribute('aria-expanded', 'false');
    }
  });

  const mobileSearchInput = document.querySelector('#mobile-site-search');
  const mobileSearchResults = document.querySelector('#mobile-search-results');
  const mobilePages = [
    ['Data Warga', 'Pendaftaran dan pembaruan data', 'https://karangtaruna.rw6selor.org/form-anggota.html', 'anggota daftar penduduk'],
    ['Iuran Warga', 'Status dan informasi iuran', 'https://karangtaruna.rw6selor.org/iuran-bulanan.html', 'bulanan pembayaran kas'],
    ['Laporan Keuangan', 'Transparansi lingkungan', 'https://karangtaruna.rw6selor.org/laporan-keuangan.html', 'uang pemasukan pengeluaran transparansi'],
    ['Dokumentasi', 'Galeri kegiatan RW 06', 'https://karangtaruna.rw6selor.org/dokumentasi-kegiatan.html', 'foto video kegiatan galeri'],
    ['Hasil Rapat', 'Notulen dan keputusan warga', 'https://karangtaruna.rw6selor.org/rapat-hasilrapat.html', 'musyawarah notulen keputusan'],
    ['Perpustakaan', 'Bacaan digital warga', 'https://karangtaruna.rw6selor.org/eperpus-mms.html', 'buku ebook baca'],
    ['Berita Warga', 'Informasi terbaru lingkungan', 'https://karangtaruna.rw6selor.org/berita.html', 'kabar pengumuman informasi'],
    ['Struktur Pengurus', 'Susunan pengurus RW 06', 'https://karangtaruna.rw6selor.org/struktur.html', 'organisasi ketua sekretaris'],
    ['Visi & Misi', 'Arah pembangunan lingkungan', 'https://karangtaruna.rw6selor.org/visi-misi.html', 'profil tujuan'],
    ['Kesehatan', 'Informasi kesehatan warga', 'https://karangtaruna.rw6selor.org/kesehatan.html', 'sehat olahraga'],
    ['Karang Taruna', 'Portal organisasi pemuda', 'https://karangtaruna.rw6selor.org', 'pemuda organisasi'],
    ['Muda-Mudi Selor', 'Kegiatan generasi muda', 'https://mudamudiselor.rw6selor.org', 'remaja pemuda kegiatan'],
  ];

  const escapeMarkup = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));

  const renderMobileSearch = () => {
    if (!mobileSearchInput || !mobileSearchResults) return;
    const query = mobileSearchInput.value.trim().toLocaleLowerCase('id');
    mobileSearchResults.hidden = !query;
    if (!query) {
      mobileSearchResults.innerHTML = '';
      return;
    }
    const matches = mobilePages.filter((item) => item.join(' ').toLocaleLowerCase('id').includes(query)).slice(0, 6);
    mobileSearchResults.innerHTML = matches.length
      ? matches.map(([label, detail, href]) => `<a href="${escapeMarkup(href)}"><span>${escapeMarkup(label)}</span><small>${escapeMarkup(detail)} →</small></a>`).join('')
      : '<p class="mobile-search-empty">Tidak ditemukan. Coba kata kunci lain.</p>';
  };

  mobileSearchInput?.addEventListener('input', renderMobileSearch);
  mobileSearchInput?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const firstResult = mobileSearchResults?.querySelector('a');
    if (!firstResult) return;
    event.preventDefault();
    firstResult.click();
  });

  const revealTargets = [...document.querySelectorAll([
    '.mobile-discovery-shell',
    '.quick-heading',
    '.service-card',
    '.row-heading',
    '.featured-story',
    '.story-list article',
    '.agenda-intro',
    '.agenda-list article',
    '.stats-lead',
    '.stat',
    '.organization-card',
    '.footer-grid > *',
  ].join(','))];

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('reveal-ready');
    revealTargets.forEach((element, index) => {
      element.classList.add('scroll-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
    });
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: window.innerWidth <= 600 ? '0px 0px -25% 0px' : '0px 0px -8% 0px',
    });
    revealTargets.forEach((element) => revealObserver.observe(element));
  }
})();
