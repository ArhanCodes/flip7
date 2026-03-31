export function getHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flip 7</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0f0f1a;--card:#1a1a2e;--card2:#16213e;--border:#2a2a4a;
    --text:#f0f0f5;--muted:#8888aa;--gold:#f59e0b;--gold-light:#fcd34d;
    --gold-glow:rgba(245,158,11,0.3);--green:#22c55e;--red:#ef4444;
    --blue:#3b82f6;--purple:#8b5cf6;--cyan:#06b6d4;
  }
  body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
  .container{max-width:800px;margin:0 auto;padding:16px}
  header{text-align:center;margin-bottom:16px}
  h1{font-size:2.4rem;font-weight:900;letter-spacing:.15em;
    background:linear-gradient(135deg,var(--gold),#f97316,var(--gold-light));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .sub{color:var(--muted);font-size:.85rem}
  .toast{position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-100px);
    background:var(--red);color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;
    z-index:1000;transition:transform .3s;pointer-events:none}
  .toast.show{transform:translateX(-50%) translateY(0)}
  .screen{display:none}.screen.active{display:block}

  .box{max-width:440px;margin:20px auto;text-align:center;background:var(--card);
    border:1px solid var(--border);border-radius:16px;padding:32px}
  .box h2{font-size:1.2rem;margin-bottom:16px}
  .row{display:flex;gap:10px;margin-bottom:12px}
  .row input,.row select{flex:1;background:var(--bg);border:2px solid var(--border);color:var(--text);
    padding:10px 14px;border-radius:10px;font-size:.95rem;outline:none}
  .row input:focus,.row select:focus{border-color:var(--gold)}
  .row input::placeholder{color:var(--muted)}
  .divider{color:var(--muted);font-size:.8rem;margin:10px 0;text-transform:uppercase;letter-spacing:.1em}
  .code-big{font-size:2.2rem;font-weight:900;letter-spacing:.3em;cursor:pointer;padding:8px 16px;
    border:2px dashed var(--border);border-radius:10px;display:inline-block;margin:8px 0 12px}
  .code-big:hover{border-color:var(--muted)}
  .hint{font-size:.75rem;color:var(--muted);margin-bottom:12px}

  .btn{padding:12px 24px;border:none;border-radius:10px;font-size:.9rem;font-weight:700;cursor:pointer;
    transition:all .2s;text-transform:uppercase;letter-spacing:.08em;display:inline-flex;
    align-items:center;justify-content:center;gap:6px}
  .btn:active{transform:scale(.96)}
  .btn-gold{background:linear-gradient(135deg,var(--gold),#f97316);color:#fff;
    box-shadow:0 4px 16px var(--gold-glow)}
  .btn-gold:hover{box-shadow:0 6px 24px var(--gold-glow)}
  .btn-green{background:var(--green);color:#fff}
  .btn-red{background:var(--red);color:#fff}
  .btn-sec{background:var(--card);color:var(--text);border:2px solid var(--border)}
  .btn-sec:hover{border-color:var(--muted)}
  .btn-full{width:100%}
  .btn-disabled{opacity:.35;pointer-events:none}

  .player-list{text-align:left;margin:12px 0}
  .pl-item{padding:10px 14px;background:var(--bg);border:1px solid var(--border);
    border-radius:8px;margin-bottom:6px;font-weight:600;display:flex;align-items:center;gap:8px}
  .pl-item .pl-n{background:var(--gold);color:#000;width:24px;height:24px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;flex-shrink:0}
  .pl-item.is-you{border-color:var(--gold)}

  /* Game */
  .event-bar{text-align:center;padding:10px 14px;border-radius:10px;margin-bottom:12px;
    font-weight:600;font-size:.9rem;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);color:var(--gold-light)}
  .turn-bar{text-align:center;padding:8px;border-radius:8px;margin-bottom:12px;
    font-weight:700;font-size:.95rem;text-transform:uppercase;letter-spacing:.08em}
  .turn-bar.my-turn{background:rgba(34,197,94,.12);color:var(--green);border:1px solid rgba(34,197,94,.3)}
  .turn-bar.waiting{background:rgba(139,92,246,.1);color:var(--purple);border:1px solid rgba(139,92,246,.25)}

  .scoreboard{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
  .sb-item{flex:1;min-width:100px;background:var(--card);border:1px solid var(--border);border-radius:10px;
    padding:10px;text-align:center}
  .sb-item.active{border-color:var(--gold);box-shadow:0 0 10px var(--gold-glow)}
  .sb-item.busted{opacity:.4;border-color:var(--red)}
  .sb-item.stayed{border-color:var(--green)}
  .sb-item.frozen{border-color:var(--cyan)}
  .sb-name{font-weight:700;font-size:.8rem;margin-bottom:2px}
  .sb-total{font-size:1.4rem;font-weight:900;color:var(--gold)}
  .sb-round{font-size:.7rem;color:var(--muted)}
  .sb-status{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-top:2px}
  .sb-status.s-bust{color:var(--red)}
  .sb-status.s-stay{color:var(--green)}
  .sb-status.s-frozen{color:var(--cyan)}

  .my-cards{margin-bottom:14px}
  .my-cards h3{font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
  .card-row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
  .c{width:56px;height:78px;border-radius:8px;display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:1rem;flex-direction:column;gap:2px;border:2px solid}
  .c.c-num{background:#1e293b;border-color:#334155;color:var(--text)}
  .c.c-mod{background:rgba(139,92,246,.12);border-color:var(--purple);color:var(--purple)}
  .c.c-act{background:rgba(6,182,212,.1);border-color:var(--cyan);color:var(--cyan)}
  .c .c-label{font-size:.5rem;text-transform:uppercase;letter-spacing:.04em;opacity:.7}

  .actions-row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}

  /* Action target modal */
  .modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:500;
    justify-content:center;align-items:center;backdrop-filter:blur(4px)}
  .modal.visible{display:flex}
  .modal-box{background:var(--card);border:1px solid var(--border);border-radius:16px;
    padding:28px;max-width:380px;width:90%;text-align:center}
  .modal-box h3{margin-bottom:14px;font-size:1.1rem}
  .target-list{display:flex;flex-direction:column;gap:8px}
  .target-btn{padding:12px;background:var(--bg);border:2px solid var(--border);border-radius:10px;
    color:var(--text);font-weight:600;cursor:pointer;font-size:.95rem;transition:all .2s}
  .target-btn:hover{border-color:var(--gold);background:rgba(245,158,11,.06)}

  .round-summary{background:var(--card);border:1px solid var(--border);border-radius:14px;
    padding:24px;margin-bottom:14px;text-align:center}
  .round-summary h2{margin-bottom:12px;color:var(--gold-light)}
  .rs-table{width:100%;text-align:left;border-collapse:collapse;margin:12px 0}
  .rs-table th,.rs-table td{padding:8px 10px;border-bottom:1px solid var(--border);font-size:.9rem}
  .rs-table th{color:var(--muted);font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}

  .game-over-box{background:var(--card);border:2px solid var(--gold);border-radius:16px;
    padding:32px;text-align:center;box-shadow:0 0 30px var(--gold-glow)}
  .game-over-box h2{font-size:2rem;color:var(--gold-light);margin-bottom:8px}
  .game-over-box p{color:var(--muted);margin-bottom:20px}

  .confetti-container{position:fixed;inset:0;pointer-events:none;z-index:600;overflow:hidden}
  .confetti{position:absolute;width:10px;height:10px;top:-10px;animation:fall linear forwards}
  @keyframes fall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}

  @media(max-width:600px){
    h1{font-size:1.6rem}.code-big{font-size:1.6rem}.sb-item{min-width:80px}
    .c{width:48px;height:66px;font-size:.85rem}
  }
</style>
</head>
<body>
<div class="toast" id="toast"></div>
<div class="container">
  <header><h1>FLIP 7</h1><p class="sub" id="headerSub">Push your luck</p></header>

  <!-- LANDING -->
  <div class="screen active" id="sLanding">
    <div class="box">
      <h2>Play Flip 7</h2>
      <div class="row"><input type="text" id="joinCode" placeholder="Room code" maxlength="4">
        <button class="btn btn-gold" onclick="goLobby()">Join</button></div>
      <div class="divider">or</div>
      <button class="btn btn-green btn-full" onclick="createGame()">Create New Game</button>
    </div>
  </div>

  <!-- LOBBY -->
  <div class="screen" id="sLobby">
    <div class="box">
      <div style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em">Room</div>
      <div class="code-big" id="lobbyCode" onclick="copyCode()"></div>
      <div class="hint">Click to copy &middot; Share with friends</div>
      <div class="row" id="nameRow">
        <select id="nameInput">
          <option value="" disabled selected>Who are you?</option>
          <option value="AJ">AJ</option>
          <option value="SB">SB</option>
          <option value="Aryan">Aryan</option>
          <option value="LB">LB</option>
          <option value="Ms DTM">Ms DTM</option>
          <option value="Pops">Pops</option>
          <option value="Mom">Mom</option>
          <option value="Mikhayl">Mikhayl</option>
          <option value="Arhan">Arhan</option>
        </select>
        <button class="btn btn-gold" onclick="joinGame()">Join</button>
      </div>
      <div class="player-list"><h3 style="font-size:.8rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Players</h3><div id="lobbyPlayers"></div></div>
      <button class="btn btn-green btn-full btn-disabled" id="startBtn" onclick="startGame()">Start Game (need 2+)</button>
      <div style="color:var(--muted);font-size:.8rem;margin-top:10px" id="lobbyStatus">Waiting for players...</div>
    </div>
  </div>

  <!-- GAME -->
  <div class="screen" id="sGame">
    <div class="event-bar" id="eventBar" style="display:none"></div>
    <div class="turn-bar" id="turnBar"></div>
    <div class="scoreboard" id="scoreboard"></div>
    <div class="my-cards" id="myCardsSection">
      <h3 id="myCardsLabel">Your Cards</h3>
      <div class="card-row" id="myCards"></div>
    </div>
    <div class="actions-row" id="actionsRow"></div>
  </div>

  <!-- ROUND END -->
  <div class="screen" id="sRoundEnd">
    <div class="round-summary" id="roundSummary"></div>
  </div>

  <!-- GAME OVER -->
  <div class="screen" id="sGameOver">
    <div class="game-over-box" id="gameOverBox"></div>
  </div>
</div>

<div class="modal" id="actionModal">
  <div class="modal-box">
    <h3 id="modalTitle">Choose a target</h3>
    <div class="target-list" id="targetList"></div>
  </div>
</div>
<div class="confetti-container" id="confettiContainer"></div>

<script>
let roomCode=null,playerId=null,pollInterval=null,lastJSON='',joined=false;

function createGame(){
  fetch('/api/create',{method:'POST'}).then(r=>r.json()).then(d=>{
    roomCode=d.roomCode;show('sLobby');
    document.getElementById('lobbyCode').textContent=roomCode;startPoll();
  }).catch(()=>toast('Failed'));
}
function goLobby(){
  const c=document.getElementById('joinCode').value.trim().toUpperCase();
  if(c.length!==4){toast('Enter 4-char code');return}
  fetch('/api/game/'+c).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{
    roomCode=d.roomCode;show('sLobby');
    document.getElementById('lobbyCode').textContent=roomCode;renderLobby(d);startPoll();
  }).catch(()=>toast('Not found'));
}
document.getElementById('joinCode').addEventListener('keydown',e=>{if(e.key==='Enter')goLobby()});

function joinGame(){
  if(!roomCode||joined)return;
  const name=document.getElementById('nameInput').value;
  if(!name){toast('Pick your name');return}
  fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({gameId:roomCode,name})}).then(r=>r.json()).then(d=>{
    if(d.error){toast(d.error);return}
    playerId=d.playerId;joined=true;
    document.getElementById('nameRow').style.display='none';renderLobby(d.game);
  }).catch(()=>toast('Failed'));
}

function startGame(){
  if(!roomCode||!playerId)return;
  fetch('/api/start',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({gameId:roomCode,playerId})}).then(r=>r.json()).then(d=>{
    if(d.error){toast(d.error);return}
    lastJSON=JSON.stringify(d);renderState(d);
  }).catch(()=>toast('Failed'));
}

