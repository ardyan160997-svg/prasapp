(()=>{
  const member=JSON.parse(localStorage.getItem('praseats_member')||'null'),key=member?.id?`praseats_chat_session_member_${member.id}`:'praseats_chat_session';
  let sessionId=member?.id?`member-${member.id}`:localStorage.getItem(key);
  if(!sessionId){sessionId='chat-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)}
  localStorage.setItem(key,sessionId)
  const wrap=document.createElement('div');
  wrap.className='public-chat';
  wrap.innerHTML=`<button class="public-chat-toggle" type="button" aria-label="Chat admin">💬<span>Chat</span></button><section class="public-chat-panel" hidden><div class="public-chat-head"><div><b>Chat PrasEats</b>${member?.name?`<span class="public-chat-member">👤 ${esc(member.name)}</span>`:''}</div><button type="button" aria-label="Tutup chat">×</button></div><div class="public-chat-body"><p class="public-chat-welcome">Belum ada chat nih.<br><b>Mau tanya apa?</b></p></div><form class="public-chat-form"><input name="message" placeholder="Tulis pesan..." autocomplete="off" required><button type="submit">Kirim</button></form><p class="public-chat-feedback" role="status"></p></section>`;
  document.body.appendChild(wrap);
  const navChatButtons=[...document.querySelectorAll('[data-public-chat-open]')];
  if(navChatButtons.length)wrap.classList.add('public-chat-nav-mode');
  const panel=wrap.querySelector('.public-chat-panel'),body=wrap.querySelector('.public-chat-body'),feedback=wrap.querySelector('.public-chat-feedback');
  function esc(value){return String(value||'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]))}
  async function loadMessages(){try{const data=await api(`/api/public/chat?sessionId=${encodeURIComponent(sessionId)}`);body.innerHTML=data.messages.map(item=>`<p class="public-chat-bubble ${item.from_admin?'admin':'user'}">${esc(item.message)}</p>`).join('')||'<p class="public-chat-welcome">Belum ada chat nih.<br><b>Mau tanya apa?</b></p>';body.scrollTop=body.scrollHeight}catch{}}
  function syncState(){const open=!panel.hidden;navChatButtons.forEach(button=>button.classList.toggle('active',open));document.body.classList.toggle('public-chat-open',open)}
  function togglePanel(){panel.hidden=!panel.hidden;syncState();if(!panel.hidden){loadMessages();wrap.querySelector('input').focus()}}
  wrap.querySelector('.public-chat-toggle').onclick=togglePanel;
  navChatButtons.forEach(button=>button.onclick=event=>{event.preventDefault();togglePanel()});
  wrap.querySelector('.public-chat-head>button').onclick=()=>{panel.hidden=true;syncState()};
  if(new URLSearchParams(location.search).get('openChat')==='1'&&panel.hidden)togglePanel();
  wrap.querySelector('form').onsubmit=async event=>{event.preventDefault();const input=event.target.message,message=input.value.trim();if(!message)return;input.value='';feedback.textContent='Mengirim...';try{const prefix=member?.name?`${member.name} (${member.whatsapp_number||member.whatsapp||'-'}): `:'';await api('/api/public/chat',{method:'POST',body:JSON.stringify({sessionId,message:prefix+message})});feedback.textContent='Pesan terkirim';await loadMessages()}catch(error){feedback.textContent=error.message}};
  setInterval(()=>{if(!panel.hidden)loadMessages()},10000);
})();
