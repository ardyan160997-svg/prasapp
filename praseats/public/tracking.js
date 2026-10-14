(()=>{
  const form=document.getElementById('track-form'),input=form.querySelector('[name="query"]'),box=document.getElementById('track-result'),member=JSON.parse(localStorage.getItem('praseats_member')||'null'),token=memberToken();
  const labels={baru:'Pesanan diterima',diterima:'Pesanan dikonfirmasi',dimasak:'Sedang dimasak',siap:'Siap diambil/diantar',diantar:'Sedang diantar',selesai:'Pesanan selesai',batal:'Pesanan dibatalkan'};
  const esc=value=>String(value||'').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char]));
  const date=value=>new Intl.DateTimeFormat('id-ID',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
  function render(orders){
    if(!orders.length){box.innerHTML='<div class="tracking-empty"><span aria-hidden="true">🍽️</span><h2>Belum ada pesanan aktif nih</h2><p>Silakan pilih menu yang kamu suka dan pesan.</p><a href="menu.html">Pilih Menu</a></div>';return}
    box.innerHTML=`<div class="member-tracking-list">${orders.map(order=>`<article class="member-tracking-card"><div class="member-tracking-head"><div><small>${esc(order.order_code)}</small><b>${labels[order.status]||esc(order.status)}</b></div><span class="tracking-status status-${esc(order.status)}">${labels[order.status]||esc(order.status)}</span></div><div class="member-tracking-items">${(order.items||[]).map(item=>`<span>${Number(item.qty||1)}× ${esc(item.menu_name||item.name)}</span>`).join('')||'<span>Detail menu tersimpan di pesanan</span>'}</div><div class="member-tracking-meta"><span>${date(order.created_at)}</span><strong>${rupiah(order.total)}</strong></div></article>`).join('')}</div>`;
  }
  async function track(query){
    const path=/^PE-/i.test(query)?`?code=${encodeURIComponent(query)}`:`?phone=${encodeURIComponent(query)}`;
    box.textContent='Mencari pesanan...';
    try{render((await api('/api/public/tracking'+path)).orders||[])}catch(error){box.textContent=error.message}
  }
  async function loadMemberOrders(){
    document.body.classList.add('member-tracking');form.hidden=true;box.textContent='Memuat pesananmu...';
    const intro=document.querySelector('.track-card>div>p:not(.eyebrow)');if(intro)intro.textContent=`Pesanan ${member.name} tampil otomatis dari akun PrasEats.`;
    try{render((await api('/api/public/members/orders',{headers:{authorization:`Bearer ${token}`}})).orders||[])}catch(error){box.innerHTML=`<div class="tracking-empty"><h2>Pesanan belum bisa dimuat</h2><p>${esc(error.message)}</p></div>`}
  }
  form.onsubmit=event=>{event.preventDefault();track(input.value.trim())};
  const preset=new URLSearchParams(location.search).get('code');
  if(member&&token)loadMemberOrders();else if(preset){input.value=preset;track(preset)}
})();