function hit(){
  api('hit',{gameId:roomCode,playerId});
}
function stay(){
  api('stay',{gameId:roomCode,playerId});
}
function nextRound(){
  api('next-round',{gameId:roomCode,playerId});
}
function newGame(){
  api('new-game',{gameId:roomCode,playerId}).then(()=>{
    document.getElementById('confettiContainer').innerHTML='';
  });
}
function sendAction(targetId){
  document.getElementById('actionModal').classList.remove('visible');
  api('action',{gameId:roomCode,playerId,targetId});
}

function api(endpoint,body){
  return fetch('/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)}).then(r=>r.json()).then(d=>{
    if(d.error){toast(d.error);return}
    lastJSON=JSON.stringify(d);renderState(d);
  }).catch(()=>toast('Failed'));
}

function renderLobby(s){
  const el=document.getElementById('lobbyPlayers');
  el.innerHTML='';
  (s.players||[]).forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='pl-item'+(p.id===playerId?' is-you':'');
    d.innerHTML='<span class="pl-n">'+(i+1)+'</span>'+p.name+(p.id===playerId?' (you)':'');
    el.appendChild(d);
  });
  const btn=document.getElementById('startBtn');
  const n=(s.players||[]).length;
  if(n>=2&&joined){btn.classList.remove('btn-disabled');btn.textContent='Start Game ('+n+' players)'}
  else{btn.classList.add('btn-disabled');btn.textContent=n<2?'Need '+(2-n)+' more':'Start Game ('+n+')'}
}

