const ORDER_STATUSES=['diajukan','dijemput','ditimbang','dicuci','selesai','diantar'];
function normalizePhone(value=''){const d=String(value).replace(/\D/g,'');if(d.startsWith('62'))return d;if(d.startsWith('0'))return `62${d.slice(1)}`;return d}
function makeOrderCode(date=new Date()){return `PS-${date.toISOString().slice(2,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`}
function calculatePrice({pricePerKg=0,weightKg=0,minimumKg=3,express=false,expressFeePerKg=5000}){const billedWeight=Math.max(Number(minimumKg)||0,Number(weightKg)||0);return{billedWeight,total:Math.round(billedWeight*(Number(pricePerKg)+(express?Number(expressFeePerKg):0)))}}
function canTransition(from,to){const a=ORDER_STATUSES.indexOf(from),b=ORDER_STATUSES.indexOf(to);return b>=0&&(a<0?b===0:b===a||b===a+1)}
module.exports={ORDER_STATUSES,normalizePhone,makeOrderCode,calculatePrice,canTransition};