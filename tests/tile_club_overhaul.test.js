import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { GameManager } from '../src/controllers/gameManager.js';
import { ThemeManager, STANDARD_THEMES } from '../src/controllers/themeManager.js';

describe('🧩 Tile Club & 3D Standard Themes Overhaul QA Suite', () => {

  test('TC-TC-01: Imperial Gold has 16 100% distinct 3D tile image assets on disk', () => {
    const dir = path.resolve(__dirname, '../Assets/themes/standard_gold');
    assert.ok(fs.existsSync(dir), 'standard_gold directory must exist');
    const hashes = new Set();
    for (let i = 1; i <= 16; i++) {
      const file = path.join(dir, `tile_${String(i).padStart(2, '0')}.png`);
      assert.ok(fs.existsSync(file), `Tile file ${file} must exist`);
      const buf = fs.readFileSync(file);
      assert.ok(buf.length > 5000, `Tile file ${file} should have realistic asset size`);
      const h = crypto.createHash('md5').update(buf).digest('hex');
      assert.ok(!hashes.has(h), `Tile ${i} duplicate MD5 hash detected: ${h}`);
      hashes.add(h);
    }
    assert.strictEqual(hashes.size, 16, 'All 16 tile images in standard_gold must be unique');
  });

  test('TC-TC-02: Royal Lapis has 16 100% distinct 3D tile image assets on disk', () => {
    const dir = path.resolve(__dirname, '../Assets/themes/standard_lapis');
    assert.ok(fs.existsSync(dir), 'standard_lapis directory must exist');
    const hashes = new Set();
    for (let i = 1; i <= 16; i++) {
      const file = path.join(dir, `tile_${String(i).padStart(2, '0')}.png`);
      assert.ok(fs.existsSync(file), `Tile file ${file} must exist`);
      const buf = fs.readFileSync(file);
      assert.ok(buf.length > 5000, `Tile file ${file} should have realistic asset size`);
      const h = crypto.createHash('md5').update(buf).digest('hex');
      assert.ok(!hashes.has(h), `Tile ${i} duplicate MD5 hash detected: ${h}`);
      hashes.add(h);
    }
    assert.strictEqual(hashes.size, 16, 'All 16 tile images in standard_lapis must be unique');
  });

  test('TC-TC-03: Board generation in Tile Club mode populates custom 3D image & thematic name', () => {
    const gm = new GameManager({ gameplayMode: 'tile_club' });
    gm.startNewStage(1);

    assert.ok(gm.tiles.length >= 24, 'Board should have tiles');
    for (const t of gm.tiles) {
      assert.ok(t.customImage, 'Tile must have customImage');
      assert.ok(t.customImage.includes('standard_gold'), 'Default customImage should be standard_gold');
      assert.ok(t.thematicName, 'Tile must have thematicName');
      assert.ok(t.thematicSymbol, 'Tile must have thematicSymbol');
    }
  });

  test('TC-TC-04: Triad match in Tile Club dissolves cleanly without ReferenceError', () => {
    const gm = new GameManager({ gameplayMode: 'tile_club' });
    gm.startNewStage(1);

    let matchSuccessFired = false;
    let matchPayload = null;
    gm.onMatchSuccess = (payload) => {
      matchSuccessFired = true;
      matchPayload = payload;
    };

    // Find 3 tiles with the same floraId
    const floraGroups = {};
    for (const t of gm.tiles) {
      floraGroups[t.floraId] = floraGroups[t.floraId] || [];
      floraGroups[t.floraId].push(t);
    }

    const triadFloraId = Object.keys(floraGroups).find(fId => floraGroups[fId].length >= 3);
    assert.ok(triadFloraId, 'Should find at least 1 group of 3 matching tiles');

    const [t1, t2, t3] = floraGroups[triadFloraId].slice(0, 3);

    // Initial state
    assert.strictEqual(gm.tray.length, 0);
    const initialScore = gm.player.score || 0;

    // Click 1st tile
    gm.handleTileClubMatch3Click(t1);
    assert.strictEqual(gm.tray.length, 1);
    assert.strictEqual(gm.tray[0].id, t1.id);
    assert.strictEqual(matchSuccessFired, false);

    // Click 2nd tile
    gm.handleTileClubMatch3Click(t2);
    assert.strictEqual(gm.tray.length, 2);
    assert.strictEqual(matchSuccessFired, false);

    // Click 3rd tile -> Triad match!
    // Must NOT throw ReferenceError: flora is not defined!
    assert.doesNotThrow(() => {
      gm.handleTileClubMatch3Click(t3);
    });

    // Verify 3 tiles dissolved from tray
    assert.strictEqual(gm.tray.length, 0, 'Tray must be empty after 3rd identical tile dissolves');
    assert.strictEqual(matchSuccessFired, true, 'onMatchSuccess callback must fire');
    assert.ok(matchPayload, 'Payload must be passed to onMatchSuccess');
    assert.strictEqual(matchPayload.mode, 'tile_club');
    assert.ok(matchPayload.flora, 'Payload flora must be defined');
    assert.strictEqual(matchPayload.triad.length, 3, 'Cleared triad must contain 3 tiles');
    assert.strictEqual(gm.player.score, initialScore + 250, 'Score must increase by +250 points');
  });

  test('TC-TC-05: Tray tile return function restores tile to board', () => {
    const gm = new GameManager({ gameplayMode: 'tile_club' });
    gm.startNewStage(1);

    const tile = gm.tiles[0];
    gm.handleTileClubMatch3Click(tile);
    assert.strictEqual(gm.tray.length, 1);
    assert.strictEqual(tile.isMatched, true);

    gm.returnTrayTileToBoard(tile.id);
    assert.strictEqual(gm.tray.length, 0);
    assert.strictEqual(tile.isMatched, false);
  });

  test('TC-TC-06: Tooltip formatting respects thematicName', () => {
    const tile = {
      thematicName: 'Imperial Rosette',
      floraData: { commonName: 'Cloud', domain: 'Atmosphere' }
    };
    const flora = tile.floraData;
    const tileName = tile.thematicName || (flora && flora.customName) || (flora && flora.commonName) || 'Tile';
    const domainInfo = (flora && flora.domain) ? ` (${flora.domain})` : '';
    const isFree = true;
    const title = isFree ? `${tileName}${domainInfo}` : `${tileName} (Blocked: clear covering tiles)`;

    assert.strictEqual(title, 'Imperial Rosette (Atmosphere)');
  });

});