function renderState(s){
  if(s.phase==='lobby'){show('sLobby');renderLobby(s);return}
  if(s.phase==='game-over'){show('sGameOver');renderGameOver(s);return}
  if(s.phase==='round-end'){show('sRoundEnd');renderRoundEnd(s);return}

  show('sGame');
  document.getElementById('headerSub').textContent='Room: '+roomCode+' · Round '+s.round;

  // Event bar
  const eb=document.getElementById('eventBar');
  if(s.lastEvent){eb.style.display='block';eb.textContent=s.lastEvent}
  else{eb.style.display='none'}

  // Turn bar
  const tb=document.getElementById('turnBar');
  const cur=s.players[s.currentPlayerIdx];
  const isMyTurn=cur&&cur.id===playerId;
  const me=s.players.find(p=>p.id===playerId);
  if(me&&(me.busted||me.stayed||me.frozen)){
    tb.className='turn-bar waiting';
    tb.textContent=me.busted?'You busted this round':me.frozen?'You were frozen':'You stayed — waiting for others';
  }else if(isMyTurn){
    tb.className='turn-bar my-turn';
    tb.textContent='Your turn — Hit or Stay?';
  }else{
    tb.className='turn-bar waiting';
    tb.textContent=cur?cur.name+"'s turn":'Waiting...';
  }

  // Scoreboard
  const sb=document.getElementById('scoreboard');
  sb.innerHTML='';
  s.players.forEach((p,i)=>{
    let cls='sb-item';
    if(i===s.currentPlayerIdx&&!p.busted&&!p.stayed&&!p.frozen)cls+=' active';
    if(p.busted)cls+=' busted';
    else if(p.frozen)cls+=' frozen';
    else if(p.stayed)cls+=' stayed';
    const numCards=p.cards.filter(c=>c.type==='number');
    const score=calcScore(p);
    let status='';
    if(p.busted)status='<div class="sb-status s-bust">Busted</div>';
    else if(p.frozen)status='<div class="sb-status s-frozen">Frozen</div>';
    else if(p.stayed)status='<div class="sb-status s-stay">Stayed ('+score+')</div>';
    const d=document.createElement('div');d.className=cls;
    d.innerHTML='<div class="sb-name">'+p.name+(p.id===playerId?' (you)':'')+'</div>'+
      '<div class="sb-total">'+p.totalScore+'</div>'+
      '<div class="sb-round">'+numCards.length+' cards · '+score+' pts</div>'+status;
    sb.appendChild(d);
  });

  // My cards
  const mc=document.getElementById('myCards');
  mc.innerHTML='';
  if(me){
    me.cards.forEach(c=>{
      const el=document.createElement('div');
      if(c.type==='number'){
        el.className='c c-num';
        el.innerHTML='<div>'+c.value+'</div><div class="c-label">num</div>';
      }else if(c.type==='modifier'){
        el.className='c c-mod';
        el.innerHTML='<div>'+c.modifier+'</div><div class="c-label">mod</div>';
      }else{
        el.className='c c-act';
        const label=c.action==='second-chance'?'2nd':c.action==='freeze'?'Frz':'F3';
        el.innerHTML='<div>'+label+'</div><div class="c-label">'+c.action+'</div>';
      }
      mc.appendChild(el);
    });
  }

  // Actions
  const ar=document.getElementById('actionsRow');
  ar.innerHTML='';
  if(me&&isMyTurn&&!me.busted&&!me.stayed&&!me.frozen){
    if(me.hasPendingAction){
      // Show target selection modal
      showActionModal(s,me.pendingActionType);
    }else{
      ar.innerHTML='<button class="btn btn-gold" onclick="hit()">Hit</button>'+
        '<button class="btn btn-sec" onclick="stay()">Stay</button>';
    }
  }
}

