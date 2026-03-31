import { getHTML } from './html';

export interface Env {
  FLIP7: KVNamespace;
}

// ============================================================
// DECK COMPOSITION
// Number cards: 0×1, 1×1, 2×2, 3×3, 4×4, 5×5, 6×6, 7×7, 8×8, 9×9, 10×10, 11×11, 12×12
// Modifier cards: +2, +4, +6, +8, +8, +10, x2 (7 total)
// Action cards: Freeze×3, Flip Three×3, Second Chance×3 (9 total)
// Total: 1+1+2+3+4+5+6+7+8+9+10+11+12 + 7 + 9 = 78+7+9 = 94
// ============================================================

type CardType = 'number' | 'modifier' | 'action';
type ActionKind = 'freeze' | 'flip3' | 'second-chance';
type ModifierKind = '+2' | '+4' | '+6' | '+8' | '+10' | 'x2';

interface Card {
  type: CardType;
  value?: number;          // for number cards
  modifier?: ModifierKind; // for modifier cards
  action?: ActionKind;     // for action cards
}

function buildDeck(): Card[] {
  const deck: Card[] = [];
  // Number cards: value N appears N times (0 appears once)
  deck.push({ type: 'number', value: 0 });
  for (let n = 1; n <= 12; n++) {
    for (let i = 0; i < n; i++) {
      deck.push({ type: 'number', value: n });
    }
  }
  // Modifier cards
  const mods: ModifierKind[] = ['+2', '+4', '+6', '+8', '+8', '+10', 'x2'];
  for (const m of mods) {
    deck.push({ type: 'modifier', modifier: m });
  }
  // Action cards
  const actions: ActionKind[] = ['freeze', 'freeze', 'freeze', 'flip3', 'flip3', 'flip3', 'second-chance', 'second-chance', 'second-chance'];
  for (const a of actions) {
    deck.push({ type: 'action', action: a });
  }
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
  totalScore: number;     // across all rounds
  roundScore: number;     // current round
  busted: boolean;
  stayed: boolean;
  frozen: boolean;
  hasSecondChance: boolean;
  pendingFlip3: number;   // cards left to flip from Flip Three
  pendingAction: Card | null; // action card to resolve (choose target)
}

interface GameState {
  roomCode: string;
  players: PlayerState[];
  deck: Card[];
  phase: 'lobby' | 'playing' | 'round-end' | 'game-over';
  currentPlayerIdx: number;
  round: number;
  targetScore: number;
  lastEvent: string | null;
  winner: string | null;
}

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
    phase: 'lobby',
    currentPlayerIdx: 0,
    round: 1,
    targetScore: 200,
    lastEvent: null,
    winner: null,
  };
}

function drawCard(game: GameState): Card | null {
  if (game.deck.length === 0) return null;
  return game.deck.pop()!;
}

function getNumberCards(player: PlayerState): Card[] {
  return player.cards.filter(c => c.type === 'number');
}

function hasNumberDuplicate(player: PlayerState, newCard: Card): boolean {
  if (newCard.type !== 'number') return false;
  return player.cards.some(c => c.type === 'number' && c.value === newCard.value);
}

function calcRoundScore(player: PlayerState): number {
  const numCards = getNumberCards(player);
  let numSum = numCards.reduce((s, c) => s + (c.value ?? 0), 0);

  // Check for x2 modifier
  const hasX2 = player.cards.some(c => c.type === 'modifier' && c.modifier === 'x2');
  if (hasX2) numSum *= 2;

  // Add other modifiers
  const modTotal = player.cards
    .filter(c => c.type === 'modifier' && c.modifier !== 'x2')
    .reduce((s, c) => {
      const val = parseInt(c.modifier!.replace('+', ''));
      return s + val;
    }, 0);

  let total = numSum + modTotal;

  // 7 unique number cards bonus (+15)
  const uniqueNums = new Set(numCards.map(c => c.value));
  if (uniqueNums.size >= 7) total += 15;

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

  // Check if round is over (no active players)
  const anyActive = game.players.some(isPlayerActive);
  if (!anyActive) {
    endRound(game);
  }
}

