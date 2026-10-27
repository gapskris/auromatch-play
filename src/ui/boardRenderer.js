// 2.5D Isometric Board Renderer for AuroMatch

// Supports Standard ($68 x 88px) and Senior View ($85 x 110px) sizing

// Isometric Layer Offsets: dx = -2px, dy = -3px per layer

// High-contrast, WCAG AAA compliant styling and visual lock indicators



import { VitaBoardGenerator } from '../models/boardGenerator.js';

import { floraCatalog, getFloraById } from '../models/floraDatabase.js';



export class BoardRenderer {

  constructor(boardContainerId, options = {}) {

    this.container = (typeof document !== 'undefined' && boardContainerId) ? document.getElementById(boardContainerId) : null;

    let actualOptions = options;

    if (Array.isArray(options)) {

      this.tiles = options;

      actualOptions = arguments[2] || {};

    } else {

      this.tiles = [];

    }

    this.options = {

      seniorView: false,

      gameplayMode: 'vita', // 'vita' | 'tile_club'

      onTileClick: null,

      ...actualOptions

    };

    this.stageLayoutMetrics = null;

  }



  setSeniorView(enabled) {

    this.options.seniorView = !!enabled;

    this.stageLayoutMetrics = null;

    this.render();

  }



  setGameplayMode(mode) {

    this.options.gameplayMode = mode;

    this.stageLayoutMetrics = null;

    this.render();

  }



  setActiveArchetype(archetype) {

    this.options.activeArchetype = archetype || null;

    this.render();

  }



  setTiles(tiles) {

    this.tiles = tiles || [];

    this.stageLayoutMetrics = null;

    // rAF defer: let CSS finish painting so clientWidth/clientHeight are real values

    if (typeof requestAnimationFrame !== 'undefined') {

      requestAnimationFrame(() => { this.render(); });

    } else {

      this.render();

    }

  }



  getTileDimensions(containerWidth = null) {

    if (this.options.seniorView) {

      if (containerWidth && containerWidth < 460) {

        const w = Math.max(52, Math.min(85, Math.floor(containerWidth / 5.2)));

        const h = Math.round(w * 1.29);

        return { width: w, height: h, fontSize: Math.max(12, Math.round(w * 0.17)), iconSize: Math.max(26, Math.round(w * 0.54)) };

      }

      return { width: 85, height: 110, fontSize: 13, iconSize: 48 };

    }

    if (containerWidth && containerWidth < 460) {

      const w = Math.max(44, Math.min(68, Math.floor(containerWidth / 5.5)));

      const h = Math.round(w * 1.29);

      return { width: w, height: h, fontSize: Math.max(10, Math.round(w * 0.16)), iconSize: Math.max(22, Math.round(w * 0.54)) };

    }

    return { width: 68, height: 88, fontSize: 11, iconSize: 42 };

  }



