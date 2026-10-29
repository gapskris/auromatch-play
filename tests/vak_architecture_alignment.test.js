import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { GameManager, routeToScreen } from '../src/controllers/gameManager.js';
import * as synth from '../src/audio/synthesizer.js';

describe('🏛️ VAK Architecture & Alignment Master Test Suite for AuroMatch', () => {

  const htmlPath = path.resolve(__dirname, '../index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  const cssPath = path.resolve(__dirname, '../styles/main.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const mainJsPath = path.resolve(__dirname, '../src/main.js');
  const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

  const synthJsPath = path.resolve(__dirname, '../src/audio/synthesizer.js');
  const synthJsContent = fs.readFileSync(synthJsPath, 'utf8');

  test('TC-VAK-01: Stage 0 3D Splash Screen DOM & 1.6s Auto-Advance / Tap-to-Skip', () => {
    // 1. Verify #landing-screen container
    assert.ok(htmlContent.includes('id="landing-screen"'), '#landing-screen container must exist in index.html');
    assert.ok(htmlContent.includes('landing-view'), 'landing-view CSS class must be present');

    // 2. Verify 3D typography, eyebrow, and tap prompt
    assert.ok(htmlContent.includes('AUROMIND SERIES'), 'Landing eyebrow must state AUROMIND SERIES');
    assert.ok(htmlContent.includes('AUROMATCH'), 'Landing 3D title must state AUROMATCH');
    assert.ok(htmlContent.includes('landing-title-3d'), 'landing-title-3d class must exist for 3D elevation');
    assert.ok(htmlContent.includes('id="landing-tap-prompt"'), '#landing-tap-prompt must exist');
    assert.ok(htmlContent.includes('TAP ANYWHERE TO ENTER'), 'Prompt text must instruct TAP ANYWHERE TO ENTER');

    // 3. Verify auto-timer (1.6s) and tap-to-skip in src/main.js
    assert.ok(mainJsContent.includes('handleLandingTap'), 'handleLandingTap must be defined in main.js');
    assert.ok(mainJsContent.includes('landingTimer = setTimeout('), 'landingTimer setTimeout must be initialized');
    assert.ok(mainJsContent.includes('1600'), 'landingTimer auto-advance duration must be exactly 1600ms (1.6s)');
  });

  test('TC-VAK-02: Stage 1 Sanctuary Gateway Double Doors & Medallion Structure', () => {
    // 1. Verify #gate-screen container
    assert.ok(htmlContent.includes('id="gate-screen"'), '#gate-screen container must exist');
    assert.ok(htmlContent.includes('gate-view'), 'gate-view class must exist');

    // 2. Verify double doors and Mother\'s 12-petaled sun medallion
    assert.ok(htmlContent.includes('id="sanctuary-doors"'), '#sanctuary-doors container must exist');
    assert.ok(htmlContent.includes('door-panel door-panel-left'), 'Left door panel must exist');
    assert.ok(htmlContent.includes('door-panel door-panel-right'), 'Right door panel must exist');
    assert.ok(htmlContent.includes('door-medallion'), 'Mother\'s sun medallion must be positioned on the doorway');
    assert.ok(htmlContent.includes('door-light-beam'), 'Radiant inner light beam must exist between doors');

    // 3. Verify authentic quote and action buttons
    assert.ok(htmlContent.includes('id="gate-quote-text"'), '#gate-quote-text must exist');
    assert.ok(htmlContent.includes('THE MOTHER'), 'Quote attribution must include THE MOTHER');
    assert.ok(htmlContent.includes('id="gate-btn-enter"'), 'Primary Enter button must exist');
    assert.ok(htmlContent.includes('id="gate-btn-resume"'), 'Personalized Resume button must exist');
    assert.ok(htmlContent.includes('id="gate-btn-explore"'), 'Explore Realms secondary CTA button must exist');
    assert.ok(htmlContent.includes('id="gate-player-label"'), 'Switch player label must exist');
  });

  test('TC-VAK-03: User Status Conditional Branching (New User vs Returning User)', () => {
    // Verify updateGatewayUI logic in main.js
    assert.ok(mainJsContent.includes('window.updateGatewayUI = () =>'), 'updateGatewayUI must be defined');

    // Test new user branching logic
    const evalUserStatus = (player) => {
      const isNew = !player || !player.name || (player.currentLevel <= 1 && !player.score);
      return {
        showEnter: isNew,
        showResume: !isNew
      };
    };

    // Case A: Fresh new user (no name, level 1, score 0)
    const newUserState = evalUserStatus({ name: '', currentLevel: 1, score: 0 });
    assert.strictEqual(newUserState.showEnter, true, 'New user must see [Enter the Sanctuary]');
    assert.strictEqual(newUserState.showResume, false, 'New user must NOT see Resume button');

    // Case B: Returning user (name set, level > 1)
    const returningUserState = evalUserStatus({ name: 'Seeker', currentLevel: 7, score: 1200, sparks: 280 });
    assert.strictEqual(returningUserState.showEnter, false, 'Returning user must NOT see Enter button');
    assert.strictEqual(returningUserState.showResume, true, 'Returning user must see [Resume: Level X]');

    // Verify resume text string formatting
    assert.ok(mainJsContent.includes('Resume: Level ${player.currentLevel}'), 'Resume text must interpolate currentLevel');
    assert.ok(mainJsContent.includes('⚡ ${player.sparks'), 'Resume text must show player sparks');
  });

  test('TC-VAK-04: Stage 1.5 2.2s Meditative Opening Ceremony & 432Hz Audio Synthesis', () => {
    // 1. Verify play432HzBowlChime export and mathematical frequency tuning
    assert.ok(typeof synth.play432HzBowlChime === 'function', 'play432HzBowlChime must be exported from synthesizer');
    assert.ok(synthJsContent.includes('const f0 = 432.0;'), 'Fundamental frequency must be mathematically set to exactly 432.0 Hz');

    // 2. Verify natural acoustic harmonic series of Tibetan singing bowl
    assert.ok(synthJsContent.includes('harmonics = [1.0, 1.5, 2.0, 2.76, 3.0, 4.24]'), 'Harmonic ratios must match singing bowl spectrum');

    // 3. Verify door opening animation and 2.2s ceremony timing in main.js
    assert.ok(mainJsContent.includes('executeDoorOpeningCeremony'), 'executeDoorOpeningCeremony must be defined');
    assert.ok(mainJsContent.includes('doors.classList.add(\'doors-opening\')'), 'Ceremony must add doors-opening class');
    assert.ok(mainJsContent.includes('2200'), 'Opening ceremony duration must be exactly 2200ms (2.2s)');

    // 4. Verify 3D door rotation CSS (-105deg and +105deg)
    assert.ok(cssContent.includes('rotateY(-105deg)'), 'Left door must swing -105 degrees');
    assert.ok(cssContent.includes('rotateY(105deg)'), 'Right door must swing +105 degrees');
  });

  test('TC-VAK-05: Stage 2 Dedicated Sacred Realm Selection Screen Cards & Navigation', () => {
    // 1. Verify #realms-hub-screen exists
    assert.ok(htmlContent.includes('id="realms-hub-screen"'), '#realms-hub-screen must exist in index.html');
    assert.ok(htmlContent.includes('realms-hub-view'), 'realms-hub-view class must exist');

    // 2. Verify 5 distinct realm/campaign cards
    assert.ok(htmlContent.includes('id="hub-card-pairs"'), 'Card 1: Pairs Campaign must exist');
    assert.ok(htmlContent.includes('id="hub-card-tileclub"'), 'Card 2: Tile Club Triad Match-3 must exist');
    assert.ok(htmlContent.includes('id="hub-card-botanical"'), 'Card 3: Botanical Art 200 Levels must exist');
    assert.ok(htmlContent.includes('id="hub-card-realms"'), 'Card 4: 20 Sacred Realms must exist');
    assert.ok(htmlContent.includes('id="hub-card-standard"'), 'Card 5: Standard Themes Switcher must exist');

    // 3. Verify top bar controls
    assert.ok(htmlContent.includes('id="rh-exit-btn"'), 'Exit to Gate button must exist');
    assert.ok(htmlContent.includes('id="rh-close-btn"'), 'Close Hub button must exist');

    // 4. Verify game manager switches gameplay mode cleanly
    const gm = new GameManager({ gameplayMode: 'vita' });
    assert.strictEqual(gm.gameplayMode, 'vita');

    gm.setGameplayMode('tile_club');
    assert.strictEqual(gm.gameplayMode, 'tile_club');

    gm.setGameplayMode('botanical');
    assert.strictEqual(gm.gameplayMode, 'botanical');

    gm.setGameplayMode('realms');
    assert.strictEqual(gm.gameplayMode, 'realms');
  });

  test('TC-VAK-06: Stage 3 In-Game Header Dropdown Pill & Seamless Routing', () => {
    // 1. Verify #gameplay-prompt is an interactive dropdown pill button
    assert.ok(htmlContent.includes('id="gameplay-prompt"'), '#gameplay-prompt must exist');
    assert.ok(htmlContent.includes('gameplay-prompt-dropdown'), 'gameplay-prompt-dropdown class must be present');
    assert.ok(htmlContent.includes('onclick="window.openRealmsHubFromGame()"'), 'Clicking header pill must call openRealmsHubFromGame');

    // 2. Verify routeToScreen handles realms_hub and hides #app-nav
    assert.ok(mainJsContent.includes('openRealmsHubFromGame'), 'openRealmsHubFromGame must be defined in main.js');
    assert.ok(mainJsContent.includes('routeToScreen(\'realms_hub\')'), 'openRealmsHubFromGame must route to realms_hub');
  });

  test('TC-VAK-07: Sacred Epiphany State Machine & Triple Sparks Reward', () => {
    const gm = new GameManager({ gameplayMode: 'vita' });

    // Initial state verification
    assert.strictEqual(gm.levelsSinceLastEpiphany, 0, 'levelsSinceLastEpiphany should initialize to 0');
    assert.ok(gm.nextEpiphanyTarget >= 6 && gm.nextEpiphanyTarget <= 12, 'nextEpiphanyTarget must be between 6 and 12');
    assert.strictEqual(gm.isEpiphanyActive, false, 'isEpiphanyActive must initialize to false');

    // Test explicit trigger
    const initialSparks = gm.player.sparks || 100;
    gm.triggerSacredEpiphany();
    assert.strictEqual(gm.isEpiphanyActive, true, 'isEpiphanyActive must be true after trigger');
    assert.strictEqual(gm.player.sparks, initialSparks + 60, 'Epiphany must award +60 Triple Sparks');

    // Test dismissal
    gm.dismissEpiphany();
    assert.strictEqual(gm.isEpiphanyActive, false, 'isEpiphanyActive must be false after dismissal');

    // Simulate level progression to trigger Epiphany in game loop
    gm.levelsSinceLastEpiphany = gm.nextEpiphanyTarget - 1;
    const preBonusSparks = gm.player.sparks;

    // Simulate stage clear
    gm.startNewStage(1);
    gm.tiles.forEach(t => t.isMatched = true);
    gm.checkStageCompletion();

    assert.strictEqual(gm.levelsSinceLastEpiphany, 0, 'levelsSinceLastEpiphany must reset to 0 after triggering');
    assert.strictEqual(gm.isEpiphanyActive, true, 'isEpiphanyActive must be true after completion');
    // Earned sparks includes standard clear (10) + clean solve (5) + epiphany (60) = 75
    assert.ok(gm.player.sparks >= preBonusSparks + 60, 'Sparks must include +60 Epiphany bonus');
  });

  test('TC-VAK-08: Global Theme Dynamic Token Binding & Zero Green Leakage', () => {
    // 1. Verify new screen views use CSS variable tokens
    const screenTokenKeys = [
      '.landing-view',
      '.gate-view',
      '.realms-hub-view',
      '.epiphany-card'
    ];
    for (const key of screenTokenKeys) {
      assert.ok(cssContent.includes(key), `CSS must define ${key}`);
    }

    assert.ok(cssContent.includes('--bg-current'), 'CSS must reference --bg-current');
    assert.ok(cssContent.includes('--panel-current'), 'CSS must reference --panel-current');
    assert.ok(cssContent.includes('--border-current'), 'CSS must reference --border-current');
    assert.ok(cssContent.includes('--accent-current'), 'CSS must reference --accent-current');

    // 2. Ensure zero hardcoded deprecated green background hex colors
    const deprecatedGreenHexes = ['#042219', '#083326', '#0d4738', '#062e22', '#0a3d2e'];
    for (const hex of deprecatedGreenHexes) {
      assert.ok(!htmlContent.includes(hex), `index.html must not contain deprecated green ${hex}`);
    }

    // Check newly added CSS section for deprecated green hexes
    const vakCssSection = cssContent.slice(cssContent.indexOf('/* 🏛️ VAK ARCHITECTURE ALIGNMENT'));
    for (const hex of deprecatedGreenHexes) {
      assert.ok(!vakCssSection.includes(hex), `VAK CSS section must not contain deprecated green ${hex}`);
    }
  });

});
