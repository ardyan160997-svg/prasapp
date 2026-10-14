(()=>{
  const member=JSON.parse(localStorage.getItem('praseats_member')||'null'),token=memberToken();
  if(!member||!token||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return;
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent),isStandalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const button=document.createElement('button');
  button.type='button';button.className='push-optin';button.innerHTML='<span aria-hidden="true">🔔</span><b>Notifikasi</b>';button.setAttribute('aria-label','Install atau nyalakan notifikasi');
  const modal=document.createElement('div');
  modal.className='push-modal';modal.hidden=true;modal.innerHTML=`<div class="push-modal-backdrop" data-push-close></div><section class="push-modal-card" role="dialog" aria-modal="true" aria-labelledby="push-modal-title"><button class="push-modal-close" type="button" data-push-close aria-label="Tutup">×</button><div class="push-modal-icon">🔔</div><p class="push-modal-eyebrow">PRASEATS UPDATE</p><h2 id="push-modal-title">Jangan lewatkan pesananmu</h2><p class="push-modal-copy">Dapatkan notifikasi saat status pesanan berubah dan ketika admin membalas Chat.</p><div class="push-modal-info"></div><div class="push-modal-actions"><button class="push-modal-primary" type="button">Nyalakan Notifikasi</button><button class="push-modal-later" type="button" data-push-close>Nanti Saja</button></div></section>`;
  document.body.append(button,modal);
  const info=modal.querySelector('.push-modal-info'),primary=modal.querySelector('.push-modal-primary');
  const sessionId=`member-${member.id}`;
  localStorage.setItem(`praseats_chat_session_member_${member.id}`,sessionId);
  const decode=value=>{const padding='='.repeat((4-value.length%4)%4),base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base64);return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)))};
  const close=()=>{modal.hidden=true;document.body.classList.remove('push-modal-open')};
  const open=()=>{info.innerHTML=isIOS&&!isStandalone?'<b>Khusus iPhone</b><span>Tekan Share, pilih <strong>Add to Home Screen</strong>, lalu buka PrasEats dari ikon Home Screen.</span>':'<b>Notifikasi aman dan pribadi</b><span>Hanya status pesanan dan balasan Chat milik akunmu yang dikirim.</span>';primary.textContent=isIOS&&!isStandalone?'Mengerti':'Nyalakan Notifikasi';modal.hidden=false;document.body.classList.add('push-modal-open')};
  async function syncSubscription(requestPermission=false){
    if(requestPermission&&Notification.permission==='default')await Notification.requestPermission();
    if(Notification.permission!=='granted')throw new Error(Notification.permission==='denied'?'Notifikasi diblokir. Aktifkan melalui pengaturan browser.':'Izin notifikasi belum diberikan.');
    const registration=await navigator.serviceWorker.register('sw.js'),keyData=await api('/api/public/push/key');
    if(!keyData.publicKey)throw new Error('Notifikasi sedang disiapkan. Coba lagi nanti.');
    let subscription=await registration.pushManager.getSubscription();
    if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(keyData.publicKey)});
    await api('/api/public/push/subscribe',{method:'POST',headers:{authorization:`Bearer ${token}`},body:JSON.stringify({subscription:subscription.toJSON(),chatSessionId:sessionId})});
    button.hidden=true;close();
  }
  button.onclick=open;
  modal.querySelectorAll('[data-push-close]').forEach(control=>control.onclick=close);
  primary.onclick=async()=>{
    if(isIOS&&!isStandalone){close();return}
    primary.disabled=true;primary.textContent='Mengaktifkan...';info.classList.remove('error');
    try{await syncSubscription(true)}catch(error){info.innerHTML=`<b>Belum aktif</b><span>${esc(error.message)}</span>`;info.classList.add('error');primary.disabled=false;primary.textContent='Coba Lagi'}
  };
  if(Notification.permission==='granted')syncSubscription().catch(()=>{button.hidden=false});
  else if(Notification.permission==='denied')button.hidden=false;
})();