  computeStageMetrics(containerW, containerH) {

    const isRealmsMode = (this.options.gameplayMode === 'realms');
    const isArtThemeMode = (this.options.gameplayMode === 'realms' || this.options.gameplayMode === 'botanical');

    const isTileClubMode = (this.options.gameplayMode === 'tile_club');

    const isSenior = !!this.options.seniorView;

    const isMobile = containerW < 480;

    const isTablet = containerW >= 480 && containerW < 1024;



    // 1. Compute bounding coordinate bounds from the FULL permanent stage layout (this.tiles)

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxZ = 0;

    const allStageTiles = (this.tiles && this.tiles.length > 0) ? this.tiles : [];

    if (allStageTiles.length > 0) {

      allStageTiles.forEach(t => {

        if (t.x < minX) minX = t.x;

        if (t.x > maxX) maxX = t.x;

        if (t.y < minY) minY = t.y;

        if (t.y > maxY) maxY = t.y;

        if (t.z > maxZ) maxZ = t.z;

      });

    } else {

      minX = 0; maxX = 5; minY = 0; maxY = 3; maxZ = 0;

    }



    const colSpan = Math.max(1, maxX - minX + 1);

    const rowSpan = Math.max(1, maxY - minY + 1);



    const aspect = 1.125; // 320x360 8:9 ratio unified across all themes

    const spacingFactor = isArtThemeMode ? 0.86 : 0.85;



    // Available board area inside container (leaving slight margin for aesthetic floating)

    const availW = Math.max(260, containerW - 16);

    // Sizing Parity: AvailH is unified across all gameplay modes (Pairs, Tile Club, Classic, Realms)
    // so that switching between categories never causes the tile formation to jump or shrink.
    const promptDeduction = isMobile ? 24 : (isTablet ? 28 : 24);

    const availH = Math.max(160, containerH - promptDeduction - (isMobile ? 0 : 8));



    const colDenominator = 1 + (colSpan - 1) * spacingFactor;

    const rowDenominator = 1 + (rowSpan - 1) * spacingFactor;



    // Target coverage: 96% of width on mobile, 94% on tablet/desktop

    const widthCoverage = isMobile ? 0.96 : 0.94;

    const heightCoverage = isMobile ? 0.92 : 0.91;



    const maxWFromWidth = (availW * widthCoverage) / colDenominator;

    const maxHFromHeight = (availH * heightCoverage) / rowDenominator;

    const maxWFromHeight = maxHFromHeight / aspect;



    // Raw geometric fit to fill container space

    let rawFitW = Math.floor(Math.min(maxWFromWidth, maxWFromHeight));



    // Dynamic width bounds across viewports (Unified parity across Pairs, Tile Club, Classic, Realms)

    let minAllowed, maxAllowed;

    if (isMobile) {

      // Mobile Viewport (< 480px): Unified 72px ceiling ensures identical tile scale between Pairs & Tile Club

      minAllowed = isSenior ? 48 : 42;

      maxAllowed = isSenior ? 84 : (isRealmsMode || this.options.gameplayMode === 'botanical' ? 82 : 72);

    } else if (isTablet) {

      // Tablet Viewport (480px - 1023px): Unified across all modes (~86px-116px)

      minAllowed = isSenior ? 66 : 58;

      maxAllowed = isSenior ? 130 : 116;

    } else {

      // Desktop Viewport (>= 1024px): Full-screen immersive — scales gracefully down on short viewports

      minAllowed = isSenior ? 52 : 42;

      maxAllowed = isSenior ? 130 : 116;

    }



    const targetW = Math.max(minAllowed, Math.min(maxAllowed, rawFitW));

    const width = targetW;

    const height = Math.round(width * aspect);



    // Hero Game Icons and Typography: Scale proportionally with tile width

    const iconRatio = isSenior ? 0.58 : 0.56;

    const fontRatio = isSenior ? 0.17 : 0.155;

    const iconSize = Math.max(24, Math.round(width * iconRatio));

    const fontSize = Math.max(9, Math.round(width * fontRatio));

    const colSpacing = Math.round(width * spacingFactor);

    const rowSpacing = Math.round(height * spacingFactor);

    const boardTotalW = (maxX - minX) * colSpacing + width;

    const boardTotalH = (maxY - minY) * rowSpacing + height;



    // Isometric depth compensation & exact bounding box centering:
    // Tiles have isoDx = -(tile.z * 2.5) and isoDy = -(tile.z * 3.5).
    // Calculate the actual relative pixel bounds of the entire stage including isometric offsets
    let minRelX = 0, maxRelX = (maxX - minX) * colSpacing + width;
    let minRelY = 0, maxRelY = (maxY - minY) * rowSpacing + height;

    if (allStageTiles.length > 0) {
      minRelX = Infinity; maxRelX = -Infinity;
      minRelY = Infinity; maxRelY = -Infinity;
      allStageTiles.forEach(t => {
        const rx = (t.x - minX) * colSpacing - (t.z * 2.5);
        if (rx < minRelX) minRelX = rx;
        if (rx + width > maxRelX) maxRelX = rx + width;
        const ry = (t.y - minY) * rowSpacing - (t.z * 3.5);
        if (ry < minRelY) minRelY = ry;
        if (ry + height > maxRelY) maxRelY = ry + height;
      });
    }

    const actualBoardW = maxRelX - minRelX;
    const actualBoardH = maxRelY - minRelY;

    const minSafeOffsetX = Math.ceil(maxZ * 2.5) + (isMobile ? 6 : 10);
    const minSafeOffsetY = Math.ceil(maxZ * 3.5) + (isMobile ? 14 : 14);

    let offsetX = minSafeOffsetX;
    if (containerW && containerW > actualBoardW) {
      offsetX = Math.max(minSafeOffsetX, Math.floor((containerW - actualBoardW) / 2) - minRelX);
    }

    let offsetY = minSafeOffsetY;
    if (containerH && containerH > actualBoardH) {
      offsetY = Math.max(minSafeOffsetY, Math.floor((containerH - actualBoardH) / 2) - minRelY);
    }

    return {

      minX, maxX, minY, maxY,

      colSpan, rowSpan,

      width, height,

      fontSize, iconSize,

      colSpacing, rowSpacing,

      offsetX, offsetY,

      boardTotalW, boardTotalH,

      containerW, containerH,

      seniorView: this.options.seniorView,

      gameplayMode: this.options.gameplayMode

    };

  }



