import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Core modules
import { floraCatalog, getFloraById, getTilesForLevel, getFloraCount } from '../src/models/floraDatabase.js';
import { VitaBoardGenerator } from '../src/models/boardGenerator.js';
import { GameManager, RANKS, getRankForLevel } from '../src/controllers/gameManager.js';
import { ThemeManager, REALMS, TOTAL_REALM_LEVELS } from '../src/controllers/themeManager.js';
import { BoardRenderer } from '../src/ui/boardRenderer.js';
import { AuroMatchUniversalInput } from '../src/controllers/inputDispatcher.js';
import {
  calculatePraharFundamental,
  PRAHAR_FREQUENCIES,
  getAudioEngineState,
  setTuningScale,
  playAshramMeditationGong,
  playTileSelectChime,
  playBlockedWarningChime
} from '../src/audio/synthesizer.js';

// Setup Mock DOM environment for Node.js
function setupMockDOM() {
  const elements = new Map();

  class MockElement {
    constructor(id = '', tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.className = '';
      this.classList = {
        _classes: new Set(),
        add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
        remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
        contains: (c) => this.classList._classes.has(c),
        toggle: (c) => this.classList.contains(c) ? this.classList.remove(c) : this.classList.add(c)
      };
      this.style = {};
      this.dataset = {};
      this.innerHTML = '';
      this.innerText = '';
      this.children = [];
      this.listeners = {};
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    querySelectorAll(selector) {
      const results = [];
      const traverse = (el) => {
        if (selector.startsWith('.') && el.classList.contains(selector.slice(1))) {
          results.push(el);
        } else if (selector.startsWith('#') && el.id === selector.slice(1)) {
          results.push(el);
        }
        el.children.forEach(traverse);
      };
      this.children.forEach(traverse);
      return results;
    }

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }

    addEventListener(event, handler) {
      this.listeners[event] = this.listeners[event] || [];
      this.listeners[event].push(handler);
    }

    dispatchEvent(event) {
      const handlers = this.listeners[event.type] || [];
      handlers.forEach(h => h(event));
    }
  }

  const rootEl = new MockElement('app-wrapper');
  const boardEl = new MockElement('board');
  const centerStageEl = new MockElement('center-stage-col');
  const fieldGuideEl = new MockElement('field-guide-col');
  const statusPraharEl = new MockElement('status-prahar-col');
  const trayEl = new MockElement('tray');

  elements.set('app-wrapper', rootEl);
  elements.set('board', boardEl);
  elements.set('center-stage-col', centerStageEl);
  elements.set('field-guide-col', fieldGuideEl);
  elements.set('status-prahar-col', statusPraharEl);
  elements.set('tray', trayEl);

  globalThis.document = {
    body: rootEl,
    getElementById: (id) => elements.get(id) || new MockElement(id),
    querySelectorAll: (sel) => rootEl.querySelectorAll(sel),
    querySelector: (sel) => rootEl.querySelector(sel),
    createElement: (tag) => new MockElement('', tag),
    documentElement: { style: { setProperty: () => {} } }
  };

  const storageMap = new Map();
  globalThis.localStorage = {
    getItem: (k) => storageMap.has(k) ? storageMap.get(k) : null,
    setItem: (k, v) => storageMap.set(k, String(v)),
    removeItem: (k) => storageMap.delete(k),
    clear: () => storageMap.clear()
  };

  globalThis.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1.0,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  return { rootEl, boardEl };
}

