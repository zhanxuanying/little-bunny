/* Little Bunny's Home
   纯静态 GitHub Pages 版本
   1) 把 NETEASE_PLAYLIST_URL 换成你的网易云歌单地址
   2) 如需真正自动播放背景音乐，把 AUDIO_URL 换成你有权使用的 mp3/ogg 文件地址。
   浏览器通常会阻止页面首次加载时的自动播放，用户第一次点击页面后即可启动。
*/
const NETEASE_PLAYLIST_URL = "https://music.163.com/#/user/home?id=3252572310";
const WEREAD_SHELF_URL = "https://weread.qq.com/";
const AUDIO_URL = ""; // 例如：assets/music.mp3

const plants = [
  {name:"月季花", emoji:"🌹", care:72, note:"晒太阳，记得修剪", harvest:false},
  {name:"小草", emoji:"🌿", care:88, note:"今天也绿油油", harvest:false},
  {name:"胡萝卜", emoji:"🥕", care:82, note:"成熟后可以收获", harvest:true},
  {name:"向日葵", emoji:"🌻", care:64, note:"朝着太阳长大", harvest:false},
  {name:"康乃馨", emoji:"🌸", care:76, note:"温柔地浇水", harvest:false},
  {name:"芍药", emoji:"💐", care:59, note:"花苞正在慢慢长大", harvest:false},
  {name:"铃兰", emoji:"🤍", care:70, note:"喜欢半阴和微风", harvest:false}
];
const tracks = [
  ["A whole New World","黄昏散步歌单"],["星辰大海","兔兔收藏"],["想去海边","晴天播放"],["好想你","厨房里的歌"],["温柔的夜","睡前歌单"]
];
const states = [
  ["read","兔兔正在读书","“今天也要留一点时间给喜欢的事情。”"],
  ["water","兔兔正在照顾花园","“花会记得每一次被认真浇过的水。”"],
  ["cook","兔兔正在厨房做饭","“把喜欢的味道，煮成一顿晚饭。”"],
  ["listen","兔兔戴着耳机听歌","“这一首歌，适合今天的黄昏。”"],
  ["walk","兔兔出门散步","“去风里走一小圈，再回家。”"],
  ["sleep","兔兔已经睡着啦","“晚安。明天醒来，又是新的一天。”"]
];

let timerId = null, timerSeconds = 1500, currentTrack = 0, audioStarted = false;
const $ = s => document.querySelector(s);

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show-toast");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show-toast"),1900)}

