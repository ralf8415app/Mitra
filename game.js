'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const $ = s => document.querySelector(s);

const COLORS = ['#ef3e4a','#8c43df','#ff9f24','#2abf8a','#2f8be6','#f04fb8'];
const DARK = ['#a91e2a','#552099','#b65d0c','#14775a','#1855a4','#9b226f'];

const state = {
  level: Math.max(1, Number(localStorage.getItem('dsr_level') || 1)),
  speed: 1,
  dragonY: 78,
  dragonDir: 1,
  dragonTimer: 0,
  stones: [],
  bullets: [],
  particles: [],
  aimX: 360,
  aimY: 430,
  dragging: false,
  currentColor: 0,
  nextColor: 1,
  score: 0,
  target: 10,
  lives: 3,
  shield: 0,
  rainbow: 3,
  bombs: 2,
  running: true,
  lastTime: performance.now(),
  spawnTimer: 0,
  shotCooldown: 0,
  won: false
};

function resizeCanvas(){
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.round(r.width*dpr));
  canvas.height = Math.max(1, Math.round(r.height*dpr));
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resizeCanvas);

function seeded(n){const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x)}
function randColor(){return Math.floor(Math.random()*Math.min(COLORS.length,3+Math.floor(state.level/4)))}
function levelTarget(){return Math.min(32,8+state.level*2)}

function resetLevel(){
  state.target=levelTarget(); state.score=0; state.lives=3; state.shield=0;
  state.stones=[]; state.bullets=[]; state.particles=[]; state.dragonY=78; state.dragonDir=1;
  state.currentColor=randColor(); state.nextColor=randColor(); state.spawnTimer=.5; state.shotCooldown=0;
  state.running=true; state.won=false; updateHud(); hideModal();
}

function updateHud(){
  $('#levelLabel').textContent=`Level ${state.level}`;
  $('#progressLabel').textContent=`${Math.min(100,Math.round(state.score/state.target*100))}%`;
  $('#nextBall').style.background=COLORS[state.nextColor];
  $('#rainbowCount').textContent=state.rainbow;
  $('#bombCount').textContent=state.bombs;
  $('#shieldCount').textContent=state.shield;
}

function spawnStone(){
  const w=canvas.clientWidth, maxColors=Math.min(COLORS.length,3+Math.floor(state.level/4));
  const color=Math.floor(Math.random()*maxColors);
  const radius=18+Math.random()*7;
  const x=55+Math.random()*(w-110);
  state.stones.push({x,y:state.dragonY+48,r:radius,color,hp:1,vy:34+state.level*2+Math.random()*18,wobble:Math.random()*6.28,dragged:true});
}

function shoot(x,y,forcedColor=null){
  if(!state.running || state.shotCooldown>0) return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  const sx=w/2, sy=h-62;
  let dx=x-sx,dy=y-sy; const len=Math.hypot(dx,dy)||1; dx/=len;dy/=len;
  const color=forcedColor===null?state.currentColor:forcedColor;
  state.bullets.push({x:sx,y:sy,vx:dx*500,vy:dy*500,r:12,color,rainbow:forcedColor===-1});
  state.currentColor=state.nextColor; state.nextColor=randColor(); state.shotCooldown=.22; updateHud();
}

function burst(x,y,color,count=12){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=45+Math.random()*110;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.55+Math.random()*.35,color})}}

function hitStone(b,s){
  if(b.rainbow || b.color===s.color){
    burst(s.x,s.y,COLORS[s.color]); state.score++; s.dead=true; b.dead=true; updateHud();
    if(state.score>=state.target) win();
  } else {
    b.dead=true; s.vy+=35; flash('Falsche Farbe!');
  }
}

function flash(text){const m=$('#message');m.textContent=text;m.classList.remove('hidden');clearTimeout(flash.t);flash.t=setTimeout(()=>m.classList.add('hidden'),700)}

