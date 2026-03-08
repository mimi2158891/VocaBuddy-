import { useState, useCallback, useEffect } from 'react';
import { speechEngine } from '../services/speechEngine';
import { ACCENTS } from '../utils/constants';

export function useSpeech() {
  const [voices, setVoices] = useState([]);
  const [accent, setAccent] = useState(() => {
    return localStorage.getItem('user_accent') || ACCENTS.US;
  });
  const [speed, setSpeed] = useState(() => {
    return parseFloat(localStorage.getItem('user_speed')) || 1.0;
  });

  // Handle async voice loading
  useEffect(() => {
    const loadedVoices = speechEngine.getAvailableVoices();
    if (loadedVoices.length > 0) {
      setVoices(loadedVoices);
    }
    
    // Register callback for when voices are ready (some browsers load async)
    speechEngine.onVoicesReady = (v) => {
      setVoices(v);
    };
  }, []);

  const changeAccent = (newAccent) => {
    setAccent(newAccent);
    localStorage.setItem('user_accent', newAccent);
  };

  const changeSpeed = (newSpeed) => {
    setSpeed(newSpeed);
    localStorage.setItem('user_speed', newSpeed.toString());
  };

  const speakWord = useCallback((word, customAccent = null) => {
    speechEngine.speak(word, {
      accent: customAccent || accent,
      rate: speed,
      isChinese: false
    });
  }, [accent, speed]);

  const speakChinese = useCallback((text) => {
    speechEngine.speak(text, {
      rate: speed,
      isChinese: true
    });
  }, [speed]);
  
  const stopSpeaking = useCallback(() => {
    speechEngine.stop();
  }, []);

  return {
    voices,
    accent,
    speed,
    changeAccent,
    changeSpeed,
    speakWord,
    speakChinese,
    stopSpeaking,
    engine: speechEngine
  };
}