function endRound(game: GameState): void {
  // Calculate scores
  for (const p of game.players) {
    if (p.busted) {
      p.roundScore = 0;
    } else {
      p.roundScore = calcRoundScore(p);
    }
    p.totalScore += p.roundScore;
  }

  // Check for game over
  const over200 = game.players.filter(p => p.totalScore >= game.targetScore);
  if (over200.length > 0) {
    const maxScore = Math.max(...over200.map(p => p.totalScore));
    const winners = over200.filter(p => p.totalScore === maxScore);
    if (winners.length === 1) {
      game.phase = 'game-over';
      game.winner = winners[0].name;
    } else {
      // Tie — play another round
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
  game.deck = shuffle(buildDeck());
  game.phase = 'playing';
  game.lastEvent = null;

  for (const p of game.players) {
    p.cards = [];
    p.roundScore = 0;
    p.busted = false;
    p.stayed = false;
    p.frozen = false;
    p.hasSecondChance = false;
    p.pendingFlip3 = 0;
    p.pendingAction = null;
  }

  // Deal one card to each player
  game.currentPlayerIdx = 0;
  for (const p of game.players) {
    const card = drawCard(game);
    if (card) dealCardToPlayer(game, p, card);
  }
  game.currentPlayerIdx = 0;

  // Make sure current player is active
  if (!isPlayerActive(game.players[0])) {
    advanceToNextPlayer(game);
  }
}

function dealCardToPlayer(game: GameState, player: PlayerState, card: Card): string | null {
  if (card.type === 'action' && card.action === 'second-chance') {
    player.hasSecondChance = true;
    player.cards.push(card);
    return `${player.name} got a Second Chance card`;
  }

  if (card.type === 'action' && (card.action === 'freeze' || card.action === 'flip3')) {
    // Player must choose a target (including themselves)
    player.pendingAction = card;
    player.cards.push(card);
    return `${player.name} drew ${card.action === 'freeze' ? 'Freeze' : 'Flip Three'} — choose a target`;
  }

  if (card.type === 'number') {
    if (hasNumberDuplicate(player, card)) {
      // Bust! Unless they have Second Chance
      if (player.hasSecondChance) {
        player.hasSecondChance = false;
        // Remove the second chance card from their hand
        const scIdx = player.cards.findIndex(c => c.type === 'action' && c.action === 'second-chance');
        if (scIdx >= 0) player.cards.splice(scIdx, 1);
        return `${player.name} drew duplicate ${card.value} but used Second Chance to survive!`;
      } else {
        player.cards.push(card);
        player.busted = true;
        return `${player.name} BUSTED on duplicate ${card.value}!`;
      }
    }
  }

  player.cards.push(card);

  if (card.type === 'number') {
    return `${player.name} drew a ${card.value}`;
  } else if (card.type === 'modifier') {
    return `${player.name} drew ${card.modifier}`;
  }
  return null;
}

function filterForPlayer(game: GameState, playerId: string | null): any {
  return {
    roomCode: game.roomCode,
    phase: game.phase,
    round: game.round,
    currentPlayerIdx: game.currentPlayerIdx,
    lastEvent: game.lastEvent,
    winner: game.winner,
    targetScore: game.targetScore,
    deckSize: game.deck.length,
    players: game.players.map(p => ({
      id: p.id,
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
      hasSecondChance: p.hasSecondChance,
      pendingFlip3: p.pendingFlip3,
      hasPendingAction: p.pendingAction !== null,
      pendingActionType: p.pendingAction?.action ?? null,
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' },
      });
    }

    if (method === 'GET' && pathname === '/') {
      return new Response(getHTML(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Create game
    if (method === 'POST' && pathname === '/api/create') {
      const game = createGame();
      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json({ roomCode: game.roomCode });
    }

    // Get game state
    const gameMatch = pathname.match(/^\/api\/game\/([A-Za-z0-9]{4})$/);
    if (method === 'GET' && gameMatch) {
      const code = gameMatch[1].toUpperCase();
      const pid = url.searchParams.get('playerId');
      const data = await env.FLIP7.get(code);
      if (!data) return json({ error: 'Game not found' }, 404);
      return json(filterForPlayer(JSON.parse(data), pid));
    }

    // Join game
    if (method === 'POST' && pathname === '/api/join') {
      const body = await request.json() as { gameId: string; name: string };
      const code = body.gameId.toUpperCase();
      const data = await env.FLIP7.get(code);
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'lobby') return json({ error: 'Game already started' }, 400);
      if (game.players.length >= 8) return json({ error: 'Room full (max 8)' }, 400);

      const name = body.name.trim();
      if (!name) return json({ error: 'Enter a name' }, 400);
      if (game.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        return json({ error: 'Name taken' }, 400);
      }

      const pid = generateId();
      game.players.push({
        id: pid, name, cards: [], totalScore: 0, roundScore: 0,
        busted: false, stayed: false, frozen: false,
        hasSecondChance: false, pendingFlip3: 0, pendingAction: null,
      });

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json({ playerId: pid, game: filterForPlayer(game, pid) });
    }

    // Start game
    if (method === 'POST' && pathname === '/api/start') {
      const body = await request.json() as { gameId: string; playerId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'lobby' && game.phase !== 'round-end') return json({ error: 'Cannot start now' }, 400);
      if (game.players.length < 2) return json({ error: 'Need at least 2 players' }, 400);

      if (game.phase === 'lobby') {
        // First round setup
        game.deck = shuffle(buildDeck());
        game.phase = 'playing';
        game.round = 1;
        // Deal one card to each player
        for (const p of game.players) {
          const card = drawCard(game);
          if (card) dealCardToPlayer(game, p, card);
        }
        game.currentPlayerIdx = 0;
        if (!isPlayerActive(game.players[0])) advanceToNextPlayer(game);
        game.lastEvent = 'Round 1 — cards dealt!';
      } else {
        startNewRound(game);
        game.lastEvent = `Round ${game.round} — cards dealt!`;
      }

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    // HIT — draw a card
    if (method === 'POST' && pathname === '/api/hit') {
      const body = await request.json() as { gameId: string; playerId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);

      const player = game.players[game.currentPlayerIdx];
      if (player.id !== body.playerId) return json({ error: 'Not your turn' }, 400);
      if (player.pendingAction) return json({ error: 'Resolve your action card first' }, 400);
      if (player.pendingFlip3 > 0) return json({ error: 'Still flipping cards from Flip Three' }, 400);

      const card = drawCard(game);
      if (!card) return json({ error: 'Deck empty' }, 400);

      const event = dealCardToPlayer(game, player, card);
      game.lastEvent = event;

      // If player has a pending action to resolve, don't advance yet
      if (player.pendingAction) {
        // Wait for target selection
      } else if (player.busted) {
        advanceToNextPlayer(game);
      } else {
        // Check if it was a flip3 that just got added
        // Normal card — turn stays if not busted, player decides hit/stay
      }

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    // STAY — bank points
    if (method === 'POST' && pathname === '/api/stay') {
      const body = await request.json() as { gameId: string; playerId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);

      const player = game.players[game.currentPlayerIdx];
      if (player.id !== body.playerId) return json({ error: 'Not your turn' }, 400);

      player.stayed = true;
      game.lastEvent = `${player.name} stayed with ${calcRoundScore(player)} points`;

      advanceToNextPlayer(game);

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    // Resolve action card (choose target)
    if (method === 'POST' && pathname === '/api/action') {
      const body = await request.json() as { gameId: string; playerId: string; targetId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);

      const player = game.players.find(p => p.id === body.playerId);
      if (!player || !player.pendingAction) return json({ error: 'No pending action' }, 400);

      const target = game.players.find(p => p.id === body.targetId);
      if (!target || target.busted || target.stayed) return json({ error: 'Invalid target' }, 400);

      const action = player.pendingAction;
      player.pendingAction = null;

      if (action.action === 'freeze') {
        // Freeze cannot be blocked by Second Chance
        target.frozen = true;
        target.stayed = true; // frozen = banked
        game.lastEvent = `${player.name} froze ${target.name}! (banked ${calcRoundScore(target)} pts)`;
      } else if (action.action === 'flip3') {
        target.pendingFlip3 = 3;
        game.lastEvent = `${player.name} used Flip Three on ${target.name}!`;

        // If target is not the current player, we need to resolve immediately
        // Auto-flip the 3 cards for the target
        const events: string[] = [];
        while (target.pendingFlip3 > 0 && !target.busted) {
          const c = drawCard(game);
          if (!c) break;
          target.pendingFlip3--;
          const ev = dealCardToPlayer(game, target, c);
          if (ev) events.push(ev);
          // If they got another action card, it needs to be resolved
          if (target.pendingAction) {
            // Auto-play on self if only player left, otherwise hold
            break;
          }
        }
        target.pendingFlip3 = 0;
        if (events.length > 0) {
          game.lastEvent = events.join(' → ');
        }
      }

      // If current player resolved their action, advance turn
      if (game.players[game.currentPlayerIdx].id === body.playerId && !player.pendingAction) {
        if (player.busted || player.stayed || player.frozen) {
          advanceToNextPlayer(game);
        }
        // Otherwise player can still hit/stay
      }

      // Check if round is over
      if (!game.players.some(isPlayerActive) && game.phase === 'playing') {
        endRound(game);
      }

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    // Next round
    if (method === 'POST' && pathname === '/api/next-round') {
      const body = await request.json() as { gameId: string; playerId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'round-end') return json({ error: 'Not at round end' }, 400);

      startNewRound(game);
      game.lastEvent = `Round ${game.round} — cards dealt!`;

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    // New game
    if (method === 'POST' && pathname === '/api/new-game') {
      const body = await request.json() as { gameId: string; playerId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const old: GameState = JSON.parse(data);
      const game = createGame();
      game.roomCode = old.roomCode;
      game.players = old.players.map(p => ({
        id: p.id, name: p.name, cards: [], totalScore: 0, roundScore: 0,
        busted: false, stayed: false, frozen: false,
        hasSecondChance: false, pendingFlip3: 0, pendingAction: null,
      }));
      game.phase = 'lobby';

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    return json({ error: 'Not found' }, 404);
  },
};