function update(dt){
  if(!state.running) return;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  state.shotCooldown=Math.max(0,state.shotCooldown-dt);
  state.dragonTimer+=dt*state.speed;
  state.dragonY += state.dragonDir*(16+state.level*.7)*dt*state.speed;
  if(state.dragonY>125){state.dragonDir=-1}else if(state.dragonY<68){state.dragonDir=1}
  state.spawnTimer-=dt*state.speed;
  if(state.spawnTimer<=0){spawnStone();state.spawnTimer=Math.max(.55,1.45-state.level*.035)+Math.random()*.35}

  for(const s of state.stones){
    s.wobble+=dt*2.2; s.x+=Math.sin(s.wobble)*9*dt; s.y+=s.vy*dt*state.speed;
    if(s.y>h-105 && !s.dead){
      s.dead=true;
      if(state.shield>0){state.shield--;flash('Schild schützt dich!')}else{state.lives--;flash(`Stein durchgekommen – ${state.lives} Leben`)}
      updateHud(); if(state.lives<=0) lose();
    }
  }
  for(const b of state.bullets){b.x+=b.vx*dt*state.speed;b.y+=b.vy*dt*state.speed;if(b.y<-30||b.x<-30||b.x>w+30)b.dead=true}
  for(const b of state.bullets){if(b.dead)continue;for(const s of state.stones){if(s.dead)continue;const rr=b.r+s.r;if((b.x-s.x)**2+(b.y-s.y)**2<=rr*rr){hitStone(b,s);break}}}
  for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=170*dt;p.life-=dt}
  state.stones=state.stones.filter(s=>!s.dead);state.bullets=state.bullets.filter(b=>!b.dead);state.particles=state.particles.filter(p=>p.life>0);
}

function drawBackground(w,h){
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#65d5e9');g.addColorStop(.62,'#82dfed');g.addColorStop(.621,'#e4f5f9');g.addColorStop(1,'#f8fcfd');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.25;ctx.fillStyle='#fff';for(let i=0;i<18;i++){const x=(i*79+state.dragonTimer*10)%w,y=70+(i*47)%(h*.55);ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  ctx.font='38px serif';ctx.fillText('🪸',w*.12,h*.48);ctx.fillText('🐚',w*.77,h*.42);ctx.fillText('⭐',w*.66,h*.52);
}

function drawDragon(w){
  const x=w/2,y=state.dragonY;
  ctx.save();ctx.translate(x,y);ctx.shadowColor='rgba(0,0,0,.22)';ctx.shadowBlur=8;ctx.shadowOffsetY=5;
  ctx.font='78px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐉',0,0);ctx.restore();
  ctx.strokeStyle='rgba(91,49,35,.55)';ctx.lineWidth=5;for(const s of state.stones){if(s.dragged&&s.y<y+95){ctx.beginPath();ctx.moveTo(x,y+24);ctx.lineTo(s.x,s.y-s.r);ctx.stroke()}}
}

function drawStone(s){
  const g=ctx.createRadialGradient(s.x-s.r*.35,s.y-s.r*.4,3,s.x,s.y,s.r);g.addColorStop(0,'#fff');g.addColorStop(.18,COLORS[s.color]);g.addColorStop(1,DARK[s.color]);ctx.fillStyle=g;ctx.beginPath();
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=s.r*(i%2?0.88:1);const x=s.x+Math.cos(a)*r,y=s.y+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.stroke();
}

function drawLauncher(w,h){
  const x=w/2,y=h-62;ctx.save();ctx.translate(x,y);ctx.fillStyle='#68748a';ctx.fillRect(-19,-30,38,48);ctx.fillStyle='#353b49';ctx.fillRect(-8,-52,16,32);ctx.fillStyle=COLORS[state.currentColor];ctx.beginPath();ctx.arc(0,-56,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=3;ctx.stroke();ctx.restore();
  const dx=state.aimX-x,dy=state.aimY-y,len=Math.hypot(dx,dy)||1;ctx.save();ctx.setLineDash([8,9]);ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-48);ctx.lineTo(x+dx/len*160,y-48+dy/len*160);ctx.stroke();ctx.restore();
}