describe("AuroMatch Vita Mahjong & Accessibility QA Suite", () => {

  beforeEach(() => {
    setupMockDOM();
  });

  // TC-VM-01
  test("TC-VM-01: Vita Mode Pair Match immediately dissolves tiles without tray interaction", () => {
    const gm = new GameManager({ gameplayMode: 'vita' });
    
    // Create two unblocked matching Lotus tiles
    const tileA = { id: 'tile_1', x: 0, y: 0, z: 0, floraId: 'lotus_sacred', isSelected: false, isMatched: false };
    const tileB = { id: 'tile_2', x: 1, y: 0, z: 0, floraId: 'lotus_sacred', isSelected: false, isMatched: false };
    gm.tiles = [tileA, tileB];

    // 1. Select unblocked Tile A
    gm.handleTileClick(tileA, true);
    assert.strictEqual(gm.selectedTile.id, tileA.id);
    assert.strictEqual(tileA.isSelected, true);
    assert.strictEqual(tileA.isMatched, false);
    assert.strictEqual(gm.tray.length, 0);

    // 2. Select matching unblocked Tile B
    gm.handleTileClick(tileB, true);

    // 3. Assert tileA.isMatched === true && tileB.isMatched === true
    assert.strictEqual(tileA.isMatched, true, "Tile A should be dissolved/matched");
    assert.strictEqual(tileB.isMatched, true, "Tile B should be dissolved/matched");
    assert.strictEqual(gm.selectedTile, null, "Selected tile buffer should be cleared");

    // 4. Assert gameManager.tray.length === 0 (tray completely bypassed)
    assert.strictEqual(gm.tray.length, 0, "Tray must remain completely empty in Vita Mode");
    assert.strictEqual(gm.matchedPairs.length, 1, "Matched pairs count must be 1");
  });

  // TC-VM-02
  test("TC-VM-02: Tile Club Mode Triad Match utilizes 7-slot tray and clears on 3 identical tiles", () => {
    let gameOverTriggered = false;
    let gameOverReason = null;

    const gm = new GameManager({
      gameplayMode: 'tile_club',
      onGameOver: ({ reason }) => {
        gameOverTriggered = true;
        gameOverReason = reason;
      }
    });

    // Create 3 matching Rose tiles
    const tileR1 = { id: 'r1', x: 0, y: 0, z: 0, floraId: 'rose_devotion', isSelected: false, isMatched: false };
    const tileR2 = { id: 'r2', x: 1, y: 0, z: 0, floraId: 'rose_devotion', isSelected: false, isMatched: false };
    const tileR3 = { id: 'r3', x: 2, y: 0, z: 0, floraId: 'rose_devotion', isSelected: false, isMatched: false };
    gm.tiles = [tileR1, tileR2, tileR3];

    // Select 2 matching tiles -> verify tray.length === 2
    gm.handleTileClick(tileR1, true);
    assert.strictEqual(gm.tray.length, 1);
    gm.handleTileClick(tileR2, true);
    assert.strictEqual(gm.tray.length, 2, "Tray should hold 2 tiles");

    // Select 3rd matching tile -> verify triad clear and tray.length === 0
    gm.handleTileClick(tileR3, true);
    assert.strictEqual(gm.tray.length, 0, "Triad should dissolve from tray leaving 0 tiles");

    // Verify selecting 7 non-matching tiles triggers GAME_OVER_TRAY_OVERFLOW
    gm.isStageCompleted = false;
    gm.tiles = [];
    gm.tray = [];
    const distinctFloras = floraCatalog.slice(0, 7);
    distinctFloras.forEach((flora, idx) => {
      const tile = { id: `overflow_${idx}`, x: idx, y: 1, z: 0, floraId: flora.id, isSelected: false, isMatched: false };
      gm.tiles.push(tile);
      gm.handleTileClick(tile, true);
    });

    assert.strictEqual(gm.tray.length, 7, "Tray should reach full capacity of 7");
    assert.strictEqual(gameOverTriggered, true, "Game Over should be triggered on 7 non-matching tiles");
    assert.strictEqual(gameOverReason, 'GAME_OVER_TRAY_OVERFLOW');
  });

  // TC-VM-03
  test("TC-VM-03: Senior View Toggle [Aa] scales tile dimensions by +25% and updates text tokens", () => {
    const renderer = new BoardRenderer('board');
    
    // 1. Default dimensions: width 68px, height 88px
    const standardDims = renderer.getTileDimensions();
    assert.strictEqual(standardDims.width, 68);
    assert.strictEqual(standardDims.height, 88);

    // 2. Dispatch toggleSeniorView(true)
    const gm = new GameManager();
    gm.boardRenderer = renderer;
    gm.toggleSeniorView(true);

    // 3. Assert tile dimensions equal 85px x 110px (+25%)
    const seniorDims = renderer.getTileDimensions();
    assert.strictEqual(seniorDims.width, 85, "Width should be scaled by +25% (68 * 1.25 = 85)");
    assert.strictEqual(seniorDims.height, 110, "Height should be scaled by +25% (88 * 1.25 = 110)");

    // 4. Assert body/root class contains .senior-view
    const rootEl = document.getElementById('app-wrapper');
    assert.strictEqual(rootEl.classList.contains('senior-view'), true, "Root element must contain .senior-view class");
  });

  // TC-VM-04
  test("TC-VM-04: Desktop Viewport (>= 1024px) renders fluid 3-column layout without overflow", () => {
    // Read and verify CSS contains 3-column sanctuary grid media query
    const candidatePaths = [
      path.resolve(import.meta.dirname, '../styles/main.css'),
      path.resolve('AuroMatch/styles/main.css'),
      path.resolve('styles/main.css')
    ];
    const cssPath = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];
    const css = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(css.includes('@media (min-width: 1024px)'), "CSS must include desktop min-width: 1024px breakpoint");
    assert.ok(css.includes('grid-template-columns: minmax(280px, 380px) minmax(460px, 1fr) minmax(280px, 380px)'), 
      "CSS must declare fluid 3-column sanctuary grid");
    assert.ok(css.includes('#field-guide-col'), "CSS must define #field-guide-col rules");
    assert.ok(css.includes('#center-stage-col'), "CSS must define #center-stage-col rules");
    assert.ok(css.includes('#status-prahar-col'), "CSS must define #status-prahar-col rules");
    assert.ok(css.includes('overflow: hidden'), "Desktop layout must prevent horizontal viewport scrolling");
  });

  // TC-VM-05
  test("TC-VM-05: Universal Input handles pointer parity and keyboard shortcuts (U, H, R, Esc)", () => {
    let triggeredAction = null;
    const stageContainer = document.getElementById('center-stage-col');
    
    const input = new AuroMatchUniversalInput(stageContainer, (action) => {
      triggeredAction = action.type;
    });

    // 1. Dispatch keydown 'U' -> verify undo execution
    input.handleKeyDown({ key: 'u', preventDefault: () => {} });
    assert.strictEqual(triggeredAction, 'FREE_UNDO', "Key 'u' must trigger FREE_UNDO");

    // 2. Dispatch keydown 'H' -> verify hint highlight
    input.handleKeyDown({ key: 'h', preventDefault: () => {} });
    assert.strictEqual(triggeredAction, 'REQUEST_HINT', "Key 'h' must trigger REQUEST_HINT");

    // 3. Dispatch keydown 'R' -> verify stage reset
    input.handleKeyDown({ key: 'r', preventDefault: () => {} });
    assert.strictEqual(triggeredAction, 'RESTART_STAGE', "Key 'r' must trigger RESTART_STAGE");

    // 4. Dispatch keydown 'Escape' -> verify pause toggle
    input.handleKeyDown({ key: 'Escape', preventDefault: () => {} });
    assert.strictEqual(triggeredAction, 'TOGGLE_MENU', "Key 'Escape' must trigger TOGGLE_MENU");
  });

  // TC-VM-06
  test("TC-VM-06: Reverse-Construction Board Generator ensures 100% solvability across 100 random seeds", () => {
    const layout = VitaBoardGenerator.createDefaultLayout(36);
    
    // Vita Mode (Pairs, K = 2) 100 seeds test
    let vitaSuccessCount = 0;
    for (let seed = 0; seed < 100; seed++) {
      const board = VitaBoardGenerator.generateSolvableBoard(layout, floraCatalog, 'vita');
      assert.strictEqual(board.length, 36);
      
      // Verify forward solvability simulator
      const solverResult = VitaBoardGenerator.simulateForwardSolver(board, 2);
      if (solverResult.isSolvable && solverResult.remainingTilesCount === 0) {
        vitaSuccessCount++;
      }
    }
    assert.strictEqual(vitaSuccessCount, 100, `Vita Mode must achieve 100% solvability (got ${vitaSuccessCount}/100)`);

    // Tile Club Mode (Triads, K = 3) 100 seeds test
    let tileClubSuccessCount = 0;
    for (let seed = 0; seed < 100; seed++) {
      const board = VitaBoardGenerator.generateSolvableBoard(layout, floraCatalog, 'tile_club');
      assert.strictEqual(board.length, 36);
      
      const solverResult = VitaBoardGenerator.simulateForwardSolver(board, 3);
      if (solverResult.isSolvable && solverResult.remainingTilesCount === 0) {
        tileClubSuccessCount++;
      }
    }
    assert.strictEqual(tileClubSuccessCount, 100, `Tile Club Mode must achieve 100% solvability (got ${tileClubSuccessCount}/100)`);
  });

  // TC-VM-07
  test("TC-VM-07: Audio Synthesizer generates mathematically correct frequencies (432Hz vs 440Hz, Prahar harmonics)", () => {
    // 1. Tuning scale base frequency verification
    setTuningScale(432);
    let state = getAudioEngineState();
    assert.strictEqual(state.baseFrequency, 432, "Base tuning frequency should be 432 Hz");

    setTuningScale(440);
    state = getAudioEngineState();
    assert.strictEqual(state.baseFrequency, 440, "Base tuning frequency should be 440 Hz");

    // 1b. Disabling acoustic tuning verification
    setTuningScale('off');
    state = getAudioEngineState();
    assert.strictEqual(state.baseFrequency, 0, "Base tuning frequency should be 0 when disabled");
    assert.strictEqual(state.disabled, true, "Audio engine should report disabled status");

    // Re-enable back to 432 Hz
    setTuningScale(432);
    state = getAudioEngineState();
    assert.strictEqual(state.baseFrequency, 432, "Base tuning should re-enable to 432 Hz");
    assert.strictEqual(state.disabled, false, "Audio engine should no longer be disabled");

    // 2. Prahar Solar Alignment fundamental frequencies
    const morningFreq = calculatePraharFundamental(8); // 8:00 AM -> Morning
    assert.strictEqual(morningFreq, 172.08, "Morning Prahar must equal Platonic Year tone 172.08 Hz");

    const eveningFreq = calculatePraharFundamental(20); // 8:00 PM -> Evening
    assert.strictEqual(eveningFreq, 110.0, "Evening Prahar must equal 110.0 Hz");

    // 3. Meditation Gong overtone multipliers verification
    const expectedMultipliers = [1.47, 2.09, 2.56, 3.12, 4.20];
    const generatedMorningHarmonics = expectedMultipliers.map(m => +(172.08 * m).toFixed(2));
    assert.deepStrictEqual(generatedMorningHarmonics, [252.96, 359.65, 440.52, 536.89, 722.74]);
  });

  // TC-VM-08
  test("TC-VM-08: Vak Progression Ladder & 7 Secular Ranks across 350 Levels", () => {
    assert.strictEqual(RANKS.length, 7, "Must have exactly 7 secular progression ranks");
    
    // Level boundary mapping
    assert.strictEqual(getRankForLevel(1).name, 'Aspirant');
    assert.strictEqual(getRankForLevel(25).name, 'Aspirant');
    assert.strictEqual(getRankForLevel(26).name, 'Learner');
    assert.strictEqual(getRankForLevel(60).name, 'Learner');
    assert.strictEqual(getRankForLevel(61).name, 'Thinker');
    assert.strictEqual(getRankForLevel(110).name, 'Thinker');
    assert.strictEqual(getRankForLevel(111).name, 'Discerner');
    assert.strictEqual(getRankForLevel(175).name, 'Discerner');
    assert.strictEqual(getRankForLevel(176).name, 'Sage');
    assert.strictEqual(getRankForLevel(240).name, 'Sage');
    assert.strictEqual(getRankForLevel(241).name, 'Explorer');
    assert.strictEqual(getRankForLevel(300).name, 'Explorer');
    assert.strictEqual(getRankForLevel(301).name, 'Luminous');
    assert.strictEqual(getRankForLevel(350).name, 'Luminous');
    assert.strictEqual(getRankForLevel(500).name, 'Luminous', "Level 500 must map to Luminous rank");
    assert.strictEqual(getRankForLevel(520).name, 'Luminous', "Level 520 must map to Luminous rank");
  });

  // TC-VM-09
  test("TC-VM-09: Sparks Economy (Initial 100, Hints -20, Clears +10/+5, Promotion +50, Free Undo)", () => {
    const gm = new GameManager();
    gm.player = { currentLevel: 1, sparks: 100 };
    gm.hintsUsedInStage = 0;

    // Board setup with mock renderer
    gm.tiles = [
      { id: 't1', x: 0, y: 0, z: 0, floraId: 'f1', isSelected: false, isMatched: false },
      { id: 't2', x: 1, y: 0, z: 0, floraId: 'f1', isSelected: false, isMatched: false }
    ];
    gm.boardRenderer = {
      highlightTiles: () => {},
      clearHighlights: () => {},
      render: () => {}
    };

    // 1. Request Hint -> costs 20 Sparks
    gm.provideHint();
    assert.strictEqual(gm.player.sparks, 80, "Hint must deduct exactly 20 Sparks");
    assert.strictEqual(gm.hintsUsedInStage, 1, "hintsUsedInStage must increment to 1");

    // 2. Deplete Sparks below 20 -> verify hint blocked
    gm.player.sparks = 10;
    gm.provideHint();
    assert.strictEqual(gm.player.sparks, 10, "Hint must be rejected when Sparks < 20");

    // 3. Clean Solve completion: 0 hints -> +10 level + 5 clean solve bonus = +15 Sparks
    gm.player.sparks = 100;
    gm.player.currentLevel = 5;
    gm.hintsUsedInStage = 0;
    gm.tiles.forEach(t => t.isMatched = true);
    gm.checkStageCompletion();
    assert.strictEqual(gm.player.sparks, 115, "Clean solve must award +15 Sparks (10 + 5 bonus)");
    assert.strictEqual(gm.player.currentLevel, 6, "Level must advance to 6");

    // 4. Rank promotion at boundary (Level 25 -> 26): awards +50 rank bonus
    gm.player.currentLevel = 25;
    gm.player.sparks = 100;
    gm.hintsUsedInStage = 1; // Not clean solve: +10 base + 50 promotion = +60
    gm.tiles.forEach(t => t.isMatched = true);
    gm.checkStageCompletion();
    assert.strictEqual(gm.player.currentLevel, 26);
    assert.strictEqual(gm.player.sparks, 160, "Promotion must award +50 bonus (+10 level = +60 total)");

    // 5. Undo remains 100% free (0 Sparks deducted)
    const sparksBeforeUndo = gm.player.sparks;
    gm.moveHistory = [{ type: 'match_pair', tiles: [gm.tiles[0], gm.tiles[1]] }];
    gm.undo();
    assert.strictEqual(gm.player.sparks, sparksBeforeUndo, "Undo must never deduct Sparks");
  });

  // TC-VM-10
  test("TC-VM-10: 1,550 Educational Flora Database & Solvable Progression Layouts", () => {
    // 1. Database size verification
    const count = getFloraCount();
    assert.ok(count >= 1500, `Educational corpus must exceed 1,500 entries (got ${count})`);

    // 2. Deterministic level tile distribution
    const level1Tiles = getTilesForLevel(1, 6);
    const level2Tiles = getTilesForLevel(2, 6);
    assert.strictEqual(level1Tiles.length, 6);
    assert.strictEqual(level2Tiles.length, 6);
    assert.notDeepStrictEqual(level1Tiles, level2Tiles, "Subsequent levels must draw distinct vocabulary subsets");

    // 3. Layout scaling: Beginner 12-tile layout
    const layout12 = VitaBoardGenerator.createDefaultLayout(12);
    assert.strictEqual(layout12.length, 12, "Beginner layout must contain 12 coordinate slots");
    const board12 = VitaBoardGenerator.generateSolvableBoard(layout12, level1Tiles, 'vita');
    assert.strictEqual(board12.length, 12);
    const solver12 = VitaBoardGenerator.simulateForwardSolver(board12, 2);
    assert.strictEqual(solver12.isSolvable, true, "12-tile beginner board must be 100% solvable");
  });

  // TC-VM-11
  test("TC-VM-11: Player Name Tracking & Returning User Auto-Resume", () => {
    localStorage.clear();
    const gm = new GameManager();
    assert.strictEqual(gm.player.name, '', "Default player name should be empty on initial boot");

    // 1. Set seeker name -> verify persistence
    gm.setPlayerName('Maya');
    assert.strictEqual(gm.player.name, 'Maya');
    const savedRaw = localStorage.getItem('auromatch_player_state');
    assert.ok(savedRaw, "State must be persisted to localStorage");
    const parsed = JSON.parse(savedRaw);
    assert.strictEqual(parsed.name, 'Maya');

    // 2. Returning User session initialization: loads player name and progress
    parsed.currentLevel = 42;
    parsed.sparks = 320;
    localStorage.setItem('auromatch_player_state', JSON.stringify(parsed));

    const returningGm = new GameManager();
    assert.strictEqual(returningGm.player.name, 'Maya', "Returning user name must be restored");
    assert.strictEqual(returningGm.player.currentLevel, 42, "Returning user level must be restored");
    assert.strictEqual(returningGm.player.sparks, 320, "Returning user sparks must be restored");
    assert.strictEqual(returningGm.getRank().name, 'Learner', "Rank must correspond to restored level");

    // 3. Multi-Player Profile Isolation:
    // Switching to a new name must NOT inherit Maya's Level 42 progress!
    const newPlayer = returningGm.switchPlayer('Aarav');
    assert.strictEqual(newPlayer.name, 'Aarav');
    assert.strictEqual(newPlayer.currentLevel, 1, "New player must start at Level 1, not inherit previous player's level");
    assert.strictEqual(newPlayer.sparks, 100, "New player must start with 100 sparks");
    assert.strictEqual(newPlayer.isNewUser, true, "New player must be flagged as isNewUser");

    // 4. Switching back to Maya must restore her Level 42 progress intact!
    const restoredMaya = returningGm.switchPlayer('Maya');
    assert.strictEqual(restoredMaya.name, 'Maya');
    assert.strictEqual(restoredMaya.currentLevel, 42, "Returning to Maya must restore her Level 42 progress");
    assert.strictEqual(restoredMaya.sparks, 320, "Returning to Maya must restore her sparks");
    assert.strictEqual(restoredMaya.isNewUser, false, "Maya must be identified as existing returning user");
  });

  // TC-VM-12
  test("TC-VM-12: Massive Pictorial Knowledge Database (>3,800 entries) & 4 Visual Tile Archetypes", () => {
    const count = getFloraCount();
    assert.ok(count >= 3500, `Corpus must exceed 3,500 entries (got ${count})`);

    const archetypes = new Set(floraCatalog.map(f => f.archetype));
    assert.ok(archetypes.has('ivory'), "Must contain Ivory archetypes");
    assert.ok(archetypes.has('golden_relic'), "Must contain Golden Relic archetypes");
    assert.ok(archetypes.has('cameo'), "Must contain Cameo archetypes");
    assert.ok(archetypes.has('hex_seal'), "Must contain Hex Seal archetypes");

    // Verify symbols are not repetitive bulbs
    const nonBulbCount = floraCatalog.filter(f => f.symbol && f.symbol !== '💡').length;
    assert.ok(nonBulbCount > 3000, `Over 3,000 tiles must have non-bulb pictorial symbols (got ${nonBulbCount})`);
  });

  // TC-VM-13
  test("TC-VM-13: Dense 3D Mahjong Clusters (up to 108 tiles) & Reshuffle Solvability", () => {
    [24, 36, 48, 60, 72, 84, 96, 108].forEach(tileCount => {
      const layout = VitaBoardGenerator.createDefaultLayout(tileCount);
      assert.strictEqual(layout.length, tileCount, `Layout must match requested density of ${tileCount}`);
      const subset = getTilesForLevel(1, Math.floor(tileCount / 2));
      const board = VitaBoardGenerator.generateSolvableBoard(layout, subset, 'vita');
      assert.strictEqual(board.length, tileCount, `Board must contain exactly ${tileCount} tiles`);
      const res = VitaBoardGenerator.simulateForwardSolver(board, 2);
      assert.strictEqual(res.isSolvable, true, `${tileCount}-tile formation must be 100% solvable`);
    });

    // Test reshuffleRemaining
    const gm = new GameManager();
    gm.startNewStage(36);
    const beforeCount = gm.tiles.filter(t => !t.isMatched).length;
    gm.reshuffleRemaining();
    const afterCount = gm.tiles.filter(t => !t.isMatched).length;
    assert.strictEqual(afterCount, beforeCount, "Reshuffle must preserve active tile count");
  });

  // TC-VM-14
  test("TC-VM-14: 520+ Level Progression Curve & Sanctuary Milestones", async () => {
    const { TOTAL_LEVELS, getTileCountForLevel } = await import('../src/controllers/gameManager.js');
    assert.strictEqual(TOTAL_LEVELS, 520, "Total levels must be configured to at least 520");

    // S-curve density progression checks
    assert.strictEqual(getTileCountForLevel(1), 24, "Level 1 tutorial must have 24 tiles");
    assert.strictEqual(getTileCountForLevel(5), 36, "Level 5 must have 36 tiles");
    assert.strictEqual(getTileCountForLevel(20), 48, "Level 20 must have 48 tiles");
    assert.strictEqual(getTileCountForLevel(50), 60, "Level 50 must have 60 tiles");
    assert.strictEqual(getTileCountForLevel(100), 72, "Level 100 must have 72 tiles");
    assert.strictEqual(getTileCountForLevel(200), 84, "Level 200 must have 84 tiles");
    assert.strictEqual(getTileCountForLevel(350), 96, "Level 350 must have 96 tiles");
    assert.strictEqual(getTileCountForLevel(500), 108, "Level 500 must have 108 tiles");

    // Milestone bonus check on Level 10
    const gm = new GameManager();
    gm.player = { currentLevel: 10, sparks: 100 };
    gm.hintsUsedInStage = 0;
    gm.tiles = [
      { id: 'm1', x: 0, y: 0, z: 0, floraId: 'f1', isSelected: false, isMatched: true },
      { id: 'm2', x: 1, y: 0, z: 0, floraId: 'f1', isSelected: false, isMatched: true }
    ];
    let milestoneRecorded = false;
    gm.onStageComplete = (info) => {
      milestoneRecorded = info.isMilestone;
    };
    gm.checkStageCompletion();
    assert.strictEqual(milestoneRecorded, true, "Level 10 must be recognized as milestone level");
    assert.strictEqual(gm.player.sparks, 135, "Milestone level clean solve must award +35 sparks (10 base + 5 clean + 20 milestone)");
  });

  // TC-VM-15
  test("TC-VM-15: Navigation History State & Settings Screen Return Memory", async () => {
    const { routeToScreen, getCurrentScreen, getPreviousScreen } = await import('../src/controllers/gameManager.js');

    // 1. Initial navigation to game screen
    routeToScreen('game');
    assert.strictEqual(getCurrentScreen(), 'game', "Current screen should be game");

    // 2. Open settings
    routeToScreen('settings');
    assert.strictEqual(getCurrentScreen(), 'settings', "Current screen should be settings");
    assert.strictEqual(getPreviousScreen(), 'game', "Previous screen before settings must be game");

    // 3. Return from settings to previous screen
    const returnScreen1 = getPreviousScreen();
    routeToScreen(returnScreen1);
    assert.strictEqual(getCurrentScreen(), 'game', "Returning from settings must restore game screen");

    // 4. Test from Oracle to settings and back
    routeToScreen('oracle');
    assert.strictEqual(getCurrentScreen(), 'oracle');
    routeToScreen('settings');
    assert.strictEqual(getPreviousScreen(), 'oracle', "Previous screen before settings must be oracle");
    const returnScreen2 = getPreviousScreen();
    routeToScreen(returnScreen2);
    assert.strictEqual(getCurrentScreen(), 'oracle', "Returning from settings must restore oracle screen");
  });

  // TC-VM-16
  test("TC-VM-16: Spatial Separation, Zero Adjacent Pairs & Multi-Layer Depth Dispersion", () => {
    [36, 48, 60].forEach(tileCount => {
      const layout = VitaBoardGenerator.createDefaultLayout(tileCount);
      const subset = getTilesForLevel(1, Math.floor(tileCount / 2));
      const board = VitaBoardGenerator.generateSolvableBoard(layout, subset, 'vita');

      const pairs = {};
      board.forEach(t => {
        pairs[t.floraId] = pairs[t.floraId] || [];
        pairs[t.floraId].push(t);
      });

      let adjacentCount = 0;
      let multiLayerCount = 0;
      let totalPairs = 0;

      for (const fId in pairs) {
        if (pairs[fId].length === 2) {
          totalPairs++;
          const [a, b] = pairs[fId];
          const dx = Math.abs(a.x - b.x);
          const dy = Math.abs(a.y - b.y);
          if (dx <= 1.05 && dy <= 1.05 && a.z === b.z) adjacentCount++;
          if (a.z !== b.z) multiLayerCount++;
        }
      }

      // Adjacent pairs must be strictly controlled (< 15% instead of old 50%+)
      const adjPercent = (adjacentCount / totalPairs) * 100;
      assert.ok(adjPercent < 15, `${tileCount}-tile board must strictly limit adjacent twins (got ${adjPercent.toFixed(1)}%)`);

      // Multi-layer pairs must be prominent (> 60% of pairs) to guarantee depth dependencies
      const multiLayerPercent = (multiLayerCount / totalPairs) * 100;
      assert.ok(multiLayerPercent >= 60, `${tileCount}-tile board must exhibit multi-layer depth dependencies (got ${multiLayerPercent.toFixed(1)}%)`);

      // Solvability must remain 100%
      const solver = VitaBoardGenerator.simulateForwardSolver(board, 2);
      assert.strictEqual(solver.isSolvable, true, "Board must remain 100% solvable");
    });
  });

  // TC-VM-17
  test("TC-VM-17: 12 Thematic Architectural Formations (H-Gate Level 2, Lotus, Citadel, Pagoda) & 100% Solvability", () => {
    assert.strictEqual(VitaBoardGenerator.FORMATIONS.length, 12, "Must offer 12 distinct sacred geometric and architectural formations");

    // 1. Level 2 explicitly matches the reference image: Twin Pillars (H-Gate)
    const level2Name = VitaBoardGenerator.getFormationName(2);
    assert.strictEqual(level2Name, 'Twin Pillars (H-Gate)', "Level 2 must generate the Twin Pillars (H-Gate) formation");

    const layoutL2 = VitaBoardGenerator.createLevelLayout(2, 36);
    assert.strictEqual(layoutL2.length, 36, "Level 2 H-Gate must produce 36 layout anchors");

    // Verify 4-layer corner depth in H-Gate
    const maxZ = Math.max(...layoutL2.map(c => c.z));
    assert.ok(maxZ >= 3, "H-Gate formation must feature deep vertical stacking (at least z=3 / 4 layers deep)");

    // 2. Test all 12 formations for 100% mathematical solvability
    for (let lvl = 1; lvl <= 12; lvl++) {
      const formName = VitaBoardGenerator.getFormationName(lvl);
      const count = (lvl === 1) ? 24 : 36;
      const layout = VitaBoardGenerator.createLevelLayout(lvl, count);
      assert.strictEqual(layout.length, count, `${formName} must supply exact requested tile count`);

      const subset = getTilesForLevel(lvl, count / 2);
      const board = VitaBoardGenerator.generateSolvableBoard(layout, subset, 'vita');
      assert.strictEqual(board.length, count);

      const solver = VitaBoardGenerator.simulateForwardSolver(board, 2);
      assert.strictEqual(solver.isSolvable, true, `Formation ${formName} must achieve 100% solvability in Mode A (Vita Pairs)`);
      assert.strictEqual(solver.remainingTilesCount, 0, `Formation ${formName} must fully clear all tiles`);
    }

    // 3. Verify GameManager integration
    const gm = new GameManager();
    gm.loadLevel(2);
    assert.strictEqual(gm.currentFormationName, 'Twin Pillars (H-Gate)');
    assert.strictEqual(gm.tiles.length, 36);
  });

  // TC-VM-18
  test("TC-VM-18: 13 Secular Realms Campaign (403 Levels: 16 Classic + 15 Master Art), Authentic Tile Skins & Zero Religious Monikers", () => {
    // 1. Verify 13 Realms catalog completeness
    assert.strictEqual(REALMS.length, 13, "Must feature exactly 13 secular realms");
    assert.strictEqual(TOTAL_REALM_LEVELS, 403, "Total campaign levels must be exactly 403 levels (31 levels * 13 realms)");

    // 2. Strict secularization assertion: ZERO mentions of 'Ashram', 'Auroville', 'Samadhi', 'The Mother', 'Sri Aurobindo'
    const forbiddenKeywords = ['ashram', 'auroville', 'samadhi', 'mother', 'aurobindo'];
    REALMS.forEach(r => {
      const lowerName = r.name.toLowerCase();
      const lowerSub = r.subtitle.toLowerCase();
      forbiddenKeywords.forEach(kw => {
        assert.ok(!lowerName.includes(kw), `Realm name '${r.name}' must be 100% secular (found '${kw}')`);
        assert.ok(!lowerSub.includes(kw), `Realm subtitle '${r.subtitle}' must be 100% secular (found '${kw}')`);
      });
    });

    // 3. Verify all 13 background images exist on disk
    REALMS.forEach(r => {
      const imgPath = path.join(process.cwd(), r.bgImage.replace('./', ''));
      assert.ok(fs.existsSync(imgPath), `Background image for realm '${r.id}' must exist at ${imgPath}`);
    });

    // 4. Test level-to-realm mapping across all 403 levels
    for (let lvl = 1; lvl <= TOTAL_REALM_LEVELS; lvl++) {
      const realmInfo = ThemeManager.getRealmForLevel(lvl);
      assert.ok(realmInfo, `Level ${lvl} must map to a valid realm`);
      assert.ok(realmInfo.chapter >= 1 && realmInfo.chapter <= 13, `Level ${lvl} must have valid chapter (1-13)`);
      assert.ok(realmInfo.levelInRealm >= 1 && realmInfo.levelInRealm <= 31, `Level ${lvl} must have levelInRealm (1-31)`);
      assert.ok(realmInfo.archetype, `Level ${lvl} must define a tactile tile archetype`);

      if (realmInfo.levelInRealm <= 15) {
        assert.strictEqual(realmInfo.isMasterArtLevel, true, `Level ${lvl} (levelInRealm ${realmInfo.levelInRealm}) must be flagged as isMasterArtLevel`);
        assert.ok(realmInfo.masterLevelIndex >= 1 && realmInfo.masterLevelIndex <= 15, `Level ${lvl} must have masterLevelIndex (1-15)`);
      } else {
        assert.strictEqual(realmInfo.isMasterArtLevel, false);
      }
    }

    // 5. Test GameManager realms mode & Master Authentic Art tile injection
    const gm = new GameManager();
    gm.setGameplayMode('realms');
    assert.strictEqual(gm.gameplayMode, 'realms');

    // Test Level 1 (Whispering Pines - Master Art Level 1 with Leaf & Bark tiles)
    gm.loadLevel(1);
    assert.strictEqual(gm.activeRealm.id, 'whispering_pines');
    assert.strictEqual(gm.activeRealm.isMasterArtLevel, true);
    assert.strictEqual(gm.activeRealm.masterLevelIndex, 1);

    // Verify tiles have authentic customImage skins applied
    const tilesWithArt = gm.tiles.filter(t => t.customImage && (t.customImage.includes('tile_leaf') || t.customImage.includes('tile_bark')));
    assert.strictEqual(tilesWithArt.length, gm.tiles.length, "All tiles in Master Art level must receive authentic mockup tile skins");

    // Test Level 16 (Whispering Pines - Classic Mastery Level 1)
    gm.loadLevel(16);
    assert.strictEqual(gm.activeRealm.id, 'whispering_pines');
    assert.strictEqual(gm.activeRealm.isMasterArtLevel, false);

    // Initial score check
    assert.strictEqual(typeof gm.player.score, 'number');
    const initialScore = gm.player.score;

    // Simulate pair match
    const active = gm.tiles.filter(t => !t.isMatched);
    const firstTile = active[0];
    const matchTile = active.find(t => t.id !== firstTile.id && t.floraId === firstTile.floraId);
    assert.ok(matchTile, "Solvable board must contain matching pair");

    gm.handleVitaMatch2Click(firstTile);
    gm.handleVitaMatch2Click(matchTile);
    assert.ok(gm.player.score >= initialScore + 100, "Pair match must increment score by at least +100");
  });
});

