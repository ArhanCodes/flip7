import { getHTML } from './html';

export interface Env {
  FLIP7: KVNamespace;
}

// ============================================================
// DECK — Official Flip 7 composition (94 cards)
// Number: 0×1, 1×1, 2×2, 3×3, 4×4, 5×5, 6×6, 7×7, 8×8, 9×9, 10×10, 11×11, 12×12
// Modifier: +2, +4, +6, +8, +8, +10, x2 (7 total)
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
  const mods: ModifierKind[] = ['+2', '+4', '+6', '+8', '+8', '+10', 'x2'];
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
    discardPile: [],
    phase: 'lobby',
    currentPlayerIdx: 0,
    dealerIdx: 0,
    round: 1,
    targetScore: 200,
    lastEvent: null,
    winner: null,
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

    // Get state
    const gameMatch = pathname.match(/^\/api\/game\/([A-Za-z0-9]{4})$/);
    if (method === 'GET' && gameMatch) {
      const code = gameMatch[1].toUpperCase();
      const pid = url.searchParams.get('playerId');
      const data = await env.FLIP7.get(code);
      if (!data) return json({ error: 'Game not found' }, 404);
      return json(filterForPlayer(JSON.parse(data), pid));
    }

    // Join
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

      // Rejoin if same name
      const existing = game.players.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return json({ playerId: existing.id, game: filterForPlayer(game, existing.id) });
      }

      const pid = generateId();
      game.players.push(newPlayer(pid, name));

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
        game.deck = shuffle(buildDeck());
        game.discardPile = [];
        game.phase = 'playing';
        game.round = 1;
        game.dealerIdx = 0;

        // Deal one card to each player
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

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    // HIT
    if (method === 'POST' && pathname === '/api/hit') {
      const body = await request.json() as { gameId: string; playerId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);

      const player = game.players[game.currentPlayerIdx];
      if (player.id !== body.playerId) return json({ error: 'Not your turn' }, 400);
      if (player.pendingAction) return json({ error: 'Resolve your action card first' }, 400);

      const card = drawCard(game);
      if (!card) return json({ error: 'Deck empty' }, 400);

      const event = dealCardToPlayer(game, player, card);
      game.lastEvent = event;

      // Don't advance if: pending action, or round already ended (Flip 7)
      if (game.phase !== 'playing') {
        // Round ended (Flip 7 or all busted)
      } else if (player.pendingAction) {
        // Wait for action target
      } else if (player.busted) {
        advanceToNextPlayer(game);
      }
      // Otherwise player can hit or stay again

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    // STAY
    if (method === 'POST' && pathname === '/api/stay') {
      const body = await request.json() as { gameId: string; playerId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);

      const player = game.players[game.currentPlayerIdx];
      if (player.id !== body.playerId) return json({ error: 'Not your turn' }, 400);

      player.stayed = true;
      const score = calcRoundScore(player);
      game.lastEvent = `${player.name} stayed with ${score} points ✋`;

      advanceToNextPlayer(game);

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    // Resolve action (choose target by ID or name)
    if (method === 'POST' && pathname === '/api/action') {
      const body = await request.json() as { gameId: string; playerId: string; targetId: string };
      const data = await env.FLIP7.get(body.gameId.toUpperCase());
      if (!data) return json({ error: 'Game not found' }, 404);

      const game: GameState = JSON.parse(data);
      if (game.phase !== 'playing') return json({ error: 'Not playing' }, 400);

      const player = game.players.find(p => p.id === body.playerId);
      if (!player || !player.pendingAction) return json({ error: 'No pending action' }, 400);

      // Accept target by ID or by name (since IDs are stripped from non-self players)
      const target = game.players.find(p => p.id === body.targetId) ||
                     game.players.find(p => p.name === body.targetId);
      if (!target) return json({ error: 'Invalid target' }, 400);

      // Freeze can target any active player; Flip Three too
      if (target.busted || target.stayed || target.frozen) {
        return json({ error: 'Target is not active' }, 400);
      }

      const action = player.pendingAction;
      player.pendingAction = null;

      if (action.action === 'freeze') {
        target.frozen = true;
        target.stayed = true;
        const score = calcRoundScore(target);
        game.lastEvent = `❄️ ${player.name} froze ${target.name}! (banked ${score} pts)`;
      } else if (action.action === 'flip3') {
        game.lastEvent = `🃏 ${player.name} used Flip Three on ${target.name}!`;

        const events = resolveFlipThree(game, target);
        if (events.length > 0) {
          game.lastEvent += ' → ' + events.join(' → ');
        }
      }

      // Advance turn if current player resolved their action and is done
      if (game.phase === 'playing') {
        const curPlayer = game.players[game.currentPlayerIdx];
        if (curPlayer.id === body.playerId && !curPlayer.pendingAction) {
          if (curPlayer.busted || curPlayer.stayed || curPlayer.frozen) {
            advanceToNextPlayer(game);
          }
        }

        // Check if any player with pending action needs to resolve (from Flip Three chain)
        // If the target got a pending action from Flip Three, they resolve it on their next turn

        if (!game.players.some(isPlayerActive) && game.phase === 'playing') {
          endRound(game);
        }
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
      game.lastEvent = `Round ${game.round} — ${game.players[game.dealerIdx].name} is dealer.`;

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
      game.players = old.players.map(p => newPlayer(p.id, p.name));
      game.phase = 'lobby';

      await env.FLIP7.put(game.roomCode, JSON.stringify(game), { expirationTtl: 86400 });
      return json(filterForPlayer(game, body.playerId));
    }

    return json({ error: 'Not found' }, 404);
  },
};