function draw(){
  const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);drawBackground(w,h);drawDragon(w);
  for(const s of state.stones)drawStone(s);
  for(const b of state.bullets){ctx.fillStyle=b.rainbow?'#fff':COLORS[b.color];ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=b.rainbow?'#ff55c8':'white';ctx.lineWidth=3;ctx.stroke()}
  for(const p of state.particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5)}ctx.globalAlpha=1;
  drawLauncher(w,h);
  ctx.fillStyle='rgba(38,61,77,.83)';ctx.font='bold 16px system-ui';ctx.textAlign='left';ctx.fillText(`❤️ ${state.lives}`,16,h-22);ctx.textAlign='right';ctx.fillText(`${state.score}/${state.target} Steine`,w-16,h-22);ctx.textAlign='start';
}

function loop(now){const dt=Math.min(.035,(now-state.lastTime)/1000);state.lastTime=now;update(dt);draw();requestAnimationFrame(loop)}

function pointerPos(e){const r=canvas.getBoundingClientRect();const p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}}
canvas.addEventListener('pointerdown',e=>{e.preventDefault();state.dragging=true;const p=pointerPos(e);state.aimX=p.x;state.aimY=p.y});
canvas.addEventListener('pointermove',e=>{if(!state.dragging)return;e.preventDefault();const p=pointerPos(e);state.aimX=p.x;state.aimY=p.y});
canvas.addEventListener('pointerup',e=>{if(!state.dragging)return;e.preventDefault();const p=pointerPos(e);state.aimX=p.x;state.aimY=p.y;state.dragging=false;shoot(p.x,p.y)});
canvas.addEventListener('pointercancel',()=>state.dragging=false);

function win(){if(state.won)return;state.won=true;state.running=false;localStorage.setItem('dsr_level',String(state.level+1));showModal('Level geschafft!',`<div class="big">🎉🐉</div><p>Alle farbigen Steine wurden abgeschossen.</p><button class="action" id="nextBtn">Nächstes Level</button>`);setTimeout(()=>{$('#nextBtn').onclick=()=>{state.level++;resetLevel()}},0)}
function lose(){state.running=false;showModal('Level verloren',`<div class="big">💥</div><p>Zu viele Steine sind unten angekommen.</p><button class="action" id="retryBtn">Noch einmal</button>`);setTimeout(()=>{$('#retryBtn').onclick=resetLevel},0)}
function showModal(title,html){$('#modalTitle').textContent=title;$('#modalContent').innerHTML=html;$('#modal').classList.remove('hidden')}
function hideModal(){$('#modal').classList.add('hidden')}

$('#closeModal').onclick=()=>{hideModal();state.running=true};
$('#settingsBtn').onclick=()=>{state.running=false;showModal('Spielanleitung',`<div class="help"><p><b>Ziel:</b> Der Drache steigt herab und lässt farbige Steine fallen.</p><p>Ziehe auf dem Spielfeld zum Zielen und lasse los. Nur eine Kugel derselben Farbe zerstört den Stein.</p><p>🌈 trifft jede Farbe, 💣 zerstört mehrere Steine, 🛡️ hält einen durchgekommenen Stein ab.</p></div><button class="action" id="resetBtn">Fortschritt löschen</button>`)};
$('#speedBtn').onclick=()=>{state.speed=state.speed===1?2:1;$('#speedBtn').textContent=`⏩ x${state.speed}`};
$('#rainbowBtn').onclick=()=>{if(state.rainbow>0&&state.running){state.rainbow--;shoot(state.aimX,state.aimY,-1);updateHud()}};
$('#bombBtn').onclick=()=>{if(state.bombs>0&&state.running&&state.stones.length){state.bombs--;const victims=[...state.stones].sort((a,b)=>b.y-a.y).slice(0,4);for(const s of victims){s.dead=true;state.score++;burst(s.x,s.y,COLORS[s.color],18)}updateHud();if(state.score>=state.target)win()}};
$('#shieldBtn').onclick=()=>{if(state.shield<3){state.shield++;updateHud();flash('Schild aktiviert')}};
document.addEventListener('click',e=>{if(e.target?.id==='resetBtn'){localStorage.removeItem('dsr_level');state.level=1;resetLevel()}});

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
resizeCanvas();resetLevel();requestAnimationFrame(t=>{state.lastTime=t;requestAnimationFrame(loop)});
