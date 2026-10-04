/* ==========================================================================
   NAMA ORGANISASI : MUDA MUDI SEDAHROMO LOR 05
   BERKAS UTAMA    : SCRIPT.JS (LOGIKA INTERAKTIF & DATABASE REAL-TIME)
   ========================================================================== */

const namaBulanIndo = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const COMMON_API_BASE = "https://mudamudiselor.web.id/common/api";
const PUBLIC_SITE_BASE = "https://mudamudiselor.web.id";

/* ==========================================================================
   1. SISTEM INISIALISASI UTAMA
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function() {
    initNavigasiMobile();
    initCarouselOrganisasi();
    initHeroSlider(); 
    
    if (document.getElementById('data-tabel-keuangan')) loadKeuanganDariDatabase();
    if (document.getElementById('data-tabel-rapat') && !window.HASIL_RAPAT_MYSQL_MODE) loadRapatDariDrive();
    if (document.getElementById('data-tabel-dokumentasi')) loadDokumentasiDariDrive();
    if (document.getElementById('data-tabel-lomba')) ambilDataGoogleSheets(); 
    if (document.getElementById('data-tabel-proposal')) ambilDataProposalGoogleSheets(); 
    if (document.getElementById('data-tabel-surat')) ambilDataSuratGoogleSheets(); 
    if (document.getElementById('data-tabel-lpj')) ambilDataLpj(); 
});

/* ==========================================================================
   2. SISTEM NAVIGASI & MENU DROPDOWN MOBILE (HP)
   ========================================================================== */
function initNavigasiMobile() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navBar = document.querySelector('.main-navbar');
    
    if (menuBtn && navBar) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navBar.classList.toggle('aktif'); 
        });
    }

    const btnBulanan = document.getElementById('btn-bulanan');
    const menuRapat = document.getElementById('menu-rapat');
    const btnTahunan = document.getElementById('btn-tahunan');
    const menu17an = document.getElementById('menu-17an');

    if (btnBulanan && menuRapat) {
        btnBulanan.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            if (menu17an) menu17an.classList.remove('buka'); 
            menuRapat.classList.toggle('buka');
        });
    }

    if (btnTahunan && menu17an) {
        btnTahunan.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            if (menuRapat) menuRapat.classList.remove('buka'); 
            menu17an.classList.toggle('buka');
        });
    }
}

/* ==========================================================================
   3. SISTEM CAROUSEL & SLIDER GAMBAR
   ========================================================================== */
function initCarouselOrganisasi() {
    if (document.querySelector('.mySwiper') && typeof Swiper !== 'undefined') {
        new Swiper(".mySwiper", {
            slidesPerView: 1, 
            spaceBetween: 15,
            centeredSlides: true, 
            loop: true,
            initialSlide: 2, 
            observer: true,
            observeParents: true,
            breakpoints: { 768: { slidesPerView: 3, spaceBetween: 30 } }
        });
    }
}

const kegiatanData = [
    {
        gambar: "images/foto-tirakatan.avif", 
        judul: "Malam Tirakatan 17 Agustus 2025",
        deskripsi: "Kegiatan rutin tahunan untuk memperingati Hari Kemerdekaan Indonesia. Warga berkumpul di madrasah dinniyah untuk doa bersama, refleksi perjuangan para pahlawan bangsa."
    },
    {
        gambar: "images/foto-lomba.avif",
        judul: "Lomba Agustusan Tahun 2025",
        deskripsi: "Salah satu lomba anak yaitu pindah air dengan sendok untuk memperingati hari ulang tahun kemerdekaan Indonesia yang ke-80 Tahun."
    },
    {
        gambar: "images/momen-kebersamaan.avif",
        judul: "Momen Kebersamaan di Evaluasi Kegiatan",
        deskripsi: "Momen indah di mana seluruh anggota organisasi berkumpul untuk mengevaluasi kegiatan dalam memperingati HUT-RI yang ke 80 tahun."
    }
];

let slideIndex = 1, slideTimer;

function initHeroSlider() {
    const sliderContainer = document.getElementById('slider-container');
    const dotsContainer = document.getElementById('dots-container');
    
    if (!sliderContainer || !dotsContainer) return;

    let slidesHTML = "", dotsHTML = "";
    kegiatanData.forEach((item, index) => {
        slidesHTML += `
            <div class="slide ${index === 0 ? 'aktif' : ''}">
                <img src="${item.gambar}" alt="${item.judul}" class="slide-img">
                <div class="slide-content">
                    <h3>${item.judul}</h3><p>${item.deskripsi}</p>
                </div>
            </div>`;
        dotsHTML += `<span class="dot ${index === 0 ? 'aktif' : ''}" onclick="currentSlide(${index + 1})"></span>`;
    });
    
    sliderContainer.innerHTML = slidesHTML;
    dotsContainer.innerHTML = dotsHTML;

    showSlides(slideIndex);
    autoSlide();
}

function showSlides(n) {
    let slides = document.getElementsByClassName("slide");
    let dots = document.getElementsByClassName("dot");
    if (slides.length === 0) return;
    if (n > slides.length) slideIndex = 1;    
    if (n < 1) slideIndex = slides.length;
    Array.from(slides).forEach(s => s.classList.remove("aktif"));
    Array.from(dots).forEach(d => d.classList.remove("aktif"));
    slides[slideIndex-1].classList.add("aktif");  
    dots[slideIndex-1].classList.add("aktif");
}

function autoSlide() {
    slideTimer = setInterval(() => { slideIndex++; showSlides(slideIndex); }, 5000);
}

window.currentSlide = function(n) { 
    showSlides(slideIndex = n); 
    clearInterval(slideTimer);
    autoSlide();
}

/* ==========================================================================
   4. SISTEM TRANSPARANSI KAS KEUANGAN (DATABASE MYSQL)
   ========================================================================== */
let dataKeuanganGlobal = [];
let dataTersaringGlobal = [];
let halamanKeuanganSaatIni = 1; 
const barisKeuanganPerHalaman = 7;

function parseTanggalKeObjek(strTanggal) {
    if (!strTanggal) return new Date(0);
    const bagian = strTanggal.split("/");
    if (bagian.length !== 3) return new Date(0);
    return new Date(parseInt(bagian[2], 10), parseInt(bagian[1], 10) - 1, parseInt(bagian[0], 10));
}

async function loadKeuanganDariDatabase() {
    try {
        const response = await fetch(`${COMMON_API_BASE}/cashflow_list.php?cache=${Date.now()}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Gagal mengambil data keuangan dari database.');
        }

        dataKeuanganGlobal = (Array.isArray(result.data) ? result.data : []).map(item => {
            const tanggalParts = String(item.tanggal || '').split('-');
            const tahun = tanggalParts[0] || '';
            const bulanIndex = parseInt(tanggalParts[1], 10) - 1;
            const bulan = namaBulanIndo[bulanIndex] || 'Semua';
            return {
                id: item.id || `${item.tanggal || ''}-${item.keterangan || ''}-${item.jumlah || 0}`,
                tanggal: item.tanggal_format || item.tanggal || '-',
                tanggal_iso: item.tanggal || '',
                bulan,
                bulan_angka: Number.isFinite(bulanIndex) ? bulanIndex + 1 : 0,
                tahun,
                keterangan: item.keterangan || '-',
                tipe: item.jenis === 'pemasukan' ? 'masuk' : 'keluar',
                jumlah: Number(item.jumlah || 0),
                jumlah_format: item.jumlah_format || formatRupiah(Number(item.jumlah || 0)),
                bukti_file: item.bukti_file || '',
                linkNota: item.bukti_file || '',
                sumber_data: item.sumber_data || '',
            };
        });

        dataKeuanganGlobal.sort((a, b) => parseTanggalKeObjek(b.tanggal) - parseTanggalKeObjek(a.tanggal));

        const daftarTahun = new Set();
        const daftarBulan = new Set();
        dataKeuanganGlobal.forEach(item => {
            if (item.tahun) daftarTahun.add(item.tahun);
            if (item.bulan && item.bulan !== 'Semua') daftarBulan.add(item.bulan);
        });

        isiDropdown('filter-tahun', Array.from(daftarTahun).sort().reverse());
        isiDropdown('filter-bulan', Array.from(daftarBulan).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));
        terapkanFilter();
    } catch (e) {
        const tbody = document.getElementById('data-tabel-keuangan');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#b71c1c;">Gagal terhubung ke database keuangan.<br><small>${escapeHtmlMms(e.message)}</small></td></tr>`;
        }
    }
}

