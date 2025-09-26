const $ = (s) => document.querySelector(s);
const favicon = $('#favicon');
const iconBtn = $('#iconBtn');
const iconImg = $('#iconImg');
const titleInput = $('#titleInput');
const colorInput = $('#colorInput');
const bgColorInput = $('#bgColorInput');
let iconURL = '';

// color helpers
function hexToRgb01(hex){
  const c = hex.replace('#','');
  return [
    parseInt(c.slice(0,2),16)/255,
    parseInt(c.slice(2,4),16)/255,
    parseInt(c.slice(4,6),16)/255
  ];
}
function luminanceFromRgb01(r,g,b){
  const toLin = (s)=> s<=0.03928 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4);
  return 0.2126*toLin(r) + 0.7152*toLin(g) + 0.0722*toLin(b);
}

function setFavicon(url){
  if(!url) return;
  const bust = url + (url.includes('?')?'&':'?') + 'cb=' + Date.now();
  favicon.href = bust;
}
function applyBackground(hex){
  if(!hex) return;
  document.documentElement.style.setProperty('--bg', hex);
  const [r,g,b] = hexToRgb01(hex);
  const L = luminanceFromRgb01(r,g,b);
  document.documentElement.classList.toggle('dark', L < 0.5);
  document.documentElement.classList.toggle('light', L >= 0.5);
}
function applyPanel(hex){
  if(!hex) return;
  document.documentElement.style.setProperty('--panel', hex);
  const [r,g,b] = hexToRgb01(hex);
  const L = luminanceFromRgb01(r,g,b);
  const panelFg = L < 0.6 ? '#fafafa' : '#171717';
  document.documentElement.style.setProperty('--panel-fg', panelFg);
  const targetDelta = L < 0.5 ? 0.18 : -0.18;
  function clamp01(x){ return Math.max(0, Math.min(1, x)); }
  function toHex(n){ return Math.round(clamp01(n)*255).toString(16).padStart(2,'0'); }
  const k = targetDelta > 0 ? targetDelta : -targetDelta;
  const toward = targetDelta > 0 ? 1 : 0;
  const nbR = r + (toward - r) * k;
  const nbG = g + (toward - g) * k;
  const nbB = b + (toward - b) * k;
  const borderHex = '#' + toHex(nbR) + toHex(nbG) + toHex(nbB);
  document.documentElement.style.setProperty('--panel-border', borderHex);
  const phToward = panelFg === '#fafafa' ? 0 : 1;
  const phK = 0.45;
  const pfR = panelFg === '#fafafa' ? 1 : 0, pfG = pfR, pfB = pfR;
  const phR = pfR + (phToward - pfR) * phK;
  const phG = pfG + (phToward - pfG) * phK;
  const phB = pfB + (phToward - pfB) * phK;
  const placeholderHex = '#' + toHex(phR) + toHex(phG) + toHex(phB);
  document.documentElement.style.setProperty('--panel-placeholder', placeholderHex);
}
function writeURL(push=true){
  const u = new URL(location.href);
  const t = (titleInput.value||'').trim() || 'Group — Tabs';
  u.searchParams.set('t', t);
  const v = (iconURL||'').trim();
  v ? u.searchParams.set('img', v) : u.searchParams.delete('img');
  const p = (colorInput.value||'').replace(/^#/, '');
  p ? u.searchParams.set('p', p) : u.searchParams.delete('p');
  const c = ((bgColorInput&&bgColorInput.value)||'').replace(/^#/, '');
  c ? u.searchParams.set('c', c) : u.searchParams.delete('c');
  (push?history.pushState(null,'',u):history.replaceState(null,'',u));
}
function init(){
  const u = new URL(location.href);
  const t = u.searchParams.get('t') || 'Group — Tabs';
  const g = u.searchParams.get('img') || '';
  const c = u.searchParams.get('c') || '';
  const p = u.searchParams.get('p') || '';
  document.title = t;
  titleInput.value = t;
  if(g){ iconURL=g; iconImg.src=g; setFavicon(g); }
  if(c){
    const hex = '#'+c.replace(/[^0-9a-fA-F]/g,'');
    if(bgColorInput) bgColorInput.value = hex;
    applyBackground(hex);
  } else {
    const cs = getComputedStyle(document.documentElement);
    const currentBg = cs.getPropertyValue('--bg').trim();
    if(bgColorInput && currentBg){ bgColorInput.value = currentBg; }
  }
  if(p){
    const hexP = '#'+p.replace(/[^0-9a-fA-F]/g,'');
    colorInput.value = hexP; applyPanel(hexP);
  } else {
    const cs = getComputedStyle(document.documentElement);
    const currentPanel = cs.getPropertyValue('--panel').trim();
    if(currentPanel){ colorInput.value = currentPanel; }
  }
}

colorInput.addEventListener('input', ()=>{ const v = colorInput.value; if(v){ applyPanel(v); writeURL(false); } });
if(bgColorInput){
  bgColorInput.addEventListener('input', ()=>{ const v = bgColorInput.value; if(v){ applyBackground(v); writeURL(false); } });
}

iconBtn.addEventListener('click', ()=>{
  const next = prompt('Icon URL', iconURL || '');
  if(next){ iconURL = next.trim(); iconImg.src = iconURL; setFavicon(iconURL); writeURL(true); }
});

titleInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); titleInput.blur(); }});
titleInput.addEventListener('blur', ()=>{ const t=(titleInput.value||'').trim()||'Group — Tabs'; document.title=t; writeURL(true); });

