import { ACCENTS } from '../utils/constants';

class SpeechEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.onVoicesReady = null;
    
    // Load voices
    this._loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = this._loadVoices.bind(this);
    }
  }

  _loadVoices() {
    this.voices = this.synth.getVoices();
    if (this.voices.length > 0 && this.onVoicesReady) {
      this.onVoicesReady(this.voices);
    }
  }

  getAvailableVoices() {
    return this.voices;
  }

  getDefaultVoiceForAccent(accentCode) {
    if (!this.voices.length) return null;
    
    // 1. Try exact match for locale (e.g., en-US)
    const exactMatches = this.voices.filter(v => v.lang === accentCode);
    
    // 2. Try prefix match (e.g., en)
    const prefixMatches = this.voices.filter(v => v.lang.startsWith(accentCode.split('-')[0]));
    
    // Priority: Google Native > Exact Match > Any Match
    const bestMatch = 
      exactMatches.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) ||
      exactMatches[0] || 
      prefixMatches[0] ||
      this.voices[0];
      
    return bestMatch;
  }

  getVoiceForChinese() {
    return this.voices.find(v => v.lang.startsWith('zh')) || this.voices[0];
  }

  speak(text, { accent = ACCENTS.US, rate = 1.0, isChinese = false, onEnd = null }) {
    if (!text || !this.synth) {
      console.warn("SpeechEngine: text is empty or synth not available", { text });
      if (onEnd) onEnd();
      return;
    }

    // Cancel current speech before speaking new one
    this.synth.cancel();

    // Small delay to ensure cancel is fully processed
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Setup Voice
      if (this.voices.length === 0) {
        this.voices = this.synth.getVoices();
        console.log("SpeechEngine: Reloaded voices", this.voices.length);
      }

      const voice = isChinese 
        ? this.getVoiceForChinese() 
        : this.getDefaultVoiceForAccent(accent);
        
      if (voice) {
        utterance.voice = voice;
        console.log("SpeechEngine: Selected voice", voice.name);
      } else {
        console.warn("SpeechEngine: No suitable voice found for", isChinese ? "Chinese" : accent);
      }

      // Adjust parameters
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = isChinese ? 'zh-TW' : accent;
      
      if (onEnd) {
        utterance.onend = () => {
          console.log("SpeechEngine: Finished speaking");
          onEnd();
        };
        utterance.onerror = (e) => {
          console.error("SpeechEngine Error:", e);
          onEnd(); // proceed even if error
        };
      } else {
        utterance.onerror = (e) => {
          console.error("SpeechEngine Error (no onEnd handler):", e);
        };
      }

      // *** CRITICAL FIX FOR CHROME BUG ***
      // Store utterance globally to prevent it from being garbage collected mid-speech
      window.currentlyPlayingUtterance = utterance;

      console.log("SpeechEngine: START speaking...", text);
      this.synth.speak(utterance);
      
      // Fix edge case where speaking stuck in paused state
      if (this.synth.paused) {
        this.synth.resume();
      }

    }, 50);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      window.currentlyPlayingUtterance = null;
    }
  }
}

// Singleton pattern
export const speechEngine = new SpeechEngine();
