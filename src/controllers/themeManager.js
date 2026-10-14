// ThemeManager: Manages the 13 Secular Realms Campaign (195 Total Thematic Levels)
// Coordinates clean background wallpapers, authentic 3D graphic tile skins, and audio presets.

export const TOTAL_REALM_LEVELS = 195; // 13 Themes * 15 Thematic Levels
export const LEVELS_PER_REALM = 15;
export const TOTAL_CLASSIC_LEVELS = 200; // Dedicated Classic Solitaire Campaign

// 16 distinct emblems with symbolic labels for each theme
const THEME_TILE_DEFS = {
  whispering_pines: [
    { name: "Emerald Leaf", symbol: "🍃" }, { name: "Pinecone", symbol: "🌲" },
    { name: "Acorn", symbol: "🌰" }, { name: "Oak Leaf", symbol: "🍂" },
    { name: "Fern Frond", symbol: "🌿" }, { name: "Forest Mushroom", symbol: "🍄" },
    { name: "Cedar Bark", symbol: "🪵" }, { name: "Maple Wing", symbol: "🍁" },
    { name: "Clover Sprout", symbol: "☘️" }, { name: "Wild Berry", symbol: "🫐" },
    { name: "Woodland Owl", symbol: "🦉" }, { name: "Forest Deer", symbol: "🦌" },
    { name: "Pine Needle", symbol: "🎋" }, { name: "Sunlit Sprout", symbol: "🌱" },
    { name: "Tree of Life", symbol: "🌳" }, { name: "Forest Blossom", symbol: "🌸" }
  ],
  temple_of_lines: [
    { name: "Blueprint Arch", symbol: "⛩️" }, { name: "Slate Dome", symbol: "🏛️" },
    { name: "Torana Gate", symbol: "🛕" }, { name: "Zen Pillar", symbol: "🏛️" },
    { name: "Sacred Triangle", symbol: "📐" }, { name: "Compass Rose", symbol: "🧭" },
    { name: "Keystone", symbol: "🧱" }, { name: "Spiral Column", symbol: "🌀" },
    { name: "Stepped Terrace", symbol: "🪜" }, { name: "Temple Bell", symbol: "🔔" },
    { name: "Golden Caliper", symbol: "📏" }, { name: "Sanctuary Obelisk", symbol: "🗿" },
    { name: "Lattice Grid", symbol: "🕸️" }, { name: "Zen Stone", symbol: "🪨" },
    { name: "Balance Scale", symbol: "⚖️" }, { name: "Horizon Portal", symbol: "🪟" }
  ],
  biblios_wisdom: [
    { name: "Gilded Owl", symbol: "🦉" }, { name: "Sunburst Tome", symbol: "☀️" },
    { name: "Feather Quill", symbol: "🪶" }, { name: "Open Codex", symbol: "📖" },
    { name: "Astrolabe", symbol: "🧭" }, { name: "Vintage Hourglass", symbol: "⏳" },
    { name: "Laurel Wreath", symbol: "🌿" }, { name: "Celestial Globe", symbol: "🌐" },
    { name: "Inkpot Scroll", symbol: "📜" }, { name: "Library Lamp", symbol: "🏮" },
    { name: "Sealing Wax", symbol: "🏷️" }, { name: "Scholar Key", symbol: "🗝️" },
    { name: "Radiant Star", symbol: "🌟" }, { name: "Illuminated Folio", symbol: "📑" },
    { name: "Wisdom Crown", symbol: "👑" }, { name: "Looking Glass", symbol: "🔍" }
  ],
  celestial_starlight: [
    { name: "Cosmic Star", symbol: "✨" }, { name: "Aquamarine Tablet", symbol: "💎" },
    { name: "Crescent Moon", symbol: "🌙" }, { name: "Solar Crest", symbol: "☀️" },
    { name: "Polaris Compass", symbol: "🧭" }, { name: "Comet Trail", symbol: "☄️" },
    { name: "Saturn Ring", symbol: "🪐" }, { name: "Astral Orbit", symbol: "💫" },
    { name: "Radiant Nova", symbol: "🌟" }, { name: "Starlight Crown", symbol: "👑" },
    { name: "Crystal Prism", symbol: "🔮" }, { name: "Eclipse Ring", symbol: "⭕" },
    { name: "Zodiac Rune", symbol: "♈" }, { name: "Zenith Spark", symbol: "⚡" },
    { name: "Cosmic Bell", symbol: "🔔" }, { name: "Infinity Spiral", symbol: "♾️" }
  ],
  golden_nebula: [
    { name: "Luminous Rune", symbol: "💫" }, { name: "Golden Tablet", symbol: "🌟" },
    { name: "Solar Flare", symbol: "☀️" }, { name: "Nebula Spiral", symbol: "🌀" },
    { name: "Gold Constellation", symbol: "✨" }, { name: "Supernova", symbol: "💥" },
    { name: "Galaxy Disc", symbol: "🌌" }, { name: "Astral Gateway", symbol: "⛩️" },
    { name: "Golden Lotus", symbol: "🪷" }, { name: "Radiant Phoenix", symbol: "🦅" },
    { name: "Cosmic Eye", symbol: "👁️" }, { name: "Golden Sceptre", symbol: "🪄" },
    { name: "Eclipse Sun", symbol: "🌕" }, { name: "Astral Hourglass", symbol: "⏳" },
    { name: "Star Chime", symbol: "🔔" }, { name: "Celestial Crown", symbol: "👑" }
  ],
  spirit_altar: [
    { name: "Marble Lotus", symbol: "🪷" }, { name: "Marble Rosette", symbol: "🏵️" },
    { name: "Concentric Mandala", symbol: "💮" }, { name: "Bodhi Leaf", symbol: "🍃" },
    { name: "Meditation Flame", symbol: "🔥" }, { name: "Bronze Chime", symbol: "🔔" },
    { name: "Incense Censer", symbol: "🪔" }, { name: "Offering Bowl", symbol: "🥣" },
    { name: "Sacred Conch", symbol: "🐚" }, { name: "Endless Knot", symbol: "♾️" },
    { name: "White Jasmine", symbol: "🌼" }, { name: "Water Lily", symbol: "🪷" },
    { name: "Golden Vessel", symbol: "🏺" }, { name: "Spiritual Halo", symbol: "⭕" },
    { name: "Temple Camellia", symbol: "🌺" }, { name: "Serene Pearl", symbol: "⚪" }
  ],
  sacred_sanctuary: [
    { name: "Chiseled Lotus", symbol: "🪷" }, { name: "Brass Rosette", symbol: "🏵️" },
    { name: "Sanctuary Flame", symbol: "🔥" }, { name: "Golden Bell", symbol: "🔔" },
    { name: "Temple Pillar", symbol: "🏛️" }, { name: "Incense Mist", symbol: "💨" },
    { name: "Amber Jewel", symbol: "💎" }, { name: "Sacred Garland", symbol: "📿" },
    { name: "Solar Disk", symbol: "☀️" }, { name: "Peace Dove", symbol: "🕊️" },
    { name: "Temple Gateway", symbol: "⛩️" }, { name: "Vessel of Light", symbol: "🏺" },
    { name: "Radiant Chime", symbol: "🎐" }, { name: "Aura Halo", symbol: "⭕" },
    { name: "Golden Leaf", symbol: "🍂" }, { name: "Eternal Lamp", symbol: "🪔" }
  ],
  ocean_horizon: [
    { name: "Azure Sea Glass", symbol: "🫧" }, { name: "Luminous Pearl", symbol: "⚪" },
    { name: "Nautilus Shell", symbol: "🐚" }, { name: "Sea Star", symbol: "⭐" },
    { name: "Ocean Wave", symbol: "🌊" }, { name: "Coral Branch", symbol: "🪸" },
    { name: "Driftwood Tablet", symbol: "🪵" }, { name: "Dolphin Crest", symbol: "🐬" },
    { name: "Tide Compass", symbol: "🧭" }, { name: "Deep Lagoon", symbol: "💧" },
    { name: "Sea Anemone", symbol: "🌸" }, { name: "Ambergris Gem", symbol: "💎" },
    { name: "Coastal Breeze", symbol: "💨" }, { name: "Lighthouse Lamp", symbol: "🏮" },
    { name: "Seagrass Frond", symbol: "🌿" }, { name: "Sunken Coin", symbol: "🪙" }
  ],
  terracotta_earth: [
    { name: "Tree of Life", symbol: "🌳" }, { name: "Terracotta Leaf", symbol: "🍂" },
    { name: "Clay Amphora", symbol: "🏺" }, { name: "Deep Root", symbol: "🌱" },
    { name: "Sun-Baked Brick", symbol: "🧱" }, { name: "Potter Wheel", symbol: "⚙️" },
    { name: "River Pebble", symbol: "🪨" }, { name: "Earthy Wheat", symbol: "🌾" },
    { name: "Hearth Flame", symbol: "🔥" }, { name: "Clay Basin", symbol: "🥣" },
    { name: "Ancient Fossil", symbol: "🐚" }, { name: "Desert Bloom", symbol: "🌵" },
    { name: "Sienna Sun", symbol: "☀️" }, { name: "Clay Tablet", symbol: "📜" },
    { name: "Terra Cameo", symbol: "🏵️" }, { name: "Harvest Basket", symbol: "🧺" }
  ],
  floral_harmony: [
    { name: "Lotus Cameo", symbol: "🪷" }, { name: "Rose Cameo", symbol: "🌹" },
    { name: "Magnolia Blossom", symbol: "🌸" }, { name: "Orchid Sprig", symbol: "🌺" },
    { name: "Cherry Petal", symbol: "🌸" }, { name: "Jasmine Garland", symbol: "🌼" },
    { name: "Peony Crown", symbol: "🏵️" }, { name: "Tulip Cup", symbol: "🌷" },
    { name: "Sunflower Crest", symbol: "🌻" }, { name: "Lavender Scent", symbol: "🪻" },
    { name: "Iris Blade", symbol: "🌿" }, { name: "Blush Cameo", symbol: "💮" },
    { name: "Garden Butterfly", symbol: "🦋" }, { name: "Honey Blossom", symbol: "🍯" },
    { name: "Morning Dew", symbol: "💧" }, { name: "Cameo Brooch", symbol: "💎" }
  ],
  blooming_mandala: [
    { name: "Porcelain Lotus", symbol: "🌸" }, { name: "Gold Cameo", symbol: "🏵️" },
    { name: "Concentric Ring", symbol: "⭕" }, { name: "Radial Star", symbol: "✳️" },
    { name: "Mandala Hub", symbol: "💮" }, { name: "Filigree Petal", symbol: "🪷" },
    { name: "Sacred Wheel", symbol: "☸️" }, { name: "Porcelain Rose", symbol: "🌹" },
    { name: "Gold Wire Crest", symbol: "⚜️" }, { name: "Sunburst Halo", symbol: "☀️" },
    { name: "Lace Mandala", symbol: "🕸️" }, { name: "Imperial Brocade", symbol: "👑" },
    { name: "Celestial Rosette", symbol: "🌟" }, { name: "Ivory Cameo", symbol: "🤍" },
    { name: "Radiant Bloom", symbol: "🌺" }, { name: "Geometric Jewel", symbol: "💎" }
  ],
  sacred_spiral: [
    { name: "Golden Vine", symbol: "🌿" }, { name: "Sacred Bloom", symbol: "🪷" },
    { name: "Fibonacci Spiral", symbol: "🌀" }, { name: "Fern Sprout", symbol: "🌱" },
    { name: "Spiral Shell", symbol: "🐚" }, { name: "Curled Tendril", symbol: "🌾" },
    { name: "Helix Crest", symbol: "🧬" }, { name: "Emerald Jewel", symbol: "💎" },
    { name: "Sunlit Canopy", symbol: "🌳" }, { name: "Verdant Clover", symbol: "🍀" },
    { name: "Botanical Orbit", symbol: "💫" }, { name: "Forest Fern", symbol: "🌿" },
    { name: "Twisting Branch", symbol: "🪵" }, { name: "Dewdrop Frond", symbol: "💧" },
    { name: "Spiral Galaxy", symbol: "🌌" }, { name: "Verdant Crown", symbol: "👑" }
  ],
  master_sanctuary: [
    { name: "Carved Walnut", symbol: "🪵" }, { name: "Marble Inlay", symbol: "🪷" },
    { name: "Master Crown", symbol: "👑" }, { name: "Golden Key", symbol: "🗝️" },
    { name: "Grand Chime", symbol: "🔔" }, { name: "Imperial Crest", symbol: "⚜️" },
    { name: "Sanctuary Sceptre", symbol: "🪄" }, { name: "Royal Astrolabe", symbol: "🧭" },
    { name: "Grand Hourglass", symbol: "⏳" }, { name: "Polished Cameo", symbol: "🏵️" },
    { name: "Altar Vessel", symbol: "🏺" }, { name: "Diamond Star", symbol: "💎" },
    { name: "Golden Laurel", symbol: "🌿" }, { name: "Master Codex", symbol: "📖" },
    { name: "Shield of Honor", symbol: "🛡️" }, { name: "Radiant Sun", symbol: "☀️" }
  ]
};