window.terapkanFilter = function() {
    const thnInput = document.getElementById('filter-tahun');
    const blnInput = document.getElementById('filter-bulan');
    const katInput = document.getElementById('filter-kategori');
    const cariInput = document.getElementById('input-cari');
    if(!thnInput || !blnInput || !katInput || !cariInput) return;

    const thn = thnInput.value;
    const bln = blnInput.value;
    const kat = katInput.value;
    const cari = cariInput.value.toLowerCase();

    dataTersaringGlobal = dataKeuanganGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && (bln === "Semua" || item.bulan === bln) && (kat === "Semua" || item.tipe === kat) && (item.keterangan.toLowerCase().includes(cari) || item.tanggal.toLowerCase().includes(cari));
    });

    let m = 0, k = 0;
    dataTersaringGlobal.forEach(i => {
        let n = Number(i.jumlah) || 0;
        i.tipe === 'masuk' ? m += n : k += n;
    });

    document.getElementById('total-masuk').innerText = formatRupiah(m);
    document.getElementById('total-keluar').innerText = formatRupiah(k);
    document.getElementById('saldo-akhir').innerText = formatRupiah(m - k);

    halamanKeuanganSaatIni = 1; 
    renderTabel();
}

function renderTabel() {
    const tbody = document.getElementById('data-tabel-keuangan'); if (!tbody) return;
    if (dataTersaringGlobal.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#666;">Data transaksi tidak ditemukan.</td></tr>`;
        return;
    }

    const saldoMap = new Map();
    let saldoBerjalan = 0;
    [...dataTersaringGlobal]
        .sort((a, b) => parseTanggalKeObjek(a.tanggal) - parseTanggalKeObjek(b.tanggal))
        .forEach((item) => {
            const jumlah = Number(item.jumlah) || 0;
            saldoBerjalan += item.tipe === 'masuk' ? jumlah : -jumlah;
            saldoMap.set(item.id, saldoBerjalan);
        });

    const start = (halamanKeuanganSaatIni - 1) * barisKeuanganPerHalaman;
    const pageData = dataTersaringGlobal.slice(start, start + barisKeuanganPerHalaman);
    let html = pageData.map(i => {
        const saldo = saldoMap.get(i.id) || 0;
        const buktiFile = i.bukti_file;
        let buktiHtml = '-';

        if (buktiFile && buktiFile !== '-') {
            const safeBukti = escapeHtmlMms(String(buktiFile));
            buktiHtml = `
                <button type="button" class="bukti-btn" data-bukti="${safeBukti}">
                    <i class="fa-solid fa-receipt"></i>
                    Lihat Nota
                </button>
            `;
        }

        return `
            <tr>
                <td>${escapeHtmlMms(i.tanggal)}</td>
                <td>${escapeHtmlMms(i.keterangan)}</td>
                <td style="color:#2e7d32; font-weight:bold;">${i.tipe === 'masuk' ? escapeHtmlMms(i.jumlah_format) : '-'}</td>
                <td style="color:#E53935; font-weight:bold;">${i.tipe === 'keluar' ? escapeHtmlMms(i.jumlah_format) : '-'}</td>
                <td><strong>${formatRupiah(saldo)}</strong></td>
                <td>${buktiHtml}</td>
            </tr>`;
    }).join('');

    const totalHal = Math.ceil(dataTersaringGlobal.length / barisKeuanganPerHalaman);
    if (totalHal > 1) {
        let tombolNav = "";
        const styleBtn = "padding:8px 16px; background:#D32F2F; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;";
        if (halamanKeuanganSaatIni === 1) tombolNav = `<div style="text-align:right;"><button onclick="nav(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        else if (halamanKeuanganSaatIni === totalHal) tombolNav = `<div style="text-align:left;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        else tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="nav(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="nav(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        html += `<tr><td colspan="6" style="padding:15px; background:#f9f9f9; border-top:1px solid #eee;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}
window.nav = (dir) => { halamanKeuanganSaatIni += dir; renderTabel(); };

function escapeHtmlMms(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeBuktiUrl(fileUrl) {
    if (!fileUrl) return '';

    const value = String(fileUrl).trim();

    if (value.startsWith('http://') || value.startsWith('https://')) {
        return value;
    }

    if (value.startsWith('/')) {
        return `${PUBLIC_SITE_BASE}${value}`;
    }

    return `${PUBLIC_SITE_BASE}/${value.replace(/^\/+/, '')}`;
}

function isImageFile(url) {
    return /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url);
}

function isPdfFile(url) {
    return /\.pdf(\?.*)?$/i.test(url);
}

function isGoogleDriveUrl(url) {
    return /drive\.google\.com|docs\.google\.com/i.test(url);
}

function openBuktiModal(fileUrl) {
    const overlay = document.getElementById('buktiModalOverlay');
    const body = document.getElementById('buktiModalBody');

    if (!overlay || !body) return;

    const url = normalizeBuktiUrl(fileUrl);
    const safeUrl = escapeHtmlMms(url);

    if (!url || url === '-') {
        body.innerHTML = '<p>Tidak ada bukti nota.</p>';
    } else if (isImageFile(url)) {
        body.innerHTML = `
            <img src="${safeUrl}" class="bukti-preview-img" alt="Bukti Nota">
        `;
    } else if (isPdfFile(url)) {
        body.innerHTML = `
            <iframe src="${safeUrl}" class="bukti-preview-frame"></iframe>
            <p style="margin-top:12px;">
                <a href="${safeUrl}" target="_blank" rel="noopener" class="bukti-open-link">
                    <i class="fa-solid fa-file-pdf"></i>
                    Buka PDF
                </a>
            </p>
        `;
    } else if (isGoogleDriveUrl(url)) {
        body.innerHTML = `
            <p>Bukti lama tersimpan di Google Drive.</p>
            <a href="${safeUrl}" target="_blank" rel="noopener" class="bukti-open-link">
                <i class="fa-brands fa-google-drive"></i>
                Buka Bukti Google Drive
            </a>
        `;
    } else {
        body.innerHTML = `
            <a href="${safeUrl}" target="_blank" rel="noopener" class="bukti-open-link">
                <i class="fa-solid fa-file"></i>
                Buka Bukti
            </a>
        `;
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeBuktiModal() {
    const overlay = document.getElementById('buktiModalOverlay');
    const body = document.getElementById('buktiModalBody');

    if (overlay) overlay.classList.remove('open');
    if (body) body.innerHTML = '';

    document.body.style.overflow = '';
}

window.openBuktiModal = openBuktiModal;
window.closeBuktiModal = closeBuktiModal;

document.addEventListener('click', function (event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const btn = target.closest('.bukti-btn');
    if (btn) {
        openBuktiModal(btn.getAttribute('data-bukti'));
        return;
    }

    const overlay = document.getElementById('buktiModalOverlay');
    if (overlay && target === overlay) {
        closeBuktiModal();
        return;
    }

    if (target.closest('#buktiModalClose')) {
        closeBuktiModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeBuktiModal();
    }
});

/* ==========================================================================
   5. SISTEM NOTULEN & HASIL MUSYAWARAH RAPAT BULANAN
   ========================================================================== */
const linkTsvRapat = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRq9to0l-2kWwtGcTvwY70z_Ga8NAVmI-C_k4LYoDgTxGhqPY954gdkuRGmqRYe3wP-zSd6M9cUz-qC/pub?gid=1613608992&single=true&output=tsv";
let dataRapatGlobal = []; let dataRapatTersaring = []; let halRapatSaatIni = 1; const barisRapatPerHal = 5; 

async function loadRapatDariDrive() {
    try {
        const response = await fetch(`${linkTsvRapat}&cache=${new Date().getTime()}`);
        const teksData = await response.text();
        dataRapatGlobal = [];
        let daftarTahunRapat = new Set(), daftarBulanRapat = new Set(), baris = [], barisSaatIni = [], diDalamKutip = false, penampungTeks = "";

        for (let i = 0; i < teksData.length; i++) {
            let char = teksData[i], nextChar = teksData[i + 1];
            if (char === '"') diDalamKutip = !diDalamKutip; 
            else if (char === '\t' && !diDalamKutip) { barisSaatIni.push(penampungTeks.trim()); penampungTeks = ""; }
            else if ((char === '\n' || char === '\r') && !diDalamKutip) {
                if (char === '\r' && nextChar === '\n') i++; 
                barisSaatIni.push(penampungTeks.trim());
                if (barisSaatIni.length > 0) baris.push(barisSaatIni);
                barisSaatIni = []; penampungTeks = "";
            } else penampungTeks += char;
        }
        if (penampungTeks) { barisSaatIni.push(penampungTeks.trim()); baris.push(barisSaatIni); }

        for (let i = 1; i < baris.length; i++) {
            let kolom = baris[i]; if (kolom.length < 5) continue;
            let tglRaw = kolom[1] || "", agendaRaw = kolom[2] || "-", hasilRaw = kolom[3] || "-", lokasiRaw = kolom[4] || "-";
            let hasilFormatBaris = hasilRaw.replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/\r/g, '<br>');
            let tglSplit = tglRaw.split("/");
            let thn = tglSplit[2] || "2026"; if(thn.length > 4) thn = thn.substring(0,4); 
            let bln = namaBulanIndo[parseInt(tglSplit[1], 10) - 1] || "Semua";

            if(thn && thn !== "") daftarTahunRapat.add(thn);
            if(bln && bln !== "Semua") daftarBulanRapat.add(bln);
            dataRapatGlobal.push({ tanggal: tglRaw, bulan: bln, tahun: thn, agenda: agendaRaw, hasil: hasilFormatBaris, lokasi: lokasiRaw });
        }
        isiDropdown('filter-rapat-tahun', Array.from(daftarTahunRapat).sort().reverse());
        isiDropdown('filter-rapat-bulan', Array.from(daftarBulanRapat).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));
        terapkanFilterRapat();
    } catch (e) {
        const tbody = document.getElementById('data-tabel-rapat');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#b71c1c;">Gagal memuat arsip hasil rapat.</td></tr>`;
        }
    }
}

window.terapkanFilterRapat = function() {
    const thn = document.getElementById('filter-rapat-tahun').value;
    const bln = document.getElementById('filter-rapat-bulan').value;
    const cari = document.getElementById('input-cari-rapat').value.toLowerCase();
    dataRapatTersaring = dataRapatGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && (bln === "Semua" || item.bulan === bln) && (item.agenda.toLowerCase().includes(cari) || item.hasil.toLowerCase().includes(cari) || item.lokasi.toLowerCase().includes(cari));
    });
    halRapatSaatIni = 1; renderTabelRapat();
}

