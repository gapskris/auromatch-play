// Dual-Mode Central Game Manager for AuroMatch
// Supports Mode A (Vita Mahjong - Match-2 pairs) and Mode B (Tile Club - Match-3 7-slot tray)
// Senior accessibility toggles, undo history stacks, and guaranteed solvability generation.

import { VitaBoardGenerator } from '../models/boardGenerator.js';
import { floraCatalog, getFloraById, getTilesForLevel } from '../models/floraDatabase.js';
import { BoardRenderer } from '../ui/boardRenderer.js';
import { AuroMatchUniversalInput } from './inputDispatcher.js';
import {
  initAudioEngine,
  playAshramMeditationGong,
  playTileSelectChime,
  playBlockedWarningChime,
  playTileSmashWhoosh,
  setTuningScale,
  unlockAudioContext
} from '../audio/synthesizer.js';
import { profileState, saveProfileState } from './storageAdapter.js';
import {
  triggerTileSparkleDissolve,
  triggerTileConvergenceSmash,
  triggerTrayTriadSparkle
} from '../ui/particles.js';
import { ThemeManager, REALMS, TOTAL_REALM_LEVELS } from './themeManager.js';

export const TOTAL_LEVELS = 520;

export const RANKS = [
  { name: 'Aspirant', symbol: '🌱', minLevel: 1, maxLevel: 25 },
  { name: 'Learner', symbol: '📖', minLevel: 26, maxLevel: 60 },
  { name: 'Thinker', symbol: '🔥', minLevel: 61, maxLevel: 110 },
  { name: 'Discerner', symbol: '⭐', minLevel: 111, maxLevel: 175 },
  { name: 'Sage', symbol: '🌟', minLevel: 176, maxLevel: 240 },
  { name: 'Explorer', symbol: '💫', minLevel: 241, maxLevel: 300 },
  { name: 'Luminous', symbol: '✨', minLevel: 301, maxLevel: 520 }
];

export function getRankForLevel(level) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (level >= RANKS[i].minLevel) return RANKS[i];
  }
  return RANKS[0];
}

/**
 * Smooth S-Curve Tile Density Function across 520 Levels
 */
export function getTileCountForLevel(levelNum) {
  if (levelNum === 1) return 24;          // Level 1: 24 tiles (Tutorial)
  if (levelNum <= 10) return 36;         // Levels 2-10: 36 tiles (Foundation)
  if (levelNum <= 30) return 48;         // Levels 11-30: 48 tiles (Ascent)
  if (levelNum <= 75) return 60;         // Levels 31-75: 60 tiles (Depth)
  if (levelNum <= 150) return 72;        // Levels 76-150: 72 tiles (Mastery)
  if (levelNum <= 260) return 84;        // Levels 151-260: 84 tiles (Grand Peak)
  if (levelNum <= 390) return 96;        // Levels 261-390: 96 tiles (Sunburst Gateway)
  return 108;                            // Levels 391-520+: 108 tiles (Grand Citadel)
}

export class GameManager {
  constructor(options = {}) {
    this.gameplayMode = options.gameplayMode || 'vita'; // 'vita' | 'tile_club'
    this.seniorView = (options.seniorView !== undefined) 
      ? !!options.seniorView 
      : !!(profileState && profileState.settings && profileState.settings.seniorViewActive);
    this.tuningBase = options.tuningBase || 432;
    this.boardRenderer = null;
    this.inputDispatcher = null;

    // Player progression state (Sparks Economy & 520 Levels)
    this.player = this.loadPlayerState();
    this.hintsUsedInStage = 0;

    // State collections
    this.tiles = [];
    this.tray = []; // Mode B: max 7 tiles
    this.selectedTile = null; // Mode A: active selected tile buffer
    this.matchedPairs = []; // Mode A: matched pairs history
    this.moveHistory = []; // Undo stack
    this.isPaused = false;
    this.isStageCompleted = false;

    // Callbacks
    this.onStateChange = options.onStateChange || null;
    this.onMatchSuccess = options.onMatchSuccess || null;
    this.onGameOver = options.onGameOver || null;
    this.onStageComplete = options.onStageComplete || null;
  }

