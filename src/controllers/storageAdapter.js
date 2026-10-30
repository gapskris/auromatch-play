// Cryptographic Storage & Local-First Adapter
const DB_NAME = 'AuroMatchDB';
const STORE_NAME = 'gameState';
const DB_VERSION = 1;

let dbPromise = null;
let isClosedByRemote = false;

export function resetIndexedDBConnection() {
    isClosedByRemote = false;
    dbPromise = null;
}

export function initIndexedDB() {
    if (typeof window === 'undefined' && typeof globalThis.indexedDB === 'undefined') {
        return Promise.resolve(null);
    }
    const idb = (typeof window !== 'undefined' && window.indexedDB) ? window.indexedDB : globalThis.indexedDB;
    if (!idb) return Promise.resolve(null);
    if (isClosedByRemote) return Promise.resolve(null);

    if (!dbPromise) {
        dbPromise = new Promise((resolve) => {
            try {
                const req = idb.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME);
                    }
                };
                req.onsuccess = (e) => {
                    const db = e.target.result;
                    db.onversionchange = () => {
                        console.warn('[Storage] AuroMatchDB versionchange/deletion requested by another context. Closing connection.');
                        try { db.close(); } catch (err) {}
                        isClosedByRemote = true;
                        dbPromise = Promise.resolve(null);
                    };
                    resolve(db);
                };
                req.onerror = () => resolve(null);
                req.onblocked = () => resolve(null);
            } catch (err) {
                resolve(null);
            }
        });
    }
    return dbPromise;
}

export async function setItemAsync(key, value) {
    if (isPurgeActive()) {
        console.warn(`[Storage] setItemAsync blocked for ${key}: Purge is active.`);
        return false;
    }
    const serialized = (typeof value === 'string') ? value : JSON.stringify(value);

    // 1. Synchronous mirror in localStorage for instantaneous UI access
    if (typeof localStorage !== 'undefined') {
        try {
            localStorage.setItem(key, serialized);
        } catch (e) {
            console.warn('[Storage] localStorage setItem error:', e);
        }
    }

    // 2. Asynchronous write into durable IndexedDB vault
    try {
        const db = await initIndexedDB();
        if (db) {
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(serialized, key);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
                tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
            });
        }
    } catch (err) {
        console.warn('[Storage] IndexedDB setItem error:', err);
    }
    return true;
}

export async function getItemAsync(key) {
    // 1. Try IndexedDB primary vault
    try {
        const db = await initIndexedDB();
        if (db) {
            const val = await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
            if (val !== undefined && val !== null) return val;
        }
    } catch (err) {}

    // 2. Fallback to localStorage
    if (typeof localStorage !== 'undefined') {
        try {
            return localStorage.getItem(key);
        } catch (e) {}
    }
    return null;
}

export async function autoHealFromIndexedDB() {
    if (typeof localStorage === 'undefined') return false;
    const idb = (typeof window !== 'undefined' && window.indexedDB) ? window.indexedDB : globalThis.indexedDB;
    if (!idb) return false;

    try {
        // If localStorage has player state or user profile, it is already healthy
        const hasLocal = localStorage.getItem('auromatch_player_state') || localStorage.getItem('auro_match_user');
        if (hasLocal) return false;

        const db = await initIndexedDB();
        if (!db) return false;

        const keysToRestore = [
            'auromatch_player_state',
            'auromatch_player_profiles',
            'auromatch_standard_theme',
            'auromatch_has_entered_sanctuary',
            'auro_match_user',
            'auro_match_consecrations',
            'auro_match_unlocked_tiles',
            'auro_match_teachings'
        ];

        let restoredCount = 0;
        for (const key of keysToRestore) {
            const val = await new Promise((resolve) => {
                try {
                    const tx = db.transaction(STORE_NAME, 'readonly');
                    const req = tx.objectStore(STORE_NAME).get(key);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => resolve(null);
                } catch (e) {
                    resolve(null);
                }
            });
            if (val !== null && val !== undefined) {
                localStorage.setItem(key, val);
                restoredCount++;
            }
        }

        if (restoredCount > 0) {
            console.info(`[Storage] Auto-healed ${restoredCount} records from AuroMatchDB into localStorage.`);
            return true;
        }
    } catch (e) {
        console.warn('[Storage] autoHealFromIndexedDB exception:', e);
    }
    return false;
}

let _isPurgeActive = false;

export function isPurgeActive() {
    if (_isPurgeActive) return true;
    try {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem('auromatch_purge_in_progress') === 'true';
        }
    } catch (e) {}
    return false;
}

