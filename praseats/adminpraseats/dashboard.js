async function loadDashboard(){const {data}=await api('/api/admin/dashboard');document.querySelector('#stats').innerHTML=[['Kategori',data.brands.length],['Database Makanan',data.menus.length],['Makanan Hari Ini',data.dailyMenus.filter(menu=>menu.is_available!==false).length],['Order',data.orders.length],['Chat',data.chats.length]].map(([label,value])=>`<div class="stat"><small>${label}</small><b>${value}</b></div>`).join('')}
document.querySelector('#refresh').onclick=()=>loadDashboard().then(()=>toast('Data diperbarui'));
requireAdmin(loadDashboard);