  loadProfilesMap() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('auromatch_player_profiles');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return {};
  }

  saveProfilesMap(profiles) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auromatch_player_profiles', JSON.stringify(profiles));
      }
    } catch (e) {}
  }

  loadPlayerState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('auromatch_player_state');
        if (saved) {
          const parsed = JSON.parse(saved);
          const state = {
            name: typeof parsed.name === 'string' ? parsed.name.trim() : '',
            currentLevel: Math.max(1, Math.min(TOTAL_LEVELS, parsed.currentLevel || 1)),
            sparks: typeof parsed.sparks === 'number' ? parsed.sparks : 100,
            score: typeof parsed.score === 'number' ? parsed.score : 0,
            isNewUser: parsed.currentLevel === 1 && !parsed.hasProgress
          };
          if (state.name) {
            const profiles = this.loadProfilesMap();
            if (!profiles[state.name]) {
              profiles[state.name] = {
                name: state.name,
                currentLevel: state.currentLevel,
                sparks: state.sparks,
                score: state.score
              };
              this.saveProfilesMap(profiles);
            }
          }
          return state;
        }
      }
    } catch (e) {
      console.warn('Failed to load player state:', e);
    }
    return { name: '', currentLevel: 1, sparks: 100, score: 0, isNewUser: true };
  }

  savePlayerState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auromatch_player_state', JSON.stringify({
          name: this.player.name || '',
          currentLevel: this.player.currentLevel,
          sparks: this.player.sparks,
          score: this.player.score || 0,
          hasProgress: this.player.currentLevel > 1 || this.player.sparks !== 100 || (this.player.score || 0) > 0
        }));

        if (this.player.name) {
          const profiles = this.loadProfilesMap();
          profiles[this.player.name] = {
            name: this.player.name,
            avatar: this.player.avatar || '🦉',
            currentLevel: this.player.currentLevel,
            sparks: this.player.sparks,
            score: this.player.score || 0
          };
          this.saveProfilesMap(profiles);
        }
      }
    } catch (e) {
      console.warn('Failed to save player state:', e);
    }
  }

  setPlayerName(name, avatar = null) {
    return this.switchPlayer(name, avatar);
  }

  switchPlayer(name, avatar = null) {
    const trimmed = (name || '').trim();
    if (!trimmed) return this.player;

    const profiles = this.loadProfilesMap();

    // Preserve active player's progress in profiles map
    if (this.player && this.player.name) {
      profiles[this.player.name] = {
        name: this.player.name,
        avatar: this.player.avatar || '🦉',
        currentLevel: this.player.currentLevel,
        sparks: this.player.sparks,
        score: this.player.score || 0
      };
    }

    if (profiles[trimmed]) {
      // Existing player profile found -> restore their exact level, sparks, and score!
      this.player = {
        name: trimmed,
        avatar: avatar || profiles[trimmed].avatar || '🦉',
        currentLevel: Math.max(1, Math.min(TOTAL_LEVELS, profiles[trimmed].currentLevel || 1)),
        sparks: typeof profiles[trimmed].sparks === 'number' ? profiles[trimmed].sparks : 100,
        score: typeof profiles[trimmed].score === 'number' ? profiles[trimmed].score : 0,
        isNewUser: false
      };
    } else {
      // BRAND NEW USER -> Initialize cleanly at Level 1 with 100 Sparks & 0 Score!
      this.player = {
        name: trimmed,
        avatar: avatar || '🦉',
        currentLevel: 1,
        sparks: 100,
        score: 0,
        isNewUser: true
      };
      profiles[trimmed] = {
        name: trimmed,
        avatar: this.player.avatar,
        currentLevel: 1,
        sparks: 100,
        score: 0
      };
    }

    this.saveProfilesMap(profiles);
    this.savePlayerState();
    this.notifyState();
    return this.player;
  }

  renamePlayer(newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed || trimmed === this.player.name) return this.player;

    const oldName = this.player.name;
    const profiles = this.loadProfilesMap();

    if (oldName && profiles[oldName]) {
      delete profiles[oldName];
    }

    this.player.name = trimmed;
    profiles[trimmed] = {
      name: trimmed,
      currentLevel: this.player.currentLevel,
      sparks: this.player.sparks
    };

    this.saveProfilesMap(profiles);
    this.savePlayerState();
    this.notifyState();
    return this.player;
  }

  getRank() {
    return getRankForLevel(this.player.currentLevel);
  }

  init(boardContainerId, stageContainerId = null) {
    initAudioEngine(0.40, 0.60, this.tuningBase);

    this.boardRenderer = new BoardRenderer(boardContainerId, {
      seniorView: this.seniorView,
      gameplayMode: this.gameplayMode,
      onTileClick: this.handleTileClick.bind(this)
    });

    const targetContainer = stageContainerId 
      ? document.getElementById(stageContainerId) 
      : document.getElementById(boardContainerId);

    if (targetContainer) {
      this.inputDispatcher = new AuroMatchUniversalInput(
        targetContainer,
        this.handleUniversalAction.bind(this)
      );
    }

    this.startNewStage(this.player.currentLevel);
  }

  loadLevel(levelNum) {
    return this.startNewStage(levelNum);
  }

  startNewStage(stageParam = null) {
    this.tray = [];
    this.selectedTile = null;
    this.matchedPairs = [];
    this.moveHistory = [];
    this.isPaused = false;
    this.isStageCompleted = false;
    this.hintsUsedInStage = 0;

    let levelNum = this.player.currentLevel;
    let tileCount = null;

    if (typeof stageParam === 'number') {
      if ([12, 24, 36, 48, 60, 72, 84, 96, 108].includes(stageParam)) {
        tileCount = stageParam;
      } else {
        levelNum = Math.max(1, Math.min(TOTAL_LEVELS, stageParam));
        this.player.currentLevel = levelNum;
        this.savePlayerState();
      }
    }

    if (!tileCount) {
      tileCount = getTileCountForLevel(levelNum);
    }

    const isRealmsMode = (this.gameplayMode === 'realms');
    const isTileClub = (this.gameplayMode === 'tile_club');
    const K = isTileClub ? 3 : 2;
    const distinctFloraCount = Math.max(3, Math.floor(tileCount / K));
    const levelFlora = getTilesForLevel(levelNum, distinctFloraCount);

    const layout = VitaBoardGenerator.createLevelLayout(levelNum, tileCount);
    this.currentFormationName = VitaBoardGenerator.getFormationName(levelNum);
    this.tiles = VitaBoardGenerator.generateSolvableBoard(layout, levelFlora, isTileClub ? 'tile_club' : 'vita');

    // Realm Campaign Metadata & Archetype assignment
    this.activeRealm = isRealmsMode ? ThemeManager.getRealmForLevel(levelNum) : null;
    const activeArch = (isRealmsMode && this.activeRealm) ? this.activeRealm.archetype : null;

    // In Realms mode, apply the dedicated 16-tile custom artistic skins
    if (isRealmsMode && this.activeRealm && this.activeRealm.customTiles && this.activeRealm.customTiles.length > 0) {
      const artTiles = this.activeRealm.customTiles;
      const distinctFlora = Array.from(new Set(this.tiles.map(t => t.floraId)));
      const floraToArtMap = {};
      distinctFlora.forEach((fId, idx) => {
        floraToArtMap[fId] = artTiles[idx % artTiles.length];
      });

      this.tiles.forEach(t => {
        const art = floraToArtMap[t.floraId];
        if (art) {
          t.customImage = art.image;
          t.thematicName = art.name;
          t.thematicSymbol = art.symbol;
          if (t.floraData) {
            t.floraData.customImage = art.image;
            t.floraData.customName = art.name;
            t.floraData.customSymbol = art.symbol;
          }
        }
      });
    }

    if (this.boardRenderer) {
      this.boardRenderer.setGameplayMode(this.gameplayMode);
      this.boardRenderer.setSeniorView(this.seniorView);
      this.boardRenderer.setActiveArchetype(activeArch);
      this.boardRenderer.setTiles(this.tiles);
    }

    // Apply photorealistic clean realm background if in realms mode
    if (typeof document !== 'undefined') {
      const boardContainer = document.querySelector('.board-container');
      if (boardContainer) {
        if (isRealmsMode && this.activeRealm) {
          boardContainer.classList.add('theme-realm-active');
          boardContainer.style.backgroundImage = `url('${this.activeRealm.bgImage}')`;
        } else {
          boardContainer.classList.remove('theme-realm-active');
          boardContainer.style.backgroundImage = '';
        }
      }
    }

    this.notifyState();
  }

  nextLevel() {
    this.startNewStage(this.player.currentLevel);
  }

  setGameplayMode(mode) {
    if (this.gameplayMode === mode) return;
    this.gameplayMode = mode;
    this.startNewStage(this.tiles.length || 36);
  }

  toggleSeniorView(forcedValue = null) {
    this.seniorView = (forcedValue !== null) ? !!forcedValue : !this.seniorView;
    if (this.boardRenderer) {
      this.boardRenderer.setSeniorView(this.seniorView);
    }
    const rootEl = document.getElementById('app-wrapper') || document.body;
    if (this.seniorView) {
      rootEl.classList.add('senior-view');
    } else {
      rootEl.classList.remove('senior-view');
    }
    // Persist to storage
    if (profileState && profileState.settings) {
      profileState.settings.seniorViewActive = this.seniorView;
      saveProfileState();
    }
    this.notifyState();
    return this.seniorView;
  }

  setTuning(baseFreq) {
    this.tuningBase = baseFreq;
    setTuningScale(baseFreq);
    this.notifyState();
  }

  handleUniversalAction(action) {
    unlockAudioContext();

    if (action.type === 'FREE_UNDO') {
      this.undo();
    } else if (action.type === 'REQUEST_HINT') {
      this.provideHint();
    } else if (action.type === 'RESTART_STAGE') {
      this.restartStage();
    } else if (action.type === 'SHUFFLE_BOARD') {
      this.reshuffleRemaining();
    } else if (action.type === 'TOGGLE_LORE') {
      if (typeof window !== 'undefined' && window.openLoreCard) {
        window.openLoreCard();
      }
    } else if (action.type === 'TOGGLE_MENU') {
      this.togglePause();
    } else if (action.type === 'NAV_KEY') {
      this.handleKeyboardTileNavigation(action.key);
    }
  }

  handleKeyboardTileNavigation(key) {
    const active = this.tiles.filter(t => !t.isMatched);
    if (active.length === 0) return;

    if (!this._focusedTileIndex) this._focusedTileIndex = 0;

    if (key === 'ArrowRight' || key === 'ArrowDown') {
      this._focusedTileIndex = (this._focusedTileIndex + 1) % active.length;
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      this._focusedTileIndex = (this._focusedTileIndex - 1 + active.length) % active.length;
    } else if (key === 'Enter' || key === ' ') {
      const targetTile = active[this._focusedTileIndex];
      if (targetTile) {
        const isFree = VitaBoardGenerator.isTileFree(targetTile, active);
        this.handleTileClick(targetTile, isFree);
      }
      return;
    }

    // Apply focus ring class
    const targetTile = active[this._focusedTileIndex];
    if (targetTile && typeof document !== 'undefined') {
      document.querySelectorAll('.tile-keyboard-focus').forEach(el => el.classList.remove('tile-keyboard-focus'));
      const el = document.getElementById(targetTile.id);
      if (el) el.classList.add('tile-keyboard-focus');
    }
  }

  reshuffleRemaining() {
    if (this.isPaused || this.isStageCompleted) return;
    const active = this.tiles.filter(t => !t.isMatched);
    if (active.length <= 1) return;

    // Reshuffle active tile contents among current active positions
    const floras = active.map(t => ({ id: t.floraId, data: t.floraData }));
    floras.sort(() => Math.random() - 0.5);

    active.forEach((t, i) => {
      t.floraId = floras[i].id;
      t.floraData = floras[i].data;
      t.isSelected = false;
    });

    this.selectedTile = null;
    if (this.boardRenderer) this.boardRenderer.render();
    this.notifyState();
  }

  handleTileClick(tile, isFree, event) {
    if (this.isPaused || this.isStageCompleted) return;

    if (!isFree) {
      playBlockedWarningChime();
      if (typeof document !== 'undefined') {
        const el = document.getElementById(tile.id);
        if (el) {
          el.classList.remove('tile-nudge-blocked');
          void el.offsetWidth;
          el.classList.add('tile-nudge-blocked');
        }
      }
      if (typeof window !== 'undefined' && window.showToastMessage) {
        window.showToastMessage("🔒 Tile blocked — clear covering or lateral tiles first");
      }
      return;
    }

    playTileSelectChime();

    if (this.gameplayMode === 'tile_club') {
      this.handleTileClubMatch3Click(tile);
    } else {
      // 'vita' and 'realms' modes use pure Vita Mahjong 2-tile pair matching!
      this.handleVitaMatch2Click(tile);
    }
  }

  /**
   * Mode A: Vita Mahjong (Match-2 Pair Matching)
   * Free pairs dissolve immediately from board. Tray is completely bypassed.
   */
  handleVitaMatch2Click(tile) {
    if (!this.selectedTile) {
      // First tile selected
      tile.isSelected = true;
      this.selectedTile = tile;
      if (this.boardRenderer) this.boardRenderer.render();
      this.notifyState();
      return;
    }

    if (this.selectedTile.id === tile.id) {
      // Deselect clicked tile
      tile.isSelected = false;
      this.selectedTile = null;
      if (this.boardRenderer) this.boardRenderer.render();
      this.notifyState();
      return;
    }

    const firstTile = this.selectedTile;

    if (firstTile.floraId === tile.floraId) {
      // Successful Pair Match!
      firstTile.isSelected = false;
      firstTile.isMatched = true;
      tile.isMatched = true;
      this.selectedTile = null;

      const flora = firstTile.floraData || getFloraById(firstTile.floraId);

      // Award score (+100 base score)
      this.player.score = (this.player.score || 0) + 100;

      // Award bonus sparks for Golden Relic archetypes (+10 Sparks!)
      if (flora && flora.archetype === 'golden_relic') {
        this.player.sparks = (this.player.sparks || 100) + 10;
        this.player.score += 50;
      }
      this.savePlayerState();

      this.matchedPairs.unshift({
        flora,
        timestamp: Date.now()
      });

      this.moveHistory.push({
        type: 'match_pair',
        tiles: [firstTile, tile]
      });

      // Visual Kinetic Convergence Smash & Stardust Dissolution
      if (typeof document !== 'undefined') {
        const el1 = document.getElementById(firstTile.id);
        const el2 = document.getElementById(tile.id);
        if (el1 && el2) {
          triggerTileConvergenceSmash(el1, el2);
        } else {
          if (el1) triggerTileSparkleDissolve(el1);
          if (el2) triggerTileSparkleDissolve(el2);
        }
      }

      playTileSmashWhoosh();
      playAshramMeditationGong();

      if (this.onMatchSuccess) {
        this.onMatchSuccess({
          mode: 'vita',
          flora,
          pair: [firstTile, tile]
        });
      }

      if (this.boardRenderer) this.boardRenderer.render();
      this.checkStageCompletion();
      this.notifyState();
    } else {
      // Mismatch: switch selection to second tile
      firstTile.isSelected = false;
      tile.isSelected = true;
      this.selectedTile = tile;
      if (this.boardRenderer) this.boardRenderer.render();
      this.notifyState();
    }
  }

  /**
   * Mode B: Tile Club (Match-3 Triad Matching with 7-Slot Holding Tray)
   */
  handleTileClubMatch3Click(tile) {
    if (this.tray.length >= 7) {
      playBlockedWarningChime();
      return;
    }

    tile.isMatched = true; // Moved from board to tray
    this.tray.push(tile);

    // Auto-sort/group identical tiles
    this.tray.sort((a, b) => (a.floraId || '').localeCompare(b.floraId || ''));

    this.moveHistory.push({
      type: 'tray_add',
      tile: tile
    });

    if (this.boardRenderer) this.boardRenderer.render();

    // Scan for Triad Match (3 identical tiles in tray)
    const counts = {};
    this.tray.forEach(t => {
      counts[t.floraId] = (counts[t.floraId] || 0) + 1;
    });

    let matchedFloraId = null;
    for (const fId in counts) {
      if (counts[fId] >= 3) {
        matchedFloraId = fId;
        break;
      }
    }

    if (matchedFloraId) {
      // Visual Starlight Triad Sparkle
      if (typeof document !== 'undefined') {
        triggerTrayTriadSparkle(matchedFloraId);
      }

      // Triad completed!
      const cleared = [];
      this.tray = this.tray.filter(t => {
        if (t.floraId === matchedFloraId && cleared.length < 3) {
          cleared.push(t);
          return false;
        }
        return true;
      });

      playTileSmashWhoosh();
      playAshramMeditationGong();
      // Award score (+250 for triads)
      this.player.score = (this.player.score || 0) + 250;
      this.savePlayerState();

      if (this.onMatchSuccess) {
        this.onMatchSuccess({
          mode: 'tile_club',
          flora,
          triad: cleared
        });
      }

      this.checkStageCompletion();
    } else if (this.tray.length >= 7) {
      // Tray overflow failure
      playBlockedWarningChime();
      if (this.onGameOver) {
        this.onGameOver({ reason: 'GAME_OVER_TRAY_OVERFLOW' });
      }
    }

    this.notifyState();
  }

  undo() {
    if (this.moveHistory.length === 0) return;
    const lastMove = this.moveHistory.pop();

    if (lastMove.type === 'match_pair') {
      lastMove.tiles.forEach(t => {
        t.isMatched = false;
        t.isSelected = false;
      });
      this.matchedPairs.shift();
      this.selectedTile = null;
    } else if (lastMove.type === 'tray_add') {
      lastMove.tile.isMatched = false;
      const idx = this.tray.indexOf(lastMove.tile);
      if (idx !== -1) this.tray.splice(idx, 1);
    }

    if (this.boardRenderer) {
      if (this.boardRenderer) this.boardRenderer.render();
    }
    this.notifyState();
  }

  returnTrayTileToBoard(tileId) {
    const idx = this.tray.findIndex(t => t.id === tileId);
    if (idx === -1) return;
    const tile = this.tray[idx];
    tile.isMatched = false;
    tile.isSelected = false;
    this.tray.splice(idx, 1);

    // Remove from move history
    this.moveHistory = this.moveHistory.filter(m => !(m.type === 'tray_add' && m.tile.id === tileId));

    if (this.boardRenderer) this.boardRenderer.render();
    this.notifyState();
  }

  provideHint() {
    if (!this.boardRenderer || this.isPaused || this.isStageCompleted) return;

    if (this.player.sparks < 20) {
      playBlockedWarningChime();
      if (typeof window !== 'undefined' && window.showToastMessage) {
        window.showToastMessage(`Need 20 Sparks for a Hint ✨ (Current: ${this.player.sparks})`);
      }
      return;
    }

    const active = this.tiles.filter(t => !t.isMatched);
    const playable = active.filter(t => VitaBoardGenerator.isTileFree(t, active));
    const K = (this.gameplayMode === 'vita') ? 2 : 3;

    const groups = {};
    playable.forEach(t => {
      groups[t.floraId] = groups[t.floraId] || [];
      groups[t.floraId].push(t);
    });

    let hintFound = false;
    for (const fId in groups) {
      if (groups[fId].length >= K) {
        const hintIds = groups[fId].slice(0, K).map(t => t.id);
        this.boardRenderer.highlightTiles(hintIds);
        setTimeout(() => {
          if (this.boardRenderer) this.boardRenderer.clearHighlights();
        }, 2500);
        hintFound = true;
        break;
      }
    }

    // Fallback: highlight any playable tile
    if (!hintFound && playable.length > 0) {
      this.boardRenderer.highlightTiles([playable[0].id]);
      setTimeout(() => {
        if (this.boardRenderer) this.boardRenderer.clearHighlights();
      }, 2000);
      hintFound = true;
    }

    if (hintFound) {
      this.player.sparks = Math.max(0, this.player.sparks - 20);
      this.hintsUsedInStage++;
      this.savePlayerState();
      this.notifyState();
    }
  }

  restartStage() {
    this.tiles.forEach(t => {
      t.isMatched = false;
      t.isSelected = false;
    });
    this.tray = [];
    this.selectedTile = null;
    this.matchedPairs = [];
    this.moveHistory = [];
    this.isStageCompleted = false;

    if (this.boardRenderer) {
      if (this.boardRenderer) this.boardRenderer.render();
    }
    this.notifyState();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.notifyState();
  }

  checkStageCompletion() {
    const remaining = this.tiles.filter(t => !t.isMatched);
    if (remaining.length === 0 && this.tray.length === 0) {
      this.isStageCompleted = true;
      playAshramMeditationGong();

      // Sparks economy
      let earnedSparks = 10;
      let cleanSolve = false;
      if (this.hintsUsedInStage === 0) {
        earnedSparks += 5; // Clean solve bonus
        cleanSolve = true;
      }

      const completedLevel = this.player.currentLevel;
      const isMilestone = (completedLevel % 10 === 0);
      if (isMilestone) {
        earnedSparks += 20; // +20 extra sparks bonus on Sanctuary Milestone levels (Total +30!)
      }

      const oldRank = this.getRank();

      // Advance level up to TOTAL_LEVELS (520)
      this.player.currentLevel = Math.min(TOTAL_LEVELS, this.player.currentLevel + 1);
      const newRank = this.getRank();
      let rankPromoted = false;
      if (newRank.name !== oldRank.name) {
        earnedSparks += 50; // Promotion bonus
        rankPromoted = true;
      }

      // Score economy (+1,000 for level clear, +500 for clean solve)
      let earnedScore = 1000;
      if (cleanSolve) earnedScore += 500;
      this.player.score = (this.player.score || 0) + earnedScore;

      this.player.sparks += earnedSparks;
      this.savePlayerState();

      if (this.onStageComplete) {
        this.onStageComplete({
          completedLevel,
          nextLevel: this.player.currentLevel,
          earnedSparks,
          cleanSolve,
          isMilestone,
          rankPromoted,
          oldRank,
          newRank,
          totalSparks: this.player.sparks
        });
      }

      this.notifyState();
    }
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        gameplayMode: this.gameplayMode,
        seniorView: this.seniorView,
        tuningBase: this.tuningBase,
        isPaused: this.isPaused,
        isStageCompleted: this.isStageCompleted,
        tray: this.tray,
        selectedTile: this.selectedTile,
        matchedPairs: this.matchedPairs,
        remainingTilesCount: this.tiles.filter(t => !t.isMatched).length,
        totalTilesCount: this.tiles.length,
        name: this.player.name,
        currentLevel: this.player.currentLevel,
        formationName: this.currentFormationName || VitaBoardGenerator.getFormationName(this.player.currentLevel),
        sparks: this.player.sparks,
        score: this.player.score || 0,
        activeRealm: this.activeRealm || ThemeManager.getRealmForLevel(this.player.currentLevel),
        rank: this.getRank(),
        isNewUser: !!this.player.isNewUser,
        hintsUsedInStage: this.hintsUsedInStage
      });
    }
  }
}

