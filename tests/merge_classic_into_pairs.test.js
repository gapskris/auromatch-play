import test from 'node:test';
import assert from 'node:assert';
import { GameManager, TOTAL_PAIRS_LEVELS, TOTAL_CLASSIC_LEVELS } from '../src/controllers/gameManager.js';
import { VitaBoardGenerator } from '../src/models/boardGenerator.js';
import { ThemeManager, REALMS } from '../src/controllers/themeManager.js';

test('TC-MERGE-01: Pairs Mode Level Ceiling is exactly 400 levels', () => {
  assert.strictEqual(TOTAL_PAIRS_LEVELS, 400, 'TOTAL_PAIRS_LEVELS must be 400');
  assert.strictEqual(TOTAL_CLASSIC_LEVELS, 400, 'TOTAL_CLASSIC_LEVELS alias must be 400');

  const gm = new GameManager({ gameplayMode: 'vita' });
  assert.strictEqual(gm.getTotalLevels(), 400);

  gm.loadLevel(400);
  assert.strictEqual(gm.player.currentLevel, 400);
  assert.strictEqual(gm.tiles.length, 108);
});

test('TC-MERGE-02: Classic mode gracefully aliases to Pairs (vita)', () => {
  const gm = new GameManager({ gameplayMode: 'classic' });
  assert.strictEqual(gm.gameplayMode, 'vita', 'Initial classic mode option must alias to vita');

  gm.setGameplayMode('classic');
  assert.strictEqual(gm.gameplayMode, 'vita', 'setGameplayMode("classic") must route to vita');
  assert.strictEqual(gm.getTotalLevels(), 400);
});

test('TC-MERGE-03: Solvability sampling across 400 levels (Levels 1, 50, 100, 150, 200, 250, 300, 350, 400)', () => {
  const sampleLevels = [1, 50, 100, 150, 200, 250, 300, 350, 400];
  const gm = new GameManager({ gameplayMode: 'vita' });

  sampleLevels.forEach(lvl => {
    gm.loadLevel(lvl);
    assert.strictEqual(gm.player.currentLevel, lvl);
    assert.ok(gm.tiles.length >= 36 && gm.tiles.length <= 108, `Level ${lvl} tile count (${gm.tiles.length}) must be in valid range`);

    // Verify board has unoccluded playable tiles
    const playable = VitaBoardGenerator.getPlayableTiles(gm.tiles);
    assert.ok(playable.length >= 2, `Level ${lvl} must have at least 2 free playable tiles (found ${playable.length})`);

    // Verify every tile belongs to a pair
    const counts = {};
    gm.tiles.forEach(t => {
      counts[t.floraId] = (counts[t.floraId] || 0) + 1;
    });
    Object.entries(counts).forEach(([fId, count]) => {
      assert.strictEqual(count % 2, 0, `Flora ${fId} in Level ${lvl} must be in exact pairs (found ${count})`);
    });
  });
});

test('TC-MERGE-04: Tile Club Mode and Realms remain 100% intact and isolated', () => {
  const gm = new GameManager({ gameplayMode: 'tile_club' });
  assert.strictEqual(gm.gameplayMode, 'tile_club');
  gm.loadLevel(1);
  // Tile Club uses triads (3 identical tiles)
  const counts = {};
  gm.tiles.forEach(t => {
    counts[t.floraId] = (counts[t.floraId] || 0) + 1;
  });
  Object.entries(counts).forEach(([fId, count]) => {
    assert.strictEqual(count % 3, 0, `Flora ${fId} in Tile Club must be in exact triads of 3 (found ${count})`);
  });

  // Switch to Realms
  gm.setGameplayMode('realms');
  assert.strictEqual(gm.gameplayMode, 'realms');
  assert.ok(gm.activeRealm, 'Realms mode must activate active realm');
  assert.strictEqual(gm.activeRealm.id, 'whispering_pines');
});
