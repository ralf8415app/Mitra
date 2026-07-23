'use strict';

const COLORS = [
  ['#f250c3','#8d1bb5'], ['#7c37df','#46129c'], ['#f44a3d','#b51f1d'],
  ['#32c6b4','#168c82'], ['#ffb329','#e56b12'], ['#4bb8ff','#176dc6']
];

const state = {
  level: Number(localStorage.getItem('yr_level') || 1),
  speed: 1,
  hp: 1,
  progress: 0,
  queue: [],
  machines: [0,0],
  sequence: [],
  targetCount: 1,
  rainbowCount: 3,
  busy: false
};

const $ = s => document.querySelector(s);
const slots = $('#slots');
const spools = $('#spools');
const machines = $('#machines');
const controls = $('#controls');

function seeded(n){
  const x = Math.sin(n * 999.91) * 43758.5453;
  return x - Math.floor(x);
}

function buildLevel(){
  state.progress = 0; state.hp = 1; state.queue=[]; state.machines=[0,0]; state.busy=false;
  const pieces = Math.min(12, 6 + Math.floor(state.level/3));
  state.sequence = Array.from({length:pieces},(_,i)=>Math.floor(seeded(state.level*31+i)*Math.min(COLORS.length,3+Math.floor(state.level/8))));
  document.documentElement.style.setProperty('--dummy','0');
  $('#levelLabel').textContent=`Level ${state.level}`;
  render();
}

function render(){
  $('#progressLabel').textContent=`${state.progress}%`;
  $('#hearts').textContent = state.hp===3?'❤️❤️❤️':state.hp===2?'❤️❤️🤍':'❤️🤍🤍';
  $('#targetCount').textContent=state.targetCount;
  $('#rainbowCount').textContent=state.rainbowCount;

  slots.innerHTML='';
  for(let i=0;i<10;i++){
    const el=document.createElement('div');el.className='slot';
    if(state.queue[i]!==undefined){const m=document.createElement('div');m.className='mini';m.style.background=COLORS[state.queue[i]][0];el.append(m)}
    slots.append(el);
  }

  spools.innerHTML='';
  state.sequence.slice(0,6).forEach((c,i)=>{
    const b=document.createElement('button');b.className='spool';b.style.setProperty('--spool',COLORS[c][0]);b.textContent=i<3?(i===0?'↓':i===1?'↓':'↑'):'';
    b.onclick=()=>pickSpool(i); spools.append(b);
  });

  machines.innerHTML=''; controls.innerHTML='';
  state.machines.forEach((v,i)=>{
    const m=document.createElement('div');m.className='machine';m.textContent=v;machines.append(m);
    const c=document.createElement('button');c.className='control';c.textContent=i===0?'◀':'▶';c.onclick=()=>feedMachine(i);controls.append(c);
  });
  drawRope();
}

function pickSpool(index){
  if(state.busy || index>=state.sequence.length) return;
  if(state.queue.length>=10){showModal('Kein Platz','Die Ablage ist voll. Verarbeite zuerst Garn.');return;}
  state.queue.push(state.sequence.splice(index,1)[0]);
  render();
}

function feedMachine(machineIndex){
  if(state.busy || state.queue.length===0) return;
  const wanted = state.sequence.length ? state.sequence[0] : state.queue[0];
  const idx = state.queue.findIndex(c=>c===wanted);
  if(idx<0){state.hp--; if(state.hp<=0){lose();return;} render(); return;}
  state.busy=true;
  const color=state.queue.splice(idx,1)[0];
  state.machines[machineIndex]++;
  animateFeed(color,()=>{
    state.progress=Math.min(100,state.progress+Math.ceil(100/(6+Math.floor(state.level/3))));
    if(state.sequence.length===0 && state.queue.length===0 || state.progress>=100){win();return;}
    state.busy=false;render();
  });
}

