// Settings Preferences Controller
import { profileState, saveProfileState } from './storageAdapter.js';
import { updateGainVolume } from '../audio/synthesizer.js';

export function updateVolumeSetting(type, val) {
    const floatVal = parseFloat(val);
    if (type === 'raga') {
        profileState.settings.volumeRaga = floatVal;
    } else {
        profileState.settings.volumeGong = floatVal;
    }
    updateGainVolume(type, floatVal);
    saveProfileState();
}

export function updateVoicePreference(value) {
    profileState.profile.voiceTonePreference = value;
    saveProfileState();
}

export function updateSanctuaryMode(value) {
    profileState.profile.sanctuaryMode = value;
    if (value === 'secular') {
        profileState.settings.secularToggle = true;
    } else {
        profileState.settings.secularToggle = false;
    }
    saveProfileState();
}

export function toggleSecularTerminology(checked) {
    profileState.settings.secularToggle = checked;
    saveProfileState();
}

export function updateExperienceMode(mode) {
    profileState.settings.experienceMode = mode;
    saveProfileState();
}