function renderTabelRapat() {
    const tbody = document.getElementById('data-tabel-rapat'); if (!tbody) return;
    if (dataRapatTersaring.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#666;">Tidak ada arsip hasil rapat yang cocok.</td></tr>`; return; }
    const start = (halRapatSaatIni - 1) * barisRapatPerHal, pageData = dataRapatTersaring.slice(start, start + barisRapatPerHal);
    let html = pageData.map(i => `
        <tr>
            <td style="font-weight: 500; color: #333; vertical-align: top;"><i class="fa-regular fa-calendar-days" style="color:#E53935; margin-right:5px;"></i> ${i.tanggal}</td>
            <td style="font-weight: bold; color: #E53935; vertical-align: top;">${i.agenda}</td>
            <td style="vertical-align: top; padding-right:20px;"><div style="line-height: 1.6; text-align: left; color: #333; display: block; white-space: normal;">${i.hasil}</div></td>
            <td style="vertical-align: top;"><i class="fa-solid fa-location-dot" style="color: #666; margin-right:4px;"></i> ${i.lokasi}</td>
            <td style="vertical-align: top;">-</td>
        </tr>`).join('');

    const totalHal = Math.ceil(dataRapatTersaring.length / barisRapatPerHal);
    if (totalHal > 1) {
        let tombolNav = ""; const styleBtn = "padding:8px 16px; background:#D32F2F; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;";
        if (halRapatSaatIni === 1) tombolNav = `<div style="text-align:right;"><button onclick="navRapat(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        else if (halRapatSaatIni === totalHal) tombolNav = `<div style="text-align:left;"><button onclick="navRapat(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        else tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="navRapat(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="navRapat(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        html += `<tr><td colspan="5" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}
window.navRapat = (dir) => { halRapatSaatIni += dir; renderTabelRapat(); };

/* ==========================================================================
   6. SISTEM DOKUMENTASI & GALERI KEGIATAN
   ========================================================================== */
const linkTsvDokumentasi = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSGNBxjdguHX3DyMAm4824Cw9Nv6t83MDuqojSZUcwftKAKyuC2jRLtPGId7FdK7w1asPeEVVtdSqqN/pub?gid=600804245&single=true&output=tsv";
let dataDokumentasiGlobal = []; let dataDokumentasiTersaring = []; let halDokSaatIni = 1; const barisDokPerHal = 5; 

async function loadDokumentasiDariDrive() {
    try {
        const response = await fetch(`${linkTsvDokumentasi}&cache=${new Date().getTime()}`);
        const teksData = await response.text(); const baris = teksData.split("\n");
        dataDokumentasiGlobal = []; let daftarTahunDok = new Set(), daftarBulanDok = new Set();

        for (let i = 1; i < baris.length; i++) {
            const barisBersih = baris[i].trim(); if (!barisBersih) continue;
            const kolom = barisBersih.split("\t"); if (kolom.length < 5) continue; 
            let tglRaw = kolom[1] ? kolom[1].trim() : "", agendaRaw = kolom[2] ? kolom[2].trim() : "-", kegiatanRaw = kolom[3] ? kolom[3].trim() : "-", subjekRaw = kolom[4] ? kolom[4].trim() : "-", linkFotoAsli = kolom[5] ? kolom[5].trim() : ""; 
            if (!tglRaw) continue;
            let tglSplit = tglRaw.split("/");
            let thn = tglSplit[2] ? tglSplit[2].trim() : "2026"; if(thn.length > 4) thn = thn.substring(0,4);
            let bln = namaBulanIndo[parseInt(tglSplit[1], 10) - 1] || "Semua";
            if(thn && thn.trim() !== "") daftarTahunDok.add(thn);
            if(bln && bln !== "Semua") daftarBulanDok.add(bln);
            dataDokumentasiGlobal.push({ tanggal: tglRaw, bulan: bln, tahun: thn, agenda: agendaRaw, kegiatan: kegiatanRaw, subjek: subjekRaw, linkAsli: linkFotoAsli });
        }
        dataDokumentasiGlobal.reverse();
        isiDropdown('filter-dok-tahun', Array.from(daftarTahunDok).sort().reverse());
        isiDropdown('filter-dok-bulan', Array.from(daftarBulanDok).sort((a,b) => namaBulanIndo.indexOf(a) - namaBulanIndo.indexOf(b)));
        terapkanFilterDokumentasi();
    } catch (e) {
        const tbody = document.getElementById('data-tabel-dokumentasi');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#b71c1c;">Gagal memuat data dokumentasi.</td></tr>`;
        }
    }
}

window.terapkanFilterDokumentasi = function() {
    const thn = document.getElementById('filter-dok-tahun').value;
    const bln = document.getElementById('filter-dok-bulan').value;
    const cari = document.getElementById('input-cari-dok').value.toLowerCase();
    dataDokumentasiTersaring = dataDokumentasiGlobal.filter(item => {
        return (thn === "Semua" || item.tahun === thn) && (bln === "Semua" || item.bulan === bln) && (item.agenda.toLowerCase().includes(cari) || item.kegiatan.toLowerCase().includes(cari) || item.subjek.toLowerCase().includes(cari));
    });
    halDokSaatIni = 1; renderTabelDokumentasi();
}

function renderTabelDokumentasi() {
    const tbody = document.getElementById('data-tabel-dokumentasi'); if (!tbody) return;
    if (dataDokumentasiTersaring.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#666;">Tidak ditemukan rekaman kegiatan yang cocok.</td></tr>`; return; }
    const start = (halDokSaatIni - 1) * barisDokPerHal, pageData = dataDokumentasiTersaring.slice(start, start + barisDokPerHal);

    let html = pageData.map(i => {
        let kolomMedia = "";
        if (i.linkAsli) {
            let daftarLink = i.linkAsli.split(",").map(link => link.trim()); kolomMedia = `<div style="display: flex; flex-direction: column; gap: 14px; align-items: center;">`;
            daftarLink.forEach((linkSingle, index) => {
                if (!linkSingle) return; let renderUrl = linkSingle, isImg = false;
                if (linkSingle.includes("id=")) { let idFile = linkSingle.split("id=")[1].split("&")[0]; renderUrl = `https://drive.google.com/thumbnail?id=${idFile}&sz=w800`; isImg = true; }
                else if (linkSingle.includes("/d/")) { let idFile = linkSingle.split("/d/")[1].split("/")[0]; renderUrl = `https://drive.google.com/thumbnail?id=${idFile}&sz=w800`; isImg = true; }
                if (isImg) kolomMedia += `<div style="text-align:center;"><a href="${linkSingle}" target="_blank"><img src="${renderUrl}" alt="${i.agenda}" style="max-width:260px; max-height:200px; object-fit:contain; border-radius:6px;"></a><br><a href="${linkSingle}" target="_blank" style="font-size:11px; color:#E53935; font-weight:600;">Foto ${index + 1} (Penuh)</a></div>`;
                else kolomMedia += `<a href="${linkSingle}" target="_blank" style="padding:6px 12px; background:#f5f5f5; border:1px solid #ccc; font-size:11px; font-weight:bold;"><i class="fa-solid fa-paperclip" style="color:#E53935;"></i> Berkas ${index + 1}</a>`;
            });
            kolomMedia += `</div>`;
        } else kolomMedia = `<div style="text-align:center; color:#999; font-style:italic; font-size:12px;">Tidak ada file</div>`;

        return `<tr><td>${i.tanggal}</td><td>${kolomMedia}</td><td style="font-weight:bold; color:#E53935;">${i.agenda}</td><td style="font-weight:600; color:#555;">${i.subjek}</td><td style="line-height:1.6; text-align:justify;">${i.kegiatan}</td></tr>`;
    }).join('');

    const totalHal = Math.ceil(dataDokumentasiTersaring.length / barisDokPerHal);
    if (totalHal > 1) {
        let tombolNav = ""; const styleBtn = "padding:8px 16px; background:#D32F2F; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;";
        if (halDokSaatIni === 1) tombolNav = `<div style="text-align:right;"><button onclick="navDok(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        else if (halDokSaatIni === totalHal) tombolNav = `<div style="text-align:left;"><button onclick="navDok(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        else tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="navDok(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="navDok(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        html += `<tr><td colspan="5" style="padding:15px; background:#f9f9f9;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}
window.navDok = (dir) => {
    halDokSaatIni += dir;
    renderTabelDokumentasi();
    const headerDok = document.getElementById('header-dokumentasi') || document.getElementById('data-frame-anggota');
    if (headerDok) {
        const isMobile = window.innerWidth <= 768;
        const offset = isMobile ? 150 : 70;
        const top = headerDok.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
};

/* ==========================================================================
   9. LOGIKA PWA & UTILLITAS UMUM
   ========================================================================== */
function isiDropdown(id, dataArray) { const el = document.getElementById(id); if (!el) return; el.innerHTML = el.options[0].outerHTML; dataArray.forEach(item => { let opt = document.createElement("option"); opt.value = item; opt.text = item; el.appendChild(opt); }); }
function formatRupiah(angka) { return 'Rp ' + Math.abs(angka).toLocaleString('id-ID'); }
window.closeModal = function() { const modal = document.getElementById('modalOverlay'); if (modal) modal.classList.remove('active'); };
window.tutupPopupInstal = function() { const popup = document.getElementById('pwa-install-popup'); if (popup) popup.style.display = 'none'; };

/* ==========================================================================
   11. ENGINE LIVE CHAT REAL-TIME
   ========================================================================== */
const URL_ENGINE_CHAT_MMS = `${COMMON_API_BASE}/warga-chat.php`;
const MMS_CHAT_DEVICE_KEY = "mms_device_id";
const MMS_CHAT_NAME_KEY = "mms_chat_display_name";
let loopPenyegarObrolan = null;
let idPesanTerakhirChatMMS = null;

function escapeHtmlMMS(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

function ambilDeviceIdChatMMS() {
    let deviceId = localStorage.getItem(MMS_CHAT_DEVICE_KEY);
    if (!deviceId) {
        const randomPart = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9-]/g, "");
        deviceId = `mms_${randomPart}`;
        localStorage.setItem(MMS_CHAT_DEVICE_KEY, deviceId);
    }
    return deviceId;
}

function normalisasiNamaChatMMS(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("id-ID")
        .split(" ")
        .filter(Boolean)
        .map((kata) => kata.charAt(0).toLocaleUpperCase("id-ID") + kata.slice(1))
        .join(" ");
}

async function requestChatMMS(action, payload = {}, method = "POST") {
    const options = { method };
    let url = `${URL_ENGINE_CHAT_MMS}?action=${encodeURIComponent(action)}`;

    if (method === "GET") {
        const params = new URLSearchParams({ action, ...payload });
        url = `${URL_ENGINE_CHAT_MMS}?${params.toString()}`;
    } else {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({ action, ...payload });
    }

    const response = await fetch(url, options);
    const result = await response.json();
    if (!result.ok) throw new Error(result.message || "Permintaan chat gagal.");
    
    // Return full result object, not just data, to get is_member flag
    return result; 
}

function setNamaChatMMS(displayName, isMember = false) {
    const labelNama = document.getElementById("chat-current-name");
    if (labelNama) {
        if (!displayName) {
            labelNama.innerHTML = "Nama belum disetel";
        } else {
            const memberBadge = isMember 
                ? ' <span class="chat-member-badge" style="background:#4CAF50;color:white;padding:2px 8px;border-radius:10px;font-size:10px;margin-left:6px;">✓ Anggota</span>' 
                : '';
            labelNama.innerHTML = `Sebagai: <strong>${escapeHtmlMMS(displayName)}</strong>${memberBadge}`;
        }
    }
    if (displayName) {
        localStorage.setItem(MMS_CHAT_NAME_KEY, displayName);
        localStorage.setItem(MMS_CHAT_NAME_KEY + "_is_member", isMember ? "1" : "0");
    }
}

function tampilkanFormNamaChatMMS() {
    const modal = document.getElementById("chat-name-modal");
    const title = document.getElementById("chat-name-title");
    const input = document.getElementById("chat-name-form-input");
    const error = document.getElementById("chat-name-error");

    if (title) title.textContent = "Masukkan Nama Lengkap Anda";
    if (input) {
        input.value = "";
        input.placeholder = "Nama lengkap (sesuai data anggota)...";
    }
    if (error) error.textContent = "";
    if (modal) modal.style.display = "flex";

    setTimeout(() => input?.focus(), 50);
}

function sembunyikanFormNamaChatMMS() {
    const modal = document.getElementById("chat-name-modal");
    if (modal) modal.style.display = "none";
}

async function pastikanUserChatMMS() {
    const deviceId = ambilDeviceIdChatMMS();
    let displayName = localStorage.getItem(MMS_CHAT_NAME_KEY) || "";

    if (!displayName) {
        tampilkanFormNamaChatMMS();
        return null;
    }

    displayName = normalisasiNamaChatMMS(displayName).slice(0, 120);
    if (!displayName) return null;

    const result = await requestChatMMS("register", { device_id: deviceId, display_name: displayName });
    const user = result.data;
    setNamaChatMMS(user.display_name, result.is_member);
    return user;
}

window.toggleKotakChatMMS = async function() {
    const kotakChat = document.getElementById("mms-chat-box"); if (!kotakChat) return;
    if (kotakChat.style.display === "none" || kotakChat.style.display === "") {
        kotakChat.style.display = "flex";
        try {
            const user = await pastikanUserChatMMS();
            if (!user) return;
            await ambilRiwayatChatMMS(true);
            clearInterval(loopPenyegarObrolan);
            loopPenyegarObrolan = setInterval(() => ambilRiwayatChatMMS(false), 7000);
        } catch (error) {
            alert(error.message || "Gagal membuka chat.");
        }
    } else {
        kotakChat.style.display = "none";
        clearInterval(loopPenyegarObrolan);
    }
};

async function ambilRiwayatChatMMS(forceScroll = false) {
    const wadahTubuhChat = document.getElementById("chat-box-body"); if (!wadahTubuhChat) return;
    try {
        const result = await requestChatMMS("list", { limit: 80 }, "GET");
        const arrayChat = Array.isArray(result.data) ? result.data : [];
        if (arrayChat.length === 0) {
            wadahTubuhChat.innerHTML = `<div style="text-align:center; color:#7f8c8d; font-size:12px; margin-top:60px;">Belum ada obrolan hari ini.</div>`;
            idPesanTerakhirChatMMS = null;
            return;
        }

        const pesanTerakhir = arrayChat[arrayChat.length - 1]?.id ?? null;
        if (!forceScroll && pesanTerakhir === idPesanTerakhirChatMMS) return;

        const deviceIdLokal = ambilDeviceIdChatMMS();
        const posisiScrollSudahDiBawah = wadahTubuhChat.scrollHeight - wadahTubuhChat.clientHeight <= wadahTubuhChat.scrollTop + 70;
        wadahTubuhChat.innerHTML = arrayChat.map(item => {
            const milikSaya = item.device_id === deviceIdLokal;
            const nama = milikSaya ? "Saya" : escapeHtmlMMS(item.display_name);
            const isMember = item.is_member ? '<span class="chat-badge" style="background:#4CAF50;color:white;padding:2px 8px;border-radius:10px;font-size:10px;vertical-align:middle;margin-left:6px;">Anggota</span>' : '';
            return `<div class="chat-bubble ${milikSaya ? "is-own" : "is-other"}">
                <span class="chat-sender-name">${nama}${isMember}</span>
                <span class="chat-text">${escapeHtmlMMS(item.message)}</span>
                <span class="chat-timestamp">${escapeHtmlMMS(item.time_label || "")}</span>
            </div>`;
        }).join("");
        idPesanTerakhirChatMMS = pesanTerakhir;
        if (forceScroll || posisiScrollSudahDiBawah) wadahTubuhChat.scrollTop = wadahTubuhChat.scrollHeight;
    } catch (err) {}
}

window.kirimPesanChatMMS = async function() {
    const inputPesan = document.getElementById("chat-input-pesan");
    if (!inputPesan) return;

    const stringPesan = inputPesan.value.trim();
    if (!stringPesan) return;
    if (stringPesan.length > 1000) { alert("Pesan maksimal 1000 karakter."); return; }

    inputPesan.value = "Mengirim...";
    inputPesan.disabled = true;
    try {
        const user = await pastikanUserChatMMS();
        if (!user) {
            inputPesan.value = stringPesan;
            return;
        }
        await requestChatMMS("send", { device_id: ambilDeviceIdChatMMS(), message: stringPesan });
        inputPesan.value = "";
        await ambilRiwayatChatMMS(true);
        inputPesan.focus();
    } catch (error) {
        alert(error.message || "Koneksi gagal!");
        inputPesan.value = stringPesan;
    } finally {
        inputPesan.disabled = false;
    }
};

window.simpanNamaChatMMS = async function(event) {
    event?.preventDefault();

    const input = document.getElementById("chat-name-form-input");
    const error = document.getElementById("chat-name-error");
    const button = document.getElementById("chat-name-save-btn");
    const displayName = normalisasiNamaChatMMS(input?.value || "").slice(0, 120);
    const namaSebelumnya = localStorage.getItem(MMS_CHAT_NAME_KEY) || "";

    if (error) error.textContent = "";
    if (input && input.value !== displayName) {
        input.value = displayName;
    }

    if (!displayName) {
        if (error) error.textContent = "Nama wajib diisi.";
        input?.focus();
        return;
    }

    // Validasi nama harus minimal 2 kata (nama lengkap)
    const kataArray = displayName.split(/\s+/).filter(k => k.length > 0);
    if (kataArray.length < 2) {
        if (error) {
            error.style.color = "#f57c00";
            error.textContent = "⚠️ Mohon gunakan nama lengkap (minimal 2 kata) sesuai data anggota.";
        }
        input?.focus();
        return;
    }

    try {
        if (button) button.disabled = true;
        const deviceId = ambilDeviceIdChatMMS();
        localStorage.setItem(MMS_CHAT_DEVICE_KEY, deviceId);
        localStorage.setItem(MMS_CHAT_NAME_KEY, displayName);

        const result = await requestChatMMS("register", { device_id: deviceId, display_name: displayName });
        const user = result.data;
        const isMember = result.is_member;

        // Tampilkan feedback status keanggotaan
        if (isMember) {
            setNamaChatMMS(user.display_name, true); // Tandai sebagai anggota
            // Tampilkan notifikasi singkat bahwa user adalah anggota
            const errorEl = document.getElementById("chat-name-error");
            if (errorEl) {
                errorEl.style.color = "#2e7d32";
                errorEl.innerHTML = `✓ <strong>Anggota terverifikasi!</strong><br>Selamat datang <strong>${escapeHtmlMMS(user.display_name)}</strong>.`;
            }
            // Tunggu sebentar agar user melihat feedback
            await new Promise(resolve => setTimeout(resolve, 1200));
        } else {
            setNamaChatMMS(user.display_name, false); // Bukan anggota
            // Tampilkan peringatan bahwa nama tidak terdaftar
            const errorEl = document.getElementById("chat-name-error");
            if (errorEl) {
                errorEl.style.color = "#f57c00";
                errorEl.innerHTML = "⚠️ Nama tidak ditemukan dalam data anggota. Anda akan bergabung sebagai <strong>tamu</strong>.";
            }
            // Tunggu sebentar agar user melihat peringatan
            await new Promise(resolve => setTimeout(resolve, 1800));
        }
        
        sembunyikanFormNamaChatMMS();
        await ambilRiwayatChatMMS(true);
        clearInterval(loopPenyegarObrolan);
        loopPenyegarObrolan = setInterval(() => ambilRiwayatChatMMS(false), 7000);
        document.getElementById("chat-input-pesan")?.focus();
    } catch (err) {
        if (namaSebelumnya) localStorage.setItem(MMS_CHAT_NAME_KEY, namaSebelumnya);
        else localStorage.removeItem(MMS_CHAT_NAME_KEY);

        const errorEl = document.getElementById("chat-name-error");
        if (errorEl) {
            errorEl.style.color = "#c62828";
            errorEl.textContent = err.message || "Gagal menyimpan nama.";
        }
    } finally {
        if (button) button.disabled = false;
    }
};

window.deteksiEnterChatMMS = function(event) { if (event.key === "Enter") window.kirimPesanChatMMS(); };

window.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("mms-chat-box")) {
        const savedName = localStorage.getItem(MMS_CHAT_NAME_KEY) || "";
        const savedIsMember = localStorage.getItem(MMS_CHAT_NAME_KEY + "_is_member") === "1";
        setNamaChatMMS(savedName, savedIsMember);
    }
});

/* ==========================================================================
   12. FUNGSI GLOBAL PEMBANTU: ENCODER EMBED GOOGLE DRIVE
   ========================================================================== */
function konversiUrlDriveUntukEmbed(urlLama) {
    if (urlLama && urlLama.includes('drive.google.com')) {
        let idFile = '';
        if (urlLama.includes('/d/')) idFile = urlLama.split('/d/')[1].split('/')[0];
        else if (urlLama.includes('id=')) idFile = urlLama.split('id=')[1].split('&')[0];
        if (idFile) return `https://drive.google.com/file/d/${idFile}/preview`;
    }
    return urlLama; 
}

/* ==========================================================================
   13. MODUL KHUSUS: ARSIP DATA LOMBA (DATABASE HOSTING)
   ========================================================================== */
let semuaDataLomba = [], dataLombaTersaring = []; const BARIS_LOMBA_PER_HALAMAN = 5; let halamanLombaSaatIni = 1; 

function ambilDataGoogleSheets() {
    archiveFetchCommon('lomba').then(result => {
        semuaDataLomba = result.data || [];
        dataLombaTersaring = [...semuaDataLomba];
        archiveFillYearSelect('filter-lomba-tahun', result.years || []);
        halamanLombaSaatIni = 1;
        terapkanFilterLomba();
    }).catch(error => archiveShowLoadError('data-tabel-lomba', error.message));
}

function terapkanFilterLomba() {
    const filterTahun = document.getElementById('filter-lomba-tahun')?.value || 'Semua';
    const cariKata = document.getElementById('input-cari-lomba')?.value || '';
    dataLombaTersaring = archiveFilterRows(semuaDataLomba, filterTahun, cariKata);
    halamanLombaSaatIni = 1;
    tampilkanDataLombaKeTabel();
}

function tampilkanDataLombaKeTabel() {
    archiveRenderRows({
        tbodyId: 'data-tabel-lomba',
        data: () => dataLombaTersaring,
        page: () => halamanLombaSaatIni,
        pageInfo: itungHalamanLomba,
        navFn: 'window.navLombaManual',
        viewerFn: 'window.bukaLombaViewer',
        emptyText: 'Data lomba tidak ditemukan.',
        badgeText: item => item.kategori || 'Umum',
        badgeColor: item => (item.kategori || '').toLowerCase().includes('anak') ? '#388E3C' : ((item.kategori || '').toLowerCase().includes('remaja') ? '#F57C00' : '#0288D1')
    });
}

function itungHalamanLomba(totalHal) {
    const infoHal = document.getElementById('info-halaman-tabel'); // Target ID HTML Arsip Lomba
    if (infoHal) { infoHal.textContent = `Halaman ${totalHal === 0 ? 0 : halamanLombaSaatIni} dari ${totalHal}`; }
}
window.navLombaManual = (dir) => { halamanLombaSaatIni += dir; tampilkanDataLombaKeTabel(); };

window.bukaLombaViewer = (url) => {
    const viewerSection = document.getElementById('pdf-viewer-section'); const iframe = document.getElementById('pdf-iframe'); const btnUnduh = document.getElementById('btn-unduh-pdf');
    if(viewerSection && iframe) {
        let embedUrl = url; if(url.includes('file/d/')) { embedUrl = url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview').replace('/view?usp=drive_link', '/preview'); }
        iframe.src = embedUrl; if(btnUnduh) btnUnduh.href = url; viewerSection.style.display = 'block'; viewerSection.scrollIntoView({ behavior: 'smooth' });
    }
};
window.tutupPdfViewer = () => { const viewerSection = document.getElementById('pdf-viewer-section'); const iframe = document.getElementById('pdf-iframe'); if(viewerSection && iframe) { iframe.src = ''; viewerSection.style.display = 'none'; } };


/* ==========================================================================
   14. MODUL KHUSUS: ARSIP DATA PROPOSAL (DATABASE HOSTING)
   ========================================================================== */
let semuaDataProposal = [], dataProposalTersaring = []; const BARIS_PROPOSAL_PER_HALAMAN = 5; let halamanProposalSaatIni = 1; 

function ambilDataProposalGoogleSheets() {
    archiveFetchCommon('proposal').then(result => {
        semuaDataProposal = result.data || [];
        dataProposalTersaring = [...semuaDataProposal];
        archiveFillYearSelect('filter-proposal-tahun', result.years || []);
        halamanProposalSaatIni = 1;
        terapkanFilterProposal();
    }).catch(error => archiveShowLoadError('data-tabel-proposal', error.message));
}

function terapkanFilterProposal() {
    const filterTahun = document.getElementById('filter-proposal-tahun')?.value || 'Semua';
    const cariKata = document.getElementById('input-cari-proposal')?.value || '';
    dataProposalTersaring = archiveFilterRows(semuaDataProposal, filterTahun, cariKata);
    halamanProposalSaatIni = 1;
    tampilkanDataProposalKeTabel();
}

function tampilkanDataProposalKeTabel() {
    archiveRenderRows({
        tbodyId: 'data-tabel-proposal',
        data: () => dataProposalTersaring,
        page: () => halamanProposalSaatIni,
        pageInfo: itungHalamanProposal,
        navFn: 'window.navProposalManual',
        viewerFn: 'window.bukaProposalViewer',
        emptyText: 'Data proposal tidak ditemukan.',
        badgeText: item => item.kategori || 'Umum',
        badgeColor: item => (item.kategori || '').toLowerCase().includes('bantuan') ? '#388E3C' : '#F57C00'
    });
}

function itungHalamanProposal(totalHal) {
    const infoHal = document.getElementById('info-halaman-proposal');
    if (infoHal) { infoHal.textContent = `Halaman ${totalHal === 0 ? 0 : halamanProposalSaatIni} dari ${totalHal}`; }
}
window.navProposalManual = (dir) => { halamanProposalSaatIni += dir; tampilkanDataProposalKeTabel(); };

window.bukaProposalViewer = (url) => {
    const viewerSection = document.getElementById('proposal-viewer-section'); const iframe = document.getElementById('proposal-iframe'); const btnUnduh = document.getElementById('btn-unduh-proposal');
    if(viewerSection && iframe) {
        let embedUrl = url; if(url.includes('file/d/')) { embedUrl = url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview').replace('/view?usp=drive_link', '/preview'); }
        iframe.src = embedUrl; if(btnUnduh) btnUnduh.href = url; viewerSection.style.display = 'block'; viewerSection.scrollIntoView({ behavior: 'smooth' });
    }
};
window.tutupProposalViewer = () => { const viewerSection = document.getElementById('proposal-viewer-section'); const iframe = document.getElementById('proposal-iframe'); if(viewerSection && iframe) { iframe.src = ''; viewerSection.style.display = 'none'; } };


/* ==========================================================================
   15. MODUL KHUSUS: ARSIP DATA SURAT (DATABASE HOSTING)
   ========================================================================== */
let semuaDataSurat = [], dataSuratTersaring = []; const BARIS_SURAT_PER_HALAMAN = 5; let halamanSuratSaatIni = 1; 

function ambilDataSuratGoogleSheets() {
    archiveFetchCommon('surat').then(result => {
        semuaDataSurat = result.data || [];
        dataSuratTersaring = [...semuaDataSurat];
        archiveFillYearSelect('filter-surat-tahun', result.years || []);
        halamanSuratSaatIni = 1;
        terapkanFilterSurat();
    }).catch(error => archiveShowLoadError('data-tabel-surat', error.message));
}

function terapkanFilterSurat() {
    const filterTahun = document.getElementById('filter-surat-tahun')?.value || 'Semua';
    const cariKata = document.getElementById('input-cari-surat')?.value || '';
    dataSuratTersaring = archiveFilterRows(semuaDataSurat, filterTahun, cariKata);
    halamanSuratSaatIni = 1;
    tampilkanDataSuratKeTabel();
}

function tampilkanDataSuratKeTabel() {
    archiveRenderRows({
        tbodyId: 'data-tabel-surat',
        data: () => dataSuratTersaring,
        page: () => halamanSuratSaatIni,
        pageInfo: itungHalamanSurat,
        navFn: 'window.navSuratManual',
        viewerFn: 'window.bukaSuratViewer',
        emptyText: 'Data surat tidak ditemukan.',
        badgeText: item => item.kategori || 'Umum',
        badgeColor: item => ((item.kategori || '').toLowerCase().includes('masuk') || (item.kategori || '').toLowerCase().includes('in')) ? '#388E3C' : '#D32F2F'
    });
}

function itungHalamanSurat(totalHal) {
    const infoHal = document.getElementById('info-halaman-surat');
    if (infoHal) { infoHal.textContent = `Halaman ${totalHal === 0 ? 0 : halamanSuratSaatIni} dari ${totalHal}`; }
}
window.navSuratManual = (dir) => { halamanSuratSaatIni += dir; tampilkanDataSuratKeTabel(); };

window.bukaSuratViewer = (url) => {
    const viewerSection = document.getElementById('surat-viewer-section'); const iframe = document.getElementById('surat-iframe'); const btnUnduh = document.getElementById('btn-unduh-surat');
    if(viewerSection && iframe) {
        let embedUrl = url; if(url.includes('file/d/')) { embedUrl = url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview').replace('/view?usp=drive_link', '/preview'); }
        iframe.src = embedUrl; if(btnUnduh) btnUnduh.href = url; viewerSection.style.display = 'block'; viewerSection.scrollIntoView({ behavior: 'smooth' });
    }
};
window.tutupSuratViewer = () => { const viewerSection = document.getElementById('surat-viewer-section'); const iframe = document.getElementById('surat-iframe'); if(viewerSection && iframe) { iframe.src = ''; viewerSection.style.display = 'none'; } };


/* ==========================================================================
   INISIALISASI AUTOMATIS SAAT HALAMAN DI-LOAD
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    if(document.getElementById('data-tabel-lomba')) ambilDataGoogleSheets();
    if(document.getElementById('data-tabel-proposal')) ambilDataProposalGoogleSheets();
    if(document.getElementById('data-tabel-surat')) ambilDataSuratGoogleSheets();
});

/* ==========================================================================
   16. MODUL KHUSUS: ARSIP DATA LPJ REAL-TIME (DUPLIKASI PERSIS KAS KEUANGAN)
   ========================================================================== */
// Gunakan Spreadsheet ID asli dari berkas Google Sheets Anda (bukan link pub)
const SPREADSHEET_ID_LPJ = '1rYD76yBGXEj99jxRVh-ZmlKrOGIO4-Zqf4aIw1PPHuA'; 
const SHEET_NAME_LPJ = 'Form Responses 1'; 
let semuaDataLpj = [], dataLpjTersaring = []; const BARIS_LPJ_PER_HALAMAN = 5; let halamanLpjSaatIni = 1; 

function ambilDataLpjGoogleSheets() {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID_LPJ}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME_LPJ)}`;
    fetch(url).then(res => res.text()).then(data => {
        const jsonPembersih = JSON.parse(data.substr(47).slice(0, -2)), barisData = jsonPembersih.table.rows;
        semuaDataLpj = []; const setTahun = new Set();
        
        for (let i = 0; i < barisData.length; i++) {
            const baris = barisData[i];
            // Memeriksa kolom B (indeks 1) untuk Tanggal dan kolom C (indeks 2) untuk Keterangan
            if (baris && baris.c && baris.c[1] && baris.c[2]) {
                const tgl = String(baris.c[1].f || baris.c[1].v).trim();
                
                // Lewati baris header jika terbaca sebagai string "Tanggal"
                if (tgl.toLowerCase() === 'tanggal') continue;
                
                let thn = tgl.split('/')[2] || 'Umum';
                
                semuaDataLpj.push({ 
                    tanggal: tgl, 
                    tahun: thn, 
                    nama: String(baris.c[2].v), // Kolom C: Keterangan
                    kategori: baris.c[3] ? String(baris.c[3].v) : 'Umum', // Kolom D: Ketua Pelaksana (Sebagai Kategori)
                    urlDrive: baris.c[4] ? String(baris.c[4].v) : '' // Kolom E: Link File (PDF)
                });
                if (thn !== 'Umum' && !isNaN(thn)) setTahun.add(thn);
            }
        }
        semuaDataLpj.reverse(); dataLpjTersaring = [...semuaDataLpj];
        const sel = document.getElementById('filter-lpj-tahun');
        if (sel) { sel.innerHTML = '<option value="Semua">Semua Tahun</option>'; Array.from(setTahun).sort().reverse().forEach(th => { let opt = document.createElement('option'); opt.value = th; opt.textContent = th; sel.appendChild(opt); }); }
        halamanLpjSaatIni = 1; tampilkanDataLpjKeTabel();
    }).catch(() => {
        const tbody = document.getElementById('data-tabel-lpj');
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#D32F2F;">Gagal memuat data LPJ. Periksa kembali ID Spreadsheet Anda.</td></tr>`;
    });
}

function tampilkanDataLpjKeTabel() {
    const tbody = document.getElementById('data-tabel-lpj'); if (!tbody) return;
    if (dataLpjTersaring.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">Data dokumen LPJ tidak ditemukan.</td></tr>`; itungHalamanLpj(0); return; }
    
    const start = (halamanLpjSaatIni - 1) * BARIS_LPJ_PER_HALAMAN;
    const pageData = dataLpjTersaring.slice(start, start + BARIS_LPJ_PER_HALAMAN);

    let html = pageData.map(i => {
        // Otomatisasi warna badge berdasarkan nama Ketua Pelaksana atau teks isi kategori
        let warnaBadge = '#0288D1'; 
        let btn = i.urlDrive ? `<button class="btn-cetak-mutasi" onclick="window.bukaLpjViewer('${i.urlDrive}')" style="height: 34px; padding: 0 12px; font-size: 12px;"><i class="fa-solid fa-eye"></i> Lihat PDF</button>` : `<i>Tidak tersedia</i>`;
        return `<tr><td>${i.tanggal}</td><td><strong>${i.nama}</strong></td><td><span style="background-color:${warnaBadge}; color:white; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:bold;">${i.kategori}</span></td><td style="text-align:center;">${btn}</td></tr>`;
    }).join('');

    const totalHal = Math.ceil(dataLpjTersaring.length / BARIS_LPJ_PER_HALAMAN);
    itungHalamanLpj(totalHal);

    if (totalHal > 1) {
        let tombolNav = ""; const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;";
        if (halamanLpjSaatIni === 1) tombolNav = `<div style="text-align:right;"><button onclick="window.navLpjManual(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        else if (halamanLpjSaatIni === totalHal) tombolNav = `<div style="text-align:left;"><button onclick="window.navLpjManual(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        else tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="window.navLpjManual(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="window.navLpjManual(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9; border-top:1px solid #eee;">${tombolNav}</td></tr>`;
    }
    tbody.innerHTML = html;
}

function itungHalamanLpj(totalHal) {
    const infoHal = document.getElementById('info-halaman-lpj');
    if (infoHal) { infoHal.textContent = `Halaman ${totalHal === 0 ? 0 : halamanLpjSaatIni} dari ${totalHal}`; }
}

window.navLpjManual = (dir) => { halamanLpjSaatIni += dir; tampilkanDataLpjKeTabel(); };

/* ==========================================================================
   FUNGSI KONTROL FILTER & VIEWER LPJ
   ========================================================================== */
function terapkanFilterLpj() {
    const filterTahun = document.getElementById('filter-lpj-tahun') ? document.getElementById('filter-lpj-tahun').value : 'Semua';
    const cariKata = document.getElementById('input-cari-lpj') ? document.getElementById('input-cari-lpj').value.toLowerCase() : '';

    dataLpjTersaring = semuaDataLpj.filter(i => {
        const cocokTahun = (filterTahun === 'Semua' || i.tahun === filterTahun);
        const cocokKata = (i.nama.toLowerCase().includes(cariKata) || i.kategori.toLowerCase().includes(cariKata));
        return cocokTahun && cocokKata;
    });

    halamanLpjSaatIni = 1;
    tampilkanDataLpjKeTabel();
}

window.bukaLpjViewer = (url) => {
    const viewerSection = document.getElementById('lpj-viewer-section');
    const iframe = document.getElementById('lpj-iframe');
    const btnUnduh = document.getElementById('btn-unduh-lpj');
    if(viewerSection && iframe) {
        let embedUrl = url;
        if(url.includes('file/d/')) {
            embedUrl = url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview').replace('/view?usp=drive_link', '/preview');
        }
        iframe.src = embedUrl;
        if(btnUnduh) btnUnduh.href = url;
        viewerSection.style.display = 'block';
        viewerSection.scrollIntoView({ behavior: 'smooth' });
    }
};

window.tutupLpjViewer = () => {
    const viewerSection = document.getElementById('lpj-viewer-section');
    const iframe = document.getElementById('lpj-iframe');
    if(viewerSection && iframe) { iframe.src = ''; viewerSection.style.display = 'none'; }
};

// Jalankan saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
    if(document.getElementById('data-tabel-lpj')) {
        ambilDataLpjGoogleSheets();
    }
});

/* ==========================================================================
   17. MODUL ARSIP DB COMMON: LOCAL FILE PRIORITY + FALLBACK LINK LAMA
   ========================================================================== */
function getArchiveApiBase() {
    return COMMON_API_BASE;
}

function archiveResolvePublicUrl(url) {
    const value = String(url || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    return value.replace(/^\/+/, '');
}

function archiveEscapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function archiveFillYearSelect(selectId, years) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="Semua">Semua Tahun</option>';
    (years || []).forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });
}

async function archiveFetchCommon(type) {
    const response = await fetch(`${getArchiveApiBase()}/archives_list.php?type=${encodeURIComponent(type)}&cache=${Date.now()}`);
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memuat data arsip.');
    }
    return result;
}

function archiveShowLoadError(tbodyId, message) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#D32F2F;">${archiveEscapeHtml(message)}</td></tr>`;
}

function archiveFilterRows(rows, filterTahun, cariKata) {
    const keyword = String(cariKata || '').toLowerCase();
    return rows.filter(item => {
        const cocokTahun = filterTahun === 'Semua' || item.tahun === filterTahun;
        const teks = `${item.nama || ''} ${item.kategori || ''} ${item.person_name || ''}`.toLowerCase();
        return cocokTahun && teks.includes(keyword);
    });
}

function archiveRenderRows(config) {
    const tbody = document.getElementById(config.tbodyId);
    if (!tbody) return;
    const data = config.data();
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#666;">${config.emptyText}</td></tr>`;
        config.pageInfo(0);
        return;
    }

    const start = (config.page() - 1) * 5;
    const pageData = data.slice(start, start + 5);
    let html = pageData.map(item => {
        const badgeText = config.badgeText(item);
        const warnaBadge = config.badgeColor(item);
        const fileUrl = archiveResolvePublicUrl(item.file_url || item.urlDrive);
        const button = fileUrl
            ? `<button class="btn-cetak-mutasi" data-url="${archiveEscapeHtml(fileUrl)}" onclick="${config.viewerFn}(this.dataset.url)" style="height: 34px; padding: 0 12px; font-size: 12px;"><i class="fa-solid fa-eye"></i> Lihat PDF</button>`
            : `<i>Tidak tersedia</i>`;

        return `<tr><td>${archiveEscapeHtml(item.tanggal)}</td><td><strong>${archiveEscapeHtml(item.nama)}</strong></td><td><span style="background-color:${warnaBadge}; color:white; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:bold;">${archiveEscapeHtml(badgeText || '-')}</span></td><td style="text-align:center;">${button}</td></tr>`;
    }).join('');

    const totalHal = Math.ceil(data.length / 5);
    config.pageInfo(totalHal);

    if (totalHal > 1) {
        const styleBtn = "padding:8px 16px; background:#E53935; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;";
        let tombolNav = "";
        if (config.page() === 1) tombolNav = `<div style="text-align:right;"><button onclick="${config.navFn}(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        else if (config.page() === totalHal) tombolNav = `<div style="text-align:left;"><button onclick="${config.navFn}(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button></div>`;
        else tombolNav = `<div style="display:flex; justify-content:space-between;"><button onclick="${config.navFn}(-1)" style="${styleBtn}"><i class="fa-solid fa-chevron-left"></i> Halaman Sebelumnya</button><button onclick="${config.navFn}(1)" style="${styleBtn}">Halaman Selanjutnya <i class="fa-solid fa-chevron-right"></i></button></div>`;
        html += `<tr><td colspan="4" style="padding:15px; background:#f9f9f9; border-top:1px solid #eee;">${tombolNav}</td></tr>`;
    }

    tbody.innerHTML = html;
}

function archiveOpenViewer(url, sectionId, iframeId, downloadId) {
    const viewerSection = document.getElementById(sectionId);
    const iframe = document.getElementById(iframeId);
    const btnUnduh = document.getElementById(downloadId);
    if (!viewerSection || !iframe) return;

    const resolvedUrl = archiveResolvePublicUrl(url);
    let embedUrl = resolvedUrl;
    if (/drive\.google\.com/i.test(resolvedUrl)) {
        embedUrl = konversiUrlDriveUntukEmbed(resolvedUrl);
    } else if (/docs\.google\.com\/(document|spreadsheets|presentation)\//i.test(resolvedUrl)) {
        embedUrl = resolvedUrl.replace(/\/edit(\?.*)?$/i, '/preview');
    }

    iframe.src = embedUrl;
    if (btnUnduh) btnUnduh.href = resolvedUrl;
    viewerSection.style.display = 'block';
    viewerSection.scrollIntoView({ behavior: 'smooth' });
}

function ambilDataGoogleSheets() {
    archiveFetchCommon('lomba').then(result => {
        semuaDataLomba = result.data || [];
        dataLombaTersaring = [...semuaDataLomba];
        archiveFillYearSelect('filter-lomba-tahun', result.years || []);
        halamanLombaSaatIni = 1;
        terapkanFilterLomba();
    }).catch(error => archiveShowLoadError('data-tabel-lomba', error.message));
}

function terapkanFilterLomba() {
    const filterTahun = document.getElementById('filter-lomba-tahun')?.value || 'Semua';
    const cariKata = document.getElementById('input-cari-lomba')?.value || '';
    dataLombaTersaring = archiveFilterRows(semuaDataLomba, filterTahun, cariKata);
    halamanLombaSaatIni = 1;
    tampilkanDataLombaKeTabel();
}

function tampilkanDataLombaKeTabel() {
    archiveRenderRows({
        tbodyId: 'data-tabel-lomba',
        data: () => dataLombaTersaring,
        page: () => halamanLombaSaatIni,
        pageInfo: itungHalamanLomba,
        navFn: 'window.navLombaManual',
        viewerFn: 'window.bukaLombaViewer',
        emptyText: 'Data lomba tidak ditemukan.',
        badgeText: item => item.kategori || 'Umum',
        badgeColor: item => (item.kategori || '').toLowerCase().includes('anak') ? '#388E3C' : ((item.kategori || '').toLowerCase().includes('remaja') ? '#F57C00' : '#0288D1')
    });
}

window.navLombaManual = (dir) => {
    halamanLombaSaatIni += dir;
    tampilkanDataLombaKeTabel();
};

window.bukaLombaViewer = (url) => archiveOpenViewer(url, 'pdf-viewer-section', 'pdf-iframe', 'btn-unduh-pdf');

function ambilDataProposalGoogleSheets() {
    archiveFetchCommon('proposal').then(result => {
        semuaDataProposal = result.data || [];
        dataProposalTersaring = [...semuaDataProposal];
        archiveFillYearSelect('filter-proposal-tahun', result.years || []);
        halamanProposalSaatIni = 1;
        terapkanFilterProposal();
    }).catch(error => archiveShowLoadError('data-tabel-proposal', error.message));
}

function terapkanFilterProposal() {
    const filterTahun = document.getElementById('filter-proposal-tahun')?.value || 'Semua';
    const cariKata = document.getElementById('input-cari-proposal')?.value || '';
    dataProposalTersaring = archiveFilterRows(semuaDataProposal, filterTahun, cariKata);
    halamanProposalSaatIni = 1;
    tampilkanDataProposalKeTabel();
}

function tampilkanDataProposalKeTabel() {
    archiveRenderRows({
        tbodyId: 'data-tabel-proposal',
        data: () => dataProposalTersaring,
        page: () => halamanProposalSaatIni,
        pageInfo: itungHalamanProposal,
        navFn: 'window.navProposalManual',
        viewerFn: 'window.bukaProposalViewer',
        emptyText: 'Data proposal tidak ditemukan.',
        badgeText: item => item.kategori || 'Umum',
        badgeColor: item => (item.kategori || '').toLowerCase().includes('bantuan') ? '#388E3C' : '#F57C00'
    });
}

window.navProposalManual = (dir) => {
    halamanProposalSaatIni += dir;
    tampilkanDataProposalKeTabel();
};

window.bukaProposalViewer = (url) => archiveOpenViewer(url, 'proposal-viewer-section', 'proposal-iframe', 'btn-unduh-proposal');

function ambilDataSuratGoogleSheets() {
    archiveFetchCommon('surat').then(result => {
        semuaDataSurat = result.data || [];
        dataSuratTersaring = [...semuaDataSurat];
        archiveFillYearSelect('filter-surat-tahun', result.years || []);
        halamanSuratSaatIni = 1;
        terapkanFilterSurat();
    }).catch(error => archiveShowLoadError('data-tabel-surat', error.message));
}

function terapkanFilterSurat() {
    const filterTahun = document.getElementById('filter-surat-tahun')?.value || 'Semua';
    const cariKata = document.getElementById('input-cari-surat')?.value || '';
    dataSuratTersaring = archiveFilterRows(semuaDataSurat, filterTahun, cariKata);
    halamanSuratSaatIni = 1;
    tampilkanDataSuratKeTabel();
}

function tampilkanDataSuratKeTabel() {
    archiveRenderRows({
        tbodyId: 'data-tabel-surat',
        data: () => dataSuratTersaring,
        page: () => halamanSuratSaatIni,
        pageInfo: itungHalamanSurat,
        navFn: 'window.navSuratManual',
        viewerFn: 'window.bukaSuratViewer',
        emptyText: 'Data surat tidak ditemukan.',
        badgeText: item => item.kategori || 'Umum',
        badgeColor: item => ((item.kategori || '').toLowerCase().includes('masuk') || (item.kategori || '').toLowerCase().includes('in')) ? '#388E3C' : '#D32F2F'
    });
}

window.navSuratManual = (dir) => {
    halamanSuratSaatIni += dir;
    tampilkanDataSuratKeTabel();
};

window.bukaSuratViewer = (url) => archiveOpenViewer(url, 'surat-viewer-section', 'surat-iframe', 'btn-unduh-surat');

function ambilDataLpj() {
    ambilDataLpjGoogleSheets();
}

function ambilDataLpjGoogleSheets() {
    archiveFetchCommon('lpj').then(result => {
        semuaDataLpj = result.data || [];
        dataLpjTersaring = [...semuaDataLpj];
        archiveFillYearSelect('filter-lpj-tahun', result.years || []);
        halamanLpjSaatIni = 1;
        terapkanFilterLpj();
    }).catch(error => archiveShowLoadError('data-tabel-lpj', error.message));
}

function terapkanFilterLpj() {
    const filterTahun = document.getElementById('filter-lpj-tahun')?.value || 'Semua';
    const cariKata = document.getElementById('input-cari-lpj')?.value || '';
    dataLpjTersaring = archiveFilterRows(semuaDataLpj, filterTahun, cariKata);
    halamanLpjSaatIni = 1;
    tampilkanDataLpjKeTabel();
}

function tampilkanDataLpjKeTabel() {
    archiveRenderRows({
        tbodyId: 'data-tabel-lpj',
        data: () => dataLpjTersaring,
        page: () => halamanLpjSaatIni,
        pageInfo: itungHalamanLpj,
        navFn: 'window.navLpjManual',
        viewerFn: 'window.bukaLpjViewer',
        emptyText: 'Data dokumen LPJ tidak ditemukan.',
        badgeText: item => item.person_name || item.kategori || 'Umum',
        badgeColor: () => '#0288D1'
    });
}

window.navLpjManual = (dir) => {
    halamanLpjSaatIni += dir;
    tampilkanDataLpjKeTabel();
};

window.bukaLpjViewer = (url) => archiveOpenViewer(url, 'lpj-viewer-section', 'lpj-iframe', 'btn-unduh-lpj');
