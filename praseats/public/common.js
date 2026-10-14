const API=window.PRASEATS_API||'https://adminpraseats.prasapp.com';
const rupiah=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
async function api(path,opt={}){const r=await fetch(API+path,{headers:{'content-type':'application/json',...(opt.headers||{})},...opt});const d=await r.json();if(!r.ok||d.ok===false)throw new Error(d.error||'Request gagal');return d}
const memberToken=()=>localStorage.getItem('praseats_member_token')||'';
let memberCart=[],cartLoadPromise=null,cartSync=Promise.resolve();
function cartNotify(){window.dispatchEvent(new CustomEvent('praseats:cart-updated'))}
function cartGet(){return memberCart.map(item=>({...item}))}
async function cartLoad(force=false){localStorage.removeItem('praseats_cart');if(!memberToken()){memberCart=[];cartNotify();return memberCart}if(cartLoadPromise&&!force)return cartLoadPromise;cartLoadPromise=api('/api/public/members/cart',{headers:{authorization:`Bearer ${memberToken()}`}}).then(data=>{memberCart=data.items||[];cartNotify();return cartGet()}).finally(()=>{cartLoadPromise=null});return cartLoadPromise}
function cartSet(items){if(!memberToken())return Promise.reject(new Error('Silakan login untuk memakai keranjang'));memberCart=items.map(item=>({...item,qty:Math.max(1,Number(item.qty||1))}));cartNotify();const payload=memberCart.map(item=>({id:item.id,qty:item.qty}));cartSync=cartSync.catch(()=>{}).then(()=>api('/api/public/members/cart',{method:'PUT',headers:{authorization:`Bearer ${memberToken()}`},body:JSON.stringify({items:payload})})).then(data=>{memberCart=data.items||[];cartNotify();return cartGet()});return cartSync}
function cartClearView(){memberCart=[];cartNotify()}
function cartCount(){return memberCart.reduce((sum,item)=>sum+Number(item.qty||0),0)}