export const activeGameManager = new GameManager();


export const gardens = [
  { id: 'samadhi', name: 'Ashram Samadhi Courtyard', icon: '🪷', concept: 'Concept 2: Circular Mandala', type: 'flowers', style: 2, diff: 'Easy (24 tiles)' },
  { id: 'playground', name: 'Ashram Playground', icon: '🕊️', concept: 'Concept 2: Circular Mandala', type: 'qualities', style: 2, diff: 'Medium (36 tiles)' },
  { id: 'matrimandir_ch', name: 'Auroville Matrimandir Chamber', icon: '🏛️', concept: 'Concept 1: Glass Stack', type: 'sanskrit', style: 1, diff: 'Hard (48 tiles)' },
  { id: 'lake_estate', name: 'Ashram Farms & Lake Estate', icon: '🌿', concept: 'Concept 3: Tactile Altar', type: 'instruments', style: 3, diff: 'Medium (36 tiles)' },
  { id: 'service_tree', name: 'Ashram Service Tree', icon: '🌳', concept: 'Concept 2: Circular Mandala', type: 'flowers', style: 2, diff: 'Easy (24 tiles)' },
  { id: 'banyan_tree', name: 'Auroville Banyan Tree', icon: '🌳', concept: 'Concept 2: Circular Mandala', type: 'qualities', style: 2, diff: 'Medium (36 tiles)' },
  { id: 'coastline', name: 'Pondicherry Promenade Coastline', icon: '🌊', concept: 'Concept 1: Glass Stack', type: 'sanskrit', style: 1, diff: 'Hard (48 tiles)' },
  { id: 'library', name: 'SABDA & Ashram Library', icon: '📜', concept: 'Concept 3: Tactile Altar', type: 'flowers', style: 3, diff: 'Medium (36 tiles)' },
  { id: 'golconde', name: 'Ashram Golconde Dormitory', icon: '🏛️', concept: 'Concept 3: Tactile Altar', type: 'qualities', style: 3, diff: 'Easy (24 tiles)' },
  { id: 'archives', name: 'Ashram Archives & Research', icon: '📚', concept: 'Concept 3: Tactile Altar', type: 'sanskrit', style: 3, diff: 'Hard (48 tiles)' },
  { id: 'matrimandir_pt', name: 'Auroville Matrimandir Petals', icon: '🌺', concept: 'Concept 1: Glass Stack', type: 'flowers', style: 1, diff: 'Easy (24 tiles)' },
  { id: 'green_belt', name: 'Auroville Green Belt', icon: '🌱', concept: 'Concept 2: Circular Mandala', type: 'qualities', style: 2, diff: 'Medium (36 tiles)' },
  { id: 'classroom', name: 'SAICE & Integral Education', icon: '🎓', concept: 'Concept 3: Tactile Altar', type: 'flowers', style: 3, diff: 'Medium (36 tiles)' },
  { id: 'botanical', name: 'Pondicherry Botanical Garden', icon: '🌸', concept: 'Concept 2: Circular Mandala', type: 'flowers', style: 2, diff: 'Easy (24 tiles)' },
  { id: 'dining', name: 'Ashram Dining Hall', icon: '🕯️', concept: 'Concept 3: Tactile Altar', type: 'qualities', style: 3, diff: 'Hard (48 tiles)' }
];