window.addEventListener('popstate', init);
init();

// Minimal Quick Notes
const NOTES_STORAGE_KEY = 'quickNotes.text.v1';
const notesText = document.querySelector('#notesText');
function loadNotesText(){
  try{ return localStorage.getItem(NOTES_STORAGE_KEY) || ''; }catch(e){ return ''; }
}
function saveNotesText(v){
  try{ localStorage.setItem(NOTES_STORAGE_KEY, v||''); }catch(e){}
}
if(notesText){
  notesText.value = loadNotesText();
  notesText.addEventListener('input', ()=> saveNotesText(notesText.value));
}

// Simple Checklist
const CHECKLIST_KEY = 'quickNotes.checklist.v1';
const checklistEl = document.querySelector('#checklist');
function loadChecklist(){
  try{ const r = JSON.parse(localStorage.getItem(CHECKLIST_KEY)||'[]'); return Array.isArray(r)?r:[]; }catch(e){ return []; }
}
function saveChecklist(items){
  try{ localStorage.setItem(CHECKLIST_KEY, JSON.stringify(items)); }catch(e){}
}
let checklist = loadChecklist();

function createItem(text, checked){
  return { id: 'i_'+Math.random().toString(36).slice(2,8)+Date.now().toString(36), text: text||'', checked: !!checked };
}

function focusText(el){
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
  el.focus();
}

function renderChecklist(){
  if(!checklistEl) return;
  checklistEl.innerHTML = '';
  checklist.forEach((item)=>{
    const row = document.createElement('div');
    row.className = 'chk-item' + (item.checked ? ' chk-checked' : '');
    row.dataset.id = item.id;
    const box = document.createElement('input');
    box.type = 'checkbox'; box.className = 'chk-box'; box.checked = item.checked;
    const text = document.createElement('div');
    text.className = 'chk-text'; text.contentEditable = 'true'; text.dataset.placeholder = 'List item';
    text.textContent = item.text || '';
    row.appendChild(box);
    row.appendChild(text);
    checklistEl.appendChild(row);
  });
}

if(checklist.length===0){ checklist=[createItem('', false)]; saveChecklist(checklist); }
renderChecklist();

if(checklistEl){
  checklistEl.addEventListener('change', (e)=>{
    const t = e.target;
    if(!(t instanceof HTMLInputElement)) return;
    if(!t.classList.contains('chk-box')) return;
    const row = t.closest('.chk-item'); if(!row) return;
    const id = row.getAttribute('data-id'); if(!id) return;
    const idx = checklist.findIndex(i=>i.id===id); if(idx<0) return;
    checklist[idx].checked = t.checked;
    saveChecklist(checklist);
    row.classList.toggle('chk-checked', t.checked);
  });

  checklistEl.addEventListener('input', (e)=>{
    const text = e.target;
    if(!(text instanceof HTMLElement)) return;
    if(!text.classList.contains('chk-text')) return;
    const row = text.closest('.chk-item'); if(!row) return;
    const id = row.getAttribute('data-id'); if(!id) return;
    const idx = checklist.findIndex(i=>i.id===id); if(idx<0) return;
    checklist[idx].text = text.innerText.replace(/\n/g,'');
    saveChecklist(checklist);
  });

  checklistEl.addEventListener('keydown', (e)=>{
    const text = e.target;
    if(!(text instanceof HTMLElement)) return;
    if(!text.classList.contains('chk-text')) return;
    const row = text.closest('.chk-item'); if(!row) return;
    const id = row.getAttribute('data-id'); if(!id) return;
    const idx = checklist.findIndex(i=>i.id===id); if(idx<0) return;

    if(e.key==='Enter' && !e.shiftKey){
      e.preventDefault();
      const newItem = createItem('', false);
      checklist.splice(idx+1,0,newItem);
      saveChecklist(checklist);
      renderChecklist();
      const next = checklistEl.querySelector(`[data-id="${newItem.id}"] .chk-text`);
      if(next) { next.focus(); }
    } else if(e.key==='Backspace'){
      const empty = (text.innerText||'').trim()==='';
      if(empty){
        e.preventDefault();
        if(checklist.length===1){
          checklist[0].text=''; checklist[0].checked=false; saveChecklist(checklist); renderChecklist();
          const cur = checklistEl.querySelector(`[data-id="${checklist[0].id}"] .chk-text`); if(cur){ cur.focus(); }
          return;
        }
        const prev = checklist[idx-1];
        const prevId = prev?prev.id:null;
        checklist.splice(idx,1);
        saveChecklist(checklist);
        renderChecklist();
        if(prevId){ const prevEl = checklistEl.querySelector(`[data-id="${prevId}"] .chk-text`); if(prevEl){ focusText(prevEl); } }
      }
    }
  });
}


