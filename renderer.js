document.querySelector('#pin').onclick = async e => {
  const pinned = await window.widget.togglePin(); e.target.classList.toggle('active', pinned);
};
document.querySelector('#close').onclick = () => window.widget.close();
document.querySelector('#details').onclick = () => {
  const t = document.querySelector('#toast'); t.textContent = '下一次重置：8/1 04:14';
  t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400);
};

function updateQuota(value) {
  document.querySelector('#value').textContent = value;
  document.querySelector('#bar').style.width = `${value}%`;
  const card = document.querySelector('#card'); card.classList.remove('high','medium','low');
  card.classList.add(value > 50 ? 'high' : value > 10 ? 'medium' : 'low');
}
function resetText(ts) { if(!ts)return '等待下次同步'; const ms=ts*1000-Date.now(),h=Math.floor(ms/3600000),m=Math.floor(ms%3600000/60000); return ms<=0?'即将重置':`${h} 小时 ${m} 分钟后重置`; }
async function refresh(){const s=document.querySelector('#status');s.className='live loading';const u=await window.widget.getUsage();if(!u.ok){s.className='live error';s.title=`同步失败，将自动重试：${u.error}`;return}s.className='live';s.title='真实额度已同步';updateQuota(u.primaryRemaining);document.querySelector('#weekly').textContent=u.secondaryRemaining;document.querySelector('#reset').textContent=resetText(u.primaryReset);const d=u.secondaryReset?new Date(u.secondaryReset*1000).toLocaleDateString(undefined,{month:'numeric',day:'numeric'}):'';document.querySelector('#weeklyLabel').textContent=`本周剩余${d?` · 至 ${d}`:''}`}
updateQuota(0);refresh();setInterval(refresh,60000);
let contrastSampling=false;
async function adaptContrast(){if(contrastSampling)return;contrastSampling=true;try{const a=await window.widget.getAmbientContrast();document.documentElement.dataset.contrast=a.mode;document.documentElement.style.setProperty('--ambient-luminance',a.luminance)}finally{contrastSampling=false;setTimeout(adaptContrast,60)}}
adaptContrast();
