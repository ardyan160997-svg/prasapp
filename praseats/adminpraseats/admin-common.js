const API='';
const TOKEN_KEY='praseats_admin_token';
let token=localStorage.getItem(TOKEN_KEY)||'';
const rupiah=value=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value||0);
const esc=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
async function api(path,options={}){const response=await fetch(API+path,{headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},...options});const data=await response.json();if(!response.ok||data.ok===false)throw new Error(data.error||'Request gagal');return data}
function toast(message){const node=document.createElement('div');node.className='toast';node.textContent=message;document.body.append(node);setTimeout(()=>node.remove(),2400)}
async function requireAdmin(load){const login=document.querySelector('#page-login'),app=document.querySelector('#page-app'),form=document.querySelector('#page-login-form'),feedback=document.querySelector('#page-login-feedback');async function open(){login.classList.add('hidden');app.classList.remove('hidden');await load()}form.onsubmit=async event=>{event.preventDefault();try{const response=await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:form.password.value})});token=response.token;localStorage.setItem(TOKEN_KEY,token);await open()}catch(error){feedback.textContent=error.message}};if(token)open().catch(()=>{localStorage.removeItem(TOKEN_KEY);token='';login.classList.remove('hidden');app.classList.add('hidden')})}
