import { getHTML } from './html';

export interface Env {
  GAME_ROOM: DurableObjectNamespace;
  STATS: DurableObjectNamespace;
}

// ============================================================
// DECK — Official Flip 7 composition (94 cards)
// Number: 0×1, 1×1, 2×2, 3×3, 4×4, 5×5, 6×6, 7×7, 8×8, 9×9, 10×10, 11×11, 12×12
// Modifier: +2, +4, +6, +8, +10, x2 (6 total)
// Action: Freeze×3, Flip Three×3, Second Chance×3 (9 total)
// ============================================================

type CardType = 'number' | 'modifier' | 'action';
type ActionKind = 'freeze' | 'flip3' | 'second-chance';
type ModifierKind = '+2' | '+4' | '+6' | '+8' | '+10' | 'x2';

interface Card {
  type: CardType;
  value?: number;
  modifier?: ModifierKind;
  action?: ActionKind;
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  deck.push({ type: 'number', value: 0 });
  for (let n = 1; n <= 12; n++) {
    for (let i = 0; i < n; i++) {
      deck.push({ type: 'number', value: n });
    }
  }
  const mods: ModifierKind[] = ['+2', '+4', '+6', '+8', '+10', 'x2'];
  for (const m of mods) deck.push({ type: 'modifier', modifier: m });
  const actions: ActionKind[] = ['freeze', 'freeze', 'freeze', 'flip3', 'flip3', 'flip3', 'second-chance', 'second-chance', 'second-chance'];
  for (const a of actions) deck.push({ type: 'action', action: a });
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PlayerState {
  id: string;
  name: string;
  cards: Card[];
  totalScore: number;
  roundScore: number;
  busted: boolean;
  stayed: boolean;
  frozen: boolean;
  hasSecondChance: boolean;
  flipped7: boolean;
  pendingFlip3: number;
  pendingAction: Card | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: number;
}

interface GameState {
  roomCode: string;
  players: PlayerState[];
  deck: Card[];
  discardPile: Card[];
  phase: 'lobby' | 'playing' | 'round-end' | 'game-over';
  currentPlayerIdx: number;
  dealerIdx: number;
  round: number;
  targetScore: number;
  lastEvent: string | null;
  winner: string | null;
  chat: ChatMessage[];
  winRecorded?: boolean;
}

const CHAT_MAX = 100;
const CHAT_MAX_LEN = 300;

function generateCode(): string {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

function generateId(): string {
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

function createGame(): GameState {
  return {
    roomCode: generateCode(),
    players: [],
    deck: shuffle(buildDeck()),
    discardPile: [],
    phase: 'lobby',
    currentPlayerIdx: 0,
    dealerIdx: 0,
    round: 1,
    targetScore: 200,
    lastEvent: null,
    winner: null,
    chat: [],
  };
}

function drawCard(game: GameState): Card | null {
  // If deck empty, reshuffle discard pile (official rule)
  if (game.deck.length === 0) {
    if (game.discardPile.length === 0) return null;
    game.deck = shuffle(game.discardPile);
    game.discardPile = [];
  }
  return game.deck.pop()!;
}

function getNumberCards(player: PlayerState): Card[] {
  return player.cards.filter(c => c.type === 'number');
}

function getUniqueNumberCount(player: PlayerState): number {
  return new Set(getNumberCards(player).map(c => c.value)).size;
}

function hasNumberDuplicate(player: PlayerState, newCard: Card): boolean {
  if (newCard.type !== 'number') return false;
  return player.cards.some(c => c.type === 'number' && c.value === newCard.value);
}

function calcRoundScore(player: PlayerState): number {
  const numCards = getNumberCards(player);
  // 1. Sum of number card values
  let numSum = numCards.reduce((s, c) => s + (c.value ?? 0), 0);

  // 2. If x2 modifier, double the number sum first
  const hasX2 = player.cards.some(c => c.type === 'modifier' && c.modifier === 'x2');
  if (hasX2) numSum *= 2;

  // 3. Add other modifier bonuses
  const modTotal = player.cards
    .filter(c => c.type === 'modifier' && c.modifier !== 'x2')
    .reduce((s, c) => s + parseInt(c.modifier!.replace('+', '')), 0);

  let total = numSum + modTotal;

  // 4. Flip 7 bonus: 7 unique number cards = +15
  if (getUniqueNumberCount(player) >= 7) total += 15;

  return total;
}

function isPlayerActive(p: PlayerState): boolean {
  return !p.busted && !p.stayed && !p.frozen;
}

function advanceToNextPlayer(game: GameState): void {
  const n = game.players.length;
  let attempts = 0;
  do {
    game.currentPlayerIdx = (game.currentPlayerIdx + 1) % n;
    attempts++;
  } while (!isPlayerActive(game.players[game.currentPlayerIdx]) && attempts < n);

  if (!game.players.some(isPlayerActive)) {
    endRound(game);
  }
}

function endRound(game: GameState): void {
  for (const p of game.players) {
    if (p.busted) {
      p.roundScore = 0;
    } else {
      p.roundScore = calcRoundScore(p);
    }
    p.totalScore += p.roundScore;
  }

  const over = game.players.filter(p => p.totalScore >= game.targetScore);
  if (over.length > 0) {
    const maxScore = Math.max(...over.map(p => p.totalScore));
    const winners = over.filter(p => p.totalScore === maxScore);
    if (winners.length === 1) {
      game.phase = 'game-over';
      game.winner = winners[0].name;
    } else {
      // Tie at 200+ — play another round
      game.phase = 'round-end';
    }
  } else {
    game.phase = 'round-end';
  }

  if (game.phase !== 'game-over') {
    game.phase = 'round-end';
  }
}

function startNewRound(game: GameState): void {
  game.round++;

  // Official rule: cards from previous round go to discard (not reshuffled)
  for (const p of game.players) {
    game.discardPile.push(...p.cards);
    p.cards = [];
    p.roundScore = 0;
    p.busted = false;
    p.stayed = false;
    p.frozen = false;
    p.hasSecondChance = false;
    p.flipped7 = false;
    p.pendingFlip3 = 0;
    p.pendingAction = null;
  }

  // Rotate dealer (pass deck to the left)
  game.dealerIdx = (game.dealerIdx + 1) % game.players.length;

  // If deck is running low, reshuffle discard into deck
  if (game.deck.length < game.players.length * 3) {
    game.deck = shuffle([...game.deck, ...game.discardPile]);
    game.discardPile = [];
  }

  game.phase = 'playing';
  game.lastEvent = null;

  // Deal one card to each player starting from left of dealer
  for (let i = 0; i < game.players.length; i++) {
    const idx = (game.dealerIdx + 1 + i) % game.players.length;
    const card = drawCard(game);
    if (card) dealCardToPlayer(game, game.players[idx], card);
  }

  // First active player after dealer starts
  game.currentPlayerIdx = (game.dealerIdx + 1) % game.players.length;
  if (!isPlayerActive(game.players[game.currentPlayerIdx])) {
    advanceToNextPlayer(game);
  }
}

// Deal a card to a player, handling all card types per official rules
function dealCardToPlayer(game: GameState, player: PlayerState, card: Card): string | null {
  // === SECOND CHANCE ===
  if (card.type === 'action' && card.action === 'second-chance') {
    if (player.hasSecondChance) {
      // Official rule: must give to another active player without one, or discard
      const validTarget = game.players.find(p =>
        p.id !== player.id && isPlayerActive(p) && !p.hasSecondChance
      );
      if (validTarget) {
        validTarget.hasSecondChance = true;
        validTarget.cards.push(card);
        return `${player.name} already has Second Chance — gave it to ${validTarget.name}`;
      } else {
        game.discardPile.push(card);
        return `${player.name} already has Second Chance — discarded`;
      }
    }
    player.hasSecondChance = true;
    player.cards.push(card);
    return `${player.name} drew Second Chance 🛡️`;
  }

  // === FREEZE / FLIP THREE ===
  if (card.type === 'action' && (card.action === 'freeze' || card.action === 'flip3')) {
    player.pendingAction = card;
    player.cards.push(card);
    const name = card.action === 'freeze' ? 'Freeze ❄️' : 'Flip Three 🃏';
    return `${player.name} drew ${name} — choose a target!`;
  }

  // === NUMBER CARD ===
  if (card.type === 'number') {
    if (hasNumberDuplicate(player, card)) {
      if (player.hasSecondChance) {
        // Second Chance saves from bust
        player.hasSecondChance = false;
        const scIdx = player.cards.findIndex(c => c.type === 'action' && c.action === 'second-chance');
        if (scIdx >= 0) {
          game.discardPile.push(player.cards[scIdx]);
          player.cards.splice(scIdx, 1);
        }
        game.discardPile.push(card); // duplicate goes to discard
        return `${player.name} drew duplicate ${card.value} but Second Chance saved them! 🛡️`;
      } else {
        player.cards.push(card);
        player.busted = true;
        return `💥 ${player.name} BUSTED on duplicate ${card.value}!`;
      }
    }

    player.cards.push(card);

    // Check for FLIP 7 — auto-ends round for everyone!
    if (getUniqueNumberCount(player) >= 7) {
      player.flipped7 = true;
      player.stayed = true;
      // End round immediately for ALL players
      endRound(game);
      return `🎉 ${player.name} got FLIP 7!!! Round over for everyone!`;
    }

    return `${player.name} drew a ${card.value}`;
  }

  // === MODIFIER CARD ===
  player.cards.push(card);
  if (card.type === 'modifier') {
    return `${player.name} drew ${card.modifier}`;
  }
  return null;
}

// Resolve Flip Three — official rules: draw 3, queue nested actions
function resolveFlipThree(game: GameState, target: PlayerState): string[] {
  const events: string[] = [];
  const queuedActions: Card[] = [];
  let cardsDrawn = 0;

  while (cardsDrawn < 3 && !target.busted && game.phase === 'playing') {
    const c = drawCard(game);
    if (!c) break;
    cardsDrawn++;

    // Official rule: Freeze/Flip Three drawn during Flip Three resolve AFTER
    if (c.type === 'action' && (c.action === 'freeze' || c.action === 'flip3')) {
      target.cards.push(c);
      queuedActions.push(c);
      const name = c.action === 'freeze' ? 'Freeze' : 'Flip Three';
      events.push(`${target.name} drew ${name} (resolves after)`);
      continue;
    }

    // Second Chance can be used immediately during Flip Three
    if (c.type === 'action' && c.action === 'second-chance') {
      if (target.hasSecondChance) {
        const validTarget = game.players.find(p =>
          p.id !== target.id && isPlayerActive(p) && !p.hasSecondChance
        );
        if (validTarget) {
          validTarget.hasSecondChance = true;
          validTarget.cards.push(c);
          events.push(`Gave Second Chance to ${validTarget.name}`);
        } else {
          game.discardPile.push(c);
          events.push(`Extra Second Chance discarded`);
        }
      } else {
        target.hasSecondChance = true;
        target.cards.push(c);
        events.push(`${target.name} got Second Chance`);
      }
      continue;
    }

    // Normal card (number or modifier)
    const ev = dealCardToPlayer(game, target, c);
    if (ev) events.push(ev);

    // Stop if Flip 7 triggered or bust
    if (game.phase !== 'playing' || target.busted) break;
  }

  target.pendingFlip3 = 0;

  // Resolve queued actions if target didn't bust
  if (!target.busted && game.phase === 'playing' && queuedActions.length > 0) {
    // Set first queued action as pending for the target to resolve
    target.pendingAction = queuedActions[0];
    // Note: if there are multiple queued actions, they'd need to be resolved
    // one at a time. For simplicity, additional ones are auto-resolved on self.
    for (let i = 1; i < queuedActions.length; i++) {
      const qa = queuedActions[i];
      if (qa.action === 'freeze') {
        // Auto-freeze self if multiple queued
        target.frozen = true;
        target.stayed = true;
        events.push(`${target.name} was auto-frozen`);
      }
    }
  }

  return events;
}

function filterForPlayer(game: GameState, playerId: string | null): any {
  return {
    roomCode: game.roomCode,
    phase: game.phase,
    round: game.round,
    currentPlayerIdx: game.currentPlayerIdx,
    dealerIdx: game.dealerIdx,
    lastEvent: game.lastEvent,
    winner: game.winner,
    targetScore: game.targetScore,
    deckSize: game.deck.length,
    chat: (game.chat || []).map(m => ({
      id: m.id,
      senderName: m.senderName,
      body: m.body,
      createdAt: m.createdAt,
      isMe: !!playerId && m.senderId === playerId,
    })),
    players: game.players.map((p, i) => ({
      id: p.id === playerId ? p.id : undefined,
      name: p.name,
      cards: p.cards.map(c => ({
        type: c.type,
        value: c.value,
        modifier: c.modifier,
        action: c.action,
      })),
      totalScore: p.totalScore,
      roundScore: p.roundScore,
      busted: p.busted,
      stayed: p.stayed,
      frozen: p.frozen,
      flipped7: p.flipped7,
      hasSecondChance: p.hasSecondChance,
      pendingFlip3: p.pendingFlip3,
      hasPendingAction: p.pendingAction !== null,
      pendingActionType: p.pendingAction?.action ?? null,
      isDealer: i === game.dealerIdx,
      isMe: p.id === playerId,
    })),
    _playerId: playerId,
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}

function newPlayer(id: string, name: string): PlayerState {
  return {
    id, name, cards: [], totalScore: 0, roundScore: 0,
    busted: false, stayed: false, frozen: false,
    hasSecondChance: false, flipped7: false,
    pendingFlip3: 0, pendingAction: null,
  };
}

// ============================================================
// Durable Object — one instance per game room
// ============================================================

export class Flip7Room {
  private state: DurableObjectState;
  private env: Env;
  private game: GameState | null = null;

  constructor(state: DurableObjectState, env: Env) { this.state = state; this.env = env; }

  private async recordWin(winnerName: string, players: { name: string; totalScore: number }[]): Promise<void> {
    if (!this.env?.STATS) return;
    try {
      const stub = this.env.STATS.get(this.env.STATS.idFromName('global'));
      await stub.fetch('https://stats/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerName,
          roomCode: this.game?.roomCode,
          players,
          finishedAt: Date.now(),
        }),
      });
    } catch (e) {
      console.error('recordWin failed:', e);
    }
  }

  private async load(): Promise<GameState | null> {
    if (this.game) return this.game;
    const stored = (await this.state.storage.get<GameState>('game')) ?? null;
    if (stored && !Array.isArray(stored.chat)) stored.chat = [];
    this.game = stored;
    return this.game;
  }
  private async save(): Promise<void> {
    if (!this.game) return;
    // Record win exactly once when phase first reaches game-over
    if (this.game.phase === 'game-over' && this.game.winner && !this.game.winRecorded) {
      this.game.winRecorded = true;
      await this.recordWin(
        this.game.winner,
        this.game.players.map(p => ({ name: p.name, totalScore: p.totalScore })),
      );
    }
    await this.state.storage.put('game', this.game);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' } });
    }
    try {
      switch (action) {
        case 'create': return await this.doCreate(request);
        case 'state': return await this.doState(request);
        case 'join': return await this.doJoin(request);
        case 'start': return await this.doStart(request);
        case 'hit': return await this.doHit(request);
        case 'stay': return await this.doStay(request);
        case 'action': return await this.doAction(request);
        case 'next-round': return await this.doNextRound(request);
        case 'new-game': return await this.doNewGame(request);
        case 'chat': return await this.doChat(request);
        default: return json({ error: 'Unknown action' }, 400);
      }
    } catch (e: any) { return json({ error: e.message || 'Internal error' }, 500); }
  }