export function setPurgeLock(active) {
    _isPurgeActive = Boolean(active);
    try {
        if (typeof localStorage !== 'undefined') {
            if (active) {
                localStorage.setItem('auromatch_purge_in_progress', 'true');
            } else {
                localStorage.removeItem('auromatch_purge_in_progress');
            }
        }
    } catch (e) {}
}

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
    if (isPurgeActive()) {
        console.warn('[Storage] saveProfileState blocked: Purge is active.');
        return false;
    }
    if (typeof localStorage !== 'undefined') {
        // Fresh-Read-Before-Merge: Prevent stale tab from stomping concurrent reflections or tile completions
        try {
            const freshConsecrations = localStorage.getItem('auro_match_consecrations');
            if (freshConsecrations) {
                const parsed = JSON.parse(freshConsecrations);
                if (Array.isArray(parsed) && parsed.length > profileState.reflections.length) {
                    profileState.reflections = parsed;
                }
            }
            const freshUnlocked = localStorage.getItem('auro_match_unlocked_tiles');
            if (freshUnlocked) {
                const parsed = JSON.parse(freshUnlocked);
                if (Array.isArray(parsed) && parsed.length > profileState.progression.completedLevelIds.length) {
                    profileState.progression.completedLevelIds = parsed;
                }
            }
            const freshUser = localStorage.getItem('auro_match_user');
            if (freshUser) {
                const parsed = JSON.parse(freshUser);
                if (parsed && parsed.progression) {
                    if (parsed.progression.completedLevelsCount > profileState.progression.completedLevelsCount) {
                        profileState.progression.completedLevelsCount = parsed.progression.completedLevelsCount;
                    }
                    if (Array.isArray(parsed.progression.unlockedThemes)) {
                        profileState.progression.unlockedThemes = Array.from(
                            new Set([...profileState.progression.unlockedThemes, ...parsed.progression.unlockedThemes])
                        );
                    }
                }
            }
        } catch (e) {}

        const userObj = {
            profile: profileState.profile,
            progression: profileState.progression,
            settings: profileState.settings,
            dailyDrawDate: profileState.dailyDrawDate
        };
        localStorage.setItem('auro_match_user', JSON.stringify(userObj));
        localStorage.setItem('auro_match_consecrations', JSON.stringify(profileState.reflections));
        localStorage.setItem('auro_match_unlocked_tiles', JSON.stringify(profileState.progression.completedLevelIds));

        // Asynchronously mirror into durable IndexedDB vault
        setItemAsync('auro_match_user', userObj);
        setItemAsync('auro_match_consecrations', profileState.reflections);
        setItemAsync('auro_match_unlocked_tiles', profileState.progression.completedLevelIds);
        return true;
    }
    return false;
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
    if (isPurgeActive()) {
        console.warn('[Storage] syncTeachingsRepository blocked: Purge is active.');
        return;
    }
    const localData = (typeof localStorage !== 'undefined') ? localStorage.getItem('auro_match_teachings') : null;
    const currentVersion = localData ? JSON.parse(localData).version : 0;
    
    if (!localData || (remoteRepository && remoteRepository.version > currentVersion)) {
        const payload = {
            version: remoteRepository ? remoteRepository.version : 101,
            lastUpdated: new Date().toISOString().split('T')[0],
            themes: remoteRepository ? remoteRepository.themes : {}
        };
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('auro_match_teachings', JSON.stringify(payload));
        }
        setItemAsync('auro_match_teachings', payload);
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
    if (isPurgeActive()) {
        throw new Error("Cannot restore backup while purge is active.");
    }
    profileState = restoredState;
    saveProfileState();
    return profileState;
}

export async function executeAbsolutePurge(targetGm = null) {
    // 1. Establish persistent purge lock before executing destructive operations
    setPurgeLock(true);

    try {
        // 2. Broadcast purge event across tabs immediately
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                const bus = new BroadcastChannel('auromatch_storage_bus');
                bus.postMessage({ type: 'AUROMATCH_PURGE_EXECUTED', timestamp: Date.now() });
                bus.close();
            } catch (e) {}
        }

        // 3. Reset in-memory GameManager state to eliminate the 800ms reload race condition
        const gm = targetGm || (typeof window !== 'undefined' ? (window.gameManager || window.activeGameManager) : null);
        if (gm && typeof gm.resetActivePlayerState === 'function') {
            gm.resetActivePlayerState();
        }

        // Phase 2: Asynchronous deletion of AuroMatchDB IndexedDB vault
        const idb = (typeof window !== 'undefined' && window.indexedDB) ? window.indexedDB : globalThis.indexedDB;
        if (idb) {
            try {
                const db = await (dbPromise || Promise.resolve(null));
                if (db) {
                    try { db.close(); } catch (err) {}
                }
            } catch (e) {}
            dbPromise = Promise.resolve(null);
            isClosedByRemote = false;

            await new Promise((resolve) => {
                try {
                    const delReq = idb.deleteDatabase(DB_NAME);
                    let settled = false;
                    const timer = setTimeout(() => {
                        if (!settled) {
                            settled = true;
                            resolve();
                        }
                    }, 5000);

                    delReq.onsuccess = () => {
                        if (!settled) {
                            settled = true;
                            clearTimeout(timer);
                            resolve();
                        }
                    };
                    delReq.onerror = () => {
                        if (!settled) {
                            settled = true;
                            clearTimeout(timer);
                            resolve();
                        }
                    };
                    delReq.onblocked = () => {
                        if (!settled) {
                            settled = true;
                            clearTimeout(timer);
                            resolve();
                        }
                    };
                } catch (delErr) {
                    resolve();
                }
            });
        }

        // Phase 3: Scoped removal of application keys (leaving foreign keys untouched)
        if (typeof localStorage !== 'undefined') {
            const knownKeys = [
                'auro_match_user',
                'auro_match_consecrations',
                'auro_match_unlocked_tiles',
                'auro_match_profile',
                'auro_match_teachings',
                'auromatch_has_entered_sanctuary',
                'auromatch_player_profiles',
                'auromatch_player_state',
                'auromatch_standard_theme'
            ];
            knownKeys.forEach(key => localStorage.removeItem(key));

            // Defensively remove any current or future Auromatch-owned keys, preserving active lock
            Object.keys(localStorage)
                .filter(key => (key.startsWith('auromatch_') || key.startsWith('auro_match_')) && key !== 'auromatch_purge_in_progress')
                .forEach(key => localStorage.removeItem(key));
        }

        // 5. Reset local in-memory profileState to canonical defaults
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
    } finally {
        // In headless testing or environments without full reload, release lock after safe cooldown
        setTimeout(() => {
            setPurgeLock(false);
        }, 1200);
    }
}
