// Cryptographic Storage & Local-First Adapter
export let profileState = {
    profile: {
        createdTimestamp: Date.now(),
        lastLaunchTimestamp: Date.now(),
        sanctuaryMode: "traditional",
        themePreference: "auto",
        voiceTonePreference: "french_cadence",
        lotusPetalCount: 0,
        consciousnessPoints: 0
    },
    progression: {
        completedLevelsCount: 0,
        unlockedThemes: ["flowers", "qualities"],
        completedLevelIds: []
    },
    settings: {
        volumeRaga: 0.40,
        volumeGong: 0.60,
        speechRate: 0.70,
        speechPitch: 0.95,
        secularToggle: false,
        experienceMode: "gk_quest", // "gk_quest" (V1) or "ashram_sanctuary" (V2)
        seniorViewActive: false
    },
    reflections: [],
    dailyDrawDate: ""
};

export function saveProfileState() {
    localStorage.setItem('auro_match_user', JSON.stringify({
        profile: profileState.profile,
        progression: profileState.progression,
        settings: profileState.settings,
        dailyDrawDate: profileState.dailyDrawDate
    }));
    localStorage.setItem('auro_match_consecrations', JSON.stringify(profileState.reflections));
    localStorage.setItem('auro_match_unlocked_tiles', JSON.stringify(profileState.progression.completedLevelIds));
}

export function loadProfileState() {
    const userData = localStorage.getItem('auro_match_user');
    const consecrationsData = localStorage.getItem('auro_match_consecrations');
    const unlockedData = localStorage.getItem('auro_match_unlocked_tiles');
    
    // Legacy fallback
    const legacyData = localStorage.getItem('auro_match_profile');
    if (legacyData && !userData) {
        try {
            const parsedLegacy = JSON.parse(legacyData);
            profileState = parsedLegacy;
            saveProfileState();
            localStorage.removeItem('auro_match_profile');
            return profileState;
        } catch(e) {}
    }

    if (userData) {
        try {
            const parsed = JSON.parse(userData);
            profileState.profile = parsed.profile;
            profileState.progression = parsed.progression;
            profileState.settings = { ...profileState.settings, ...(parsed.settings || {}) };
            profileState.dailyDrawDate = parsed.dailyDrawDate || "";
        } catch(e) {
            console.error("Failed to parse auro_match_user");
        }
    }
    
    if (consecrationsData) {
        try {
            profileState.reflections = JSON.parse(consecrationsData);
        } catch(e) {
            console.error("Failed to parse auro_match_consecrations");
        }
    }
    
    if (unlockedData) {
        try {
            profileState.progression.completedLevelIds = JSON.parse(unlockedData);
        } catch(e) {
            console.error("Failed to parse auro_match_unlocked_tiles");
        }
    }
    
    return profileState;
}

export function syncTeachingsRepository(remoteRepository) {
    const localData = localStorage.getItem('auro_match_teachings');
    const currentVersion = localData ? JSON.parse(localData).version : 0;
    
    if (!localData || (remoteRepository && remoteRepository.version > currentVersion)) {
        localStorage.setItem('auro_match_teachings', JSON.stringify({
            version: remoteRepository ? remoteRepository.version : 101,
            lastUpdated: new Date().toISOString().split('T')[0],
            themes: remoteRepository ? remoteRepository.themes : {}
        }));
    }
}


export const PBKDF2_RECOMMENDED_ITERATIONS = 100000;

export async function encryptAndExportBackup(password) {
    if (!password) throw new Error("Decryption password is required.");
    
    // PBKDF2 Key Derivation with hardened iteration count (OWASP compliant)
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iterations = PBKDF2_RECOMMENDED_ITERATIONS;
    const pbkdfKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const payload = enc.encode(JSON.stringify(profileState));
    
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        pbkdfKey,
        payload
    );
    
    const exportObj = {
        version: 2,
        iterations: iterations,
        salt: btoa(String.fromCharCode(...salt)),
        iv: btoa(String.fromCharCode(...iv)),
        data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };
    
    return JSON.stringify(exportObj);
}

export async function decryptAndImportBackup(password, jsonString) {
    if (!password) throw new Error("Decryption password is required.");
    
    const backupObj = JSON.parse(jsonString);
    
    const salt = new Uint8Array(atob(backupObj.salt).split("").map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(backupObj.iv).split("").map(c => c.charCodeAt(0)));
    const encryptedData = new Uint8Array(atob(backupObj.data).split("").map(c => c.charCodeAt(0)));
    
    // Support modern exports (100,000 iterations) and legacy v1 exports (10,000 iterations)
    const iterations = backupObj.iterations || 10000;
    
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    
    const pbkdfKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: iterations,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );
    
    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        pbkdfKey,
        encryptedData
    );
    
    const dec = new TextDecoder();
    const restoredState = JSON.parse(dec.decode(decrypted));
    
    // Decoupled Merge
    profileState = restoredState;
    saveProfileState();
    return profileState;
}

export function executeAbsolutePurge() {
    localStorage.clear();
    profileState = {
        profile: {
            createdTimestamp: Date.now(),
            lastLaunchTimestamp: Date.now(),
            sanctuaryMode: "traditional",
            themePreference: "auto",
            voiceTonePreference: "french_cadence",
            lotusPetalCount: 0,
            consciousnessPoints: 0
        },
        progression: {
            completedLevelsCount: 0,
            unlockedThemes: ["flowers", "qualities"],
            completedLevelIds: []
        },
        settings: {
            volumeRaga: 0.40,
            volumeGong: 0.60,
            speechRate: 0.70,
            speechPitch: 0.95,
            secularToggle: false
        },
        reflections: [],
        dailyDrawDate: ""
    };
}
