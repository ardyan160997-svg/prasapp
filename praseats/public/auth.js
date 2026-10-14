const memberKey='praseats_member';
const tokenKey='praseats_member_token';
function saveSession(data){localStorage.setItem(tokenKey,data.token);localStorage.setItem(memberKey,JSON.stringify(data.member));location.href='index.html'}
function showFeedback(message){const box=document.querySelector('#auth-feedback');if(box)box.textContent=message}
async function submitAuth(path,body){try{showFeedback('Memproses...');const data=await api(path,{method:'POST',body:JSON.stringify(body)});saveSession(data)}catch(error){showFeedback(error.message)}}
const loginForm=document.querySelector('#login-form');
if(loginForm)loginForm.onsubmit=event=>{event.preventDefault();submitAuth('/api/public/members/login',{whatsapp:loginForm.whatsapp.value,password:loginForm.password.value})};
const registerForm=document.querySelector('#register-form');
if(registerForm)registerForm.onsubmit=event=>{event.preventDefault();submitAuth('/api/public/members/register',{name:registerForm.name.value,whatsapp:registerForm.whatsapp.value,password:registerForm.password.value})};