  private async doCreate(request: Request): Promise<Response> {
    const body = await request.json() as { roomCode: string };
    const g = createGame();
    g.roomCode = body.roomCode;
    this.game = g;
    await this.save();
    return json({ roomCode: g.roomCode });
  }

  private async doState(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pid = url.searchParams.get('playerId');
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    return json(filterForPlayer(game, pid));
  }

  private async doJoin(request: Request): Promise<Response> {
    const body = await request.json() as { name: string };
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    if (game.phase !== 'lobby') return json({ error: 'Game already started' }, 400);
    if (game.players.length >= 8) return json({ error: 'Room full (max 8)' }, 400);
    const name = body.name.trim();
    if (!name) return json({ error: 'Enter a name' }, 400);
    const existing = game.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return json({ playerId: existing.id, game: filterForPlayer(game, existing.id) });
    }
    const pid = generateId();
    game.players.push(newPlayer(pid, name));
    await this.save();
    return json({ playerId: pid, game: filterForPlayer(game, pid) });
  }

  private async doStart(request: Request): Promise<Response> {
    const body = await request.json() as { playerId: string };
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    if (game.phase !== 'lobby' && game.phase !== 'round-end') return json({ error: 'Cannot start now' }, 400);
    if (game.players.length < 2) return json({ error: 'Need at least 2 players' }, 400);

    if (game.phase === 'lobby') {
      game.deck = shuffle(buildDeck());
      game.discardPile = [];
      game.phase = 'playing';
      game.round = 1;
      game.dealerIdx = 0;
      for (let i = 0; i < game.players.length; i++) {
        const idx = (game.dealerIdx + 1 + i) % game.players.length;
        const card = drawCard(game);
        if (card) dealCardToPlayer(game, game.players[idx], card);
      }
      game.currentPlayerIdx = (game.dealerIdx + 1) % game.players.length;
      if (!isPlayerActive(game.players[game.currentPlayerIdx])) advanceToNextPlayer(game);
      game.lastEvent = `Round 1 — cards dealt! ${game.players[game.dealerIdx].name} is dealer.`;
    } else {
      startNewRound(game);
      game.lastEvent = `Round ${game.round} — ${game.players[game.dealerIdx].name} is dealer.`;
    }
    await this.save();
    return json(filterForPlayer(game, body.playerId));
  }

  private async doHit(request: Request): Promise<Response> {
    const body = await request.json() as { playerId: string };
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);
    const player = game.players[game.currentPlayerIdx];
    if (player.id !== body.playerId) return json({ error: 'Not your turn' }, 400);
    if (player.pendingAction) return json({ error: 'Resolve your action card first' }, 400);
    const card = drawCard(game);
    if (!card) return json({ error: 'Deck empty' }, 400);
    game.lastEvent = dealCardToPlayer(game, player, card);
    if (game.phase !== 'playing') { /* round ended */ }
    else if (player.pendingAction) { /* wait for action target */ }
    else { advanceToNextPlayer(game); }
    await this.save();
    return json(filterForPlayer(game, body.playerId));
  }

  private async doStay(request: Request): Promise<Response> {
    const body = await request.json() as { playerId: string };
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);
    const player = game.players[game.currentPlayerIdx];
    if (player.id !== body.playerId) return json({ error: 'Not your turn' }, 400);
    player.stayed = true;
    game.lastEvent = `${player.name} stayed with ${calcRoundScore(player)} points ✋`;
    advanceToNextPlayer(game);
    await this.save();
    return json(filterForPlayer(game, body.playerId));
  }

  private async doAction(request: Request): Promise<Response> {
    const body = await request.json() as { playerId: string; targetId: string };
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);
    const player = game.players.find(p => p.id === body.playerId);
    if (!player || !player.pendingAction) return json({ error: 'No pending action' }, 400);
    const target = game.players.find(p => p.id === body.targetId) ||
                   game.players.find(p => p.name === body.targetId);
    if (!target) return json({ error: 'Invalid target' }, 400);
    if (target.busted || target.stayed || target.frozen) return json({ error: 'Target not active' }, 400);

    const action = player.pendingAction;
    player.pendingAction = null;

    if (action.action === 'freeze') {
      target.frozen = true;
      target.stayed = true;
      game.lastEvent = `❄️ ${player.name} froze ${target.name}! (banked ${calcRoundScore(target)} pts)`;
    } else if (action.action === 'flip3') {
      game.lastEvent = `🃏 ${player.name} used Flip Three on ${target.name}!`;
      const events = resolveFlipThree(game, target);
      if (events.length > 0) game.lastEvent += ' → ' + events.join(' → ');
    }

    if (game.phase === 'playing') {
      const cur = game.players[game.currentPlayerIdx];
      if (cur.id === body.playerId && !cur.pendingAction) {
        // After resolving action, advance (1 card per turn rule)
        advanceToNextPlayer(game);
      }
      if (!game.players.some(isPlayerActive) && game.phase === 'playing') endRound(game);
    }
    await this.save();
    return json(filterForPlayer(game, body.playerId));
  }

  private async doNextRound(request: Request): Promise<Response> {
    const body = await request.json() as { playerId: string };
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    if (game.phase !== 'round-end') return json({ error: 'Not at round end' }, 400);
    startNewRound(game);
    game.lastEvent = `Round ${game.round} — ${game.players[game.dealerIdx].name} is dealer.`;
    await this.save();
    return json(filterForPlayer(game, body.playerId));
  }

  private async doNewGame(request: Request): Promise<Response> {
    const body = await request.json() as { playerId: string };
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    const g = createGame();
    g.roomCode = game.roomCode;
    g.players = game.players.map(p => newPlayer(p.id, p.name));
    g.phase = 'lobby';
    g.chat = game.chat || [];
    this.game = g;
    await this.save();
    return json(filterForPlayer(g, body.playerId));
  }

  private async doChat(request: Request): Promise<Response> {
    const body = await request.json() as { playerId: string; body: string };
    const game = await this.load();
    if (!game) return json({ error: 'Game not found' }, 404);
    const player = game.players.find(p => p.id === body.playerId);
    if (!player) return json({ error: 'Player not in this room' }, 403);
    const text = (body.body || '').trim().slice(0, CHAT_MAX_LEN);
    if (!text) return json({ error: 'Empty message' }, 400);
    if (!Array.isArray(game.chat)) game.chat = [];
    game.chat.push({
      id: generateId(),
      senderId: player.id,
      senderName: player.name,
      body: text,
      createdAt: Date.now(),
    });
    if (game.chat.length > CHAT_MAX) {
      game.chat = game.chat.slice(-CHAT_MAX);
    }
    await this.save();
    return json(filterForPlayer(game, body.playerId));
  }
}