function showActionModal(s,actionType){
  const modal=document.getElementById('actionModal');
  const title=document.getElementById('modalTitle');
  const list=document.getElementById('targetList');
  title.textContent=actionType==='freeze'?'Freeze who?':'Flip Three on who?';
  list.innerHTML='';
  s.players.forEach(p=>{
    if(p.busted||p.stayed||p.frozen)return;
    const btn=document.createElement('button');
    btn.className='target-btn';
    btn.textContent=p.name+(p.id===playerId?' (yourself)':'');
    btn.onclick=()=>sendAction(p.id);
    list.appendChild(btn);
  });
  modal.classList.add('visible');
}

function calcScore(p){
  const nums=p.cards.filter(c=>c.type==='number');
  let sum=nums.reduce((s,c)=>s+(c.value||0),0);
  if(p.cards.some(c=>c.type==='modifier'&&c.modifier==='x2'))sum*=2;
  const mods=p.cards.filter(c=>c.type==='modifier'&&c.modifier!=='x2')
    .reduce((s,c)=>s+parseInt(c.modifier.replace('+','')),0);
  let total=sum+mods;
  const unique=new Set(nums.map(c=>c.value));
  if(unique.size>=7)total+=15;
  return total;
}

function renderRoundEnd(s){
  const el=document.getElementById('roundSummary');
  let html='<h2>Round '+s.round+' Complete</h2>';
  html+='<table class="rs-table"><thead><tr><th>Player</th><th>Cards</th><th>Round</th><th>Total</th></tr></thead><tbody>';
  s.players.forEach(p=>{
    const numCards=p.cards.filter(c=>c.type==='number');
    html+='<tr><td style="font-weight:700">'+p.name+(p.id===playerId?' (you)':'')+'</td>'+
      '<td>'+numCards.length+'</td>'+
      '<td style="color:'+(p.busted?'var(--red)':'var(--green)')+'">'+
      (p.busted?'Busted':'+'+p.roundScore)+'</td>'+
      '<td style="font-weight:700;color:var(--gold)">'+p.totalScore+'</td></tr>';
  });
  html+='</tbody></table>';
  html+='<div style="margin-top:16px"><button class="btn btn-gold" onclick="nextRound()">Next Round</button></div>';
  el.innerHTML=html;
}