export function renderSelectorSanctuaries() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('garden-list');
  if (!container) return;
  container.innerHTML = '';
  
  gardens.forEach(g => {
    const card = document.createElement('div');
    card.className = 'garden-card';
    card.onclick = () => startGardenSanctuary(g);

    let diffClass = 'diff-easy';
    if (g.diff.includes('36')) diffClass = 'diff-medium';
    else if (g.diff.includes('48')) diffClass = 'diff-hard';
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div class="garden-icon-badge">${g.icon || '🪷'}</div>
        <div class="garden-meta">
          <div class="garden-name">${g.name}</div>
          <div class="garden-concept">${g.concept}</div>
          <span class="garden-diff-badge ${diffClass}">${g.diff}</span>
        </div>
      </div>
      <div class="garden-arrow">➔</div>
    `;
    container.appendChild(card);
  });
}

let currentScreenId = 'welcome';
let previousScreenId = 'welcome';

export function getCurrentScreen() {
  return currentScreenId;
}

export function getPreviousScreen() {
  return previousScreenId;
}

export function routeToScreen(screenId) {
  if (screenId === 'settings') {
    if (currentScreenId !== 'settings') {
      previousScreenId = currentScreenId;
    }
  } else {
    previousScreenId = currentScreenId;
  }
  currentScreenId = screenId;

  if (typeof document === 'undefined') return;
  const screens = document.querySelectorAll('.screen-view');
  screens.forEach(s => s.classList.remove('active-screen'));
  const target = document.getElementById(screenId + '-screen');
  if (target) target.classList.add('active-screen');

  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(t => t.classList.remove('active-tab'));
  if (screenId === 'welcome' || screenId === 'selector') {
    if (tabs[0]) tabs[0].classList.add('active-tab');
  } else if (screenId === 'oracle') {
    if (tabs[1]) tabs[1].classList.add('active-tab');
  } else if (screenId === 'jar') {
    if (tabs[2]) tabs[2].classList.add('active-tab');
  } else if (screenId === 'constellation') {
    if (tabs[3]) tabs[3].classList.add('active-tab');
  }

  const appNav = document.getElementById('app-nav');
  if (appNav) {
    if (screenId === 'game') {
      appNav.style.display = 'none';
    } else {
      appNav.style.display = 'flex';
    }
  }

  if (screenId === 'selector') {
    renderSelectorSanctuaries();
  } else if (screenId === 'constellation') {
    renderConstellationGrid();
  }
}

export function startGardenSanctuary(garden) {
  if (typeof document === 'undefined') return;
  const titleEl = document.getElementById('game-title');
  if (titleEl && garden && garden.name) {
    titleEl.innerText = garden.name;
  }
  routeToScreen('game');
  let tileCount = 36;
  if (garden && garden.diff) {
    if (garden.diff.includes('24')) tileCount = 24;
    else if (garden.diff.includes('48')) tileCount = 48;
  }
  if (activeGameManager) {
    if (!activeGameManager.boardRenderer) {
      activeGameManager.init('board', 'center-stage-col');
    }
    activeGameManager.startNewStage(tileCount);
  }
}

export const ORACLE_QUALITIES = [
  { name: 'Sincerity', symbol: '🪷', prompt: 'Total alignment of thought, speech, and physical action with inner truth.' },
  { name: 'Humility', symbol: '🌱', prompt: 'Freedom from the demands and pretense of the ego; pure openness to learning.' },
  { name: 'Gratitude', symbol: '✨', prompt: 'Humble recognition of the grace and beauty operating in every circumstance.' },
  { name: 'Perseverance', symbol: '🛡️', prompt: 'Steadfast persistence through fatigue, doubt, and temporary resistance.' },
  { name: 'Aspiration', symbol: '🔥', prompt: 'A steady inner longing for higher wisdom, concentration, and light.' },
  { name: 'Receptivity', symbol: '💡', prompt: 'A silent, transparent consciousness capable of receiving truth directly.' },
  { name: 'Peace', symbol: '🕊️', prompt: 'Profound inner stillness that external disturbances cannot shake.' },
  { name: 'Equanimity', symbol: '⚖️', prompt: 'Equal vision and calm under all conditions, in joy as in difficulty.' },
  { name: 'Generosity', symbol: '🌊', prompt: 'Giving freely of one\'s goodwill, patience, and effort without reservation.' },
  { name: 'Goodness', symbol: '🌸', prompt: 'Spontaneous kindness and pure goodwill towards all living beings.' },
  { name: 'Courage', symbol: '🦁', prompt: 'Steadfast boldness of will to overcome inner fear and self-limitation.' },
  { name: 'Devotion', symbol: '💖', prompt: 'Joyful consecration of one\'s concentration and daily work to the Divine.' }
];

export function renderConstellationGrid() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('stars-grid');
  const svg = document.getElementById('constellation-svg');
  if (!container || !svg) return;

  container.innerHTML = '';
  svg.innerHTML = '';

  const w = container.parentElement ? container.parentElement.clientWidth : 320;
  const h = 320;

  // 7 nodes representing the 7 days of the cosmic week / journey
  const starNodes = [
    { day: 'Mon', title: 'Sincerity Star', active: true, x: 0.18, y: 0.70 },
    { day: 'Tue', title: 'Peace Star', active: true, x: 0.32, y: 0.45 },
    { day: 'Wed', title: 'Gratitude Star', active: true, x: 0.50, y: 0.25 },
    { day: 'Thu', title: 'Aspiration Star', active: true, x: 0.68, y: 0.40 },
    { day: 'Fri', title: 'Equanimity Star', active: false, x: 0.82, y: 0.65 },
    { day: 'Sat', title: 'Perseverance Star', active: false, x: 0.50, y: 0.75 },
    { day: 'Sun', title: 'Devotion Star', active: true, x: 0.50, y: 0.50 }
  ];

  // Draw connecting starlight constellations in SVG
  let pathD = '';
  starNodes.forEach((node, i) => {
    const px = Math.round(node.x * w);
    const py = Math.round(node.y * h);
    if (i === 0) pathD += `M ${px} ${py} `;
    else pathD += `L ${px} ${py} `;
  });

  svg.innerHTML = `
    <path d="${pathD}" stroke="rgba(197, 168, 128, 0.4)" stroke-width="1.5" stroke-dasharray="4,4" fill="none" />
  `;

  // Render star elements in container
  starNodes.forEach(node => {
    const starEl = document.createElement('div');
    starEl.className = `star-node ${node.active ? 'active-star' : ''}`;
    starEl.style.left = `${Math.round(node.x * 100)}%`;
    starEl.style.top = `${Math.round(node.y * 100)}%`;
    starEl.title = `${node.day}: ${node.title} (${node.active ? 'Reflected' : 'Open'})`;
    starEl.onclick = () => {
      if (typeof window !== 'undefined' && window.showToastMessage) {
        window.showToastMessage(`✨ ${node.day}: ${node.title} — ${node.active ? 'Journal reflection consecrated' : 'Awaiting reflection'}`);
      }
    };
    container.appendChild(starEl);
  });
}

export function drawDailyOracle() {
  if (typeof document === 'undefined') return;
  const bag = document.getElementById('velvet-bag');
  if (bag) bag.classList.add('shake');
  setTimeout(() => {
    if (bag) bag.classList.remove('shake');
    playAshramMeditationGong();
    
    // Pick based on day of year to ensure daily stability
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 1000 / 60 / 60 / 24);
    const chosen = ORACLE_QUALITIES[dayOfYear % ORACLE_QUALITIES.length];

    const qEl = document.getElementById('oracle-quality');
    const pEl = document.getElementById('oracle-prompt');
    const symEl = document.getElementById('oracle-symbol');
    const resEl = document.getElementById('oracle-result-container');
    const lockEl = document.getElementById('oracle-lock-msg');

    if (symEl) symEl.innerText = chosen.symbol;
    if (qEl) qEl.innerText = chosen.name;
    if (pEl) pEl.innerText = chosen.prompt;
    if (resEl) resEl.style.display = 'block';
    if (lockEl) lockEl.innerText = `Attitude focus drawn for today: ${chosen.symbol} ${chosen.name}.`;

    if (typeof window !== 'undefined' && window.showToastMessage) {
      window.showToastMessage(`🔮 Daily Oracle: ${chosen.symbol} ${chosen.name} drawn!`);
    }
  }, 600);
}

export function checkCalendarGreetings() {
  if (typeof document === 'undefined') return;
  const today = new Date();
  const MM = String(today.getMonth() + 1).padStart(2, '0');
  const DD = String(today.getDate()).padStart(2, '0');
  const dateStr = MM + '-' + DD;
  const milestones = {
    '02-21': { title: "The Mother's Birthday", desc: "A day of divine manifestation and inner light." },
    '04-24': { title: "Darshan Day", desc: "The Mother's final arrival in Pondicherry." },
    '08-15': { title: "Sri Aurobindo's Birthday", desc: "A day of supreme consciousness and spiritual dawn." },
    '11-24': { title: "Siddhi Day", desc: "Descent of Krishna consciousness into the physical." }
  };
  const event = milestones[dateStr];
  if (event) {
    const modal = document.getElementById('darshan-modal');
    const tEl = document.getElementById('darshan-title');
    const dEl = document.getElementById('darshan-desc');
    if (tEl) tEl.innerText = event.title;
    if (dEl) dEl.innerText = event.desc;
    if (modal) modal.style.display = 'flex';
  }
}

export function applySanctuaryModeTheme() {
  if (typeof document === 'undefined') return;
  const isMorning = new Date().getHours() < 17 && new Date().getHours() >= 5;
  const container = document.getElementById('app-wrapper');
  if (!container) return;
  if (isMorning) {
    container.classList.add('theme-morning');
    container.classList.remove('theme-evening');
  } else {
    container.classList.add('theme-evening');
    container.classList.remove('theme-morning');
  }
}
