// Web Audio Procedural Synthesis Engine for AuroMatch
// Supports 432 Hz Pythagorean harmonic scale and 440 Hz standard concert pitch
// Features non-startle blocked tap (196 Hz), select chime (432 Hz), and additive meditation gong.

let audioCtx = null;
let gongGainNode = null;

export const ragaDrone = {
    oscillators: [],
    gainNode: null,
    filterNode: null,
    volume: 0.40,
    gongVolume: 0.60,
    tuningBase: 'off', // Default disabled
    disabled: true
};

export function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    return audioCtx;
}

export function initAudioEngine(volumeRaga = 0.40, volumeGong = 0.60, tuningBase = 'off') {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    ragaDrone.volume = volumeRaga;
    ragaDrone.gongVolume = volumeGong;
    ragaDrone.tuningBase = tuningBase;
    ragaDrone.disabled = (tuningBase === 'off' || tuningBase === 0 || tuningBase === 'disable');

    if (!gongGainNode) {
        gongGainNode = ctx.createGain();
        gongGainNode.gain.setValueAtTime(volumeGong, ctx.currentTime);
        gongGainNode.connect(ctx.destination);
    }
    
    if (!ragaDrone.gainNode) {
        ragaDrone.gainNode = ctx.createGain();
        ragaDrone.gainNode.gain.setValueAtTime(volumeRaga, ctx.currentTime);
        
        ragaDrone.filterNode = ctx.createBiquadFilter();
        ragaDrone.filterNode.type = 'lowpass';
        ragaDrone.filterNode.frequency.setValueAtTime(600, ctx.currentTime);
        ragaDrone.filterNode.Q.setValueAtTime(1, ctx.currentTime);
        
        ragaDrone.gainNode.connect(ragaDrone.filterNode);
        ragaDrone.filterNode.connect(ctx.destination);
    }
    
    // Unlock on gesture
    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
    
    // Tab visibility handling: smoothly fade audio when tab is backgrounded
    if (typeof document !== 'undefined' && !window._audioVisibilityInitialized) {
        window._audioVisibilityInitialized = true;
        document.addEventListener('visibilitychange', () => {
            const audioContext = getAudioContext();
            if (!audioContext) return;
            const now = audioContext.currentTime;
            if (document.hidden) {
                if (ragaDrone.gainNode) {
                    ragaDrone.gainNode.gain.cancelScheduledValues(now);
                    ragaDrone.gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
                }
            } else {
                if (ragaDrone.gainNode) {
                    ragaDrone.gainNode.gain.cancelScheduledValues(now);
                    ragaDrone.gainNode.gain.linearRampToValueAtTime(ragaDrone.volume, now + 0.5);
                }
            }
        });
    }

    startDroneSynthesizer();
}

export function unlockAudioContext() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
}

export function getActiveRagaScale() {
    const hour = new Date().getHours();
    const ratio = (ragaDrone.tuningBase === 432) ? (432 / 440) : 1.0;
    const baseC3 = 130.81 * ratio; // 128.43 Hz in 432Hz tuning

    // Dawn: 4:00 - 8:00 (Bhairav)
    if (hour >= 4 && hour < 8) {
        return { name: "Bhairav", base: baseC3, scale: [baseC3, baseC3 * 1.06, baseC3 * 1.26, baseC3 * 1.33, baseC3 * 1.50, baseC3 * 1.59, baseC3 * 1.89] };
    }
    // Noon: 8:00 - 16:00 (Sarang)
    else if (hour >= 8 && hour < 16) {
        return { name: "Sarang", base: baseC3, scale: [baseC3, baseC3 * 1.12, baseC3 * 1.33, baseC3 * 1.50, baseC3 * 1.78] };
    }
    // Evening: 16:00 - 20:00 (Yaman)
    else if (hour >= 16 && hour < 20) {
        return { name: "Yaman", base: baseC3, scale: [baseC3, baseC3 * 1.12, baseC3 * 1.26, baseC3 * 1.41, baseC3 * 1.50, baseC3 * 1.68, baseC3 * 1.89] };
    }
    // Night: 20:00 - 04:00 (Darbari)
    else {
        return { name: "Darbari", base: baseC3, scale: [baseC3, baseC3 * 1.12, baseC3 * 1.19, baseC3 * 1.33, baseC3 * 1.50, baseC3 * 1.59, baseC3 * 1.78] };
    }
}

export function stopDroneSynthesizer() {
    ragaDrone.oscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch(e){}
    });
    ragaDrone.oscillators = [];
}

export function startDroneSynthesizer() {
    stopDroneSynthesizer();
    if (ragaDrone.disabled || ragaDrone.tuningBase === 0 || ragaDrone.tuningBase === 'off') {
        return;
    }
    const ctx = getAudioContext();
    if (!ctx || !ragaDrone.gainNode) return;
    
    const raga = getActiveRagaScale();
    const frequencies = [raga.base, raga.base * 1.5, raga.base * 2.0];
    const gains = [0.06, 0.03, 0.02];
    
    const now = ctx.currentTime;
    frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        const channelGain = ctx.createGain();
        channelGain.gain.setValueAtTime(0, now);
        channelGain.gain.linearRampToValueAtTime(gains[idx], now + 2.0);
        
        osc.connect(channelGain);
        channelGain.connect(ragaDrone.gainNode);
        
        osc.start(now);
        ragaDrone.oscillators.push(osc);
    });
}

