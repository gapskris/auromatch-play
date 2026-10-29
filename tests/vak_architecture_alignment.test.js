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

  test('TC-VAK-01: Stage 0 3D Splash Screen DOM & Interactive Cover Pacing (No Auto-Advance)', () => {
    // 1. Verify #landing-screen container
    assert.ok(htmlContent.includes('id="landing-screen"'), '#landing-screen container must exist in index.html');
    assert.ok(htmlContent.includes('landing-view'), 'landing-view CSS class must be present');

    // 2. Verify 3D typography, eyebrow, and tap prompt
    assert.ok(htmlContent.includes('AUROMIND SERIES'), 'Landing eyebrow must state AUROMIND SERIES');
    assert.ok(htmlContent.includes('AUROMATCH'), 'Landing 3D title must state AUROMATCH');
    assert.ok(htmlContent.includes('landing-title-3d'), 'landing-title-3d class must exist for 3D elevation');
    assert.ok(htmlContent.includes('id="landing-tap-prompt"'), '#landing-tap-prompt must exist');
    assert.ok(htmlContent.includes('TAP ANYWHERE TO ENTER'), 'Prompt text must instruct TAP ANYWHERE TO ENTER');

    // 3. Verify title CSS has white-space: nowrap to prevent AUROMATC / H line splitting (Pic 1 fix)
    assert.ok(cssContent.includes('.landing-title-3d') && cssContent.includes('white-space: nowrap;'), 'landing-title-3d must enforce white-space: nowrap');

    // 4. Verify interactive cover pacing: NO premature auto-advance timer, awaits user tap or keyboard Space/Enter (Pic 1 fix)
    assert.ok(mainJsContent.includes('handleLandingTap'), 'handleLandingTap must be defined in main.js');
    assert.ok(!mainJsContent.includes('landingTimer = setTimeout('), 'Must NOT contain automatic landingTimer auto-dismissal');
    assert.ok(mainJsContent.includes('window.addEventListener(\'keydown\''), 'Must listen for keyboard Space/Enter interaction');
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

  test('TC-VAK-04: Stage 1.5 Sanctuary Door Opening Ceremony & 432Hz Synthesis with Identical VAK Delays', () => {
    // 1. Verify play432HzBowlChime export and mathematical frequency tuning
    assert.ok(typeof synth.play432HzBowlChime === 'function', 'play432HzBowlChime must be exported from synthesizer');
    assert.ok(synthJsContent.includes('const f0 = 432.0;'), 'Fundamental frequency must be mathematically set to exactly 432.0 Hz');

    // 2. Verify natural acoustic harmonic series of Tibetan singing bowl
    assert.ok(synthJsContent.includes('harmonics = [1.0, 1.5, 2.0, 2.76, 3.0, 4.24]'), 'Harmonic ratios must match singing bowl spectrum');

    // 3. Verify door opening animation and identical VAK ceremony timing sequence in main.js
    assert.ok(mainJsContent.includes('executeDoorOpeningCeremony'), 'executeDoorOpeningCeremony must be defined');
    assert.ok(mainJsContent.includes('doors.classList.add(\'doors-opening\')'), 'Ceremony must add doors-opening class');
    assert.ok(mainJsContent.includes('3850'), 'Target screen mount delay must be exactly 3850ms (150ms start + 1500ms swing + 2200ms contemplation)');
    assert.ok(mainJsContent.includes('4500'), 'Total immersion duration must be exactly 4500ms (4.5s Deep Temple Immersion)');

    // 4. Verify CSS selector matches BOTH .sanctuary-double-doors.doors-opening and #sanctuary-doors.doors-opening
    assert.ok(cssContent.includes('.sanctuary-double-doors.doors-opening') || cssContent.includes('#sanctuary-doors.doors-opening'), 'CSS selector must match sanctuary-double-doors or #sanctuary-doors with doors-opening');
    assert.ok(cssContent.includes('rotateY(-105deg)'), 'Left door must swing -105 degrees');
    assert.ok(cssContent.includes('rotateY(105deg)'), 'Right door must swing +105 degrees');
    assert.ok(cssContent.includes('1.5s cubic-bezier'), 'Door panels must swing with majestic 1.5s cubic-bezier ease');
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

  test('TC-VAK-06: Stage 3 In-Game Top-Center Header Dropdown Pill & Clean Zen Layout (Pic 3 Parity)', () => {
    // 1. Verify #header-realm-dropdown-pill exists in .app-header (Pic 3 Parity)
    assert.ok(htmlContent.includes('id="header-realm-dropdown-pill"'), '#header-realm-dropdown-pill must exist in header');
    assert.ok(htmlContent.includes('header-realm-dropdown-pill'), 'header-realm-dropdown-pill class must be present');
    assert.ok(htmlContent.includes('onclick="window.openRealmsHubFromGame()"'), 'Clicking header pill must call openRealmsHubFromGame');

    // 2. Verify CSS hides redundant mode-toggle-bar and footer-theme-selector in gameplay screen (Pic 3 Parity)
    assert.ok(cssContent.includes('#game-screen .mode-toggle-bar') && cssContent.includes('display: none'), '#game-screen must hide redundant mode-toggle-bar');
    assert.ok(cssContent.includes('#game-screen #footer-theme-selector') && cssContent.includes('display: none'), '#game-screen must hide redundant footer-theme-selector');

    // 3. Verify updateHeaderRealmDropdown function exists in main.js
    assert.ok(mainJsContent.includes('window.updateHeaderRealmDropdown = () =>'), 'updateHeaderRealmDropdown must be defined in main.js');

    // 4. Verify routeToScreen handles realms_hub and hides #app-nav
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

  test('TC-VAK-09: Gate Screen Overlay Architecture & Zero Document Flow Split (Pics 1 & 3 Parity)', () => {
    // 1. Verify .gate-view is styled as an absolute overlay
    assert.ok(cssContent.includes('.gate-view') && cssContent.includes('position: absolute;'), '.gate-view must be position: absolute');
    assert.ok(cssContent.includes('inset: 0;'), '.gate-view must specify inset: 0');
    assert.ok(cssContent.includes('z-index: 100;'), '.gate-view must specify z-index: 100');

    // 2. Verify .app-container enforces overflow: hidden and position: relative to encapsulate overlay
    assert.ok(cssContent.includes('.app-container') && cssContent.includes('overflow: hidden;'), '.app-container must have overflow: hidden');
    assert.ok(cssContent.includes('position: relative;'), '.app-container must have position: relative');
  });

  test('TC-VAK-10: Inner Revelation Portal DOM & Inscription Integrity (Pic 2 Parity)', () => {
    // 1. Verify Inner Revelation Chamber container exists in index.html
    assert.ok(htmlContent.includes('id="door-inner-revelation-portal"'), '#door-inner-revelation-portal must exist');
    assert.ok(htmlContent.includes('door-inner-revelation-portal'), 'door-inner-revelation-portal class must exist');
    assert.ok(htmlContent.includes('inner-portal-sunbeam'), 'inner-portal-sunbeam must exist for radiant glow');

    // 2. Verify sacred inscriptions & typography
    assert.ok(htmlContent.includes('ENTER IN PEACE'), 'Inner portal must feature title: ENTER IN PEACE');
    assert.ok(htmlContent.includes('All life is yoga.'), 'Inner portal quote must feature: All life is yoga.');
    assert.ok(htmlContent.includes('Sri Aurobindo'), 'Inner portal citation must feature Sri Aurobindo');
    assert.ok(htmlContent.includes('inner-portal-symbol'), 'inner-portal-symbol container must exist');

    // 3. Verify CSS styling for inner portal & sunbeam animation
    assert.ok(cssContent.includes('.door-inner-revelation-portal'), 'CSS must define .door-inner-revelation-portal');
    assert.ok(cssContent.includes('.inner-portal-sunbeam'), 'CSS must define .inner-portal-sunbeam');
    assert.ok(cssContent.includes('@keyframes sunbeamPulse'), 'CSS must define @keyframes sunbeamPulse');
  });

  test('TC-VAK-11: 3D Beveled Door Leaves & Filigree Inlay Architecture (Pic 2 Parity)', () => {
    // 1. Verify filigree panels exist in index.html inside both door panels
    assert.ok(htmlContent.includes('class="door-filigree-panel"'), 'door-filigree-panel must exist inside door panels');

    // 2. Verify filigree CSS and 3D swing transforms
    assert.ok(cssContent.includes('.door-filigree-panel'), 'CSS must define .door-filigree-panel');
    assert.ok(cssContent.includes('border-radius: 26px;'), 'Door leaves must feature 26px rounded contours');
    assert.ok(cssContent.includes('transform: rotateY(-105deg);'), 'Left door leaf must swing outward in 3D');
    assert.ok(cssContent.includes('transform: rotateY(105deg);'), 'Right door leaf must swing outward in 3D');
  });

  test('TC-VAK-12: Screen Routing Lifecycle & Zero Inline Specificity Conflict (Pics 1 & 3 Parity)', () => {
    const gmJsPath = path.resolve(__dirname, '../src/controllers/gameManager.js');
    const gmJsContent = fs.readFileSync(gmJsPath, 'utf8');

    // 1. Verify routeToScreen manages #gate-screen inline display
    assert.ok(gmJsContent.includes("document.getElementById('gate-screen')"), 'routeToScreen must reference #gate-screen');
    assert.ok(gmJsContent.includes("gateScreen.style.display = 'none'"), 'routeToScreen must hide gate-screen on exit');

    // 2. Verify handleGatewayExplore clears gate screen
    assert.ok(mainJsContent.includes('handleGatewayExplore'), 'main.js must define handleGatewayExplore');
    assert.ok(mainJsContent.includes("routeToScreen('realms_hub')"), 'handleGatewayExplore must route to realms_hub');

    // 3. Verify executeDoorOpeningCeremony handles dissolving class and cleanup
    assert.ok(mainJsContent.includes("gateScreen.classList.add('dissolving')"), 'Ceremony must add dissolving class');
    assert.ok(mainJsContent.includes("gateScreen.classList.remove('dissolving')"), 'Ceremony must remove dissolving class');
  });

  test('TC-VAK-13: Gateway Buttons Alignment & Touch Target Conformance', () => {
    // 1. Verify gate-actions container styling
    assert.ok(cssContent.includes('.gate-actions'), 'CSS must define .gate-actions');
    assert.ok(cssContent.includes('max-width: 360px;'), '.gate-actions must enforce max-width: 360px');

    // 2. Verify primary and secondary CTA styling
    assert.ok(cssContent.includes('.gate-cta-primary'), 'CSS must define .gate-cta-primary');
    assert.ok(cssContent.includes('.gate-cta-secondary'), 'CSS must define .gate-cta-secondary');
    assert.ok(cssContent.includes('border-radius: 28px;'), '.gate-cta-primary must have pill border-radius');
  });

  test('TC-VAK-14: Dual Repository Exact File Parity (AuroMatch vs auromatch-play)', () => {
    const playHtmlPath = path.resolve(__dirname, '../../auromatch-play/index.html');
    const playCssPath = path.resolve(__dirname, '../../auromatch-play/styles/main.css');
    const playMainJsPath = path.resolve(__dirname, '../../auromatch-play/src/main.js');
    const playGmJsPath = path.resolve(__dirname, '../../auromatch-play/src/controllers/gameManager.js');

    assert.ok(fs.existsSync(playHtmlPath), 'auromatch-play index.html must exist');
    assert.ok(fs.existsSync(playCssPath), 'auromatch-play styles/main.css must exist');
    assert.ok(fs.existsSync(playMainJsPath), 'auromatch-play src/main.js must exist');
    assert.ok(fs.existsSync(playGmJsPath), 'auromatch-play src/controllers/gameManager.js must exist');

    const playHtml = fs.readFileSync(playHtmlPath, 'utf8');
    const playCss = fs.readFileSync(playCssPath, 'utf8');
    const playMainJs = fs.readFileSync(playMainJsPath, 'utf8');

    // Verify key architectural additions are identical in auromatch-play
    assert.ok(playHtml.includes('id="door-inner-revelation-portal"'), 'play index.html must have #door-inner-revelation-portal');
    assert.ok(playHtml.includes('door-filigree-panel'), 'play index.html must have door-filigree-panel');
    assert.ok(playCss.includes('.door-inner-revelation-portal'), 'play main.css must have .door-inner-revelation-portal');
    assert.ok(playCss.includes('.door-filigree-panel'), 'play main.css must have .door-filigree-panel');
    assert.ok(playMainJs.includes('executeDoorOpeningCeremony'), 'play main.js must have executeDoorOpeningCeremony');
  });

});
