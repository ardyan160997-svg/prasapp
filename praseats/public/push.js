(()=>{
  const member=JSON.parse(localStorage.getItem('praseats_member')||'null'),token=memberToken();
  if(!member||!token||!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return;
  const button=document.createElement('button');
  button.type='button';button.className='push-optin';button.innerHTML='<span aria-hidden="true">🔔</span><b>Aktifkan notifikasi</b>';button.setAttribute('aria-label','Aktifkan notifikasi pesanan dan chat');document.body.append(button);
  const sessionId=`member-${member.id}`;
  localStorage.setItem(`praseats_chat_session_member_${member.id}`,sessionId);
  const decode=value=>{const padding='='.repeat((4-value.length%4)%4),base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/'),raw=atob(base64);return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)))};
  async function syncSubscription(requestPermission=false){
    if(requestPermission&&Notification.permission==='default')await Notification.requestPermission();
    if(Notification.permission!=='granted')throw new Error(Notification.permission==='denied'?'Notifikasi diblokir. Aktifkan melalui pengaturan browser.':'Izin notifikasi belum diberikan.');
    const registration=await navigator.serviceWorker.register('sw.js'),keyData=await api('/api/public/push/key');
    if(!keyData.publicKey)throw new Error('Notifikasi sedang disiapkan. Coba lagi nanti.');
    let subscription=await registration.pushManager.getSubscription();
    if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decode(keyData.publicKey)});
    await api('/api/public/push/subscribe',{method:'POST',headers:{authorization:`Bearer ${token}`},body:JSON.stringify({subscription:subscription.toJSON(),chatSessionId:sessionId})});
    button.hidden=true;
  }
  button.onclick=async()=>{button.disabled=true;button.querySelector('b').textContent='Mengaktifkan...';try{if(/iPhone|iPad|iPod/.test(navigator.userAgent)&&!window.matchMedia('(display-mode: standalone)').matches)throw new Error('Di iPhone, pilih Share lalu Add to Home Screen. Buka PrasEats dari Home Screen untuk mengaktifkan notifikasi.');await syncSubscription(true)}catch(error){alert(error.message);button.disabled=false;button.querySelector('b').textContent='Aktifkan notifikasi'}};
  if(Notification.permission==='granted')syncSubscription().catch(()=>{button.hidden=false});
  else if(Notification.permission==='denied')button.hidden=true;
})();