/**
 * Additive Dual-Fundamental Meditation Gong (Platonic Morning 172.08 Hz / Evening 110.0 Hz)
 * 5 Overtones (1.47x, 2.09x, 2.56x, 3.12x, 4.2x) with smooth exponential decay over 4.8s.
 * Complete garbage collection with node.disconnect().
 */
export function playAshramMeditationGong() {
    const ctx = getAudioContext();
    if (!ctx) return;
    unlockAudioContext();

    const now = ctx.currentTime;
    const isMorning = new Date().getHours() < 16;
    const f0 = isMorning ? 172.08 : 110.0;
    
    const overtones = [1.0, 1.47, 2.09, 2.56, 3.12, 4.2];
    const overtoneGains = [0.35, 0.20, 0.14, 0.09, 0.05, 0.02];
    
    overtones.forEach((factor, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f0 * factor, now);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(overtoneGains[idx] * (ragaDrone.gongVolume || 0.6), now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);
        
        osc.connect(gain);
        if (gongGainNode) {
            gain.connect(gongGainNode);
        } else {
            gain.connect(ctx.destination);
        }
        
        osc.start(now);
        osc.stop(now + 4.9);

        // Automatic GC
        setTimeout(() => {
            try {
                osc.disconnect();
                gain.disconnect();
            } catch(e){}
        }, 5000);
    });
}

/**
 * Selection Tap: Authentic ceramic tile click transient + 432 Hz Pythagorean resonant body chime
 */
export function playCeramicTileTap() {
    const ctx = getAudioContext();
    if (!ctx) return;
    unlockAudioContext();

    const now = ctx.currentTime;
    
    // High-pitched tactile ceramic click transient (1250 Hz -> 320 Hz)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(1250, now);
    clickOsc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
    clickGain.gain.setValueAtTime(0.14, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.045);

    // Resonant musical body tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const freq = (ragaDrone.tuningBase === 432) ? 432.0 : 440.0;
    osc.frequency.setValueAtTime(freq, now);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.24);

    setTimeout(() => {
        try { 
            clickOsc.disconnect(); clickGain.disconnect();
            osc.disconnect(); gain.disconnect(); 
        } catch(e){}
    }, 300);
}

export function playTileSelectChime() {
    playCeramicTileTap();
}

/**
 * Kinetic Starlight Smash & Whoosh: Atmospheric air glide + crisp ceramic impact & meditation chime
 */
export function playTileSmashWhoosh() {
    const ctx = getAudioContext();
    if (!ctx) return;
    unlockAudioContext();

    const now = ctx.currentTime;

    // 1. Air displacement Whoosh (180ms frequency glide)
    const whooshOsc = ctx.createOscillator();
    const whooshFilter = ctx.createBiquadFilter();
    const whooshGain = ctx.createGain();

    whooshOsc.type = 'triangle';
    whooshOsc.frequency.setValueAtTime(240, now);
    whooshOsc.frequency.exponentialRampToValueAtTime(720, now + 0.08);
    whooshOsc.frequency.exponentialRampToValueAtTime(190, now + 0.18);

    whooshFilter.type = 'bandpass';
    whooshFilter.frequency.setValueAtTime(480, now);
    whooshFilter.Q.setValueAtTime(1.8, now);

    whooshGain.gain.setValueAtTime(0.01, now);
    whooshGain.gain.linearRampToValueAtTime(0.14, now + 0.06);
    whooshGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    whooshOsc.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(ctx.destination);

    whooshOsc.start(now);
    whooshOsc.stop(now + 0.19);

    // 2. Ceramic Stone Impact Clack at t + 0.16s
    const impactTime = now + 0.16;
    const impactOsc = ctx.createOscillator();
    const impactGain = ctx.createGain();

    impactOsc.type = 'triangle';
    impactOsc.frequency.setValueAtTime(1600, impactTime);
    impactOsc.frequency.exponentialRampToValueAtTime(380, impactTime + 0.035);

    impactGain.gain.setValueAtTime(0.22, impactTime);
    impactGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.04);

    impactOsc.connect(impactGain);
    impactGain.connect(ctx.destination);

    impactOsc.start(impactTime);
    impactOsc.stop(impactTime + 0.045);

    // 3. Resonant Starlight Bell Chime (528 Hz Love/Dawn harmonic)
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    const baseTuning = (ragaDrone.tuningBase === 432) ? 432 : 440;
    const chimeFreq = (baseTuning === 432) ? 518.4 : 528.0;

    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(chimeFreq, impactTime);

    bellGain.gain.setValueAtTime(0.001, impactTime);
    bellGain.gain.linearRampToValueAtTime(0.20, impactTime + 0.02);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, impactTime + 0.38);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);

    bellOsc.start(impactTime);
    bellOsc.stop(impactTime + 0.40);

    setTimeout(() => {
        try {
            whooshOsc.disconnect(); whooshFilter.disconnect(); whooshGain.disconnect();
            impactOsc.disconnect(); impactGain.disconnect();
            bellOsc.disconnect(); bellGain.disconnect();
        } catch(e){}
    }, 450);
}