function getBJNow(){
  return new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Shanghai"}));
}
function updateClock(){
  const d=getBJNow(), pad=n=>String(n).padStart(2,"0");
  const weekdays=["日","一","二","三","四","五","六"];
  $("#cnDate").textContent=`北京时间 · ${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} 周${weekdays[d.getDay()]}`;
  $("#cnTime").textContent=`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  updateDayNight(d);
}
function updateDayNight(d){
  const h=d.getHours()+d.getMinutes()/60;
  document.body.classList.toggle("night",h<6.1||h>=18.5);
}
setInterval(updateClock,1000);updateClock();

function weatherText(code){
  const map={0:["☀️","晴"],1:["🌤️","基本晴朗"],2:["⛅","少云"],3:["☁️","阴"],45:["🌫️","雾"],48:["🌫️","雾凇"],51:["🌦️","毛毛雨"],53:["🌦️","小雨"],55:["🌧️","雨"],61:["🌦️","小雨"],63:["🌧️","中雨"],65:["🌧️","大雨"],71:["🌨️","小雪"],73:["❄️","中雪"],75:["❄️","大雪"],80:["🌦️","阵雨"],81:["🌧️","阵雨"],82:["⛈️","强阵雨"],95:["⛈️","雷雨"],96:["⛈️","雷雨冰雹"],99:["⛈️","强雷雨"]};return map[code]||["☁️","多云"];
}
async function loadWeather(){
  try{
    const url="https://api.open-meteo.com/v1/forecast?latitude=30.2741&longitude=120.1551&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=Asia%2FShanghai";
    const r=await fetch(url);const d=await r.json();const [ico,text]=weatherText(d.current.weather_code);
    $("#weatherIcon").textContent=ico;$("#weatherText").textContent=`杭州 · ${text} ${Math.round(d.current.temperature_2m)}°C`;
  }catch(e){$("#weatherText").textContent="杭州 · 天气暂时无法获取"}
}
loadWeather();

const bunnyRoutine=[
  ["walk","兔兔走向书房","“去拿今天想看的那本书。”",9000],
  ["read","兔兔坐下来读书","“安静地读几页，窗外的风也慢下来。”",26000],
  ["stretch","兔兔伸了个懒腰","“眼睛休息一下，再去花园看看。”",7000],
  ["water","兔兔正在花园浇水","“月季、铃兰和胡萝卜，都喝一点水吧。”",24000],
  ["garden","兔兔在花园看花","“风吹过来了，花朵也一起摇晃。”",13000],
  ["cook","兔兔回厨房做饭","“把刚收的胡萝卜做成今天的晚饭。”",25000],
  ["eat","兔兔坐下来吃饭","“好香。认真吃饭也是生活的一部分。”",15000],
  ["walk","兔兔出门散步","“去城堡外面走一小圈，看看黄昏。”",28000],
  ["listen","兔兔在黄昏听歌","“这一首歌，适合湖边的风。”",26000],
  ["bath","兔兔洗澡啦","“洗掉一天的疲惫，换上柔软的睡衣。”",17000],
  ["sleep","兔兔回床睡觉","“晚安。明天醒来，又是新的一天。”",42000]
];
let routineIndex=0,routineStart=performance.now();
function setBunnyRoutine(item){
 const [state,status,thought]=item;const b=$("#heroBunny");b.dataset.state=state;
 $("#bunnyStatus").textContent=status;$("#bunnyThought").textContent=thought;
 b.classList.remove("action-spark");void b.offsetWidth;b.classList.add("action-spark");
}
function routineFrame(now){
 const item=bunnyRoutine[routineIndex],elapsed=now-routineStart;
 const progress=Math.min(100,elapsed/item[3]*100);
 const bar=$(".daily-card");
 if(bar) bar.style.setProperty("--routine-progress",progress+"%");
 if(elapsed>=item[3]){routineIndex=(routineIndex+1)%bunnyRoutine.length;routineStart=now;setBunnyRoutine(bunnyRoutine[routineIndex]);}
 requestAnimationFrame(routineFrame);
}
setBunnyRoutine(bunnyRoutine[0]);requestAnimationFrame(routineFrame);

function renderDiary(){
  const entries=[
    ["2026.09.12","今天给月季浇了水，听完一张专辑。阳光落在窗台上，好像有人把金粉洒下来。"],
    ["2026.09.09","胡萝卜成熟啦。洗干净，切成小块，今晚做一顿暖暖的饭。"],
    ["2026.09.05","下午读了几页书，又在花园里坐了一会儿。什么都没赶，也很好。"],
    ["2026.08.28","下班回家以后听歌、做饭、看了一集喜欢的剧。普通的一天也值得记录。"]
  ];
  $("#diaryList").innerHTML=entries.map(e=>`<article class="entry"><small>♡ ${e[0]}</small><p>${e[1]}</p></article>`).join("");
}
renderDiary();
function addDiary(){const text=prompt("写下今天的一句话：");if(!text)return;const el=document.createElement("article");el.className="entry";el.innerHTML=`<small>♡ ${new Date().toLocaleDateString("zh-CN")}</small><p></p>`;el.querySelector("p").textContent=text;$("#diaryList").prepend(el);toast("这一页日记收好了 ✦")}

function renderPlants(){
  const score=plants.filter(p=>p.care>=95).length;$("#gardenScore").textContent=score;
  $("#plantList").innerHTML=plants.map((p,i)=>`
    <div class="plant">
      <div class="plant-top"><span class="plant-name">${p.name}</span><span class="plant-emoji">${p.emoji}</span></div>
      <small>${p.note}</small><div class="bar"><i style="width:${p.care}%"></i></div>
      <div class="plant-actions">
        <button onclick="carePlant(${i},8)">💧 浇水</button>
        <button onclick="carePlant(${i},5)">✨ 施肥</button>
        ${p.harvest?`<button class="harvest" onclick="harvestCarrot(${i})">🥕 收获</button>`:""}
      </div>
    </div>`).join("");
  $("#plantScene").innerHTML=plants.map(p=>`<span title="${p.name}">${p.emoji}</span>`).join("");
}
function carePlant(i,amount){plants[i].care=Math.min(100,plants[i].care+amount);$("#gardenBunny").style.transform="scale(.78) translateY(-8px)";setTimeout(()=>$("#gardenBunny").style.transform="",500);renderPlants();toast(`${plants[i].name} 被照顾得更精神啦 🌱`)}
function harvestCarrot(i){if(plants[i].care<90){toast("胡萝卜还没完全成熟，再照顾它一下吧 🥕");return}plants[i].care=45;renderPlants();toast("收获了一根甜甜的胡萝卜！今晚吃它 🥕")}
renderPlants();

function addTodo(){
  const input=$("#todoInput"),v=input.value.trim();if(!v)return;
  const li=document.createElement("li");li.innerHTML=`<span></span><button class="delete">×</button>`;li.querySelector("span").textContent=v;
  li.querySelector("span").onclick=()=>li.classList.toggle("done");li.querySelector(".delete").onclick=()=>li.remove();$("#todoList").prepend(li);input.value="";
}
$("#todoInput").addEventListener("keydown",e=>{if(e.key==="Enter")addTodo()});

function renderTimer(){const m=Math.floor(timerSeconds/60),s=timerSeconds%60;$("#timer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
function startTimer(){if(timerId)return;timerId=setInterval(()=>{if(timerSeconds<=0){clearInterval(timerId);timerId=null;toast("番茄钟完成啦，起来走走吧 🍅");return}timerSeconds--;renderTimer()},1000)}
function resetTimer(){clearInterval(timerId);timerId=null;timerSeconds=1500;renderTimer()}

function calculate(){
  const raw=$("#calc").value.trim();if(!raw)return;
  if(!/^[0-9+\-*/().%\s]+$/.test(raw)){toast("只支持数字和 + - * / % ( )");return}
  try{$("#calcResult").textContent=Function(`"use strict";return (${raw})`)()}catch{$("#calcResult").textContent="算式有误"}
}
function saveMemo(){localStorage.setItem("bunnyMemo",$("#memo").value);toast("小纸条收进抽屉了 ✦")}
$("#memo").value=localStorage.getItem("bunnyMemo")||"";

function renderPlaylist(){
  $("#playlist").innerHTML=tracks.map((t,i)=>`<div class="track ${i===currentTrack?"active":""}" onclick="selectTrack(${i})"><span class="track-num">${String(i+1).padStart(2,"0")}</span><div><b>${t[0]}</b><small>${t[1]}</small></div></div>`).join("");
  $("#trackTitle").textContent=tracks[currentTrack][0];$("#trackArtist").textContent=tracks[currentTrack][1];
}
function selectTrack(i){currentTrack=i;renderPlaylist();toast(`已选中：${tracks[i][0]}`)}
function prevTrack(){selectTrack((currentTrack-1+tracks.length)%tracks.length)}
function nextTrack(){selectTrack((currentTrack+1)%tracks.length)}
function toggleAudio(){
  const audio=$("#bgAudio");
  if(!AUDIO_URL){window.open(NETEASE_PLAYLIST_URL,"_blank","noopener");toast("已打开网易云歌单。请在 script.js 设置 AUDIO_URL 才能在本页播放。");return}
  if(audio.paused){audio.play().then(()=>{audioStarted=true;toast("音乐开始啦 🎵")}).catch(()=>toast("请先点击页面一次，再播放音乐"))}else audio.pause();
}
$("#neteaseLink").href=NETEASE_PLAYLIST_URL;renderPlaylist();

document.addEventListener("click",()=>{if(AUDIO_URL&&!audioStarted){const a=$("#bgAudio");a.src=AUDIO_URL;a.play().then(()=>audioStarted=true).catch(()=>{})}}, {once:true});
$("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("night");toast(document.body.classList.contains("night")?"晚安模式 🌙":"白天模式 ☀️")});
$("#year").textContent=new Date().getFullYear();

$("#wereadLink").href=WEREAD_SHELF_URL;
