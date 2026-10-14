// ThemeManager: Manages the 13 Secular Realms Campaign (403 Total Levels)
// Coordinates background wallpapers, authentic graphic tile skins, CSS tile material archetypes, and audio presets.

export const TOTAL_REALM_LEVELS = 403; // 13 Themes * 31 Levels (16 Standard + 15 Master Authentic Art)
export const LEVELS_PER_REALM = 31;
export const STANDARD_LEVELS_PER_REALM = 16;
export const MASTER_LEVELS_PER_REALM = 15;

export const REALMS = [
  {
    id: 'whispering_pines',
    chapter: 1,
    name: 'Whispering Pines',
    subtitle: 'Woodland Bark & Emerald Veins',
    bgImage: './Assets/backgrounds/whispering_pines_clean.png',
    originalBgImage: './Assets/backgrounds/whispering_pines.png',
    archetype: 'bark_leaf',
    audioPreset: 'forest',
    levelStart: 1,
    levelEnd: 31,
    masterLevelStart: 1,
    classicLevelStart: 16,
    icon: '🌲',
    customTiles: [
      { name: 'Emerald Leaf', image: './Assets/themes/whispering_pines/tile_leaf.png', symbol: '🍃' },
      { name: 'Woodland Bark', image: './Assets/themes/whispering_pines/tile_bark.png', symbol: '🪵' }
    ]
  },
  {
    id: 'temple_of_lines',
    chapter: 2,
    name: 'Temple of Lines',
    subtitle: 'Layered Slate & Blueprint Geometry',
    bgImage: './Assets/backgrounds/temple_of_lines_clean.png',
    originalBgImage: './Assets/backgrounds/temple_of_lines.png',
    archetype: 'slate_zen',
    audioPreset: 'zen_stone',
    levelStart: 32,
    levelEnd: 62,
    masterLevelStart: 32,
    classicLevelStart: 47,
    icon: '🏛️',
    customTiles: [
      { name: 'Blueprint Arch', image: './Assets/themes/temple_of_lines/tile_slate_arch.png', symbol: '⛩️' },
      { name: 'Slate Dome', image: './Assets/themes/temple_of_lines/tile_slate_dome.png', symbol: '🏛️' }
    ]
  },
  {
    id: 'biblios_wisdom',
    chapter: 3,
    name: 'Biblios Wisdom',
    subtitle: 'Leather-Bound Tomes & Gilded Edges',
    bgImage: './Assets/backgrounds/biblios_wisdom_clean.png',
    originalBgImage: './Assets/backgrounds/biblios_wisdom.png',
    archetype: 'leather_tome',
    audioPreset: 'parchment',
    levelStart: 63,
    levelEnd: 93,
    masterLevelStart: 63,
    classicLevelStart: 78,
    icon: '📚',
    customTiles: [
      { name: 'Gilded Owl Tome', image: './Assets/themes/biblios_wisdom/tile_book_owl.png', symbol: '🦉' },
      { name: 'Sunburst Tome', image: './Assets/themes/biblios_wisdom/tile_book_sun.png', symbol: '☀️' }
    ]
  },
  {
    id: 'celestial_starlight',
    chapter: 4,
    name: 'Celestial Starlight',
    subtitle: 'Aquamarine Crystal & 24K Gold Bevels',
    bgImage: './Assets/backgrounds/celestial_starlight_clean.png',
    originalBgImage: './Assets/backgrounds/celestial_starlight.jpg',
    archetype: 'cosmic_glass',
    audioPreset: 'crystal_bell',
    levelStart: 94,
    levelEnd: 124,
    masterLevelStart: 94,
    classicLevelStart: 109,
    icon: '✨',
    customTiles: [
      { name: 'Cosmic Rune', image: './Assets/themes/golden_nebula/tile_cosmic_gold.png', symbol: '✨' },
      { name: 'Aquamarine Tablet', image: './Assets/themes/golden_nebula/tile_cosmic_tablet.png', symbol: '💎' }
    ]
  },
  {
    id: 'golden_nebula',
    chapter: 5,
    name: 'Golden Nebula',
    subtitle: 'Obsidian Mirrors & Radiant Runes',
    bgImage: './Assets/backgrounds/golden_nebula_clean.png',
    originalBgImage: './Assets/backgrounds/golden_nebula.png',
    archetype: 'gold_mantra',
    audioPreset: 'deep_drone',
    levelStart: 125,
    levelEnd: 155,
    masterLevelStart: 125,
    classicLevelStart: 140,
    icon: '🌌',
    customTiles: [
      { name: 'Luminous Rune', image: './Assets/themes/golden_nebula/tile_cosmic_gold.png', symbol: '💫' },
      { name: 'Golden Tablet', image: './Assets/themes/golden_nebula/tile_cosmic_tablet.png', symbol: '🌟' }
    ]
  },
  {
    id: 'spirit_altar',
    chapter: 6,
    name: 'Spirit Altar',
    subtitle: 'Carrara Marble on Teak Wood',
    bgImage: './Assets/backgrounds/spirit_altar_clean.png',
    originalBgImage: './Assets/backgrounds/spirit_altar.jpg',
    archetype: 'marble_altar',
    audioPreset: 'bronze_bell',
    levelStart: 156,
    levelEnd: 186,
    masterLevelStart: 156,
    classicLevelStart: 171,
    icon: '🕯️',
    customTiles: [
      { name: 'Marble Lotus', image: './Assets/themes/spirit_altar/tile_marble_lotus.png', symbol: '🪷' },
      { name: 'Marble Rosette', image: './Assets/themes/spirit_altar/tile_marble_rosette.png', symbol: '🏵️' }
    ]
  },
  {
    id: 'sacred_sanctuary',
    chapter: 7,
    name: 'Sacred Sanctuary',
    subtitle: 'Chiseled Gold Lotus & Incense Mist',
    bgImage: './Assets/backgrounds/sacred_sanctuary_clean.png',
    originalBgImage: './Assets/backgrounds/sacred_sanctuary.png',
    archetype: 'brass_lotus',
    audioPreset: 'singing_bowl',
    levelStart: 187,
    levelEnd: 217,
    masterLevelStart: 187,
    classicLevelStart: 202,
    icon: '🪷',
    customTiles: [
      { name: 'Chiseled Lotus', image: './Assets/themes/spirit_altar/tile_marble_lotus.png', symbol: '🪷' },
      { name: 'Brass Rosette', image: './Assets/themes/spirit_altar/tile_marble_rosette.png', symbol: '🏵️' }
    ]
  },
  {
    id: 'ocean_horizon',
    chapter: 8,
    name: 'Ocean Horizon',
    subtitle: 'Tumbled Seaglass & Luminous Pearls',
    bgImage: './Assets/backgrounds/ocean_horizon_clean.png',
    originalBgImage: './Assets/backgrounds/ocean_horizon.png',
    archetype: 'seaglass',
    audioPreset: 'ocean_tide',
    levelStart: 218,
    levelEnd: 248,
    masterLevelStart: 218,
    classicLevelStart: 233,
    icon: '🌊',
    customTiles: [
      { name: 'Azure Sea Glass', image: './Assets/themes/ocean_horizon/tile_seaglass_blue.png', symbol: '🫧' },
      { name: 'Luminous Pearl', image: './Assets/themes/ocean_horizon/tile_pearl_white.png', symbol: '⚪' }
    ]
  },
  {
    id: 'terracotta_earth',
    chapter: 9,
    name: 'Terracotta Earth',
    subtitle: 'Red Earth Clay & Tree of Life',
    bgImage: './Assets/backgrounds/terracotta_earth_clean.png',
    originalBgImage: './Assets/backgrounds/terracotta_earth.png',
    archetype: 'terracotta',
    audioPreset: 'clay_pot',
    levelStart: 249,
    levelEnd: 279,
    masterLevelStart: 249,
    classicLevelStart: 264,
    icon: '🏺',
    customTiles: [
      { name: 'Tree of Life', image: './Assets/themes/terracotta_earth/tile_roots.png', symbol: '🌳' },
      { name: 'Terracotta Leaf', image: './Assets/themes/terracotta_earth/tile_leaf.png', symbol: '🍂' }
    ]
  },
  {
    id: 'floral_harmony',
    chapter: 10,
    name: 'Floral Harmony',
    subtitle: 'Rose-Quartz Enamel Floral Cameos',
    bgImage: './Assets/backgrounds/floral_harmony_clean.png',
    originalBgImage: './Assets/backgrounds/floral_harmony.png',
    archetype: 'enamel_cameo',
    audioPreset: 'quartz_bowl',
    levelStart: 280,
    levelEnd: 310,
    masterLevelStart: 280,
    classicLevelStart: 295,
    icon: '🌸',
    customTiles: [
      { name: 'Lotus Cameo', image: './Assets/themes/floral_harmony/tile_cameo_lotus.png', symbol: '🪷' },
      { name: 'Rose Cameo', image: './Assets/themes/floral_harmony/tile_cameo_rose.png', symbol: '🌹' }
    ]
  },
  {
    id: 'blooming_mandala',
    chapter: 11,
    name: 'Blooming Mandala',
    subtitle: 'Circular Porcelain Cameos & Gold Wire',
    bgImage: './Assets/backgrounds/blooming_mandala_clean.png',
    originalBgImage: './Assets/backgrounds/blooming_mandala.jpg',
    archetype: 'porcelain_cameo',
    audioPreset: 'birdsong',
    levelStart: 311,
    levelEnd: 341,
    masterLevelStart: 311,
    classicLevelStart: 326,
    icon: '🏵️',
    customTiles: [
      { name: 'Porcelain Lotus', image: './Assets/themes/floral_harmony/tile_cameo_lotus.png', symbol: '🌸' },
      { name: 'Gold Cameo', image: './Assets/themes/floral_harmony/tile_cameo_rose.png', symbol: '🏵️' }
    ]
  },
  {
    id: 'sacred_spiral',
    chapter: 12,
    name: 'Sacred Spiral',
    subtitle: 'Golden Vine Orbits & Botanical Blooms',
    bgImage: './Assets/backgrounds/sacred_spiral_clean.png',
    originalBgImage: './Assets/backgrounds/sacred_spiral.png',
    archetype: 'spiral_vine',
    audioPreset: 'bansuri_flute',
    levelStart: 342,
    levelEnd: 372,
    masterLevelStart: 342,
    classicLevelStart: 357,
    icon: '🌿',
    customTiles: [
      { name: 'Golden Vine', image: './Assets/themes/whispering_pines/tile_leaf.png', symbol: '🌿' },
      { name: 'Sacred Bloom', image: './Assets/themes/floral_harmony/tile_cameo_lotus.png', symbol: '🪷' }
    ]
  },
  {
    id: 'master_sanctuary',
    chapter: 13,
    name: 'Master Sanctuary',
    subtitle: 'Carved Walnut Tray & Classic Botanicals',
    bgImage: './Assets/backgrounds/master_sanctuary_clean.png',
    originalBgImage: './Assets/backgrounds/master_sanctuary.png',
    archetype: 'ivory_wood',
    audioPreset: 'meditation_gong',
    levelStart: 373,
    levelEnd: 403,
    masterLevelStart: 373,
    classicLevelStart: 388,
    icon: '👑',
    customTiles: [
      { name: 'Carved Walnut', image: './Assets/themes/whispering_pines/tile_bark.png', symbol: '🪵' },
      { name: 'Marble Inlay', image: './Assets/themes/spirit_altar/tile_marble_lotus.png', symbol: '🪷' }
    ]
  }
];