// ============================================================
// Worker entry — routes to Durable Object
// ============================================================

function getStub(env: Env, roomCode: string): DurableObjectStub {
  const id = env.GAME_ROOM.idFromName(roomCode.toUpperCase());
  return env.GAME_ROOM.get(id);
}

function fwd(env: Env, code: string, action: string, request: Request, body?: any): Promise<Response> {
  const stub = getStub(env, code);
  const qs = action.includes('?') ? action : `?action=${action}`;
  return stub.fetch(new Request(`https://do/${qs}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }));
}

// ============================================================
// Stats DO — single instance ('global') tracking all wins
// ============================================================

interface WinEntry {
  winnerName: string;
  roomCode: string;
  finalScore?: number;
  players: { name: string; totalScore: number }[];
  finishedAt: number;
}

export class Flip7Stats {
  private state: DurableObjectState;
  constructor(state: DurableObjectState) { this.state = state; }

  private async loadWins(): Promise<WinEntry[]> {
    // One-time backfill of remembered wins (Aryan x2, AJ x1) the first
    // time this DO is read. Self-locking via the 'seeded:v1' flag so
    // it never runs again.
    const seeded = await this.state.storage.get<boolean>('seeded:v1');
    const existing = (await this.state.storage.get<WinEntry[]>('wins')) ?? [];
    if (!seeded) {
      const now = Date.now();
      const day = 86400000;
      const backfill: WinEntry[] = [
        { winnerName: 'AJ', roomCode: '—', players: [], finishedAt: now - 3 * day },
        { winnerName: 'Aryan', roomCode: '—', players: [], finishedAt: now - 2 * day },
        { winnerName: 'Aryan', roomCode: '—', players: [], finishedAt: now - day },
      ];
      const merged = [...backfill, ...existing];
      await this.state.storage.put('wins', merged);
      await this.state.storage.put('seeded:v1', true);
      return merged;
    }
    return existing;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/record' && request.method === 'POST') {
      const body = await request.json() as WinEntry;
      const wins = await this.loadWins();
      wins.push({
        winnerName: body.winnerName,
        roomCode: body.roomCode,
        players: body.players || [],
        finalScore: body.players?.find(p => p.name === body.winnerName)?.totalScore,
        finishedAt: body.finishedAt || Date.now(),
      });
      // Keep last 1000 to bound storage
      const trimmed = wins.slice(-1000);
      await this.state.storage.put('wins', trimmed);
      return json({ ok: true, count: trimmed.length });
    }
    if (url.pathname === '/list' && request.method === 'GET') {
      const wins = await this.loadWins();
      return json(wins);
    }
    return json({ error: 'Not found' }, 404);
  }
}

function renderWinsPage(wins: WinEntry[]): string {
  // Aggregate by name
  const tally: Record<string, { wins: number; latest: number }> = {};
  for (const w of wins) {
    const k = w.winnerName;
    if (!tally[k]) tally[k] = { wins: 0, latest: 0 };
    tally[k].wins++;
    if (w.finishedAt > tally[k].latest) tally[k].latest = w.finishedAt;
  }
  const rows = Object.entries(tally)
    .map(([name, t]) => ({ name, wins: t.wins, latest: t.latest }))
    .sort((a, b) => b.wins - a.wins || b.latest - a.latest);

  const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Flip 7 — Wins</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:#0b1220;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;padding:32px 16px;min-height:100vh}
.wrap{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:24px}
h1{font-size:1.6rem;font-weight:800;letter-spacing:0.04em;background:linear-gradient(135deg,#facc15,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sub{color:#94a3b8;font-size:.85rem;margin-top:4px}
.card{background:#1e293b;border:1px solid #334155;border-radius:14px;overflow:hidden}
.card h2{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;color:#5eead4;padding:12px 16px;border-bottom:1px solid #334155;font-weight:800}
.row{display:grid;grid-template-columns:32px 1fr auto;gap:12px;padding:12px 16px;border-bottom:1px solid #1e293b;align-items:center}
.row:last-child{border-bottom:none}
.rank{font-weight:800;color:#94a3b8;font-size:.9rem}
.rank.gold{color:#facc15}.rank.silver{color:#cbd5e1}.rank.bronze{color:#f97316}
.name{font-weight:700;font-size:1rem}
.meta{color:#94a3b8;font-size:.75rem;margin-top:2px}
.wins-pill{background:rgba(13,148,136,.15);color:#5eead4;padding:6px 12px;border-radius:999px;font-weight:800;font-size:.85rem}
.recent .row{grid-template-columns:1fr auto;font-size:.85rem;padding:10px 16px}
.recent .when{color:#64748b;font-size:.7rem}
.empty{padding:24px 16px;text-align:center;color:#94a3b8;font-size:.9rem}
</style></head>
<body><div class="wrap">
<header><h1>🏆 Wins</h1><p class="sub">All Flip 7 wins ever recorded · ${wins.length} total</p></header>
<div class="card"><h2>Leaderboard</h2>
${rows.length === 0 ? '<div class="empty">No wins recorded yet. Finish a game and it&apos;ll show up here.</div>' :
  rows.map((r, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    return `<div class="row"><span class="rank ${rankClass}">${i+1}</span><div class="name">${esc(r.name)}</div><span class="wins-pill">${r.wins} win${r.wins===1?'':'s'}</span></div>`;
  }).join('')}
</div>
</div></body></html>`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' } });
    }
    if (request.method === 'GET' && pathname === '/') {
      return new Response(getHTML(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Secret wins page
    if (request.method === 'GET' && pathname === '/wins') {
      const stub = env.STATS.get(env.STATS.idFromName('global'));
      const res = await stub.fetch('https://stats/list');
      const wins = await res.json() as WinEntry[];
      return new Response(renderWinsPage(wins), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex' },
      });
    }
    if (request.method === 'GET' && pathname === '/api/stats') {
      const stub = env.STATS.get(env.STATS.idFromName('global'));
      const res = await stub.fetch('https://stats/list');
      const wins = await res.json();
      return json(wins);
    }

    if (request.method === 'POST' && pathname === '/api/create') {
      const roomCode = generateCode();
      return fwd(env, roomCode, 'create', request, { roomCode });
    }

    const gameMatch = pathname.match(/^\/api\/game\/([A-Za-z0-9]{4})$/);
    if (request.method === 'GET' && gameMatch) {
      const code = gameMatch[1].toUpperCase();
      const pid = url.searchParams.get('playerId') || '';
      return fwd(env, code, `?action=state&playerId=${pid}`, request);
    }

    // All POST actions: extract gameId, forward body
    const postActions: Record<string, string> = {
      '/api/join': 'join', '/api/start': 'start', '/api/hit': 'hit',
      '/api/stay': 'stay', '/api/action': 'action',
      '/api/next-round': 'next-round', '/api/new-game': 'new-game',
      '/api/chat': 'chat',
    };
    if (request.method === 'POST' && postActions[pathname]) {
      const body = await request.json() as any;
      const code = (body.gameId || '').toUpperCase();
      if (!code) return json({ error: 'Missing gameId' }, 400);
      return fwd(env, code, postActions[pathname], request, body);
    }

    return json({ error: 'Not found' }, 404);
  },
};
