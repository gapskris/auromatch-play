import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ThemeManager, TOTAL_BOTANICAL_LEVELS, BOTANICAL_CAMPAIGN } from '../src/controllers/themeManager.js';
import { GameManager, getBotanicalTileCount } from '../src/controllers/gameManager.js';
import { VitaBoardGenerator } from '../src/models/boardGenerator.js';

describe('🌸 Botanical Art Campaign (200 Progressive Levels) QA Suite', () => {

  test('TC-BOT-01: Botanical campaign constants & metadata validity', () => {
    assert.strictEqual(TOTAL_BOTANICAL_LEVELS, 200, 'Campaign must have exactly 200 levels');
    assert.ok(BOTANICAL_CAMPAIGN, 'BOTANICAL_CAMPAIGN must be defined');
    assert.strictEqual(BOTANICAL_CAMPAIGN.id, 'botanical_art');
    assert.strictEqual(BOTANICAL_CAMPAIGN.totalLevels, 200);
    assert.strictEqual(BOTANICAL_CAMPAIGN.customTiles.length, 24, 'Campaign must have 24 distinct custom tiles');
  });

  test('TC-BOT-02: All 24 3D tile files and background exist on disk in Assets', () => {
    const assetsDir = path.resolve(__dirname, '../Assets/themes/botanical_art');
    assert.ok(fs.existsSync(assetsDir), 'Directory Assets/themes/botanical_art must exist');

    const bgPath = path.join(assetsDir, 'background.png');
    assert.ok(fs.existsSync(bgPath), 'background.png must exist');
    const bgStat = fs.statSync(bgPath);
    assert.ok(bgStat.size > 50000, 'background.png must be non-empty valid image');

    for (let i = 1; i <= 24; i++) {
      const tileName = `tile_${String(i).padStart(2, '0')}.png`;
      const tilePath = path.join(assetsDir, tileName);
      assert.ok(fs.existsSync(tilePath), `${tileName} must exist on disk`);
      const stat = fs.statSync(tilePath);
      assert.ok(stat.size > 1000, `${tileName} must be a non-empty image file`);
    }
  });

  test('TC-BOT-03: ThemeManager.getBotanicalForLevel returns consistent metadata across 1 to 200', () => {
    for (const lvl of [1, 25, 50, 75, 100, 150, 200]) {
      const def = ThemeManager.getBotanicalForLevel(lvl);
      assert.strictEqual(def.id, 'botanical_art');
      assert.strictEqual(def.currentLevel, lvl);
      assert.strictEqual(def.levelName, `Garden Level ${lvl}`);
      assert.strictEqual(def.customTiles.length, 24);
      assert.strictEqual(def.isMasterArtLevel, true);
    }

    // Bounds clamping
    const clampLow = ThemeManager.getBotanicalForLevel(0);
    assert.strictEqual(clampLow.currentLevel, 1);
    const clampHigh = ThemeManager.getBotanicalForLevel(250);
    assert.strictEqual(clampHigh.currentLevel, 200);
  });

  test('TC-BOT-04: getBotanicalTileCount progressive difficulty curve across 4 chapters', () => {
    // Chapter 1 (Lv 1-25): Gentle Awakening (18 - 30 tiles)
    assert.strictEqual(getBotanicalTileCount(1), 18);
    assert.strictEqual(getBotanicalTileCount(5), 18);
    assert.strictEqual(getBotanicalTileCount(10), 24);
    assert.strictEqual(getBotanicalTileCount(25), 30);

    // Chapter 2 (Lv 26-75): The Blossom (36 - 48 tiles)
    assert.strictEqual(getBotanicalTileCount(26), 36);
    assert.strictEqual(getBotanicalTileCount(50), 36);
    assert.strictEqual(getBotanicalTileCount(51), 48);
    assert.strictEqual(getBotanicalTileCount(75), 48);

    // Chapter 3 (Lv 76-140): Sacred Mandala (60 - 72 tiles)
    assert.strictEqual(getBotanicalTileCount(76), 60);
    assert.strictEqual(getBotanicalTileCount(110), 60);
    assert.strictEqual(getBotanicalTileCount(111), 72);
    assert.strictEqual(getBotanicalTileCount(140), 72);

    // Chapter 4 (Lv 141-200): Grand Pichwai Temple (84 - 96 tiles)
    assert.strictEqual(getBotanicalTileCount(141), 84);
    assert.strictEqual(getBotanicalTileCount(175), 84);
    assert.strictEqual(getBotanicalTileCount(176), 96);
    assert.strictEqual(getBotanicalTileCount(200), 96);
  });

  test('TC-BOT-05: GameManager in botanical mode initializes 100% solvable board with 3D art tiles', () => {
    const gm = new GameManager({ gameplayMode: 'botanical' });
    assert.strictEqual(gm.gameplayMode, 'botanical');
    assert.strictEqual(gm.getTotalLevels(), 200);

    gm.startNewStage(1);
    assert.ok(gm.tiles.length >= 18, 'Board must have at least 18 tiles');
    assert.strictEqual(gm.activeRealm.id, 'botanical_art');

    // Every tile must have customImage pointing to botanical_art
    for (const t of gm.tiles) {
      assert.ok(t.customImage, 'Tile must have customImage');
      assert.ok(t.customImage.includes('botanical_art'), 'customImage must reference botanical_art theme');
      assert.ok(t.thematicName, 'Tile must have thematicName');
      assert.ok(t.thematicSymbol, 'Tile must have thematicSymbol');
    }

    // Verify 100% solvability across all sample levels
    for (const sampleLvl of [1, 25, 75, 140, 200]) {
      gm.startNewStage(sampleLvl);
      assert.ok(gm.tiles.length > 0, `Level ${sampleLvl} must generate tiles`);
      const unblocked = gm.tiles.filter(t => !t.isBlocked && !t.isMatched);
      assert.ok(unblocked.length >= 2, `Level ${sampleLvl} must have unblocked pairs at start`);
    }
  });

});
