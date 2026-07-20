import React, { useEffect, useState } from 'react';
import { Mic, MicOff, X, Volume2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (transcript: string) => void;
}

const VoiceSearchModal: React.FC<VoiceSearchModalProps> = ({ isOpen, onClose, onSearch }) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Check for native Speech Recognition API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Web Speech API is not supported in this browser. Mocking recognition.');
      return;
    }

    const recInstance = new SpeechRecognition();
    recInstance.continuous = false;
    recInstance.interimResults = true;
    recInstance.lang = 'en-US';

    recInstance.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recInstance.onerror = (e: any) => {
      console.error(e);
      setError('Microphone access denied or audio issue encountered.');
      setIsListening(false);
    };

    recInstance.onend = () => {
      setIsListening(false);
    };

    recInstance.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      // Auto trigger search if final result is set
      if (event.results[current].isFinal) {
        setTimeout(() => {
          onSearch(text);
          onClose();
        }, 1200);
      }
    };

    setRecognition(recInstance);

    // Auto trigger listening
    try {
      recInstance.start();
    } catch (e) {
      console.error(e);
    }

    return () => {
      try {
        recInstance.stop();
      } catch (e) {}
    };
  }, [isOpen]);

  const toggleListening = () => {
    if (!recognition) {
      // Simulator fallback if Web Speech is missing
      if (isListening) {
        setIsListening(false);
      } else {
        setIsListening(true);
        setTranscript('Listening for query...');
        setTimeout(() => {
          setTranscript('Veloce Running Shoes');
          setTimeout(() => {
            onSearch('Veloce Running Shoes');
            onClose();
          }, 1000);
        }, 1500);
      }
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      recognition.start();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col items-center justify-center relative text-center text-xs"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full hover:bg-secondary p-1.5 transition-colors cursor-pointer text-muted-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-extrabold text-sm mb-2 text-foreground flex items-center gap-1.5">
              <Mic className="h-4.5 w-4.5 text-primary" />
              <span>Voice Assist Search</span>
            </h3>
            
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mb-8">
              Speak product names, categories, or discounts. The search triggers automatically when you pause.
            </p>

            {/* Listening Waveform Animation */}
            <div className="relative flex justify-center items-center h-28 w-28 mb-8">
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.6, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-primary/10 rounded-full border border-primary/20"
                  />
                  <motion.div
                    animate={{ scale: [1, 2.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                    className="absolute inset-0 bg-primary/5 rounded-full border border-primary/10"
                  />
                </>
              )}
              
              <button
                onClick={toggleListening}
                className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg border border-white/5 cursor-pointer transition-all ${
                  isListening
                    ? 'bg-primary text-primary-foreground hover:bg-primary/95'
                    : 'bg-muted text-muted-foreground hover:bg-secondary'
                }`}
              >
                {isListening ? <Volume2 className="h-8 w-8 animate-pulse" /> : <MicOff className="h-8 w-8" />}
              </button>
            </div>

            {/* Transcript Area */}
            <div className="w-full bg-secondary/30 border border-border p-4 rounded-xl min-h-[70px] flex items-center justify-center mb-4">
              <p className={`font-semibold text-sm leading-relaxed ${transcript ? 'text-foreground' : 'text-muted-foreground animate-pulse'}`}>
                {transcript || 'Say "Veloce Shoes" or "active discounts"...'}
              </p>
            </div>

            {error && (
              <span className="text-[10px] text-amber-500 font-bold max-w-xs leading-normal">
                {error}
              </span>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoiceSearchModal;
