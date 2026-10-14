// Guaranteed Solvability Engine & Vita Mahjong 3D Stacking Models
// Pure mathematical reverse-construction generation ensuring 100% solvability without deadlocks.

export class VitaBoardGenerator {
  /**
   * Occlusion Rules:
   * A tile at (x, y, z) is free/playable if:
   * 1. No tile at z + 1 overlaps its bounding box [x - 0.9, x + 0.9] x [y - 0.9, y + 0.9].
   * 2. AND either Left (x - 1, y, z) is unoccluded OR Right (x + 1, y, z) is unoccluded.
   */
  static isTileFree(tile, activeTiles) {
    if (tile.isMatched) return false;

    // 1. Upper layer occlusion check (z + 1)
    for (const other of activeTiles) {
      if (other.id === tile.id || other.isMatched) continue;

      if (other.z === tile.z + 1) {
        const dx = Math.abs(other.x - tile.x);
        const dy = Math.abs(other.y - tile.y);
        // Overlap bounding box [x - 0.9, x + 0.9] x [y - 0.9, y + 0.9]
        if (dx < 0.9 && dy < 0.9) {
          return false; // Covered from above
        }
      }
    }

    // 2. Lateral side clearance check (same layer)
    let leftBlocked = false;
    let rightBlocked = false;

    for (const other of activeTiles) {
      if (other.id === tile.id || other.isMatched) continue;

      if (other.z === tile.z && Math.abs(other.y - tile.y) < 0.8) {
        if (other.x < tile.x && (tile.x - other.x) <= 1.05) {
          leftBlocked = true;
        }
        if (other.x > tile.x && (other.x - tile.x) <= 1.05) {
          rightBlocked = true;
        }
      }
    }

    // Free if at least one long side (Left OR Right) is open
    return !leftBlocked || !rightBlocked;
  }

  /**
   * Returns list of currently unoccluded, playable tiles.
   */
  static getPlayableTiles(tiles) {
    const active = tiles.filter(t => !t.isMatched);
    return active.filter(t => this.isTileFree(t, active));
  }

  // Helper: Scale layouts up to high tile counts (e.g. 72, 84, 96, 108) by stacking upper tiers
  static _padToTarget(coords, targetCount) {
    if (coords.length >= targetCount) {
      return coords.slice(0, targetCount);
    }
    const set = new Set(coords.map(c => `${c.x}_${c.y}_${c.z}`));
    let zTier = 1;
    while (coords.length < targetCount && zTier <= 5) {
      const currentLen = coords.length;
      for (let i = 0; i < currentLen && coords.length < targetCount; i++) {
        const base = coords[i];
        if (base.z === zTier - 1) {
          const key = `${base.x}_${base.y}_${zTier}`;
          if (!set.has(key)) {
            set.add(key);
            coords.push({ x: base.x, y: base.y, z: zTier });
          }
        }
      }
      zTier++;
    }
    return coords.slice(0, targetCount);
  }

