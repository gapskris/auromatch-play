// matched Scripture Card and TTS Narration Engine
import { profileState } from '../controllers/storageAdapter.js';

let currentUtterance = null;
const glossaryDict = {
    "sadhana": "A dedicated spiritual practice or effort undertaken to align one\'s outer nature with the inner soul.",
    "consecration": "The act of offering all thoughts, movements, and physical actions to the Divine Mother\'s force.",
    "transformation": "The ultimate change of the mental, vital, and physical nature into a supramental consciousness."
};

export function displayMatchedScriptureCard(tile, overlayId, cardIconId, cardTitleId, cardQualityId, cardDescId) {
    let title = tile.name;
    let sub = tile.quality;
    let text = tile.desc;
    
    // Secular Toggle terminology replacements
    if (profileState.settings.secularToggle) {
        if (sub === 'Divine Presence') sub = 'Internal Awareness';
        else if (sub === 'Devotion') sub = 'Commitment';
        else if (sub === 'Love for the Divine') sub = 'Universal Compassion';
    }
    
    const iconDiv = document.getElementById(cardIconId);
    if (iconDiv) {
        iconDiv.innerText = tile.symbol;
        iconDiv.className = `match-card-icon ${tile.class}`;
    }
    
    const titleH = document.getElementById(cardTitleId);
    if (titleH) titleH.innerText = title;
    
    const qualityDiv = document.getElementById(cardQualityId);
    if (qualityDiv) qualityDiv.innerText = sub;
    
    // Highlight glossary terms
    let highlightedText = text;
    const terms = ["Sadhana", "Consecration", "Transformation"];
    terms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, `<span class="glossary-term" data-glossary="${term.toLowerCase()}">${term}</span>`);
    });
    
    const descP = document.getElementById(cardDescId);
    if (descP) descP.innerHTML = highlightedText;
    
    const overlay = document.getElementById(overlayId);
    if (overlay) overlay.style.display = 'flex';
}

export function playMeditativeSpeech() {
    const descP = document.getElementById('card-desc');
    if (!descP) return;
    const quoteText = descP.innerText;
    if (!quoteText) return;
    
    stopSpeechSynthesis();
    
    const utterance = new SpeechSynthesisUtterance(quoteText);
    utterance.rate = profileState.settings.speechRate;
    utterance.pitch = profileState.settings.speechPitch;
    
    const voices = window.speechSynthesis.getVoices();
    if (profileState.profile.voiceTonePreference === 'french_cadence') {
        const frVoice = voices.find(v => v.lang.startsWith('fr'));
        if (frVoice) utterance.voice = frVoice;
    } else {
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
    }
    
    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
}

export function stopSpeechSynthesis() {
    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    currentUtterance = null;
}

export function speakCustomSpeech(text) {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
    stopSpeechSynthesis();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = (profileState.settings && profileState.settings.speechRate) || 1.0;
    utterance.pitch = (profileState.settings && profileState.settings.speechPitch) || 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (profileState.profile && profileState.profile.voiceTonePreference === 'french_cadence') {
        const frVoice = voices.find(v => v.lang && v.lang.startsWith('fr'));
        if (frVoice) utterance.voice = frVoice;
    } else {
        const enVoice = voices.find(v => v.lang && v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
    }

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
}

export function openGlossaryOverlaySheet(termKey, sheetId, sheetTitleId, sheetDescId) {
    const sheet = document.getElementById(sheetId);
    const titleH = document.getElementById(sheetTitleId);
    const descP = document.getElementById(sheetDescId);
    
    if (!sheet || !titleH || !descP) return;
    
    const title = termKey.charAt(0).toUpperCase() + termKey.slice(1);
    const desc = glossaryDict[termKey] || "Spiritual definition.";
    
    titleH.innerText = title;
    descP.innerText = desc;
    sheet.classList.add('active');
}
export { glossaryDict };
