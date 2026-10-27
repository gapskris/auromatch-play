import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ThemeManager, STANDARD_THEMES } from '../src/controllers/themeManager.js';
import { GameManager } from '../src/controllers/gameManager.js';

describe('✨ Standard Categories Dual-Theme (Imperial Gold & Royal Lapis) QA Suite', () => {

  test('TC-STD-01: STANDARD_THEMES definitions & custom tile counts', () => {
    assert.ok(STANDARD_THEMES.imperial_gold, 'imperial_gold theme must exist');
    assert.ok(STANDARD_THEMES.royal_lapis, 'royal_lapis theme must exist');
    assert.strictEqual(STANDARD_THEMES.imperial_gold.customTiles.length, 16);
    assert.strictEqual(STANDARD_THEMES.royal_lapis.customTiles.length, 16);
  });

  test('TC-STD-02: All 16 3D tile files and background exist on disk for both themes', () => {
    for (const themeKey of ['standard_gold', 'standard_lapis']) {
      const themeDir = path.resolve(__dirname, `../Assets/themes/${themeKey}`);
      assert.ok(fs.existsSync(themeDir), `Directory ${themeDir} must exist`);

      const bg = path.join(themeDir, 'background.png');
      assert.ok(fs.existsSync(bg), `Background ${bg} must exist`);
      assert.ok(fs.statSync(bg).size > 20000);

      for (let i = 1; i <= 16; i++) {
        const tFile = path.join(themeDir, `tile_${String(i).padStart(2, '0')}.png`);
        assert.ok(fs.existsSync(tFile), `${tFile} must exist`);
        assert.ok(fs.statSync(tFile).size > 1000);
      }
    }
  });

  test('TC-STD-03: GameManager in Pairs mode applies Imperial Gold by default', () => {
    const gm = new GameManager({ gameplayMode: 'vita' });
    assert.strictEqual(gm.standardTheme, 'imperial_gold');
    gm.startNewStage(1);

    assert.ok(gm.tiles.length >= 24, 'Board should have tiles');
    for (const t of gm.tiles) {
      assert.ok(t.customImage, 'Tile must have customImage');
      assert.ok(t.customImage.includes('standard_gold'), 'Default customImage must be standard_gold');
    }
  });

  test('TC-STD-04: setStandardTheme live switch to Royal Lapis', () => {
    const gm = new GameManager({ gameplayMode: 'vita' });
    gm.startNewStage(1);

    gm.setStandardTheme('royal_lapis');
    assert.strictEqual(gm.standardTheme, 'royal_lapis');

    for (const t of gm.tiles) {
      assert.ok(t.customImage.includes('standard_lapis'), 'customImage must update to standard_lapis');
    }
  });

  test('TC-STD-05: Strict Boundary Protection - Realms and Botanical remain 100% isolated', () => {
    const gm = new GameManager({ gameplayMode: 'vita' });
    gm.setStandardTheme('royal_lapis');

    // 1. Switch to Botanical Art: must NOT use royal_lapis!
    gm.setGameplayMode('botanical');
    gm.startNewStage(1);
    for (const t of gm.tiles) {
      assert.ok(t.customImage.includes('botanical_art'), 'Botanical mode must strictly use botanical_art tiles');
      assert.ok(!t.customImage.includes('standard_lapis'), 'Botanical mode must NOT use standard_lapis');
    }

    // 2. Switch to Realms: must NOT use royal_lapis!
    gm.setGameplayMode('realms');
    gm.startNewStage(1);
    for (const t of gm.tiles) {
      assert.ok(t.customImage.includes('whispering_pines'), 'Realms Ch 1 must strictly use realm tiles');
      assert.ok(!t.customImage.includes('standard_lapis'), 'Realms mode must NOT use standard_lapis');
    }
  });

});
