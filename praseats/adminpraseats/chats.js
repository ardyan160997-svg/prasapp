let chats=[],activeChat='';
function renderChats(){document.querySelector('#chat-list').innerHTML=chats.map(chat=>`<button class="chat-row ${chat.session_id===activeChat?'active':''}" data-chat="${esc(chat.session_id)}"><b>${esc(chat.session_id)}</b><small>${chat.total||1} pesan</small></button>`).join('')||'<p>Belum ada chat.</p>'}
async function loadChats(){const response=await api('/api/admin/dashboard');chats=response.data.chats;renderChats()}
async function openChat(sessionId){activeChat=sessionId;renderChats();const response=await api(`/api/admin/chat?sessionId=${encodeURIComponent(sessionId)}`);document.querySelector('#chat-messages').innerHTML=response.messages.map(message=>`<p class="bubble ${message.from_admin?'admin':''}"><span>${message.from_admin?'Admin':'Pelanggan'}</span>${esc(message.message)}</p>`).join('')||'<p>Belum ada pesan.</p>';document.querySelector('#chat-form').classList.remove('hidden')}
document.querySelector('#refresh').onclick=()=>loadChats().then(()=>toast('Data diperbarui'));
document.addEventListener('click',event=>{const button=event.target.closest('[data-chat]');if(button)openChat(button.dataset.chat)});
document.querySelector('#chat-form').onsubmit=async event=>{event.preventDefault();if(!activeChat)return;const message=new FormData(event.target).get('message');await api('/api/admin/chat',{method:'POST',body:JSON.stringify({sessionId:activeChat,message})});event.target.reset();await openChat(activeChat);await loadChats();toast('Balasan terkirim')};
requireAdmin(loadChats);
