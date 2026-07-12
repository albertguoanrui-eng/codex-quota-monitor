const { app, BrowserWindow, ipcMain, screen, net, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let win;
let pinned = true;

function createWindow() {
  const display = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    width: 202, height: 158,
    x: display.x + display.width - 222,
    y: display.y + 32,
    frame: false, transparent: true, resizable: false,
    alwaysOnTop: pinned, skipTaskbar: true,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  win.loadFile('index.html');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
}

async function getUsage() {
  try {
    const sessionsRoot = path.join(os.homedir(), '.codex', 'sessions');
    const files = [];
    const walkFiles = dir => { for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { const full=path.join(dir,entry.name); if(entry.isDirectory())walkFiles(full); else if(entry.name.endsWith('.jsonl'))files.push({full,mtime:fs.statSync(full).mtimeMs}); }};
    walkFiles(sessionsRoot);
    files.sort((a,b)=>b.mtime-a.mtime);
    const findLimits = value => {
      if(!value || typeof value!=='object') return null;
      if(Object.prototype.hasOwnProperty.call(value,'rate_limits') && value.rate_limits?.primary) return value.rate_limits;
      for(const child of Object.values(value)){const found=findLimits(child);if(found)return found;}
      return null;
    };
    for(const file of files.slice(0,20)) {
      const lines=fs.readFileSync(file.full,'utf8').trim().split(/\r?\n/);
      for(let i=lines.length-1;i>=0;i--){try{const limits=findLimits(JSON.parse(lines[i]));if(limits)return {ok:true,plan:(limits.plan_type||'Codex').toUpperCase(),primaryRemaining:Math.max(0,Math.round(100-limits.primary.used_percent)),primaryReset:limits.primary.resets_at||null,secondaryRemaining:Math.max(0,Math.round(100-(limits.secondary?.used_percent||0))),secondaryReset:limits.secondary?.resets_at||null,source:'local'}}catch{}}
    }
    const auth = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.codex', 'auth.json'), 'utf8'));
    const response = await net.fetch('https://chatgpt.com/backend-api/wham/usage', { signal:AbortSignal.timeout(8000), headers: { Authorization: `Bearer ${auth.tokens.access_token}`, 'ChatGPT-Account-Id': auth.tokens.account_id }});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json(), primary = data.rate_limit?.primary_window, secondary = data.rate_limit?.secondary_window;
    return { ok:true, plan:(data.plan_type||'Codex').toUpperCase(), primaryRemaining:Math.max(0,Math.round(100-(primary?.used_percent||0))), primaryReset:primary?.reset_at||null, secondaryRemaining:Math.max(0,Math.round(100-(secondary?.used_percent||0))), secondaryReset:secondary?.reset_at||null };
  } catch(error) { return {ok:false,error:error.message}; }
}

async function getAmbientContrast() {
  try {
    const bounds = win.getBounds();
    const display = screen.getDisplayMatching(bounds);
    const size = display.size;
    const sources = await desktopCapturer.getSources({ types:['screen'], thumbnailSize:size });
    const source = sources.find(s => String(s.display_id) === String(display.id)) || sources[0];
    const image = source.thumbnail, bitmap = image.toBitmap(), imageSize = image.getSize();
    const sx = imageSize.width / size.width, sy = imageSize.height / size.height;
    const left = Math.max(0, Math.round((bounds.x - display.bounds.x) * sx));
    const top = Math.max(0, Math.round((bounds.y - display.bounds.y) * sy));
    const right = Math.min(imageSize.width - 1, Math.round((bounds.x - display.bounds.x + bounds.width) * sx));
    const bottom = Math.min(imageSize.height - 1, Math.round((bounds.y - display.bounds.y + bounds.height) * sy));
    const samples = [];
    const read = (x,y,weight=1) => { if(x<0||y<0||x>=imageSize.width||y>=imageSize.height)return; const i=(y*imageSize.width+x)*4,b=bitmap[i],g=bitmap[i+1],r=bitmap[i+2],l=.2126*r+.7152*g+.0722*b; for(let n=0;n<weight;n++)samples.push(l); };
    const contentRight = left + Math.round((right-left)*.72);
    // 正文位于卡片左侧：对左边缘和正文上下方做 4 层采样，避开卡片自身。
    for(const offset of [3,10,22,38]) {
      for(let x=left;x<=contentRight;x+=7){ read(x,top-offset,2); read(x,bottom+offset,2); }
      for(let y=top;y<=bottom;y+=7) read(left-offset,y,3);
      // 右边缘只保留低权重，用于卡片完全处于同一背景时的稳定判断。
      for(let y=top;y<=bottom;y+=14) read(right+offset,y,1);
    }
    samples.sort((a,b)=>a-b);
    const trim=Math.floor(samples.length*.18), core=samples.slice(trim,samples.length-trim);
    const luminance = core.length ? core.reduce((sum,v)=>sum+v,0)/core.length : 128;
    return { mode:luminance>145?'dark':luminance<105?'light':'outlined', luminance:Math.round(luminance) };
  } catch { return {mode:'dark',luminance:180}; }
}

ipcMain.handle('toggle-pin', () => {
  pinned = !pinned;
  win.setAlwaysOnTop(pinned);
  return pinned;
});
ipcMain.on('close', () => win.close());
ipcMain.handle('get-usage', getUsage);
ipcMain.handle('get-ambient-contrast', getAmbientContrast);

app.whenReady().then(() => {
  app.setLoginItemSettings({ openAtLogin:false });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
