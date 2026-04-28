export function getHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Flip 7</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0c1220;--felt:#111827;--card-bg:#1e293b;--border:#334155;
    --text:#f1f5f9;--muted:#94a3b8;
    --teal:#0d9488;--teal-light:#5eead4;--teal-glow:rgba(13,148,136,0.3);
    --orange:#f59e0b;--orange-light:#fcd34d;--orange-glow:rgba(245,158,11,0.3);
    --purple:#8b5cf6;--purple-light:#c4b5fd;
    --cyan:#06b6d4;--cyan-light:#67e8f9;
    --green:#22c55e;--green-light:#86efac;
    --red:#ef4444;--red-light:#fca5a5;
    --gold:#f59e0b;--gold-light:#fcd34d;--gold-glow:rgba(245,158,11,0.25);
    --cream:#fefce8;
  }
  body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
    min-height:100vh;min-height:100dvh;overflow-x:hidden}
  .container{max-width:860px;margin:0 auto;padding:10px}

  /* Header */
  header{text-align:center;margin-bottom:12px}
  h1{font-size:2.2rem;font-weight:900;letter-spacing:.15em;
    background:linear-gradient(135deg,var(--teal),var(--teal-light),var(--gold));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .sub{color:var(--muted);font-size:.8rem}

  /* Toast */
  .toast{position:fixed;top:16px;left:50%;transform:translateX(-50%) translateY(-80px);
    background:var(--red);color:#fff;padding:10px 20px;border-radius:10px;font-weight:600;
    z-index:1000;transition:transform .3s;pointer-events:none;font-size:.85rem}
  .toast.show{transform:translateX(-50%) translateY(0)}
  .screen{display:none}.screen.active{display:block}

  /* Landing + Lobby shared */
  .box{max-width:420px;margin:20px auto;text-align:center;background:var(--card-bg);
    border:1px solid var(--border);border-radius:16px;padding:28px}
  /* Chat */
  .chat-panel{margin:14px auto 0;max-width:520px;background:var(--card-bg);
    border:1px solid var(--border);border-radius:14px;overflow:hidden}
  .chat-header{padding:9px 14px;background:rgba(13,148,136,.08);
    border-bottom:1px solid var(--border);font-size:.7rem;color:var(--teal-light);
    text-transform:uppercase;letter-spacing:.1em;display:flex;align-items:center;
    justify-content:space-between;font-weight:700}
  .chat-log{max-height:200px;overflow-y:auto;padding:10px 14px;
    display:flex;flex-direction:column;gap:6px;background:var(--bg)}
  .chat-msg{font-size:.85rem;line-height:1.35;word-break:break-word}
  .chat-msg .cm-name{font-weight:700;color:var(--teal-light);margin-right:6px}
  .chat-msg.is-me .cm-name{color:var(--gold-light)}
  .chat-empty{color:var(--muted);font-size:.78rem;text-align:center;padding:6px 0}
  .chat-input-row{display:flex;gap:6px;padding:8px;border-top:1px solid var(--border)}
  .chat-input-row input{flex:1;background:var(--bg);border:1px solid var(--border);
    color:var(--text);padding:8px 10px;border-radius:8px;font-size:.85rem;outline:none}
  .chat-input-row input:focus{border-color:var(--teal)}
  .chat-input-row button{padding:8px 14px;font-size:.72rem;border-radius:8px}

  .rejoin-banner{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.3);
    border-radius:12px;padding:14px 16px;margin-bottom:18px;text-align:left}
  .rejoin-banner .rj-text{color:var(--text);font-size:.9rem;margin-bottom:10px;line-height:1.4}
  .rejoin-banner .rj-text strong{color:var(--green-light);letter-spacing:.06em}
  .rejoin-banner .rj-actions{display:flex;gap:8px;flex-wrap:wrap}
  .rejoin-banner .btn{flex:1;min-width:120px;padding:10px 16px;font-size:.78rem}
  .box h2{font-size:1.15rem;margin-bottom:14px;letter-spacing:.03em}
  .row{display:flex;gap:8px;margin-bottom:10px}
  .row input,.row select{flex:1;background:var(--bg);border:2px solid var(--border);color:var(--text);
    padding:10px 12px;border-radius:10px;font-size:.9rem;outline:none}
  .row input:focus,.row select:focus{border-color:var(--teal)}
  .row input::placeholder{color:var(--muted)}
  .row select{cursor:pointer;appearance:none;-webkit-appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
    background-repeat:no-repeat;background-position:right 10px center}
  .divider{color:var(--muted);font-size:.75rem;margin:8px 0;text-transform:uppercase;letter-spacing:.1em}
  .code-big{font-size:2rem;font-weight:900;letter-spacing:.3em;cursor:pointer;padding:6px 14px;
    border:2px dashed var(--border);border-radius:10px;display:inline-block;margin:6px 0 10px;
    color:var(--teal-light)}
  .code-big:hover{border-color:var(--teal)}
  .hint{font-size:.7rem;color:var(--muted);margin-bottom:10px}

  .btn{padding:11px 22px;border:none;border-radius:10px;font-size:.85rem;font-weight:700;cursor:pointer;
    transition:all .2s;text-transform:uppercase;letter-spacing:.06em;display:inline-flex;
    align-items:center;justify-content:center;gap:6px}
  .btn:active{transform:scale(.96)}
  .btn-teal{background:linear-gradient(135deg,var(--teal),#14b8a6);color:#fff;box-shadow:0 4px 14px var(--teal-glow)}
  .btn-gold{background:linear-gradient(135deg,var(--gold),#f97316);color:#fff;box-shadow:0 4px 14px var(--gold-glow)}
  .btn-green{background:var(--green);color:#fff}
  .btn-red{background:var(--red);color:#fff}
  .btn-sec{background:var(--card-bg);color:var(--text);border:2px solid var(--border)}
  .btn-sec:hover{border-color:var(--muted)}
  .btn-full{width:100%}
  .btn-disabled{opacity:.35;pointer-events:none}
  .btn-lg{padding:14px 32px;font-size:1rem;border-radius:12px}

  /* Lobby player list */
  .pl{text-align:left;margin:10px 0}
  .pl-item{padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;
    margin-bottom:5px;font-weight:600;display:flex;align-items:center;gap:8px;font-size:.9rem}
  .pl-n{background:var(--teal);color:#fff;width:22px;height:22px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:800;flex-shrink:0}
  .pl-item.is-you{border-color:var(--teal);background:rgba(13,148,136,.06)}

  /* ========== GAME TABLE ========== */
  .event-bar{text-align:center;padding:8px 12px;border-radius:10px;margin-bottom:10px;
    font-weight:600;font-size:.85rem;background:rgba(13,148,136,.08);
    border:1px solid rgba(13,148,136,.2);color:var(--teal-light);
    animation:eventPulse 0.4s ease-out}
  @keyframes eventPulse{0%{transform:scale(0.97);opacity:0.5}100%{transform:scale(1);opacity:1}}

  .turn-bar{text-align:center;padding:8px;border-radius:8px;margin-bottom:10px;
    font-weight:700;font-size:.9rem;text-transform:uppercase;letter-spacing:.06em}
  .turn-bar.my-turn{background:rgba(34,197,94,.1);color:var(--green-light);
    border:1px solid rgba(34,197,94,.25);animation:turnGlow 1.5s ease-in-out infinite}
  @keyframes turnGlow{0%,100%{box-shadow:0 0 8px rgba(34,197,94,.15)}50%{box-shadow:0 0 20px rgba(34,197,94,.3)}}
  .turn-bar.waiting{background:rgba(139,92,246,.06);color:var(--purple-light);
    border:1px solid rgba(139,92,246,.15)}
  .turn-bar.out{background:rgba(239,68,68,.06);color:var(--red-light);
    border:1px solid rgba(239,68,68,.15)}

  /* Deck + info bar */
  .table-info{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:12px}
  .deck-visual{position:relative;width:44px;height:62px;flex-shrink:0}
  .deck-card{position:absolute;width:100%;height:100%;border-radius:6px;
    background:linear-gradient(135deg,#134e4a,#0d3d3a);border:2px solid var(--teal);
    box-shadow:0 2px 6px rgba(0,0,0,.3)}
  .deck-card:nth-child(1){top:-2px;left:-1px}.deck-card:nth-child(2){top:-1px}.deck-card:nth-child(3){top:0;left:1px}
  .deck-label{font-size:.7rem;color:var(--muted);text-align:center;margin-top:2px}
  .round-badge{background:var(--card-bg);border:1px solid var(--border);border-radius:8px;
    padding:6px 14px;font-size:.8rem;font-weight:600;color:var(--gold-light)}
  .target-badge{font-size:.7rem;color:var(--muted)}

  /* ===== PLAYER AREAS ===== */
  .players-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
  .player-area{background:var(--card-bg);border:1px solid var(--border);border-radius:12px;
    padding:10px;transition:all .3s}
  .player-area.is-turn{border-color:var(--teal);box-shadow:0 0 16px var(--teal-glow)}
  .player-area.is-me{border-color:var(--gold);box-shadow:0 0 12px var(--gold-glow)}
  .player-area.is-busted{opacity:.5;border-color:var(--red)}
  .player-area.is-stayed{border-color:var(--green)}
  .player-area.is-frozen{border-color:var(--cyan)}

  .pa-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
  .pa-name{font-weight:700;font-size:.8rem;display:flex;align-items:center;gap:4px}
  .pa-name .badge{font-size:.55rem;padding:1px 5px;border-radius:4px;font-weight:700;text-transform:uppercase}
  .badge-you{background:var(--gold);color:#000}
  .badge-dealer{background:var(--purple);color:#fff}
  .pa-score{text-align:right}
  .pa-total{font-size:1.1rem;font-weight:900;color:var(--gold)}
  .pa-round{font-size:.6rem;color:var(--muted)}

  .pa-status{font-size:.6rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;
    margin-bottom:4px;height:14px}
  .pa-status.s-bust{color:var(--red)}
  .pa-status.s-stay{color:var(--green)}
  .pa-status.s-frozen{color:var(--cyan)}
  .pa-status.s-flip7{color:var(--gold-light)}
  .pa-status.s-sc{color:var(--green-light)}

  /* Cards on table */
  .pa-cards{display:flex;flex-wrap:wrap;gap:4px}
  .pa-cards.busted-cards .c{opacity:.4;filter:saturate(0.3)}

  /* ===== CARD DESIGNS ===== */
  .c{width:40px;height:56px;border-radius:6px;display:flex;flex-direction:column;
    align-items:center;justify-content:center;font-weight:800;position:relative;
    box-shadow:0 2px 6px rgba(0,0,0,.25);transition:transform .2s;
    animation:cardDeal .35s ease-out}
  @keyframes cardDeal{0%{transform:scale(0.4) translateY(-20px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
  .c:hover{transform:translateY(-2px)}

  /* Number cards — teal theme like real game */
  .c-num{background:var(--cream);border:2.5px solid var(--teal)}
  .c-num .c-val{font-size:1.15rem;color:var(--teal);line-height:1}
  .c-num .c-corner{position:absolute;font-size:.4rem;font-weight:800;color:var(--teal)}
  .c-num .c-corner.tl{top:2px;left:4px}.c-num .c-corner.br{bottom:2px;right:4px;transform:rotate(180deg)}

  /* Modifier cards — orange/amber */
  .c-mod{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2.5px solid var(--orange)}
  .c-mod .c-val{font-size:1rem;color:var(--orange);line-height:1}
  .c-mod .c-type{font-size:.35rem;color:var(--orange);opacity:.7;text-transform:uppercase;letter-spacing:.03em}

  /* x2 special */
  .c-x2{background:linear-gradient(135deg,#fef3c7,#fde68a);border:2.5px solid #d97706}
  .c-x2 .c-val{font-size:1.1rem;color:#d97706;font-weight:900}

  /* Action cards — purple/themed */
  .c-act{border:2.5px solid var(--purple)}
  .c-act .c-icon{font-size:1rem;line-height:1}
  .c-act .c-type{font-size:.32rem;text-transform:uppercase;letter-spacing:.02em;margin-top:1px}

  .c-freeze{background:linear-gradient(135deg,#ecfeff,#cffafe);border-color:var(--cyan)}
  .c-freeze .c-icon{color:var(--cyan)}.c-freeze .c-type{color:var(--cyan)}

  .c-flip3{background:linear-gradient(135deg,#faf5ff,#ede9fe);border-color:var(--purple)}
  .c-flip3 .c-icon{color:var(--purple)}.c-flip3 .c-type{color:var(--purple)}

  .c-sc{background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-color:var(--green)}
  .c-sc .c-icon{color:var(--green)}.c-sc .c-type{color:var(--green)}

  /* Actions row */
  .actions-row{display:flex;gap:10px;justify-content:center;margin:12px 0;padding:0 10px}
  .actions-row .btn{flex:1;max-width:160px}

  /* Modal */
  .modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:500;
    justify-content:center;align-items:center;backdrop-filter:blur(4px)}
  .modal.visible{display:flex}
  .modal-box{background:var(--card-bg);border:1px solid var(--border);border-radius:16px;
    padding:24px;max-width:360px;width:90%;text-align:center}
  .modal-box h3{margin-bottom:12px;font-size:1rem}
  .target-list{display:flex;flex-direction:column;gap:6px}
  .target-btn{padding:10px;background:var(--bg);border:2px solid var(--border);border-radius:10px;
    color:var(--text);font-weight:600;cursor:pointer;font-size:.9rem;transition:all .2s}
  .target-btn:hover{border-color:var(--teal);background:rgba(13,148,136,.06)}

  /* Round summary */
  .round-box{background:var(--card-bg);border:1px solid var(--border);border-radius:14px;
    padding:20px;margin-bottom:14px;text-align:center;max-width:500px;margin-left:auto;margin-right:auto}
  .round-box h2{margin-bottom:10px;color:var(--teal-light);font-size:1.2rem}
  .rs-table{width:100%;text-align:left;border-collapse:collapse;margin:10px 0}
  .rs-table th,.rs-table td{padding:7px 8px;border-bottom:1px solid var(--border);font-size:.85rem}
  .rs-table th{color:var(--muted);font-size:.7rem;text-transform:uppercase;letter-spacing:.06em}
  .rs-table td.bust{color:var(--red)}.rs-table td.scored{color:var(--green)}
  .rs-table td.flip7{color:var(--gold-light);font-weight:700}

  /* Game over */
  .go-box{background:var(--card-bg);border:2px solid var(--gold);border-radius:16px;
    padding:28px;text-align:center;box-shadow:0 0 30px var(--gold-glow);max-width:440px;margin:0 auto}
  .go-box h2{font-size:1.8rem;color:var(--gold-light);margin-bottom:6px}
  .go-box p{color:var(--muted);margin-bottom:16px;font-size:.9rem}

  .confetti-container{position:fixed;inset:0;pointer-events:none;z-index:600;overflow:hidden}
  .confetti{position:absolute;width:10px;height:10px;top:-10px;animation:fall linear forwards}
  @keyframes fall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}

  /* Bust shake */
  @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-3px)}40%,80%{transform:translateX(3px)}}
  .player-area.just-busted{animation:shake .4s ease-out}

  /* ===== MOBILE ===== */
  @media(max-width:640px){
    .container{padding:6px}
    h1{font-size:1.5rem}
    .sub{font-size:.7rem}
    .box{padding:20px 16px;margin:12px auto}
    .players-grid{grid-template-columns:1fr;gap:6px}
    .c{width:36px;height:50px;border-radius:5px;border-width:2px}
    .c-num .c-val{font-size:1rem}
    .c-mod .c-val{font-size:.85rem}
    .c-act .c-icon{font-size:.85rem}
    .c-num .c-corner{font-size:.35rem}
    .c-mod .c-type,.c-act .c-type{font-size:.3rem}
    .pa-cards{gap:3px}
    .player-area{padding:8px}
    .pa-name{font-size:.75rem}
    .pa-total{font-size:1rem}
    .event-bar{font-size:.78rem;padding:6px 10px}
    .turn-bar{font-size:.8rem;padding:6px}
    .actions-row .btn{padding:12px 20px;font-size:.85rem}
    .code-big{font-size:1.5rem}
    .round-box{padding:16px}
    .go-box{padding:22px;margin:0 8px}
  }
  @media(min-width:641px){
    .players-grid{grid-template-columns:1fr 1fr}
  }
</style>
</head>
<body>
<div class="toast" id="toast"></div>
<div class="container">
  <header><h1>FLIP 7</h1><p class="sub" id="headerSub">(for Self glazers)</p></header>

  <!-- LANDING -->
  <div class="screen active" id="sLanding">
    <div class="box">
      <div class="rejoin-banner" id="rejoinBanner" style="display:none">
        <div class="rj-text">You have an unfinished game in room <strong id="rejoinCode"></strong>.</div>
        <div class="rj-actions">
          <button class="btn btn-green" onclick="rejoinSavedRoom()">Rejoin</button>
          <button class="btn btn-sec" onclick="dismissSavedRoom()">Start Fresh</button>
        </div>
      </div>
      <h2>Play Flip 7</h2>
      <div class="row"><input type="text" id="joinCode" placeholder="Room code" maxlength="4">
        <button class="btn btn-teal" onclick="goLobby()">Join</button></div>
      <div class="divider">or</div>
      <button class="btn btn-green btn-full" onclick="createGame()">Create New Game</button>
    </div>
  </div>

  <!-- LOBBY -->
  <div class="screen" id="sLobby">
    <div class="box">
      <div style="font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.1em">Room</div>
      <div class="code-big" id="lobbyCode" onclick="copyCode()"></div>
      <div class="hint">Tap to copy &middot; Share with friends</div>
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
        <button class="btn btn-teal" onclick="joinGame()">Join</button>
      </div>
      <div class="pl"><div style="font-size:.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Players</div><div id="lobbyPlayers"></div></div>
      <button class="btn btn-green btn-full btn-disabled" id="startBtn" onclick="startGame()">Start Game (need 2+)</button>
      <div style="color:var(--muted);font-size:.75rem;margin-top:8px" id="lobbyStatus">Waiting for players...</div>
    </div>
  </div>

  <!-- GAME -->
  <div class="screen" id="sGame">
    <div class="event-bar" id="eventBar" style="display:none"></div>
    <div class="turn-bar" id="turnBar"></div>
    <div class="table-info" id="tableInfo">
      <div class="round-badge" id="roundBadge">Round 1</div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="deck-visual"><div class="deck-card"></div><div class="deck-card"></div><div class="deck-card"></div></div>
        <div><div class="deck-label" id="deckCount">94 left</div><div class="target-badge">First to 200</div></div>
      </div>
    </div>
    <div class="players-grid" id="playersGrid"></div>
    <div class="actions-row" id="actionsRow"></div>
  </div>

  <!-- ROUND END -->
  <div class="screen" id="sRoundEnd"><div class="round-box" id="roundSummary"></div></div>

  <!-- GAME OVER -->
  <div class="screen" id="sGameOver"><div class="go-box" id="gameOverBox"></div></div>

  <!-- CHAT (visible while in a room) -->
  <div class="chat-panel" id="chatPanel" style="display:none">
    <div class="chat-header"><span>Chat</span><span id="chatCount" style="color:var(--muted);font-weight:600;letter-spacing:.04em"></span></div>
    <div class="chat-log" id="chatLog"><div class="chat-empty">No messages yet.</div></div>
    <div class="chat-input-row">
      <input type="text" id="chatInput" placeholder="Say something..." maxlength="300" disabled>
      <button class="btn btn-teal" onclick="sendChat()" id="chatSendBtn" disabled>Send</button>
    </div>
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

// Session persistence
function saveSession(){
  if(roomCode&&playerId){localStorage.setItem('f7_room',roomCode);localStorage.setItem('f7_pid',playerId)}
}
function clearSession(){localStorage.removeItem('f7_room');localStorage.removeItem('f7_pid')}

// Check saved session — validate and show a "Rejoin / Start Fresh" prompt on the
// landing screen instead of auto-jumping into the game. Closing the tab and
// reopening always lands on the home screen.
(function checkSavedSession(){
  const r=localStorage.getItem('f7_room'),p=localStorage.getItem('f7_pid');
  if(!r||!p)return;
  fetch('/api/game/'+r+'?playerId='+p).then(res=>res.json()).then(d=>{
    if(d.error){clearSession();return}
    const me=(d.players||[]).find(pl=>pl.isMe);
    if(!me){clearSession();return}
    if(d.phase==='game-over'){clearSession();return}
    document.getElementById('rejoinCode').textContent=r;
    document.getElementById('rejoinBanner').style.display='block';
    const ji=document.getElementById('joinCode');
    if(ji&&!ji.value)ji.value=r;
  }).catch(()=>{/* offline — leave banner hidden */});
})();

function rejoinSavedRoom(){
  const r=localStorage.getItem('f7_room'),p=localStorage.getItem('f7_pid');
  if(!r||!p){document.getElementById('rejoinBanner').style.display='none';return}
  roomCode=r;playerId=p;
  fetch('/api/game/'+roomCode+'?playerId='+playerId).then(res=>res.json()).then(d=>{
    if(d.error){clearSession();document.getElementById('rejoinBanner').style.display='none';return}
    const me=(d.players||[]).find(pl=>pl.isMe);
    if(!me){clearSession();document.getElementById('rejoinBanner').style.display='none';return}
    if(d.phase==='game-over'){clearSession();document.getElementById('rejoinBanner').style.display='none';return}
    joined=true;lastJSON=JSON.stringify(d);
    document.getElementById('rejoinBanner').style.display='none';
    if(d.phase==='lobby'){
      show('sLobby');
      document.getElementById('lobbyCode').textContent=roomCode;
      document.getElementById('nameRow').style.display='none';
      renderLobby(d);
    } else {
      renderState(d);
    }
    startPoll();
  }).catch(()=>toast('Could not rejoin'));
}

function dismissSavedRoom(){
  clearSession();
  document.getElementById('rejoinBanner').style.display='none';
  const ji=document.getElementById('joinCode');if(ji)ji.value='';
}

function newRoom(){
  clearSession();
  if(pollInterval){clearInterval(pollInterval);pollInterval=null}
  roomCode=null;playerId=null;joined=false;lastJSON='';lastChatId='';
  document.getElementById('confettiContainer').innerHTML='';
  document.getElementById('rejoinBanner').style.display='none';
  const ji=document.getElementById('joinCode');if(ji)ji.value='';
  const nameRow=document.getElementById('nameRow');if(nameRow)nameRow.style.display='';
  const log=document.getElementById('chatLog');
  if(log)log.innerHTML='<div class="chat-empty">No messages yet.</div>';
  show('sLanding');
}

function createGame(){
  fetch('/api/create',{method:'POST'}).then(r=>r.json()).then(d=>{
    roomCode=d.roomCode;show('sLobby');
    document.getElementById('lobbyCode').textContent=roomCode;startPoll();
  }).catch(()=>toast('Failed'));
}
function goLobby(){
  const c=document.getElementById('joinCode').value.trim().toUpperCase();
  if(c.length!==4){toast('Enter 4-character code');return}
  fetch('/api/game/'+c).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{
    roomCode=d.roomCode;show('sLobby');
    document.getElementById('lobbyCode').textContent=roomCode;renderLobby(d);startPoll();
  }).catch(()=>toast('Game not found'));
}
document.getElementById('joinCode').addEventListener('keydown',e=>{if(e.key==='Enter')goLobby()});

function joinGame(){
  if(!roomCode||joined)return;
  const name=document.getElementById('nameInput').value;
  if(!name){toast('Pick your name');return}
  fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({gameId:roomCode,name})}).then(r=>r.json()).then(d=>{
    if(d.error){toast(d.error);return}
    playerId=d.playerId;joined=true;saveSession();
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

function hit(){api('hit',{gameId:roomCode,playerId})}
function stay(){api('stay',{gameId:roomCode,playerId})}
function nextRound(){api('next-round',{gameId:roomCode,playerId})}
function newGame(){api('new-game',{gameId:roomCode,playerId}).then(()=>{document.getElementById('confettiContainer').innerHTML=''})}
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

// ===== RENDER LOBBY =====
function renderLobby(s){
  const el=document.getElementById('lobbyPlayers');el.innerHTML='';
  (s.players||[]).forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='pl-item'+(p.isMe?' is-you':'');
    d.innerHTML='<span class="pl-n">'+(i+1)+'</span><span>'+esc(p.name)+(p.isMe?' (you)':'')+'</span>';
    el.appendChild(d);
  });
  const btn=document.getElementById('startBtn');
  const n=(s.players||[]).length;
  if(n>=2&&joined){btn.classList.remove('btn-disabled');btn.textContent='Start Game ('+n+' players)'}
  else{btn.classList.add('btn-disabled');btn.textContent=n<2?'Need '+(2-n)+' more player'+(2-n>1?'s':''):'Start Game ('+n+')'}
  renderChat(s);
  updateChatInputState();
}

// ===== RENDER GAME STATE =====
function renderState(s){
  renderChat(s);
  updateChatInputState();
  if(s.phase==='lobby'){show('sLobby');renderLobby(s);return}
  if(s.phase==='game-over'){show('sGameOver');renderGameOver(s);return}
  if(s.phase==='round-end'){show('sRoundEnd');renderRoundEnd(s);return}

  show('sGame');
  document.getElementById('headerSub').textContent='Room: '+roomCode;

  // Event bar
  const eb=document.getElementById('eventBar');
  if(s.lastEvent){eb.style.display='block';eb.textContent=s.lastEvent}else{eb.style.display='none'}

  // Turn bar
  const tb=document.getElementById('turnBar');
  const cur=s.players[s.currentPlayerIdx];
  const me=s.players.find(p=>p.isMe);
  const isMyTurn=cur&&cur.isMe;

  if(me&&me.busted){
    tb.className='turn-bar out';tb.textContent='💥 You busted this round';
  }else if(me&&me.frozen){
    tb.className='turn-bar out';tb.textContent='❄️ You were frozen — points banked';
  }else if(me&&me.stayed){
    tb.className='turn-bar waiting';tb.textContent='✋ You stayed — waiting for others';
  }else if(isMyTurn){
    tb.className='turn-bar my-turn';
    if(me&&me.hasPendingAction){
      tb.textContent='Choose a target for your action card!';
    }else{
      tb.textContent='Your turn — Hit or Stay?';
    }
  }else{
    tb.className='turn-bar waiting';
    tb.textContent=cur?esc(cur.name)+'\\'s turn...':'Waiting...';
  }

  // Table info
  document.getElementById('roundBadge').textContent='Round '+s.round;
  document.getElementById('deckCount').textContent=s.deckSize+' left';

  // Player areas — show ALL players' cards (like real table!)
  const grid=document.getElementById('playersGrid');
  grid.innerHTML='';

  // Put "me" last so I'm always at the bottom
  const ordered=[...s.players.filter(p=>!p.isMe),...s.players.filter(p=>p.isMe)];

  ordered.forEach((p,idx)=>{
    const isTurn=s.players[s.currentPlayerIdx]===p||
      (s.players[s.currentPlayerIdx]&&s.players[s.currentPlayerIdx].name===p.name);
    let cls='player-area';
    if(p.isMe)cls+=' is-me';
    if(isTurn&&!p.busted&&!p.stayed&&!p.frozen)cls+=' is-turn';
    if(p.busted)cls+=' is-busted';
    else if(p.frozen)cls+=' is-frozen';
    else if(p.stayed)cls+=' is-stayed';

    const score=calcScore(p);
    let statusHtml='';
    if(p.busted)statusHtml='<div class="pa-status s-bust">💥 Busted</div>';
    else if(p.flipped7)statusHtml='<div class="pa-status s-flip7">🎉 FLIP 7!</div>';
    else if(p.frozen)statusHtml='<div class="pa-status s-frozen">❄️ Frozen ('+score+' pts)</div>';
    else if(p.stayed)statusHtml='<div class="pa-status s-stay">✋ Stayed ('+score+' pts)</div>';
    else if(p.hasSecondChance)statusHtml='<div class="pa-status s-sc">🛡️ Protected</div>';
    else statusHtml='<div class="pa-status">'+score+' pts · '+getNumCount(p)+' cards</div>';

    const badges=(p.isMe?'<span class="badge badge-you">You</span>':'')+(p.isDealer?'<span class="badge badge-dealer">Dealer</span>':'');

    const el=document.createElement('div');el.className=cls;
    el.innerHTML=
      '<div class="pa-header">'+
        '<div class="pa-name">'+esc(p.name)+' '+badges+'</div>'+
        '<div class="pa-score"><div class="pa-total">'+p.totalScore+'</div><div class="pa-round">total</div></div>'+
      '</div>'+
      statusHtml+
      '<div class="pa-cards'+(p.busted?' busted-cards':'')+'">'+renderCards(p.cards)+'</div>';
    grid.appendChild(el);
  });

  // Actions
  const ar=document.getElementById('actionsRow');ar.innerHTML='';
  if(me&&isMyTurn&&!me.busted&&!me.stayed&&!me.frozen){
    if(me.hasPendingAction){
      showActionModal(s,me.pendingActionType);
    }else{
      ar.innerHTML=
        '<button class="btn btn-teal btn-lg" onclick="hit()">🃏 Hit</button>'+
        '<button class="btn btn-sec btn-lg" onclick="stay()">✋ Stay</button>';
    }
  }
}

// ===== CARD RENDERING =====
function renderCards(cards){
  return cards.map(c=>{
    if(c.type==='number'){
      return '<div class="c c-num">'+
        '<span class="c-corner tl">'+c.value+'</span>'+
        '<span class="c-val">'+c.value+'</span>'+
        '<span class="c-corner br">'+c.value+'</span></div>';
    }
    if(c.type==='modifier'){
      if(c.modifier==='x2'){
        return '<div class="c c-x2"><span class="c-val">x2</span><span class="c-type" style="color:#d97706">mult</span></div>';
      }
      return '<div class="c c-mod"><span class="c-val">'+c.modifier+'</span><span class="c-type">bonus</span></div>';
    }
    if(c.action==='freeze'){
      return '<div class="c c-act c-freeze"><span class="c-icon">❄️</span><span class="c-type">Freeze</span></div>';
    }
    if(c.action==='flip3'){
      return '<div class="c c-act c-flip3"><span class="c-icon">🃏</span><span class="c-type">Flip 3</span></div>';
    }
    if(c.action==='second-chance'){
      return '<div class="c c-act c-sc"><span class="c-icon">🛡️</span><span class="c-type">2nd Ch.</span></div>';
    }
    return '';
  }).join('');
}

function showActionModal(s,actionType){
  const modal=document.getElementById('actionModal');
  const title=document.getElementById('modalTitle');
  const list=document.getElementById('targetList');
  title.textContent=actionType==='freeze'?'❄️ Freeze who?':'🃏 Flip Three on who?';
  list.innerHTML='';
  s.players.forEach(p=>{
    if(p.busted||p.stayed||p.frozen)return;
    const btn=document.createElement('button');btn.className='target-btn';
    btn.textContent=esc(p.name)+(p.isMe?' (yourself)':'');
    btn.onclick=()=>sendAction(p.isMe?playerId:p.name);
    list.appendChild(btn);
  });
  modal.classList.add('visible');
}

function findPid(s,name){
  // Since we stripped IDs from others, we need another way...
  // The backend expects targetId. For non-self players, we don't have their ID.
  // Let's use name-based targeting instead.
  // Actually, the backend filter includes id only for "me". For others it's undefined.
  // We need to change the action endpoint to accept targetName too.
  // For now, let's pass the name and handle it.
  return name;
}

// ===== ROUND END =====
function renderRoundEnd(s){
  const el=document.getElementById('roundSummary');
  let html='<h2>Round '+s.round+' Complete</h2>';
  html+='<table class="rs-table"><thead><tr><th>Player</th><th>Cards</th><th>Round</th><th>Total</th></tr></thead><tbody>';
  [...s.players].sort((a,b)=>b.totalScore-a.totalScore).forEach(p=>{
    const nc=getNumCount(p);
    let cls='scored',label='+'+p.roundScore;
    if(p.busted){cls='bust';label='Busted'}
    if(p.flipped7){cls='flip7';label='🎉 +'+p.roundScore}
    html+='<tr><td style="font-weight:700">'+esc(p.name)+(p.isMe?' (you)':'')+'</td>'+
      '<td>'+nc+'</td><td class="'+cls+'">'+label+'</td>'+
      '<td style="font-weight:700;color:var(--gold)">'+p.totalScore+'</td></tr>';
  });
  html+='</tbody></table>';
  html+='<div style="margin-top:14px"><button class="btn btn-teal btn-lg" onclick="nextRound()">Next Round →</button></div>';
  el.innerHTML=html;
}

// ===== GAME OVER =====
function renderGameOver(s){
  const el=document.getElementById('gameOverBox');
  const sorted=[...s.players].sort((a,b)=>b.totalScore-a.totalScore);
  el.innerHTML='<h2>🏆 '+esc(s.winner)+' Wins!</h2>'+
    '<p>Reached '+s.targetScore+'+ points</p>';
  let table='<table class="rs-table" style="margin:0 auto;max-width:300px"><thead><tr><th>#</th><th>Player</th><th>Score</th></tr></thead><tbody>';
  sorted.forEach((p,i)=>{
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'.';
    table+='<tr><td>'+medal+'</td><td style="font-weight:700">'+esc(p.name)+'</td>'+
      '<td style="color:var(--gold);font-weight:700">'+p.totalScore+'</td></tr>';
  });
  table+='</tbody></table>';
  el.innerHTML+=table;
  el.innerHTML+='<div style="margin-top:16px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
    '<button class="btn btn-green btn-lg" onclick="newGame()">Keep Playing</button>'+
    '<button class="btn btn-sec btn-lg" onclick="newRoom()">New Room</button>'+
    '</div>';
  confetti();
}

// ===== HELPERS =====
function calcScore(p){
  const nums=p.cards.filter(c=>c.type==='number');
  let sum=nums.reduce((s,c)=>s+(c.value||0),0);
  if(p.cards.some(c=>c.type==='modifier'&&c.modifier==='x2'))sum*=2;
  const mods=p.cards.filter(c=>c.type==='modifier'&&c.modifier!=='x2')
    .reduce((s,c)=>s+parseInt(c.modifier.replace('+','')),0);
  let total=sum+mods;
  if(new Set(nums.map(c=>c.value)).size>=7)total+=15;
  return total;
}
function getNumCount(p){return p.cards.filter(c=>c.type==='number').length}
function esc(s){return (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

function startPoll(){
  if(pollInterval)clearInterval(pollInterval);
  pollInterval=setInterval(()=>{
    if(!roomCode)return;
    const url='/api/game/'+roomCode+(playerId?'?playerId='+playerId:'');
    fetch(url).then(r=>r.json()).then(d=>{
      if(d.error)return;const j=JSON.stringify(d);
      if(j===lastJSON)return;lastJSON=j;renderState(d);
    }).catch(()=>{});
  },1500);
}

function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(id!=='sLanding')document.getElementById('headerSub').textContent='Room: '+(roomCode||'');
  // Show chat in lobby/game/round-end/game-over (anywhere we are inside a room)
  const cp=document.getElementById('chatPanel');
  if(cp)cp.style.display=(id==='sLanding')?'none':'block';
  updateChatInputState();
}

function updateChatInputState(){
  const input=document.getElementById('chatInput');
  const btn=document.getElementById('chatSendBtn');
  if(!input||!btn)return;
  const enabled=!!playerId&&!!roomCode;
  input.disabled=!enabled;
  btn.disabled=!enabled;
  input.placeholder=enabled?'Say something...':'Join the room to chat';
}

let lastChatId='';
function renderChat(state){
  const log=document.getElementById('chatLog');
  const countEl=document.getElementById('chatCount');
  if(!log)return;
  const msgs=Array.isArray(state.chat)?state.chat:[];
  if(countEl)countEl.textContent=msgs.length?msgs.length+' message'+(msgs.length===1?'':'s'):'';
  const newestId=msgs.length?msgs[msgs.length-1].id:'';
  if(newestId===lastChatId&&log.children.length===Math.max(1,msgs.length))return;
  lastChatId=newestId;
  if(msgs.length===0){
    log.innerHTML='<div class="chat-empty">No messages yet.</div>';
    return;
  }
  log.innerHTML=msgs.map(m=>{
    const cls='chat-msg'+(m.isMe?' is-me':'');
    return '<div class="'+cls+'"><span class="cm-name">'+esc(m.senderName)+'</span><span>'+esc(m.body)+'</span></div>';
  }).join('');
  log.scrollTop=log.scrollHeight;
}

function sendChat(){
  const input=document.getElementById('chatInput');
  if(!input)return;
  const text=input.value.trim();
  if(!text||!roomCode||!playerId)return;
  fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({gameId:roomCode,playerId,body:text})}).then(r=>r.json()).then(d=>{
    if(d.error){toast(d.error);return}
    input.value='';
    lastJSON=JSON.stringify(d);renderState(d);
  }).catch(()=>toast('Failed'));
}

document.getElementById('chatInput').addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}
});
function copyCode(){if(roomCode)navigator.clipboard.writeText(roomCode).then(()=>toast('Copied: '+roomCode))}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function confetti(){
  const c=document.getElementById('confettiContainer');c.innerHTML='';
  const cols=['var(--teal)','var(--gold)','var(--green)','var(--purple)','var(--cyan)','#f97316','#ec4899'];
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
