import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechAssistantProps {
  language: 'mn' | 'en' | 'ja';
  wakeWord?: string;
  onCommandRecognized: (command: string) => void;
  voiceEnabled?: boolean;
}

export function useSpeechAssistant({
  language,
  wakeWord = 'sain uu',
  onCommandRecognized,
  voiceEnabled = true,
}: UseSpeechAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onCommandRef = useRef(onCommandRecognized);

  useEffect(() => {
    onCommandRef.current = onCommandRecognized;
  }, [onCommandRecognized]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'mn' ? 'mn-MN' : language === 'ja' ? 'ja-JP' : 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        const trimmed = currentTranscript.trim();
        setTranscript(trimmed);

        // Check wake word if set
        const lower = trimmed.toLowerCase();
        const wakeLower = wakeWord.toLowerCase();

        if (lower.includes(wakeLower) || lower.includes('сайн уу') || lower.includes('hey assistant')) {
          setWakeWordDetected(true);
          setTimeout(() => setWakeWordDetected(false), 3000);
        }

        // If speech segment is final
        if (event.results[event.results.length - 1].isFinal && trimmed.length > 0) {
          // Clean wake word from command if present
          let cleanCommand = trimmed;
          if (cleanCommand.toLowerCase().startsWith(wakeLower)) {
            cleanCommand = cleanCommand.slice(wakeLower.length).trim();
          } else if (cleanCommand.toLowerCase().startsWith('сайн уу')) {
            cleanCommand = cleanCommand.slice('сайн уу'.length).trim();
          }

          if (cleanCommand.length > 0) {
            onCommandRef.current(cleanCommand);
            setTranscript('');
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [language, wakeWord, isListening]);

  const toggleListening = useCallback(() => {
    if (!isSupported) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    } else {
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Error starting recognition', err);
      }
    }
  }, [isListening, isSupported]);

  const speak = useCallback(
    (text: string) => {
      try {
        if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        // Select matching voice if available
        const voices = window.speechSynthesis.getVoices?.() || [];
        if (language === 'mn') {
          const mnVoice = voices.find((v) => v.lang.startsWith('mn'));
          if (mnVoice) utterance.voice = mnVoice;
        } else if (language === 'ja') {
          const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
          if (jaVoice) utterance.voice = jaVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error or blocked:', err);
        setIsSpeaking(false);
      }
    },
    [voiceEnabled, language]
  );

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    transcript,
    wakeWordDetected,
    toggleListening,
    speak,
    stopSpeaking,
  };
}