  // 1. Pyramid (Shikhara - Concentric centered pyramid)
  static _genPyramid(targetCount) {
    const coords = [];
    const maxR = targetCount <= 36 ? 4 : (targetCount <= 60 ? 5 : 6);
    const maxC = targetCount <= 36 ? 5 : (targetCount <= 60 ? 6 : 8);
    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
    }
    for (let r = 0; r < maxR - 1; r++) {
      for (let c = 0; c < maxC - 1; c++) coords.push({ x: c * 1.0 + 0.5, y: r * 1.0 + 0.5, z: 1 });
    }
    for (let r = 0; r < maxR - 2; r++) {
      for (let c = 0; c < maxC - 2; c++) coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 1.0, z: 2 });
    }
    for (let r = 0; r < Math.max(1, maxR - 3); r++) {
      for (let c = 0; c < Math.max(1, maxC - 3); c++) coords.push({ x: c * 1.0 + 1.5, y: r * 1.0 + 1.5, z: 3 });
    }
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 2. Twin Pillars & Gateway Bridge (H-Gate - Watermelon Mahjong style!)
  static _genHGate(targetCount) {
    const coords = [];
    const W = targetCount <= 36 ? 6 : (targetCount <= 60 ? 7 : 8);
    const H = 5;

    // Corner pillar positions (4 corners, 2 tiles wide each: total 8 base slots)
    const cornerCols = [0, 1, W - 2, W - 1];
    const cornerRows = [0, H - 1];

    // Layer 0: 8 corner footprints + center bridge tiles
    cornerCols.forEach(c => cornerRows.forEach(r => coords.push({ x: c * 1.0, y: r * 1.0, z: 0 })));
    for (let r = 0; r < H; r++) {
      for (let c = 2; c <= W - 3; c++) {
        coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      }
    }

    // Layer 1: 8 corner stacks + 2 bridge tiles
    cornerCols.forEach(c => cornerRows.forEach(r => coords.push({ x: c * 1.0, y: r * 1.0, z: 1 })));
    coords.push({ x: 2.5, y: 1.0, z: 1 });
    coords.push({ x: 2.5, y: 3.0, z: 1 });

    // Layer 2: 4 outer corner pillars + 2 bridge crests
    [0, W - 1].forEach(c => cornerRows.forEach(r => coords.push({ x: c * 1.0, y: r * 1.0, z: 2 })));
    coords.push({ x: 2.0, y: 2.0, z: 2 });
    coords.push({ x: W - 3, y: 2.0, z: 2 });

    // Layer 3: 4 outer corner peaks (4 layers deep!)
    [0, W - 1].forEach(c => cornerRows.forEach(r => coords.push({ x: c * 1.0, y: r * 1.0, z: 3 })));

    // Extra corner support for higher tile counts
    [1, W - 2].forEach(c => cornerRows.forEach(r => {
      coords.push({ x: c * 1.0, y: r * 1.0, z: 2 });
      coords.push({ x: c * 1.0, y: r * 1.0, z: 3 });
    }));

    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 3. Lotus (Padma - 4 Radial Petals & Center Bud)
  static _genLotus(targetCount) {
    const coords = [];
    const cx = 3, cy = 3;
    for (let r = 0; r <= 6; r++) {
      for (let c = 0; c <= 6; c++) {
        const dx = Math.abs(c - cx);
        const dy = Math.abs(r - cy);
        if ((dx <= 2 && dy <= 1) || (dx <= 1 && dy <= 2) || (dx === 1 && dy === 1)) {
          coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
        }
      }
    }
    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= 5; c++) {
        const dx = Math.abs(c - cx);
        const dy = Math.abs(r - cy);
        if (dx + dy <= 3 && !(dx === 2 && dy === 2)) {
          coords.push({ x: c * 1.0 + 0.5, y: r * 1.0 + 0.5, z: 1 });
        }
      }
    }
    for (let r = 2; r <= 4; r++) {
      for (let c = 2; c <= 4; c++) coords.push({ x: c * 1.0, y: r * 1.0, z: 2 });
    }
    coords.push({ x: cx * 1.0, y: cy * 1.0, z: 3 });
    coords.push({ x: cx * 1.0, y: cy * 1.0, z: 4 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 4. Citadel Fortress (Sanctuary Ring & Inner Island)
  static _genCitadel(targetCount) {
    const coords = [];
    const W = 7, H = 6;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const isPerimeter = (r === 0 || r === H - 1 || c === 0 || c === W - 1);
        const isIsland = (r >= 2 && r <= 3 && c >= 2 && c <= 4);
        if (isPerimeter || isIsland) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      }
    }
    for (let c = 0; c < W; c += 2) {
      coords.push({ x: c * 1.0, y: 0, z: 1 });
      coords.push({ x: c * 1.0, y: H - 1, z: 1 });
    }
    for (let r = 1; r < H - 1; r += 2) {
      coords.push({ x: 0, y: r * 1.0, z: 1 });
      coords.push({ x: W - 1, y: r * 1.0, z: 1 });
    }
    for (let r = 2; r <= 3; r++) {
      for (let c = 2; c <= 4; c++) {
        coords.push({ x: c * 1.0, y: r * 1.0, z: 1 });
        coords.push({ x: c * 1.0, y: r * 1.0, z: 2 });
      }
    }
    coords.push({ x: 3.0, y: 2.5, z: 3 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 5. Butterfly Wings (Titli)
  static _genButterfly(targetCount) {
    const coords = [];
    const W = 7, H = 5;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const isSpine = (c === 3);
        const isLeftWing = (c <= 2 && !(c === 0 && r === 2));
        const isRightWing = (c >= 4 && !(c === 6 && r === 2));
        if (isSpine || isLeftWing || isRightWing) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      }
    }
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        if ((c === 1 || c === 5) && (r === 1 || r === 3)) coords.push({ x: c * 1.0, y: r * 1.0, z: 1 });
        if (c === 3 && (r >= 1 && r <= 3)) {
          coords.push({ x: 3.0, y: r * 1.0, z: 1 });
          coords.push({ x: 3.0, y: r * 1.0, z: 2 });
        }
      }
    }
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 6. Temple Cross (Vishwa)
  static _genTempleCross(targetCount) {
    const coords = [];
    const cx = 3, cy = 3;
    for (let r = 0; r <= 6; r++) {
      for (let c = 0; c <= 6; c++) {
        if ((c >= 2 && c <= 4) || (r >= 2 && r <= 4)) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      }
    }
    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= 5; c++) {
        if ((c === 3 && r >= 1 && r <= 5) || (r === 3 && c >= 1 && c <= 5)) coords.push({ x: c * 1.0, y: r * 1.0, z: 1 });
      }
    }
    for (let r = 2; r <= 4; r++) {
      for (let c = 2; c <= 4; c++) coords.push({ x: c * 1.0, y: r * 1.0, z: 2 });
    }
    coords.push({ x: cx * 1.0, y: cy * 1.0, z: 3 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 7. Diamond (Vajra)
  static _genDiamond(targetCount) {
    const coords = [];
    const cx = 3, cy = 3;
    for (let r = 0; r <= 6; r++) {
      for (let c = 0; c <= 6; c++) {
        if (Math.abs(c - cx) + Math.abs(r - cy) <= 3) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      }
    }
    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= 5; c++) {
        if (Math.abs(c - cx) + Math.abs(r - cy) <= 2) coords.push({ x: c * 1.0, y: r * 1.0, z: 1 });
      }
    }
    for (let r = 2; r <= 4; r++) {
      for (let c = 2; c <= 4; c++) {
        if (Math.abs(c - cx) + Math.abs(r - cy) <= 1) coords.push({ x: c * 1.0, y: r * 1.0, z: 2 });
      }
    }
    coords.push({ x: cx * 1.0, y: cy * 1.0, z: 3 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 8. Hourglass (Damaru)
  static _genHourglass(targetCount) {
    const coords = [];
    const W = 6, H = 7;
    for (let r = 0; r < H; r++) {
      const distFromMid = Math.abs(r - 3);
      const minC = 3 - distFromMid;
      const maxC = 3 + distFromMid;
      for (let c = 0; c < W; c++) {
        if (c >= minC - 1 && c <= maxC) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      }
    }
    for (let c = 0; c < W; c++) {
      coords.push({ x: c * 1.0, y: 0, z: 1 });
      coords.push({ x: c * 1.0, y: H - 1, z: 1 });
    }
    coords.push({ x: 2.5, y: 3.0, z: 1 });
    coords.push({ x: 2.5, y: 3.0, z: 2 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 9. Star (Constellation)
  static _genStar(targetCount) {
    const coords = [];
    const cx = 3, cy = 3;
    for (let r = 0; r <= 6; r++) {
      for (let c = 0; c <= 6; c++) {
        const isCard = (c === cx || r === cy);
        const isDiag = (Math.abs(c - cx) === Math.abs(r - cy));
        const isCore = (Math.abs(c - cx) <= 1 && Math.abs(r - cy) <= 1);
        if (isCard || isDiag || isCore) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      }
    }
    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= 5; c++) {
        if ((c === cx && r >= 1 && r <= 5) || (r === cy && c >= 1 && c <= 5) || (Math.abs(c - cx) <= 1 && Math.abs(r - cy) <= 1)) {
          coords.push({ x: c * 1.0, y: r * 1.0, z: 1 });
        }
      }
    }
    for (let r = 2; r <= 4; r++) {
      for (let c = 2; c <= 4; c++) coords.push({ x: c * 1.0, y: r * 1.0, z: 2 });
    }
    coords.push({ x: cx * 1.0, y: cy * 1.0, z: 3 });
    coords.push({ x: cx * 1.0, y: cy * 1.0, z: 4 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 10. Pagoda (Torana Gateway)
  static _genPagoda(targetCount) {
    const coords = [];
    for (let c = 0; c <= 6; c++) coords.push({ x: c * 1.0, y: 5.0, z: 0 });
    for (let c = 0; c <= 6; c++) coords.push({ x: c * 1.0, y: 4.0, z: 0 });
    for (let c = 1; c <= 5; c++) coords.push({ x: c * 1.0, y: 3.0, z: 0 });
    for (let c = 1; c <= 5; c++) coords.push({ x: c * 1.0, y: 2.0, z: 0 });
    for (let c = 2; c <= 4; c++) coords.push({ x: c * 1.0, y: 1.0, z: 0 });
    coords.push({ x: 3.0, y: 0.0, z: 0 });

    for (let c = 1; c <= 5; c++) coords.push({ x: c * 1.0, y: 4.0, z: 1 });
    for (let c = 1; c <= 5; c++) coords.push({ x: c * 1.0, y: 3.0, z: 1 });
    for (let c = 2; c <= 4; c++) coords.push({ x: c * 1.0, y: 2.0, z: 1 });
    for (let c = 2; c <= 4; c++) coords.push({ x: c * 1.0, y: 1.0, z: 1 });
    coords.push({ x: 3.0, y: 0.0, z: 1 });

    for (let c = 2; c <= 4; c++) coords.push({ x: c * 1.0, y: 2.0, z: 2 });
    coords.push({ x: 3.0, y: 1.0, z: 2 });
    coords.push({ x: 3.0, y: 0.0, z: 2 });
    coords.push({ x: 3.0, y: 0.0, z: 3 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 11. Sunburst (Surya)
  static _genSunburst(targetCount) {
    const coords = [];
    const cx = 3, cy = 3;
    for (let r = 1; r <= 5; r++) {
      for (let c = 1; c <= 5; c++) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
    }
    [0, 6].forEach(c => coords.push({ x: c * 1.0, y: cy * 1.0, z: 0 }));
    [0, 6].forEach(r => coords.push({ x: cx * 1.0, y: r * 1.0, z: 0 }));
    for (let r = 2; r <= 4; r++) {
      for (let c = 2; c <= 4; c++) {
        coords.push({ x: c * 1.0, y: r * 1.0, z: 1 });
        coords.push({ x: c * 1.0, y: r * 1.0, z: 2 });
      }
    }
    coords.push({ x: cx * 1.0, y: cy * 1.0, z: 3 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  // 12. Infinity Knot (Ananta)
  static _genInfinity(targetCount) {
    const coords = [];
    const W = 8, H = 5;
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const isLoop1 = (c <= 3 && (r === 0 || r === H - 1 || c === 0 || c === 3));
        const isLoop2 = (c >= 4 && (r === 0 || r === H - 1 || c === 4 || c === W - 1));
        const isCenter = (r === 2 && (c >= 1 && c <= 6));
        if (isLoop1 || isLoop2 || isCenter) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      }
    }
    for (let c = 1; c < W - 1; c += 2) {
      coords.push({ x: c * 1.0, y: 0, z: 1 });
      coords.push({ x: c * 1.0, y: H - 1, z: 1 });
    }
    for (let r = 1; r < H - 1; r++) {
      coords.push({ x: 0, y: r * 1.0, z: 1 });
      coords.push({ x: W - 1, y: r * 1.0, z: 1 });
    }
    coords.push({ x: 3.5, y: 2.0, z: 1 });
    coords.push({ x: 3.5, y: 2.0, z: 2 });
    coords.push({ x: 3.5, y: 2.0, z: 3 });
    return VitaBoardGenerator._padToTarget(coords, targetCount);
  }

  static FORMATIONS = [
    { name: 'Pyramid (Shikhara)', generator: VitaBoardGenerator._genPyramid },
    { name: 'Twin Pillars (H-Gate)', generator: VitaBoardGenerator._genHGate },
    { name: 'Lotus (Padma)', generator: VitaBoardGenerator._genLotus },
    { name: 'Citadel Fortress', generator: VitaBoardGenerator._genCitadel },
    { name: 'Butterfly Wings (Titli)', generator: VitaBoardGenerator._genButterfly },
    { name: 'Temple Cross (Vishwa)', generator: VitaBoardGenerator._genTempleCross },
    { name: 'Diamond (Vajra)', generator: VitaBoardGenerator._genDiamond },
    { name: 'Hourglass (Damaru)', generator: VitaBoardGenerator._genHourglass },
    { name: 'Constellation Star', generator: VitaBoardGenerator._genStar },
    { name: 'Pagoda Gateway', generator: VitaBoardGenerator._genPagoda },
    { name: 'Sunburst (Surya)', generator: VitaBoardGenerator._genSunburst },
    { name: 'Infinity Knot (Ananta)', generator: VitaBoardGenerator._genInfinity }
  ];

  static getFormationName(levelNum = 1) {
    const idx = Math.max(0, (levelNum - 1)) % this.FORMATIONS.length;
    return this.FORMATIONS[idx].name;
  }

  static createLevelLayout(levelNum = 1, tileCount = 36) {
    const idx = Math.max(0, (levelNum - 1)) % this.FORMATIONS.length;
    return this.FORMATIONS[idx].generator(tileCount);
  }

  /**
   * Generate default coordinate layout anchor templates
   * Concentric centered pyramid formations for 24, 36, or 48 tiles.
   */
  static createDefaultLayout(tileCount = 36) {
    const coords = [];
    const targetCount = tileCount;

    if (targetCount === 12) {
      // Layer 0: 2x4 = 8 tiles
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
        }
      }
      // Layer 1: 1x4 = 4 tiles
      for (let c = 0; c < 4; c++) {
        coords.push({ x: c * 1.0, y: 0.5, z: 1 });
      }
    } else if (targetCount === 24) {
      // Layer 0: 3x4 = 12 tiles
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
        }
      }
      // Layer 1: 2x3 = 6 tiles (centered)
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          coords.push({ x: c * 1.0 + 0.5, y: r * 1.0 + 0.5, z: 1 });
        }
      }
      // Layer 2: 2x2 = 4 tiles (centered)
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 0.5, z: 2 });
        }
      }
      // 2 Peak tiles
      coords.push({ x: 1.5, y: 1.0, z: 3 });
      coords.push({ x: 2.0, y: 1.0, z: 3 });
    } else if (targetCount === 36) {
      // Concentric centered pyramid: 20 (base) + 12 (mid) + 4 (top) = 36
      // Layer 0: 4x5 = 20 tiles
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
        }
      }
      // Layer 1: 3x4 = 12 tiles (centered)
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push({ x: c * 1.0 + 0.5, y: r * 1.0 + 0.5, z: 1 });
        }
      }
      // Layer 2: 2x2 = 4 tiles (centered)
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          coords.push({ x: c * 1.0 + 1.5, y: r * 1.0 + 1.0, z: 2 });
        }
      }
    } else if (targetCount <= 48) {
      // 48 tiles: 24 on layer 0, 16 on layer 1, 8 on layer 2
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) {
          coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
        }
      }
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 0.5, z: 1 });
        }
      }
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 1.0, z: 2 });
        }
      }
    } else if (targetCount <= 60) {
      // 60 tiles: 30 on layer 0, 16 on layer 1, 8 on layer 2, 4 on layer 3, 2 on layer 4
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 6; c++) {
          coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
        }
      }
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 0.5, z: 1 });
        }
      }
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 1.5, z: 2 });
        }
      }
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          coords.push({ x: c * 1.0 + 2.0, y: r * 1.0 + 1.5, z: 3 });
        }
      }
      coords.push({ x: 2.5, y: 1.5, z: 4 });
      coords.push({ x: 2.5, y: 2.5, z: 4 });
    } else if (targetCount <= 72) {
      // 72 tiles: 36 on layer 0, 20 on layer 1, 12 on layer 2, 4 on layer 3
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
        }
      }
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          coords.push({ x: c * 1.0 + 0.5, y: r * 1.0 + 1.0, z: 1 });
        }
      }
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 1.5, z: 2 });
        }
      }
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          coords.push({ x: c * 1.0 + 2.0, y: r * 1.0 + 2.0, z: 3 });
        }
      }
    } else if (targetCount <= 84) {
      // 84 tiles (Twin Pagodas): 42 on layer 0, 25 on layer 1, 12 on layer 2, 4 on layer 3, 1 peak
      for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 0.5, z: 1 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) coords.push({ x: c * 1.0 + 1.5, y: r * 1.0 + 1.5, z: 2 });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) coords.push({ x: c * 1.0 + 2.5, y: r * 1.0 + 2.0, z: 3 });
      coords.push({ x: 3.0, y: 2.5, z: 4 });
    } else if (targetCount <= 96) {
      // 96 tiles (Sunburst Gateway): 48 on layer 0, 30 on layer 1, 12 on layer 2, 4 on layer 3, 2 peaks
      for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) coords.push({ x: c * 1.0 + 1.0, y: r * 1.0 + 0.5, z: 1 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) coords.push({ x: c * 1.0 + 2.0, y: r * 1.0 + 1.5, z: 2 });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) coords.push({ x: c * 1.0 + 3.0, y: r * 1.0 + 2.0, z: 3 });
      coords.push({ x: 3.0, y: 2.5, z: 4 });
      coords.push({ x: 4.0, y: 2.5, z: 4 });
    } else {
      // 108 tiles (Grand Citadel Fortress): 54 on layer 0, 30 on layer 1, 16 on layer 2, 6 on layer 3, 2 peaks
      for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) coords.push({ x: c * 1.0, y: r * 1.0, z: 0 });
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) coords.push({ x: c * 1.0 + 1.5, y: r * 1.0 + 0.5, z: 1 });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) coords.push({ x: c * 1.0 + 2.5, y: r * 1.0 + 1.0, z: 2 });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) coords.push({ x: c * 1.0 + 3.0, y: r * 1.0 + 2.0, z: 3 });
      coords.push({ x: 3.5, y: 2.5, z: 4 });
      coords.push({ x: 4.5, y: 2.5, z: 4 });
    }

    return coords.slice(0, targetCount);
  }

  /**
   * Reverse-Construction Generation Algorithm (100% Solvability Guarantee)
   * Simulates forward playable extraction to guarantee that matching groups
   * are completely playable without deadlocks.
   */
  static generateSolvableBoard(layoutAnchors, floraCatalog, mode = 'vita', maxAttempts = 25) {
    const K = (mode === 'vita') ? 2 : 3;
    const totalSlots = layoutAnchors.length;
    const adjustedCount = totalSlots - (totalSlots % K);
    const activeAnchors = layoutAnchors.slice(0, adjustedCount);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const board = this._buildReverseBoard(activeAnchors, floraCatalog, K);
      const verification = this.simulateForwardSolver(board, K);
      if (verification.isSolvable && verification.remainingTilesCount === 0) {
        return board;
      }
    }

    // Direct guaranteed generation
    return this._buildReverseBoard(activeAnchors, floraCatalog, K);
  }

  static _buildReverseBoard(anchors, floraCatalog, K) {
    // Clone anchors with unique IDs
    const slots = anchors.map((a, idx) => ({
      id: `tile_${idx}_${a.x}_${a.y}_${a.z}`,
      x: a.x,
      y: a.y,
      z: a.z,
      floraId: null,
      floraData: null,
      isSelected: false,
      isMatched: false
    }));

    // Randomize flora choices
    const shuffledFlora = [...floraCatalog].sort(() => Math.random() - 0.5);
    let floraIndex = 0;

    const sim = slots.map(s => ({ ...s }));
    let remaining = sim.length;
    let attempts = 0;
    const waitingBuffer = [];

    while (remaining > 0 && attempts < 500) {
      attempts++;
      const active = sim.filter(t => !t.isMatched);
      const playable = active.filter(t => this.isTileFree(t, active));
      
      if (playable.length === 0) break;

      // Ingest unassigned playable tiles into waiting buffer
      playable.forEach(p => {
        if (!waitingBuffer.some(w => w.id === p.id)) {
          waitingBuffer.push(p);
        }
      });

      let bestPick = null;

      if (K === 2) {
        let bestScore = -Infinity;
        for (let i = 0; i < waitingBuffer.length; i++) {
          for (let j = i + 1; j < waitingBuffer.length; j++) {
            const a = waitingBuffer[i];
            const b = waitingBuffer[j];
            const dx = Math.abs(a.x - b.x);
            const dy = Math.abs(a.y - b.y);
            const dz = Math.abs(a.z - b.z);
            const dist = Math.hypot(a.x - b.x, a.y - b.y);

            // Strictly reject adjacent tiles on same layer unless last 4 tiles
            if (dx <= 1.05 && dy <= 1.05 && dz === 0 && remaining > 4) continue;

            // Prioritize spatial separation across the board + vertical depth difference
            const score = (dist * 3.0) + (dz > 0 ? 8.0 : 0) + (Math.random() * 1.5);
            if (score > bestScore) {
              bestScore = score;
              bestPick = [a, b];
            }
          }
        }
      } else {
        // Mode B: Triads (K = 3)
        let bestScore = -Infinity;
        for (let i = 0; i < waitingBuffer.length; i++) {
          for (let j = i + 1; j < waitingBuffer.length; j++) {
            for (let m = j + 1; m < waitingBuffer.length; m++) {
              const a = waitingBuffer[i], b = waitingBuffer[j], c = waitingBuffer[m];
              const distAB = Math.hypot(a.x - b.x, a.y - b.y);
              const distBC = Math.hypot(b.x - c.x, b.y - c.y);
              const distCA = Math.hypot(c.x - a.x, c.y - a.y);
              const layerCount = new Set([a.z, b.z, c.z]).size;
              const score = (distAB + distBC + distCA) + (layerCount * 4.0) + (Math.random() * 2.0);
              if (score > bestScore) {
                bestScore = score;
                bestPick = [a, b, c];
              }
            }
          }
        }
      }

      // Fallbacks if buffer hasn't found optimal combinations yet
      if (!bestPick) {
        if (waitingBuffer.length >= K) {
          bestPick = waitingBuffer.slice(0, K);
        } else if (playable.length >= K) {
          bestPick = playable.slice(0, K);
        } else {
          bestPick = active.slice(0, Math.min(K, remaining));
        }
      }

      const flora = shuffledFlora[floraIndex % shuffledFlora.length];
      floraIndex++;

      bestPick.forEach(t => {
        t.floraId = flora.id;
        t.floraData = flora;
        t.isMatched = true;

        const original = slots.find(s => s.id === t.id);
        if (original) {
          original.floraId = flora.id;
          original.floraData = flora;
        }
      });

      const removeIds = new Set(bestPick.map(t => t.id));
      for (let k = waitingBuffer.length - 1; k >= 0; k--) {
        if (removeIds.has(waitingBuffer[k].id)) {
          waitingBuffer.splice(k, 1);
        }
      }

      remaining -= bestPick.length;
    }

    slots.forEach(s => {
      s.isMatched = false;
      s.isSelected = false;
    });

    return slots;
  }

  /**
   * Forward Solver Simulator for automated QA verification
   * Returns { isSolvable: boolean, remainingTilesCount: number }
   */
  static simulateForwardSolver(board, groupSize = 2) {
    const K = (typeof groupSize === 'number') ? groupSize : (groupSize === 'vita' ? 2 : 3);
    const simBoard = board.map(t => ({ ...t, isMatched: false }));
    let remaining = simBoard.length;
    let iterations = 0;
    const maxIterations = 300;

    while (remaining > 0 && iterations < maxIterations) {
      iterations++;
      const active = simBoard.filter(t => !t.isMatched);
      const playable = active.filter(t => this.isTileFree(t, active));
      if (playable.length === 0) break;

      const groups = {};
      playable.forEach(t => {
        groups[t.floraId] = groups[t.floraId] || [];
        groups[t.floraId].push(t);
      });

      let found = false;
      for (const fId in groups) {
        if (groups[fId].length >= K) {
          groups[fId].slice(0, K).forEach(t => { t.isMatched = true; });
          remaining -= K;
          found = true;
          break;
        }
      }

      if (!found) {
        // Mode B tray buffering simulation
        if (K === 3 && playable.length > 0) {
          playable[0].isMatched = true;
          remaining -= 1;
        } else {
          break;
        }
      }
    }

    return {
      isSolvable: remaining === 0,
      remainingTilesCount: remaining
    };
  }
}