  render() {

    if (!this.container) return;

    this.container.innerHTML = '';



    // RC1+RC4 fix: measure the PARENT .board-container (not #board which has max-width:980px).

    // Fall back to window dimensions so desktop never returns null/tiny values.

    const _boardParent = this.container ? this.container.parentElement : null;

    const _rawW = (_boardParent && _boardParent.clientWidth > 120)

      ? _boardParent.clientWidth

      : (this.container && this.container.clientWidth > 120 ? this.container.clientWidth : 0);

    const containerW = _rawW > 120

      ? _rawW

      : (typeof window !== 'undefined' ? window.innerWidth : 1280);



    const isMobile = containerW < 480;
    const isTablet = containerW >= 480 && containerW < 1024;
    const isTileClub = (this.options.gameplayMode === 'tile_club');

    const _minHThresh = isMobile ? 120 : 160;
    const _rawH = (this.container && this.container.clientHeight > _minHThresh)
      ? this.container.clientHeight
      : ((_boardParent && _boardParent.clientHeight > _minHThresh)
        ? _boardParent.clientHeight
        : 0);

    let containerH;
    if (_rawH > _minHThresh) {
      containerH = _rawH;
    } else {
      const _stageCol = (typeof document !== 'undefined') ? document.getElementById('center-stage-col') : null;
      const _stageH = (_stageCol && _stageCol.clientHeight > 200) ? _stageCol.clientHeight : 0;
      if (_stageH > 200) {
        const uiReserve = isMobile ? (isTileClub ? 142 : 78) : (isTileClub ? 144 : 72);
        containerH = Math.max(180, _stageH - uiReserve);
      } else {
        containerH = typeof window !== 'undefined' ? Math.floor(window.innerHeight * (isMobile ? 0.58 : 0.70)) : 600;
      }
    }



    if (containerW && containerW > 100) {

      if (!this.stageLayoutMetrics ||

          this.stageLayoutMetrics.containerW !== containerW ||

          this.stageLayoutMetrics.containerH !== containerH ||

          this.stageLayoutMetrics.seniorView !== this.options.seniorView ||

          this.stageLayoutMetrics.gameplayMode !== this.options.gameplayMode) {

        this.stageLayoutMetrics = this.computeStageMetrics(containerW, containerH);

      }

    }



    const metrics = this.stageLayoutMetrics || {

      ...this.getTileDimensions(),

      minX: 0, maxX: 5, minY: 0, maxY: 3,

      colSpacing: 58, rowSpacing: 75,

      offsetX: 10, offsetY: 12

    };



    const {

      minX, minY,

      width, height,

      fontSize, iconSize,

      colSpacing, rowSpacing,

      offsetX, offsetY

    } = metrics;



    const activeTiles = this.tiles.filter(t => !t.isMatched);



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



      // Isometric depth offset: dx = -2.5px, dy = -3.5px per layer for rich 3D stacking

      const isoDx = -(tile.z * 2.5);

      const isoDy = -(tile.z * 3.5);



      const posX = offsetX + (tile.x - minX) * colSpacing + isoDx;

      const posY = offsetY + (tile.y - minY) * rowSpacing + isoDy;



      // Flora details & Archetype

      const flora = tile.floraData || getFloraById(tile.floraId);

      const arch = this.options.activeArchetype || tile.archetype || flora.archetype || 'ivory';

      const ribbonColor = domainRibbons[flora.domain] || '#c5a880';



      const el = document.createElement('div');

      el.className = `tile-element archetype-${arch} ${isFree ? 'tile-free' : 'tile-blocked'} ${isSelected ? 'tile-selected' : ''}`;

      if (this.options.seniorView) el.classList.add('senior-tile');



      el.id = tile.id;

      el.dataset.id = tile.id;

      el.dataset.archetype = arch;

      el.dataset.z = `${tile.z}`;

      el.style.width = `${width}px`;

      el.style.height = `${height}px`;

      el.style.left = `${posX}px`;

      el.style.top = `${posY}px`;

      el.style.zIndex = `${tile.z * 10 + 10}`;



      const bonusBadge = (arch === 'golden_relic') ? '<div class="tile-spark-badge">✨+10</div>' : '';



      const tileName = tile.thematicName || (flora && flora.customName) || (flora && flora.commonName) || 'Tile';
      const domainInfo = (flora && flora.domain) ? ` (${flora.domain})` : '';
      el.title = isFree ? `${tileName}${domainInfo}` : `${tileName} (Blocked: clear covering tiles)`;



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



      const isRealmsMode = (this.options.gameplayMode === 'realms');

      const isArtThemeMode = (this.options.gameplayMode === 'realms' || this.options.gameplayMode === 'botanical');
      const customImg = tile.customImage || (flora && flora.customImage) || null;



      if (customImg) {

        el.classList.add('tile-authentic-art');

        const tileName = tile.thematicName || (flora && flora.customName) || (flora && flora.commonName) || 'Tile';

        const tileSym = tile.thematicSymbol || (flora && flora.customSymbol) || (flora && flora.symbol) || '✨';

        el.innerHTML = `

          <div class="tile-face tile-art-face">

            <img class="tile-art-img" src="${customImg}" alt="${tileName}" draggable="false" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />

            <div class="tile-art-fallback" style="display: none; width: 100%; height: 100%; flex-direction: column; align-items: center; justify-content: center; background: #1e293b; border: 2px solid #fbbf24; border-radius: 12px; color: #fff; text-align: center; padding: 4px;">

              <span style="font-size: ${iconSize}px;">${tileSym}</span>

              <span style="font-size: ${dynFontSize}px; font-weight: 700; margin-top: 2px;">${tileName}</span>

            </div>

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

