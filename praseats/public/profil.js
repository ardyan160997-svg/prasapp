(()=>{
  const memberKey='praseats_member',tokenKey='praseats_member_token';
  let member=JSON.parse(localStorage.getItem(memberKey)||'null');
  const token=localStorage.getItem(tokenKey);
  if(!member||!token){location.href='login.html';return}
  const avatar=document.querySelector('#profile-avatar'),feedback=document.querySelector('#profile-feedback'),address=document.querySelector('#profile-address'),detail=document.querySelector('#profile-detail');
  const esc=value=>String(value||'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const statusLabel={baru:'Baru',diterima:'Diterima',dimasak:'Sedang dimasak',siap:'Siap',diantar:'Sedang diantar',selesai:'Selesai',batal:'Dibatalkan'};
  function render(){
    document.querySelector('#profile-name').textContent=member.name||'Member PrasEats';
    document.querySelector('#profile-phone').textContent=member.whatsapp_number||member.whatsapp||'';
    address.value=member.home_address||'';
    detail.value=member.home_detail||'';
    avatar.innerHTML=member.profile_photo?`<img src="${member.profile_photo}" alt="Foto profil">`:'👤';
    document.querySelector('#profile-avatar-add').textContent=member.profile_photo?'Ganti':'+';
    document.querySelector('#remove-profile-photo').hidden=!member.profile_photo;
  }
  function message(text){feedback.textContent=text}
  function readPhoto(file){return new Promise((resolve,reject)=>{if(!file)return resolve('');if(file.size>5*1024*1024)return reject(new Error('Foto maksimal 5MB'));const reader=new FileReader();reader.onerror=()=>reject(new Error('Foto gagal dibaca'));reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('Format foto tidak didukung'));image.onload=()=>{const size=320,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),scale=Math.max(size/image.width,size/image.height),width=image.width*scale,height=image.height*scale;canvas.width=size;canvas.height=size;ctx.drawImage(image,(size-width)/2,(size-height)/2,width,height);resolve(canvas.toDataURL('image/jpeg',.76))};image.src=reader.result};reader.readAsDataURL(file)})}
  async function updateProfile(body,success){message('Menyimpan...');const data=await api('/api/public/members/profile',{method:'PATCH',headers:{authorization:`Bearer ${token}`},body:JSON.stringify(body)});member=data.member;localStorage.setItem(memberKey,JSON.stringify(member));render();message(success)}
  function orderCard(order){const items=(order.items||[]).map(item=>`${Number(item.qty||1)}× ${esc(item.menu_name||item.name)}`).join(', ');const date=order.created_at?new Date(order.created_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'';return `<article class="member-order-card"><div class="member-order-card-head"><b>${esc(order.order_code)}</b><span class="status-${esc(order.status)}">${esc(statusLabel[order.status]||order.status)}</span></div><p>${items||'Detail menu tersedia di halaman tracking.'}</p><div class="member-order-meta"><span>${date}</span><strong>${rupiah(order.total)}</strong></div><a href="tracking.html?code=${encodeURIComponent(order.order_code)}">Lihat Detail</a></article>`}
  async function loadOrders(){try{const data=await api('/api/public/members/orders',{headers:{authorization:`Bearer ${token}`}}),orders=data.orders||[],historyStatuses=new Set(['selesai','batal']),active=orders.filter(order=>!historyStatuses.has(order.status)),history=orders.filter(order=>historyStatuses.has(order.status));document.querySelector('#active-order-count').textContent=active.length;document.querySelector('#order-history-count').textContent=history.length;document.querySelector('#active-orders').innerHTML=active.map(orderCard).join('')||'<p class="member-order-empty">Belum ada order berjalan.</p>';document.querySelector('#order-history').innerHTML=history.map(orderCard).join('')||'<p class="member-order-empty">Belum ada riwayat order.</p>'}catch(error){document.querySelector('#active-orders').innerHTML=`<p class="member-order-empty">${esc(error.message)}</p>`;document.querySelector('#order-history').innerHTML='<p class="member-order-empty">Riwayat belum dapat dimuat.</p>'}}
  document.querySelector('#profile-photo').onchange=async event=>{try{const photo=await readPhoto(event.target.files[0]);if(photo)await updateProfile({profilePhoto:photo},'Foto profil tersimpan')}catch(error){message(error.message)}};
  document.querySelector('#remove-profile-photo').onclick=()=>updateProfile({profilePhoto:''},'Foto profil dihapus').catch(error=>message(error.message));
  document.querySelector('#profile-address-form').onsubmit=event=>{event.preventDefault();const homeAddress=address.value.trim();if(!homeAddress){message('Alamat tidak boleh kosong');return}updateProfile({homeAddress,homeDetail:detail.value.trim()},'Alamat pengantaran tersimpan').catch(error=>message(error.message))};
  document.querySelector('#logout-member').onclick=()=>{localStorage.removeItem(memberKey);localStorage.removeItem(tokenKey);location.href='index.html'};
  render();loadOrders();
})();
