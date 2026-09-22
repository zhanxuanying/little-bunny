const DB_NAME='LittleBunnyLifeDB', DB_VER=1, STORE='days', FILES='files';
let db, currentDate=new Date().toISOString().slice(0,10), currentRecord={}, selectedBody='', selectedExercise='🚶', tempFiles={};

const $=id=>document.getElementById(id);
const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));

function openDB(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME,DB_VER);
    r.onupgradeneeded=e=>{const d=e.target.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'date'});if(!d.objectStoreNames.contains(FILES)){const s=d.createObjectStore(FILES,{keyPath:'id',autoIncrement:true});s.createIndex('date','date')}};
    r.onsuccess=e=>{db=e.target.result;resolve(db)}; r.onerror=()=>reject(r.error);
  });
}
function tx(store,mode='readonly'){return db.transaction(store,mode).objectStore(store)}
function getDay(date){return new Promise((res,rej)=>{const r=tx(STORE).get(date);r.onsuccess=()=>res(r.result||emptyDay(date));r.onerror=()=>rej(r.error)})}
function putDay(day){return new Promise((res,rej)=>{const r=tx(STORE,'readwrite').put(day);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function emptyDay(date){return {date,moods:[],moodNote:'',meals:{breakfast:{text:'',files:[]},lunch:{text:'',files:[]},dinner:{text:'',files:[]}},wakeTime:'',sleepTime:'',napStart:'',napEnd:'',nightWake:'',bodyLogs:[],wonderText:'',wonderFiles:[],money:'',moneyNote:'',progress:'',brave:'',ashamed:'',annoyed:'',regret:'',doneThings:'',weight:'',bodyFat:'',encouragement:'',media:[],plans:{life:'',study:'',work:''},exercise:[],memos:[]}}
function addFile(date,category,file){return new Promise((res,rej)=>{const r=tx(FILES,'readwrite').add({date,category,name:file.name,type:file.type,size:file.size,blob:file});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function getFile(id){return new Promise((res,rej)=>{const r=tx(FILES).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function deleteFile(id){return new Promise((res,rej)=>{const r=tx(FILES,'readwrite').delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
function listAllDays(){return new Promise((res,rej)=>{const r=tx(STORE).getAll();r.onsuccess=()=>res(r.result.sort((a,b)=>b.date.localeCompare(a.date)));r.onerror=()=>rej(r.error)})}

async function save(){await putDay(currentRecord); $('saveState').textContent='✓ 已自动保存 '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});renderSummary()}
function bind(id,key,type='value'){const el=$(id); if(!el)return; el.addEventListener('input',()=>{currentRecord[key]=type==='number'?(el.value===''?'':Number(el.value)):el.value; debounceSave()});}
let saveTimer; function debounceSave(){clearTimeout(saveTimer);saveTimer=setTimeout(save,450)}

async function setDate(date){
  currentDate=date; $('datePicker').value=date; currentRecord=await getDay(date); selectedBody=''; selectedExercise='🚶'; tempFiles={}; renderAll();
}
function renderAll(){
  $('dateText').textContent=new Date(currentDate+'T12:00:00').toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  const r=currentRecord;
  qsa('.emoji-grid button').forEach(b=>b.classList.toggle('active',r.moods.includes(b.dataset.mood)));
  $('moodNote').value=r.moodNote||'';
  $('wakeTime').value=r.wakeTime||'';$('sleepTime').value=r.sleepTime||'';$('napStart').value=r.napStart||'';$('napEnd').value=r.napEnd||'';$('nightWake').value=r.nightWake??'';
  $('wonderText').value=r.wonderText||'';$('money').value=r.money||'';$('moneyNote').value=r.moneyNote||'';
  ['progress','brave','ashamed','annoyed','regret','doneThings','weight','bodyFat','encouragement','planLife','planStudy','planWork'].forEach(id=>$(id).value=id.startsWith('plan')?r.plans[id.slice(4).toLowerCase()]||'':r[id]||'');
  renderMeals(); renderBody(); renderWonder(); renderMedia(); renderMemos(); renderExercises(); renderQuotes(); renderSummary(); renderArchive();
}
function renderSummary(){ $('coinSummary').textContent='¥ '+(Number(currentRecord.money||0).toFixed(2)); $('weightSummary').textContent=currentRecord.weight?currentRecord.weight+' kg':'—'; $('sleepSummary').textContent=currentRecord.sleepTime&&currentRecord.wakeTime?currentRecord.sleepTime+' → '+currentRecord.wakeTime:'—'}
function renderMeals(){
 const names=[['breakfast','🌅 早餐'],['lunch','☀️ 午餐'],['dinner','🌙 晚餐']];
 $('mealCards').innerHTML=names.map(([k,n])=>`<div class="meal-card"><h3>${n}</h3><div class="meal-photo" id="${k}Photo">📷 还没有照片</div><textarea class="textarea" id="${k}Text" placeholder="吃了什么？感觉怎么样？">${esc(currentRecord.meals[k].text||'')}</textarea><label class="upload" style="width:100%;margin-top:8px">📷 上传照片<input id="${k}Files" type="file" accept="image/*" multiple hidden></label></div>`).join('');
 names.forEach(([k])=>{ $(k+'Text').addEventListener('input',()=>{currentRecord.meals[k].text=$(k+'Text').value;debounceSave()}); $(k+'Files').addEventListener('change',e=>handleFiles(e.target.files,'meal:'+k,currentRecord.meals[k].files,k+'Photo'))});
 names.forEach(([k])=>showImages(currentRecord.meals[k].files,k+'Photo'));
}
async function handleFiles(files,category,targetArrayOrPreview,previewId){
 const arr=[...files]; if(!arr.length)return;
 const ids=[]; for(const f of arr){const id=await addFile(currentDate,category,f);ids.push(id)}
 if(Array.isArray(targetArrayOrPreview)){targetArrayOrPreview.push(...ids);await save(); renderAll()} else {showImages(ids,previewId)}
}
async function showImages(ids,containerId){
 const el=$(containerId);if(!el)return;el.innerHTML='';
 for(const id of ids||[]){const f=await getFile(id);if(!f)continue;const url=URL.createObjectURL(f.blob);const img=document.createElement('img');img.src=url;img.onload=()=>URL.revokeObjectURL(url);el.appendChild(img)}
}
function renderBody(){$('bodyLogs').innerHTML=currentRecord.bodyLogs.map((x,i)=>`<div class="log-item"><span><b>${x.part}</b> · ${x.time||'未填时间'} · ${esc(x.text)}</span><button onclick="removeBody(${i})">×</button></div>`).join('')||'<div class="muted">今天还没有身体记录。</div>'}
window.removeBody=i=>{currentRecord.bodyLogs.splice(i,1);save().then(renderAll)}
function renderWonder(){showImages(currentRecord.wonderFiles,'wonderPreview');$('wonderText').value=currentRecord.wonderText||''}
function renderQuotes(){
 listAllDays().then(days=>{$('quoteHistory').innerHTML=days.filter(d=>d.encouragement).slice(0,20).map(d=>`<div class="quote-card"><b>${d.date}</b>${esc(d.encouragement)}</div>`).join('')||'<div class="muted">每天写下一句，未来会慢慢长成一面墙。</div>'})
}
async function renderMedia(){
 $('mediaList').innerHTML=currentRecord.media.map((m,i)=>`<div class="media-card"><h3>${m.type} ${esc(m.title||'未命名')}</h3><p>${esc(m.note||'')}</p><div class="files">${(m.files||[]).map(id=>`<span class="file-chip" data-file="${id}">📎 文件</span>`).join(' ')}</div><button class="soft-btn" onclick="removeMedia(${i})">删除</button></div>`).join('')||'<div class="muted">今天还没有收藏笔记。</div>';
}
window.removeMedia=async i=>{for(const id of currentRecord.media[i].files||[])await deleteFile(id);currentRecord.media.splice(i,1);await save();renderAll()}
function renderMemos(){
 listAllDays().then(days=>{const memos=[];days.forEach(d=>(d.memos||[]).forEach((m,i)=>memos.push({...m,date:d.date,index:i})));$('memoList').innerHTML=memos.filter(m=>!m.done).sort((a,b)=>(a.remindAt||'').localeCompare(b.remindAt||'')).map(m=>`<div class="memo"><button onclick="completeMemo('${m.date}',${m.index})">○</button><div class="memo-body"><b>${esc(m.text)}</b><small>${m.remindAt?' · '+new Date(m.remindAt).toLocaleString('zh-CN'):''} · ${m.date}</small></div></div>`).join('')||'<div class="muted">没有未完成的备忘录。</div>'})
}
window.completeMemo=async(date,i)=>{const d=await getDay(date);d.memos=d.memos||[];d.memos[i].done=true;await putDay(d);renderMemos()}
async function addMemo(){const text=$('memoText').value.trim();if(!text)return;currentRecord.memos=currentRecord.memos||[];currentRecord.memos.push({text,remindAt:$('memoTime').value,done:false,createdAt:new Date().toISOString()});$('memoText').value='';$('memoTime').value='';await save();renderMemos();requestNotify()}
function renderExercises(){$('exerciseList').innerHTML=currentRecord.exercise.map((e,i)=>`<div class="exercise-card"><span class="ex-emoji">${e.type}</span><div style="flex:1"><b>${e.minutes||0} 分钟</b><div class="muted">${esc(e.text||'')}</div></div><button onclick="removeExercise(${i})">×</button></div>`).join('')||'<div class="muted">今天还没有运动记录。</div>'}
window.removeExercise=i=>{currentRecord.exercise.splice(i,1);save().then(renderAll)}
async function addExercise(){const mins=Number($('exerciseMinutes').value||0);if(!mins)return;const ids=[];for(const f of [...($('exerciseFiles').files||[])])ids.push(await addFile(currentDate,'exercise',f));currentRecord.exercise.push({type:selectedExercise,minutes:mins,text:$('exerciseText').value,files:ids});$('exerciseMinutes').value='';$('exerciseText').value='';$('exerciseFiles').value='';await save();renderAll()}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

function bindUI(){
 $('todayBtn').onclick=()=>setDate(new Date().toISOString().slice(0,10));
 $('datePicker').onchange=e=>setDate(e.target.value);
 $('prevDay').onclick=()=>shift(-1);$('nextDay').onclick=()=>shift(1);
 $('saveBtn').onclick=save;
 qsa('.emoji-grid button').forEach(b=>b.onclick=()=>{const m=b.dataset.mood;currentRecord.moods=currentRecord.moods.includes(m)?currentRecord.moods.filter(x=>x!==m):[...currentRecord.moods,m];save().then(renderAll)});
 bind('moodNote','moodNote');['wakeTime','sleepTime','napStart','napEnd','nightWake','wonderText','money','moneyNote','progress','brave','ashamed','annoyed','regret','doneThings','weight','bodyFat','encouragement'].forEach(id=>bind(id,id,id==='nightWake'||id==='money'||id==='weight'||id==='bodyFat'?'number':'value'));
 ['life','study','work'].forEach(k=>{$('plan'+k[0].toUpperCase()+k.slice(1)).addEventListener('input',()=>{currentRecord.plans[k]=$('plan'+k[0].toUpperCase()+k.slice(1)).value;debounceSave()})});
 qsa('#bodyMap button').forEach(b=>b.onclick=()=>{selectedBody=b.dataset.part;qsa('#bodyMap button').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('selectedPart').textContent='已选择：'+selectedBody});
 $('addBodyLog').onclick=async()=>{if(!selectedBody)return alert('先点一下身体部位');currentRecord.bodyLogs.push({part:selectedBody,time:$('bodyTime').value,text:$('bodyText').value});$('bodyTime').value='';$('bodyText').value='';await save();renderAll()};
 $('wonderFiles').onchange=e=>handleFiles(e.target.files,'wonder',currentRecord.wonderFiles,'wonderPreview');
 $('addMedia').onclick=addMedia;
 qsa('#exerciseTypes button').forEach(b=>b.onclick=()=>{selectedExercise=b.dataset.ex;qsa('#exerciseTypes button').forEach(x=>x.classList.remove('active'));b.classList.add('active')});qs('#exerciseTypes button').classList.add('active');
 $('addMemo').onclick=addMemo;$('archiveBtn').onclick=()=>{$('archivePanel').classList.remove('hidden');$('archivePanel').scrollIntoView({behavior:'smooth'})};$('closeArchive').onclick=()=>{$('archivePanel').classList.add('hidden')};
 $('backupBtn').onclick=backup;$('restoreInput').onchange=restore;
 $('dismissReminder').onclick=()=>$('reminderToast').classList.add('hidden');
}
async function addMedia(){const title=$('mediaTitle').value.trim();if(!title){alert('写一个作品名称吧');return}const ids=[];for(const f of [...($('mediaFiles').files||[])])ids.push(await addFile(currentDate,'media',f));currentRecord.media.push({title,type:$('mediaType').value,note:$('mediaNote').value,files:ids});$('mediaTitle').value='';$('mediaNote').value='';$('mediaFiles').value='';await save();renderAll()}
async function shift(n){const d=new Date(currentDate+'T12:00:00');d.setDate(d.getDate()+n);await setDate(d.toISOString().slice(0,10))}
async function renderArchive(){const days=await listAllDays();$('archiveList').innerHTML=days.map(d=>`<div class="archive-item"><button onclick="setDate('${d.date}')"><b>${d.date}</b><small>${d.moods.join(' ')} ${d.encouragement?' · 有鼓励语':''} ${d.wonderText?' · 有奇妙发现':''}</small></button></div>`).join('')||'<div class="muted">还没有其他日期的记录。</div>'}
async function backup(){
 const days=await listAllDays();const allFiles=await new Promise((res,rej)=>{const r=tx(FILES).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
 const fileData=[];for(const f of allFiles){fileData.push({id:f.id,date:f.date,category:f.category,name:f.name,type:f.type,size:f.size,data:await blobToDataURL(f.blob)})}
 const payload={version:1,exportedAt:new Date().toISOString(),days,files:fileData};
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload)],{type:'application/json'}));a.download='little-bunny-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
}
function blobToDataURL(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)})}
async function restore(e){
 const file=e.target.files[0];if(!file)return;const text=await file.text();const p=JSON.parse(text);for(const d of p.days||[])await putDay(d);
 for(const f of p.files||[]){const res=await fetch(f.data);const blob=await res.blob();await new Promise((resolve,reject)=>{const r=tx(FILES,'readwrite').add({date:f.date,category:f.category,name:f.name,type:f.type,size:f.size,blob});r.onsuccess=resolve;r.onerror=reject})}
 await setDate(currentDate);alert('备份恢复完成');e.target.value=''
}
function requestNotify(){if('Notification'in window&&Notification.permission==='default')Notification.requestPermission()}
async function checkReminders(){
 const now=Date.now();const days=await listAllDays();
 for(const d of days){for(const m of (d.memos||[])){if(!m.done&&m.remindAt&&new Date(m.remindAt).getTime()<=now&&!m.notified){m.notified=true;await putDay(d);showReminder(m.text);if('Notification'in window&&Notification.permission==='granted')new Notification('Little Bunny 提醒',{body:m.text})}}}
 renderMemos()
}
function showReminder(text){$('reminderTitle').textContent='该记得啦 🐇';$('reminderBody').textContent=text;$('reminderToast').classList.remove('hidden')}
async function init(){await openDB();bindUI();await setDate(currentDate);setInterval(checkReminders,30000);setTimeout(checkReminders,1500)}
init().catch(e=>{console.error(e);alert('记录本初始化失败，请刷新页面再试。')});