export class ThemeManager {
  /**
   * Retrieves the active Realm definition for any level (1 - 403+)
   */
  static getRealmForLevel(levelNum = 1) {
    const safeLevel = Math.max(1, levelNum);
    const realmIdx = Math.floor((safeLevel - 1) / LEVELS_PER_REALM) % REALMS.length;
    const realm = REALMS[realmIdx];
    const levelInRealm = ((safeLevel - 1) % LEVELS_PER_REALM) + 1;
    // Levels 1-15: Master Authentic Art Levels (featuring theme-specific tiles)
    // Levels 16-31: Classic Mastery Levels (progressive architectural formations)
    const isMasterArtLevel = levelInRealm <= MASTER_LEVELS_PER_REALM;
    const masterLevelIndex = isMasterArtLevel ? levelInRealm : null;
    const classicLevelIndex = !isMasterArtLevel ? (levelInRealm - MASTER_LEVELS_PER_REALM) : null;

    return {
      ...realm,
      currentLevel: safeLevel,
      levelInRealm,
      isMasterArtLevel,
      masterLevelIndex,
      classicLevelIndex,
      isFirstInRealm: levelInRealm === 1,
      isLastInRealm: levelInRealm === LEVELS_PER_REALM
    };
  }

  /**
   * Returns list of all 13 secular realms for the visual Realm Browser carousel
   */
  static getAllRealms() {
    return REALMS;
  }
}