function renderGameOver(s){
  const el=document.getElementById('gameOverBox');
  el.innerHTML='<h2>'+s.winner+' Wins!</h2>'+
    '<p>Reached '+s.targetScore+'+ points</p>';
  let table='<table class="rs-table" style="margin:0 auto;max-width:300px"><thead><tr><th>Player</th><th>Score</th></tr></thead><tbody>';
  [...s.players].sort((a,b)=>b.totalScore-a.totalScore).forEach(p=>{
    table+='<tr><td style="font-weight:700">'+p.name+'</td><td style="color:var(--gold);font-weight:700">'+p.totalScore+'</td></tr>';
  });
  table+='</tbody></table>';
  el.innerHTML+= table;
  el.innerHTML+='<div style="margin-top:20px"><button class="btn btn-green" onclick="newGame()">Play Again</button></div>';
  confetti();
}

function startPoll(){
  if(pollInterval)clearInterval(pollInterval);
  pollInterval=setInterval(()=>{
    if(!roomCode)return;
    const url='/api/game/'+roomCode+(playerId?'?playerId='+playerId:'');
    fetch(url).then(r=>r.json()).then(d=>{
      if(d.error)return;
      const j=JSON.stringify(d);
      if(j===lastJSON)return;
      lastJSON=j;renderState(d);
    }).catch(()=>{});
  },1500);
}

function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id!=='sLanding')document.getElementById('headerSub').textContent='Room: '+(roomCode||'');
}
function copyCode(){if(roomCode)navigator.clipboard.writeText(roomCode).then(()=>toast('Copied: '+roomCode))}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function confetti(){
  const c=document.getElementById('confettiContainer');c.innerHTML='';
  const cols=['#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#f97316','#06b6d4'];
  for(let i=0;i<80;i++){const e=document.createElement('div');e.className='confetti';
    e.style.left=Math.random()*100+'%';e.style.background=cols[Math.floor(Math.random()*cols.length)];
    e.style.width=(6+Math.random()*8)+'px';e.style.height=(6+Math.random()*8)+'px';
    e.style.borderRadius=Math.random()>.5?'50%':'2px';
    e.style.animationDuration=(2+Math.random()*3)+'s';e.style.animationDelay=Math.random()*2+'s';
    c.appendChild(e)}
}
</script>
</body>
</html>`;
}
