import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon, CheckIcon, XIcon, SpeakerIcon } from './icons';
import { GoogleGenAI, Modality } from '@google/genai';

interface ListeningGameProps {
    contentItems: ContentItem[];
    onBack: () => void;
}

// Helper function to decode Base64 string to Uint8Array
function decode(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper function to decode raw PCM audio data into an AudioBuffer
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


interface GameQuestion {
    audioText: string;
    options: string[];
    correctAnswer: string;
}

const generateQuestions = (items: ContentItem[], count: number): GameQuestion[] => {
    if (items.length < 4) return [];

    const shuffledItems = [...items].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, count);

    return selectedItems.map(item => {
        const correctAnswer = item.English;
        const distractors = shuffledItems
            .filter(distractor => distractor.English !== item.English)
            .slice(0, 3)
            .map(d => d.English);
        
        const options = [...new Set([correctAnswer, ...distractors])];
        while (options.length < 4 && shuffledItems.length > options.length) {
            const nextOption = shuffledItems.find(i => !options.includes(i.English))?.English;
            if(nextOption) options.push(nextOption);
            else break;
        }

        return {
            audioText: item.Hiragana,
            options: options.sort(() => 0.5 - Math.random()),
            correctAnswer,
        };
    });
};

const ListeningGame: React.FC<ListeningGameProps> = ({ contentItems, onBack }) => {
    const [ai, setAi] = useState<GoogleGenAI | null>(null);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    
    const [questions, setQuestions] = useState<GameQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    
    const [isAudioLoading, setIsAudioLoading] = useState(false); // For when user clicks and audio isn't ready
    const [audioCache, setAudioCache] = useState<Map<string, AudioBuffer>>(new Map());
    const [fetchingAudio, setFetchingAudio] = useState<Set<string>>(new Set());

    const [error, setError] = useState<string | null>(null);

    const gameItems = useMemo(() => contentItems.filter(item => item.Category === 'Vocabulary'), [contentItems]);

    // Initialize AI and AudioContext
    useEffect(() => {
        try {
            setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
            setAudioContext(new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 }));
        } catch (e) {
            console.error("Error initializing:", e);
            setError("Could not initialize audio system. Please use a modern browser.");
        }
    }, []);

    // Generate questions when content is available
    useEffect(() => {
        if (gameItems.length >= 4) {
            setQuestions(generateQuestions(gameItems, Math.min(10, gameItems.length)));
        }
    }, [gameItems]);

    const playWithBrowserTTS = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) {
            setError("AI voice failed and your browser doesn't support a fallback.");
            setIsAudioLoading(false);
            return;
        }

        const speak = () => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const japaneseVoice = voices.find(voice => voice.lang === 'ja-JP');
            
            if (japaneseVoice) utterance.voice = japaneseVoice;
            
            utterance.lang = 'ja-JP';
            utterance.rate = 0.9;
            utterance.onend = () => setIsAudioLoading(false);
            utterance.onerror = (e) => {
                console.error("Browser TTS Error:", e);
                setError("The fallback voice also failed to play.");
                setIsAudioLoading(false);
            };
            
            window.speechSynthesis.speak(utterance);
        };
        
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = speak;
        } else {
            speak();
        }
    }, []);

    const fetchAndCacheAudio = useCallback(async (text: string): Promise<boolean> => {
        if (!ai || !audioContext || audioCache.has(text) || fetchingAudio.has(text)) {
            return true;
        }
        
        const cleanedText = text.split(/[\(\/]/)[0].trim();

        setFetchingAudio(prev => new Set(prev).add(text));

        const MAX_RETRIES = 2;
        for (let i = 0; i <= MAX_RETRIES; i++) {
             try {
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-preview-tts",
                    contents: [{ parts: [{ text: cleanedText }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    },
                });
                const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    const audioBytes = decode(base64Audio);
                    const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
                    setAudioCache(prev => new Map(prev).set(text, audioBuffer));
                    setFetchingAudio(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(text);
                        return newSet;
                    });
                    return true;
                } else {
                    // Successful response, but no audio data. Fallback immediately.
                    console.warn("AI request succeeded but returned no audio data. Falling back to TTS.");
                    break; // Exit retry loop
                }
            } catch (e) {
                console.error(`Attempt ${i + 1}/${MAX_RETRIES + 1} failed to fetch AI audio:`, e);
                if (i === MAX_RETRIES) {
                    // Last attempt failed
                    break;
                }
                 // Wait before retrying
                 await new Promise(res => setTimeout(res, 500 * (i + 1)));
            }
        }
        
        // This part is reached on failure or empty response
        setFetchingAudio(prev => {
            const newSet = new Set(prev);
            newSet.delete(text);
            return newSet;
        });
        
        return false;
    }, [ai, audioContext, audioCache, fetchingAudio]);

    // Pre-fetch initial and subsequent audio clips
    useEffect(() => {
        if (questions.length > 0 && ai && audioContext) {
            // Pre-fetch current question if not already cached/fetching
            fetchAndCacheAudio(questions[currentIndex].audioText);
            
            // Pre-fetch next question
            const nextIndex = currentIndex + 1;
            if (nextIndex < questions.length) {
                fetchAndCacheAudio(questions[nextIndex].audioText);
            }
        }
    }, [questions, currentIndex, ai, audioContext, fetchAndCacheAudio]);

    const playAudio = useCallback(async (text: string) => {
        if (!audioContext) return;
        if (audioContext.state === 'suspended') await audioContext.resume();

        setIsAudioLoading(true);
        setError(null);
        
        const cachedBuffer = audioCache.get(text);
        if (cachedBuffer) {
            const source = audioContext.createBufferSource();
            source.buffer = cachedBuffer;
            source.connect(audioContext.destination);
            source.onended = () => setIsAudioLoading(false);
            source.start();
        } else {
            const success = await fetchAndCacheAudio(text);
            if (success && audioCache.has(text)) {
                const newBuffer = audioCache.get(text)!;
                const source = audioContext.createBufferSource();
                source.buffer = newBuffer;
                source.connect(audioContext.destination);
                source.onended = () => setIsAudioLoading(false);
                source.start();
            } else {
                setError("Premium AI voice unavailable, using standard voice.");
                playWithBrowserTTS(text.split(/[\(\/]/)[0].trim());
            }
        }
    }, [audioContext, audioCache, fetchAndCacheAudio, playWithBrowserTTS]);
    
    const handleAnswerSelect = (answer: string) => {
        if (isAnswered) return;
        setSelectedAnswer(answer);
        setIsAnswered(true);
        if (answer === questions[currentIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setError(null);
        } else {
            setIsFinished(true);
        }
    };
    
    const restartGame = () => {
        const newQuestions = generateQuestions(gameItems, Math.min(10, gameItems.length));
        setQuestions(newQuestions);
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setIsFinished(false);
        setError(null);
        setAudioCache(new Map()); // Clear cache for new game
    };
    
    if (gameItems.length < 4) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-500 dark:text-slate-400 text-lg">Not enough vocabulary items to start a listening game (need at least 4).</p>
                <button onClick={onBack} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400">Game Complete!</h2>
                <p className="text-xl mt-4 text-slate-800 dark:text-slate-200">Your Score: <span className="font-bold text-slate-900 dark:text-white">{score} / {questions.length}</span></p>
                <div className="flex gap-4 mt-8">
                    <button onClick={restartGame} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Try Again</button>
                    <button onClick={onBack} className="px-6 py-2 bg-slate-500 dark:bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors">Change Activity</button>
                </div>
            </div>
        );
    }
    
    if (questions.length === 0) return (
         <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">Preparing questions...</p>
        </div>
    );

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex flex-col h-full w-full relative">
            <button onClick={onBack} className="absolute top-0 left-0 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <BackArrowIcon className="w-8 h-8"/>
            </button>
            <div className="text-center mb-6">
                 <p className="text-slate-500 dark:text-slate-400">Question {currentIndex + 1} of {questions.length} • Score: {score}</p>
                 <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mt-2">
                    <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-8 text-center my-auto transition-colors duration-300 min-h-[150px] flex flex-col justify-center items-center">
                <p className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-6">Listen and choose the translation:</p>
                <button
                    onClick={() => playAudio(currentQuestion.audioText)}
                    disabled={isAudioLoading}
                    className="w-24 h-24 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed transform hover:scale-105"
                    aria-label="Play audio"
                >
                    {isAudioLoading ? (
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
                    ) : (
                        <SpeakerIcon className="w-12 h-12" />
                    )}
                </button>
                {error && <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-4">{error}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {currentQuestion.options.map((option, index) => {
                    const isCorrect = option === currentQuestion.correctAnswer;
                    let buttonClass = 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600';
                    if (isAnswered && selectedAnswer === option) {
                        buttonClass = isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600';
                    } else if (isAnswered && isCorrect) {
                         buttonClass = 'bg-green-500 opacity-70';
                    }

                    return (
                        <button key={index} onClick={() => handleAnswerSelect(option)} disabled={isAnswered} className={`p-4 rounded-lg font-medium transition-colors text-left flex justify-between items-center ${buttonClass}`}>
                            <p className="text-lg text-slate-900 dark:text-white">{option}</p>
                            {isAnswered && selectedAnswer === option && (isCorrect ? <CheckIcon className="w-6 h-6 text-white flex-shrink-0"/> : <XIcon className="w-6 h-6 text-white flex-shrink-0"/>)}
                        </button>
                    );
                })}
            </div>
             {isAnswered && (
                <button onClick={handleNext} className="mt-6 w-full py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                    {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Game'}
                </button>
            )}
        </div>
    );
};

export default ListeningGame;