function buildCustomTilesForTheme(themeId) {
  const defs = THEME_TILE_DEFS[themeId] || THEME_TILE_DEFS.whispering_pines;
  return defs.map((d, idx) => ({
    name: d.name,
    image: `./Assets/themes/${themeId}/tile_${String(idx + 1).padStart(2, '0')}.png`,
    symbol: d.symbol
  }));
}

export const REALMS = [
  {
    id: 'whispering_pines',
    chapter: 1,
    name: 'Whispering Pines',
    subtitle: 'Woodland Bark & Emerald Veins',
    bgImage: './Assets/backgrounds/whispering_pines_clean.png',
    archetype: 'bark_leaf',
    audioPreset: 'forest',
    levelStart: 1,
    levelEnd: 15,
    icon: '🌲',
    customTiles: buildCustomTilesForTheme('whispering_pines')
  },
  {
    id: 'temple_of_lines',
    chapter: 2,
    name: 'Temple of Lines',
    subtitle: 'Layered Slate & Blueprint Geometry',
    bgImage: './Assets/backgrounds/temple_of_lines_clean.png',
    archetype: 'slate_zen',
    audioPreset: 'zen_stone',
    levelStart: 16,
    levelEnd: 30,
    icon: '🏛️',
    customTiles: buildCustomTilesForTheme('temple_of_lines')
  },
  {
    id: 'biblios_wisdom',
    chapter: 3,
    name: 'Biblios Wisdom',
    subtitle: 'Leather-Bound Tomes & Gilded Edges',
    bgImage: './Assets/backgrounds/biblios_wisdom_clean.png',
    archetype: 'leather_tome',
    audioPreset: 'parchment',
    levelStart: 31,
    levelEnd: 45,
    icon: '📚',
    customTiles: buildCustomTilesForTheme('biblios_wisdom')
  },
  {
    id: 'celestial_starlight',
    chapter: 4,
    name: 'Celestial Starlight',
    subtitle: 'Aquamarine Crystal & 24K Gold Bevels',
    bgImage: './Assets/backgrounds/celestial_starlight_clean.png',
    archetype: 'cosmic_glass',
    audioPreset: 'crystal_bell',
    levelStart: 46,
    levelEnd: 60,
    icon: '✨',
    customTiles: buildCustomTilesForTheme('celestial_starlight')
  },
  {
    id: 'golden_nebula',
    chapter: 5,
    name: 'Golden Nebula',
    subtitle: 'Obsidian Mirrors & Radiant Runes',
    bgImage: './Assets/backgrounds/golden_nebula_clean.png',
    archetype: 'gold_mantra',
    audioPreset: 'deep_drone',
    levelStart: 61,
    levelEnd: 75,
    icon: '🌌',
    customTiles: buildCustomTilesForTheme('golden_nebula')
  },
  {
    id: 'spirit_altar',
    chapter: 6,
    name: 'Spirit Altar',
    subtitle: 'Carrara Marble on Teak Wood',
    bgImage: './Assets/backgrounds/spirit_altar_clean.png',
    archetype: 'marble_altar',
    audioPreset: 'bronze_bell',
    levelStart: 76,
    levelEnd: 90,
    icon: '🕯️',
    customTiles: buildCustomTilesForTheme('spirit_altar')
  },
  {
    id: 'sacred_sanctuary',
    chapter: 7,
    name: 'Sacred Sanctuary',
    subtitle: 'Chiseled Gold Lotus & Incense Mist',
    bgImage: './Assets/backgrounds/sacred_sanctuary_clean.png',
    archetype: 'brass_lotus',
    audioPreset: 'singing_bowl',
    levelStart: 91,
    levelEnd: 105,
    icon: '🪷',
    customTiles: buildCustomTilesForTheme('sacred_sanctuary')
  },
  {
    id: 'ocean_horizon',
    chapter: 8,
    name: 'Ocean Horizon',
    subtitle: 'Tumbled Seaglass & Luminous Pearls',
    bgImage: './Assets/backgrounds/ocean_horizon_clean.png',
    archetype: 'seaglass',
    audioPreset: 'ocean_tide',
    levelStart: 106,
    levelEnd: 120,
    icon: '🌊',
    customTiles: buildCustomTilesForTheme('ocean_horizon')
  },
  {
    id: 'terracotta_earth',
    chapter: 9,
    name: 'Terracotta Earth',
    subtitle: 'Red Earth Clay & Tree of Life',
    bgImage: './Assets/backgrounds/terracotta_earth_clean.png',
    archetype: 'terracotta',
    audioPreset: 'clay_pot',
    levelStart: 121,
    levelEnd: 135,
    icon: '🏺',
    customTiles: buildCustomTilesForTheme('terracotta_earth')
  },
  {
    id: 'floral_harmony',
    chapter: 10,
    name: 'Floral Harmony',
    subtitle: 'Rose-Quartz Enamel Floral Cameos',
    bgImage: './Assets/backgrounds/floral_harmony_clean.png',
    archetype: 'enamel_cameo',
    audioPreset: 'quartz_bowl',
    levelStart: 136,
    levelEnd: 150,
    icon: '🌸',
    customTiles: buildCustomTilesForTheme('floral_harmony')
  },
  {
    id: 'blooming_mandala',
    chapter: 11,
    name: 'Blooming Mandala',
    subtitle: 'Circular Porcelain Cameos & Gold Wire',
    bgImage: './Assets/backgrounds/blooming_mandala_clean.png',
    archetype: 'porcelain_cameo',
    audioPreset: 'birdsong',
    levelStart: 151,
    levelEnd: 165,
    icon: '🏵️',
    customTiles: buildCustomTilesForTheme('blooming_mandala')
  },
  {
    id: 'sacred_spiral',
    chapter: 12,
    name: 'Sacred Spiral',
    subtitle: 'Golden Vine Orbits & Botanical Blooms',
    bgImage: './Assets/backgrounds/sacred_spiral_clean.png',
    archetype: 'spiral_vine',
    audioPreset: 'bansuri_flute',
    levelStart: 166,
    levelEnd: 180,
    icon: '🌿',
    customTiles: buildCustomTilesForTheme('sacred_spiral')
  },
  {
    id: 'master_sanctuary',
    chapter: 13,
    name: 'Master Sanctuary',
    subtitle: 'Carved Walnut Tray & Classic Botanicals',
    bgImage: './Assets/backgrounds/master_sanctuary_clean.png',
    archetype: 'ivory_wood',
    audioPreset: 'meditation_gong',
    levelStart: 181,
    levelEnd: 195,
    icon: '👑',
    customTiles: buildCustomTilesForTheme('master_sanctuary')
  }
];

export class ThemeManager {
  /**
   * Retrieves the active Realm definition for any level (1 - 195)
   */
  static getRealmForLevel(levelNum = 1) {
    const safeLevel = Math.max(1, levelNum);
    const realmIdx = Math.floor((safeLevel - 1) / LEVELS_PER_REALM) % REALMS.length;
    const realm = REALMS[realmIdx];
    const levelInRealm = ((safeLevel - 1) % LEVELS_PER_REALM) + 1;

    return {
      ...realm,
      currentLevel: safeLevel,
      levelInRealm,
      isMasterArtLevel: true, // In Realms mode, all 15 levels feature authentic dedicated art tiles
      masterLevelIndex: levelInRealm,
      classicLevelIndex: null,
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