/**
 * Blocked Tap: Gentle low-pass hum at 196 Hz (G3), 0.15s duration, soft attack, zero harshness
 */
export function playBlockedWarningChime() {
    const ctx = getAudioContext();
    if (!ctx) return;
    unlockAudioContext();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(196.00, now); // Gentle G3 tone
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.18);

    setTimeout(() => {
        try { osc.disconnect(); filter.disconnect(); gain.disconnect(); } catch(e){}
    }, 250);
}

export function addInstrumentDynamicLayer(instrument) {
    const ctx = getAudioContext();
    if (!ctx) return;
    unlockAudioContext();

    const freq = instrument.freq || 196.0;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 3.2);

    setTimeout(() => {
        try { osc.disconnect(); gain.disconnect(); } catch(e){}
    }, 3500);
}

export function setTuningScale(tuningBase) {
    if (tuningBase === 0 || tuningBase === 'off' || tuningBase === 'disable' || tuningBase === false) {
        ragaDrone.disabled = true;
        ragaDrone.tuningBase = 0;
        stopDroneSynthesizer();
        return;
    }
    ragaDrone.disabled = false;
    ragaDrone.tuningBase = (tuningBase === 440) ? 440 : 432;
    startDroneSynthesizer();
}

export function updateGainVolume(type, value) {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (type === 'raga') {
        ragaDrone.volume = value;
        if (ragaDrone.gainNode) {
            ragaDrone.gainNode.gain.setValueAtTime(value, now);
        }
    } else {
        ragaDrone.gongVolume = value;
        if (gongGainNode) {
            gongGainNode.gain.setValueAtTime(value, now);
        }
    }
}

export const PRAHAR_FREQUENCIES = {
  MORNING: 172.08,
  EVENING: 110.00,
  OVERTONES: [1.47, 2.09, 2.56, 3.12, 4.20]
};

export function calculatePraharFundamental(hour = new Date().getHours()) {
  return (hour >= 5 && hour < 17) ? PRAHAR_FREQUENCIES.MORNING : PRAHAR_FREQUENCIES.EVENING;
}

export function getAudioEngineState() {
  return {
    baseFrequency: ragaDrone.tuningBase,
    volumeRaga: ragaDrone.volume,
    volumeGong: ragaDrone.gongVolume,
    disabled: !!ragaDrone.disabled
  };
}


/**
 * Combo Match Procedural Chime: Scales along a Pythagorean harmonic arpeggio based on 432 Hz tuning.
 * Combo 1: Root Tone (518.4 Hz / C5)
 * Combo 2: Major Third (648.0 Hz / E5)
 * Combo 3: Perfect Fifth (777.6 Hz / G5)
 * Combo 4: Octave (1036.8 Hz / High C6)
 * Combo 5+: Harmonic Serenity Wash (Chord + Shimmer)
 */
export function playComboMatchChime(comboCount = 1) {
    const ctx = getAudioContext();
    if (!ctx) return;
    unlockAudioContext();

    const now = ctx.currentTime;
    const is432 = (ragaDrone.tuningBase === 432);
    const root = is432 ? 518.4 : 528.0;

    // Arpeggio frequency ratios: Root (1.0), Major Third (1.25), Fifth (1.5), Octave (2.0), 9th (2.25)
    const steps = [1.0, 1.25, 1.50, 2.0, 2.25];
    const stepIdx = Math.min(Math.max(0, comboCount - 1), steps.length - 1);
    const freq = root * steps[stepIdx];

    // Primary resonant sine chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = (comboCount >= 4) ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const baseVol = Math.min(0.28, 0.16 + (comboCount * 0.02));
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(baseVol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (comboCount >= 3 ? 0.55 : 0.40));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.60);

    // If combo >= 3, add secondary harmonic overtone
    if (comboCount >= 3) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 1.5, now);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.linearRampToValueAtTime(baseVol * 0.4, now + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.50);
        setTimeout(() => {
            try { osc2.disconnect(); gain2.disconnect(); } catch(e){}
        }, 550);
    }

    setTimeout(() => {
        try { osc.disconnect(); gain.disconnect(); } catch(e){}
    }, 650);
}

/**
 * Tile Settling Sound: Subtle tactile micro-drop when newly unblocked tiles settle
 */
export function playTileSettleSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);

    setTimeout(() => {
        try { osc.disconnect(); gain.disconnect(); } catch(e){}
    }, 100);
}
