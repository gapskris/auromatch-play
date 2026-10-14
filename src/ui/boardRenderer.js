// 2.5D Isometric Board Renderer for AuroMatch
// Supports Standard ($68 x 88px) and Senior View ($85 x 110px) sizing
// Isometric Layer Offsets: dx = -2px, dy = -3px per layer
// High-contrast, WCAG AAA compliant styling and visual lock indicators

import { VitaBoardGenerator } from '../models/boardGenerator.js';
import { floraCatalog, getFloraById } from '../models/floraDatabase.js';

export class BoardRenderer {
  constructor(boardContainerId, options = {}) {
    this.container = document.getElementById(boardContainerId);
    this.options = {
      seniorView: false,
      gameplayMode: 'vita', // 'vita' | 'tile_club'
      onTileClick: null,
      ...options
    };
    this.tiles = [];
  }

  setSeniorView(enabled) {
    this.options.seniorView = !!enabled;
    this.render();
  }

  setGameplayMode(mode) {
    this.options.gameplayMode = mode;
    this.render();
  }

  setActiveArchetype(archetype) {
    this.options.activeArchetype = archetype || null;
    this.render();
  }

  setTiles(tiles) {
    this.tiles = tiles || [];
    this.render();
  }

  getTileDimensions(containerWidth = null) {
    if (this.options.seniorView) {
      if (containerWidth && containerWidth < 460) {
        const w = Math.max(52, Math.min(85, Math.floor(containerWidth / 5.2)));
        const h = Math.round(w * 1.29);
        return { width: w, height: h, fontSize: Math.max(12, Math.round(w * 0.19)), iconSize: Math.max(20, Math.round(w * 0.33)) };
      }
      return { width: 85, height: 110, fontSize: 16, iconSize: 28 };
    }
    if (containerWidth && containerWidth < 460) {
      const w = Math.max(44, Math.min(68, Math.floor(containerWidth / 5.5)));
      const h = Math.round(w * 1.29);
      return { width: w, height: h, fontSize: Math.max(10, Math.round(w * 0.19)), iconSize: Math.max(16, Math.round(w * 0.32)) };
    }
    return { width: 68, height: 88, fontSize: 13, iconSize: 22 };
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    const containerW = (this.container && this.container.clientWidth > 100)
      ? this.container.clientWidth
      : (typeof window !== 'undefined' && window.innerWidth < 768 ? window.innerWidth - 24 : null);

    const { width, height, fontSize, iconSize } = this.getTileDimensions(containerW);
    const activeTiles = this.tiles.filter(t => !t.isMatched);

    // Compute bounding coordinate bounds for dynamic centering
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    if (activeTiles.length > 0) {
      activeTiles.forEach(t => {
        if (t.x < minX) minX = t.x;
        if (t.x > maxX) maxX = t.x;
        if (t.y < minY) minY = t.y;
        if (t.y > maxY) maxY = t.y;
      });
    } else {
      minX = 0; maxX = 5; minY = 0; maxY = 3;
    }

    const colSpacing = width * 0.85;
    const rowSpacing = height * 0.85;
    const boardTotalW = (maxX - minX + 1) * colSpacing;
    const boardTotalH = (maxY - minY + 1) * rowSpacing;

    let offsetX = 20;
    if (this.container && this.container.clientWidth > boardTotalW) {
      offsetX = Math.max(10, Math.floor((this.container.clientWidth - boardTotalW) / 2));
    }
    let offsetY = 20;
    if (this.container && this.container.clientHeight > boardTotalH) {
      offsetY = Math.max(15, Math.floor((this.container.clientHeight - boardTotalH) / 2));
    }

    const domainRibbons = {
      'Fauna & Wildlife': '#15803d',
      'Flora & Ecology': '#16a34a',
      'Cosmos & Astronomy': '#4f46e5',
      'Earth & Geology': '#b45309',
      'Mind & Science': '#0284c7',
      'Arts & Culture': '#e11d48',
      'Character & Will': '#d97706',
      'Heart, Empathy & Peace': '#ec4899',
      'Wisdom & Integral Yoga': '#9333ea'
    };

    activeTiles.forEach(tile => {
      const isFree = VitaBoardGenerator.isTileFree(tile, activeTiles);
      const isSelected = !!tile.isSelected;

      // Isometric depth offset: dx = -2px, dy = -3px per layer
      const isoDx = -(tile.z * 2);
      const isoDy = -(tile.z * 3);

      const posX = offsetX + (tile.x - minX) * colSpacing + isoDx;
      const posY = offsetY + (tile.y - minY) * rowSpacing + isoDy;

      // Flora details & Archetype
      const flora = tile.floraData || getFloraById(tile.floraId);
      const arch = this.options.activeArchetype || flora.archetype || 'ivory';
      const ribbonColor = domainRibbons[flora.domain] || '#c5a880';

      const el = document.createElement('div');
      el.className = `tile-element archetype-${arch} ${isFree ? 'tile-free' : 'tile-blocked'} ${isSelected ? 'tile-selected' : ''}`;
      if (this.options.seniorView) el.classList.add('senior-tile');

      el.id = tile.id;
      el.dataset.id = tile.id;
      el.dataset.archetype = arch;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.left = `${posX}px`;
      el.style.top = `${posY}px`;
      el.style.zIndex = `${tile.z * 10 + 10}`;

      const bonusBadge = (arch === 'golden_relic') ? '<div class="tile-spark-badge">✨+10</div>' : '';

      el.title = isFree ? `${flora.commonName} (${flora.domain})` : `${flora.commonName} (Blocked: clear covering tiles)`;

      // Hybrid Typography Engine: Dynamic font-clamp & soft 2-line balancing
      const nameLen = (flora.commonName || '').length;
      let dynFontSize = fontSize;
      let dynLineHeight = '1.08';
      if (nameLen <= 5) {
        dynFontSize = fontSize;
        dynLineHeight = '1.1';
      } else if (nameLen <= 8) {
        dynFontSize = Math.max(9.5, Math.round(fontSize * 0.88 * 10) / 10);
        dynLineHeight = '1.05';
      } else if (nameLen <= 11) {
        dynFontSize = Math.max(8.5, Math.round(fontSize * 0.78 * 10) / 10);
        dynLineHeight = '1.02';
      } else {
        dynFontSize = Math.max(8.0, Math.round(fontSize * 0.72 * 10) / 10);
        dynLineHeight = '0.98';
      }

      const customImg = tile.customImage || (flora && flora.customImage) || null;

      if (customImg) {
        el.classList.add('tile-authentic-art');
        el.innerHTML = `
          <div class="tile-face tile-art-face" style="background-image: url('${customImg}');">
            <div class="tile-art-glow"></div>
            ${bonusBadge}
          </div>
        `;
      } else {
        el.innerHTML = `
          <div class="tile-face">
            <div class="tile-category-ribbon" style="background: ${ribbonColor};"></div>
            ${bonusBadge}
            <div class="tile-icon" style="font-size: ${iconSize}px;">${flora.symbol || '🪷'}</div>
            <div class="tile-label-banner">
              <div class="tile-label" style="font-size: ${dynFontSize}px; line-height: ${dynLineHeight};">${flora.commonName}</div>
            </div>
          </div>
        `;
      }

      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (this.options.onTileClick) {
          this.options.onTileClick(tile, isFree, e);
        }
      });

      this.container.appendChild(el);
    });
  }

  highlightTiles(tileIds = []) {
    const ids = new Set(tileIds);
    const elements = this.container.querySelectorAll('.tile-element');
    elements.forEach(el => {
      if (ids.has(el.dataset.id)) {
        el.classList.add('tile-hint-aura');
      } else {
        el.classList.remove('tile-hint-aura');
      }
    });
  }

  clearHighlights() {
    const elements = this.container.querySelectorAll('.tile-element');
    elements.forEach(el => el.classList.remove('tile-hint-aura'));
  }
}

export function reshuffleBoard() {
  if (typeof window !== 'undefined' && window.gameManager) {
    window.gameManager.restartStage();
  }
}

export function renderBoard(boardId, statusId, onComplete) {
  if (typeof window !== 'undefined' && window.gameManager) {
    window.gameManager.boardRenderer?.render();
  }
}
