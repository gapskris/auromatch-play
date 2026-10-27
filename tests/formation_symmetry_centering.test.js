import { describe, it } from 'node:test';
import assert from 'node:assert';
import { VitaBoardGenerator } from '../src/models/boardGenerator.js';
import { BoardRenderer } from '../src/ui/boardRenderer.js';

describe('📐 Formation Bilateral Symmetry & Stage Centering QA Suite', () => {

  it('TC-SYM-01: Levels 1, 2, and 3 maintain bilateral reflection symmetry with 0 unpartnered tiles', () => {
    // Level 1: Pyramid, Level 2: Twin Pillars, Level 3: Lotus
    [1, 2, 3].forEach(level => {
      const form = VitaBoardGenerator.FORMATIONS[(level - 1) % VitaBoardGenerator.FORMATIONS.length];
      const coords = form.generator(24);
      assert.strictEqual(coords.length, 24, `${form.name} must have exactly 24 tiles`);

      const minX = Math.min(...coords.map(c => c.x));
      const maxX = Math.max(...coords.map(c => c.x));
      const midX = (minX + maxX) / 2;
      const comX = coords.reduce((s, c) => s + c.x, 0) / coords.length;

      // Symmetry check
      const set = new Set(coords.map(c => `${c.x.toFixed(2)}_${c.y.toFixed(2)}_${c.z}`));
      let unpartnered = 0;
      coords.forEach(c => {
        const symX = (2 * midX - c.x).toFixed(2);
        const key = `${symX}_${c.y.toFixed(2)}_${c.z}`;
        if (!set.has(key)) unpartnered++;
      });

      assert.strictEqual(unpartnered, 0, `${form.name} must have 0 unpartnered tiles across axis midX=${midX}`);
      assert.ok(Math.abs(comX - midX) < 0.05, `${form.name} center of mass (${comX}) must match geometric midpoint (${midX})`);
    });
  });

  it('TC-SYM-02: Level 2 Twin Pillars has equal layer-stack heights on left and right pillars', () => {
    const coords = VitaBoardGenerator.FORMATIONS[1].generator(24);
    const minX = Math.min(...coords.map(c => c.x));
    const maxX = Math.max(...coords.map(c => c.x));

    const leftPillarTiles = coords.filter(c => c.x === minX);
    const rightPillarTiles = coords.filter(c => c.x === maxX);

    assert.strictEqual(leftPillarTiles.length, rightPillarTiles.length, 'Left and right pillars must have identical tile count');

    const leftMaxZ = Math.max(...leftPillarTiles.map(c => c.z));
    const rightMaxZ = Math.max(...rightPillarTiles.map(c => c.z));
    assert.strictEqual(leftMaxZ, rightMaxZ, `Left pillar peak (z=${leftMaxZ}) must equal right pillar peak (z=${rightMaxZ})`);
  });

  it('TC-SYM-03: BoardRenderer computeStageMetrics centers visual bounding box within 1px of viewport center', () => {
    const renderer = new BoardRenderer(null, { gameplayMode: 'realms' });
    const containerW = 1024;
    const containerH = 450;

    [1, 2, 3].forEach(level => {
      const form = VitaBoardGenerator.FORMATIONS[(level - 1) % VitaBoardGenerator.FORMATIONS.length];
      const coords = form.generator(24);
      renderer.tiles = coords.map((c, i) => ({ id: 't' + i, x: c.x, y: c.y, z: c.z, isMatched: false }));

      const metrics = renderer.computeStageMetrics(containerW, containerH);

      let minPixelX = Infinity, maxPixelX = -Infinity;
      renderer.tiles.forEach(t => {
        const isoDx = -(t.z * 2.5);
        const px = metrics.offsetX + (t.x - metrics.minX) * metrics.colSpacing + isoDx;
        if (px < minPixelX) minPixelX = px;
        if (px + metrics.width > maxPixelX) maxPixelX = px + metrics.width;
      });

      const visualMid = (minPixelX + maxPixelX) / 2;
      const targetMid = containerW / 2; // 512px
      const diff = Math.abs(visualMid - targetMid);

      assert.ok(diff <= 1.0, `${form.name} visual midpoint (${visualMid}px) must be within 1px of screen center (${targetMid}px). Got diff=${diff}px`);
    });
  });

  it('TC-SYM-04: All 21 formations across 24, 36, 48, 60, 72 tiles produce exact tile counts and >= 2 playable tiles', () => {
    [24, 36, 48, 60, 72].forEach(tc => {
      VitaBoardGenerator.FORMATIONS.forEach(form => {
        const coords = form.generator(tc);
        assert.strictEqual(coords.length, tc, `${form.name} at target ${tc} must produce exactly ${tc} tiles`);

        const dummy = coords.map(c => ({ id: `${c.x}_${c.y}_${c.z}`, x: c.x, y: c.y, z: c.z, isMatched: false }));
        const playable = dummy.filter(t => VitaBoardGenerator.isTileFree(t, dummy));
        assert.ok(playable.length >= 2, `${form.name} at target ${tc} must have at least 2 free playable tiles. Got ${playable.length}`);
      });
    });
  });

});
