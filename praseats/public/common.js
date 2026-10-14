const API=window.PRASEATS_API||'https://adminpraseats.prasapp.com';
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
async function api(path,opt={}){const r=await fetch(API+path,{headers:{'content-type':'application/json',...(opt.headers||{})},...opt});const d=await r.json();if(!r.ok||d.ok===false)throw new Error(d.error||'Request gagal');return d}
function cartGet(){return JSON.parse(localStorage.getItem('praseats_cart')||'[]')}
function cartSet(items){localStorage.setItem('praseats_cart',JSON.stringify(items));window.dispatchEvent(new CustomEvent('praseats:cart-updated'))}
function cartCount(){return cartGet().reduce((s,i)=>s+Number(i.qty||0),0)}