function animateFeed(color,done){
  const dot=document.createElement('div');dot.className='spool';dot.style.setProperty('--spool',COLORS[color][0]);dot.style.position='fixed';
  const src=machines.getBoundingClientRect();dot.style.left=(src.left+src.width/2-22)+'px';dot.style.top=(src.top+20)+'px';dot.style.zIndex='90';document.body.append(dot);
  const cat=$('#cat').getBoundingClientRect();
  dot.animate([{transform:'scale(1)',left:dot.style.left,top:dot.style.top},{transform:'scale(.45)',left:(cat.left+18)+'px',top:(cat.top+35)+'px'}],{duration:700/state.speed,easing:'ease-in-out'}).onfinish=()=>{dot.remove();done()};
}

function drawRope(){
  const layer=$('#ropeLayer');layer.innerHTML='';
  const total=12, completed=Math.round(state.progress/100*total);
  const pts=[];
  for(let i=0;i<=total;i++){
    const t=i/total;
    const x=70 + t*500;
    const y=340 + Math.sin(t*Math.PI*2.2)*52 + t*15;
    pts.push([x,y]);
  }
  for(let i=0;i<completed;i++){
    const [x1,y1]=pts[i],[x2,y2]=pts[i+1];
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*180/Math.PI;
    const s=document.createElement('div');s.className='rope-segment';
    const col=COLORS[i%COLORS.length];s.style.setProperty('--c1',col[0]);s.style.setProperty('--c2',col[1]);
    s.style.left=x1+'px';s.style.top=y1+'px';s.style.width=(len+10)+'px';s.style.transform=`rotate(${ang}deg)`;layer.append(s);
  }
}

function win(){
  localStorage.setItem('yr_level',String(state.level+1));
  showModal('Geschafft!','<div class="win">🎉🐱🧶</div><p>Die Katze wurde gerettet.</p><button class="action" id="nextBtn">Nächstes Level</button>');
  setTimeout(()=>{const b=$('#nextBtn');if(b)b.onclick=()=>{hideModal();state.level++;buildLevel();}},0);
}
function lose(){
  showModal('Level verloren','<div class="win">😿</div><p>Zu viele falsche Garne.</p><button class="action" id="retryBtn">Nochmal</button>');
  setTimeout(()=>{const b=$('#retryBtn');if(b)b.onclick=()=>{hideModal();buildLevel();}},0);
}
function showModal(title,html){$('#modalTitle').textContent=title;$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}
function hideModal(){$('#modal').classList.add('hidden')}

$('#settingsBtn').onclick=()=>showModal('Einstellungen','<div class="help"><p><b>Spielprinzip:</b> Lege Garn in die Ablage und schicke passende Farben zur Maschine. Jede richtige Farbe verlängert das Seil.</p><p>Das Spiel speichert den Levelstand automatisch auf dem Gerät.</p></div><button class="action" id="resetBtn">Fortschritt löschen</button>');
$('#closeModal').onclick=hideModal;
$('#speedBtn').onclick=()=>{state.speed=state.speed===1?2:1;$('#speedBtn').textContent=`⏩ x${state.speed}`};
$('#vipBtn').onclick=()=>showModal('V.I.P.','Diese private GitHub-Version enthält keine Käufe und keine Werbung.');

document.querySelectorAll('[data-boost]').forEach(b=>b.onclick=()=>{
  const type=b.dataset.boost;
  if(type==='shuffle'){state.queue.sort(()=>Math.random()-.5);render()}
  if(type==='target'&&state.targetCount>0&&state.queue.length){state.targetCount--;const wanted=state.sequence[0];const idx=state.queue.findIndex(c=>c===wanted);if(idx>=0){state.queue.unshift(state.queue.splice(idx,1)[0])}render()}
  if(type==='rainbow'&&state.rainbowCount>0){state.rainbowCount--;state.progress=Math.min(100,state.progress+15);render();if(state.progress>=100)win()}
  if(type==='hammer'){state.hp=Math.min(3,state.hp+1);render()}
});

document.addEventListener('click',e=>{if(e.target?.id==='resetBtn'){localStorage.removeItem('yr_level');state.level=1;hideModal();buildLevel()}});

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
buildLevel();
