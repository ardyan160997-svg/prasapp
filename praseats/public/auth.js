const memberKey='praseats_member';
const tokenKey='praseats_member_token';
function saveSession(data){localStorage.setItem(tokenKey,data.token);localStorage.setItem(memberKey,JSON.stringify(data.member));location.href='index.html'}
function showFeedback(message){const box=document.querySelector('#auth-feedback');if(box)box.textContent=message}
function profilePhoto(file){return new Promise((resolve,reject)=>{if(!file)return resolve('');if(file.size>5*1024*1024)return reject(new Error('Foto maksimal 5MB'));const reader=new FileReader();reader.onerror=()=>reject(new Error('Foto gagal dibaca'));reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('Format foto tidak didukung'));image.onload=()=>{const size=320,canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),scale=Math.max(size/image.width,size/image.height),width=image.width*scale,height=image.height*scale;canvas.width=size;canvas.height=size;ctx.drawImage(image,(size-width)/2,(size-height)/2,width,height);resolve(canvas.toDataURL('image/jpeg',.76))};image.src=reader.result};reader.readAsDataURL(file)})}
async function submitAuth(path,body){try{showFeedback('Memproses...');const data=await api(path,{method:'POST',body:JSON.stringify(body)});saveSession(data)}catch(error){showFeedback(error.message)}}
const loginForm=document.querySelector('#login-form');
if(loginForm)loginForm.onsubmit=event=>{event.preventDefault();submitAuth('/api/public/members/login',{whatsapp:loginForm.whatsapp.value,password:loginForm.password.value})};
const registerForm=document.querySelector('#register-form');
if(registerForm)registerForm.onsubmit=event=>{event.preventDefault();submitAuth('/api/public/members/register',{name:registerForm.name.value,whatsapp:registerForm.whatsapp.value,homeAddress:registerForm.homeAddress.value,password:registerForm.password.value})};
