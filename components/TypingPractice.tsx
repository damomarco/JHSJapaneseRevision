import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon, CheckIcon, XIcon } from './icons';
import { shuffleArray } from './languageUtils';

interface TypingPracticeProps {
    contentItems: ContentItem[];
    onBack: () => void;
}

// --- Helper functions for Kana conversion ---

const isKatakana = (text: string): boolean => /[\u30A0-\u30FF]/.test(text);

const hiraganaToKatakana = (hiragana: string): string => {
    return hiragana.replace(/[\u3041-\u3096]/g, char => 
        String.fromCharCode(char.charCodeAt(0) + 96)
    );
};

const HIRAGANA_MAP: { [key: string]: string } = {
    'a':'あ','i':'い','u':'う','e':'え','o':'お',
    'ka':'か','ki':'き','ku':'く','ke':'け','ko':'こ',
    'sa':'さ','shi':'し','su':'す','se':'せ','so':'そ',
    'ta':'た','chi':'ち','tsu':'つ','te':'て','to':'と',
    'na':'な','ni':'に','nu':'ぬ','ne':'ね','no':'の',
    'ha':'は','hi':'ひ','fu':'ふ','he':'へ','ho':'ほ',
    'ma':'ま','mi':'み','mu':'む','me':'め','mo':'も',
    'ya':'や','yu':'ゆ','yo':'よ',
    'ra':'ら','ri':'り','ru':'る','re':'れ','ro':'ろ',
    'wa':'わ','wo':'を', 'nn':'ん',
    'ga':'が','gi':'ぎ','gu':'ぐ','ge':'げ','go':'ご',
    'za':'ざ','ji':'じ','zu':'ず','ze':'ぜ','zo':'ぞ',
    'da':'だ','di':'ぢ','du':'づ','de':'で','do':'ど',
    'ba':'ば','bi':'び','bu':'ぶ','be':'べ','bo':'ぼ',
    'pa':'ぱ','pi':'ぴ','pu':'ぷ','pe':'ぺ','po':'ぽ',
    'kya':'きゃ','kyu':'きゅ','kyo':'きょ',
    'sha':'しゃ','shu':'しゅ','sho':'しょ',
    'cha':'ちゃ','chu':'ちゅ','cho':'ちょ',
    'nya':'にゃ','nyu':'にゅ','nyo':'にょ',
    'hya':'ひゃ','hyu':'ひゅ','hyo':'ひょ',
    'mya':'みゃ','myu':'みゅ','myo':'みょ',
    'rya':'りゃ','ryu':'りゅ','ryo':'りょ',
    'gya':'ぎゃ','gyu':'ぎゅ','gyo':'ぎょ',
    'ja':'じゃ','ju':'じゅ','jo':'じょ',
    'bya':'びゃ','byu':'びゅ','byo':'びょ',
    'pya':'ぴゃ','pyu':'ぴゅ','pyo':'ぴょ',
    '-':'ー',
};

const KATAKANA_MAP: { [key: string]: string } = Object.fromEntries(
    Object.entries(HIRAGANA_MAP).map(([romaji, hira]) => [romaji, hiraganaToKatakana(hira)])
);


const convertRomajiToKana = (romaji: string, mode: 'hiragana' | 'katakana'): string => {
    const map = mode === 'hiragana' ? HIRAGANA_MAP : KATAKANA_MAP;
    const sokuon = mode === 'hiragana' ? 'っ' : 'ッ';
    const syllabicN = mode === 'hiragana' ? 'ん' : 'ン';
    
    let kana = '';
    let tempRomaji = romaji.toLowerCase();

    while (tempRomaji.length > 0) {
        let foundMatch = false;

        // sokuon (っ/ッ) for double consonants
        if (tempRomaji.length > 1 && tempRomaji[0] !== 'n' && 'bcdfghjklmpqrstvwxyz'.includes(tempRomaji[0]) && tempRomaji[0] === tempRomaji[1]) {
            kana += sokuon;
            tempRomaji = tempRomaji.substring(1);
            continue;
        }

        // Check for longest possible match (3 chars, then 2, then 1)
        for (let len = 3; len >= 1; len--) {
            if (tempRomaji.length >= len) {
                const sub = tempRomaji.substring(0, len);
                if (map[sub]) {
                    kana += map[sub];
                    tempRomaji = tempRomaji.substring(len);
                    foundMatch = true;
                    break;
                }
            }
        }
        
        if (foundMatch) continue;

        // Syllabic 'n' (ん/ン) handling
        if (tempRomaji.startsWith('n')) {
            // Only convert 'n' to 'ん' if it's followed by a consonant (and not 'y'),
            // but not if it's the last character in the input string.
            // 'nn' is handled by the map directly.
            if (tempRomaji.length > 1 && !'aiueoy'.includes(tempRomaji[1])) {
                kana += syllabicN;
                tempRomaji = tempRomaji.substring(1);
                continue;
            }
        }
        
        // If no match found, append the character as is (e.g., for intermediate typing)
        if (tempRomaji.length > 0) {
            kana += tempRomaji[0];
            tempRomaji = tempRomaji.substring(1);
        }
    }
    return kana;
};

const MAX_QUESTIONS = 10;
const MIN_ITEMS = 5;

const TypingPractice: React.FC<TypingPracticeProps> = ({ contentItems, onBack }) => {
    const [mode, setMode] = useState<'hiragana' | 'katakana'>('hiragana');
    const [questions, setQuestions] = useState<ContentItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [romajiInput, setRomajiInput] = useState('');
    const [hiraganaOutput, setHiraganaOutput] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const gameItems = useMemo(() => {
         const filteredByMode = contentItems.filter(item => {
            const isTargetKanaType = mode === 'katakana' ? isKatakana(item.Hiragana) : !isKatakana(item.Hiragana);
            return item.Category === 'Vocabulary' && !item.Romaji.includes(' ') && isTargetKanaType;
        });
        return filteredByMode;
    }, [contentItems, mode]);

    const setupGame = useCallback(() => {
        const selectedQuestions = shuffleArray(gameItems).slice(0, MAX_QUESTIONS);
        setQuestions(selectedQuestions);
        setCurrentIndex(0);
        setScore(0);
        setRomajiInput('');
        setHiraganaOutput('');
        setIsAnswered(false);
        setIsCorrect(false);
        setIsFinished(false);
        setTimeout(() => inputRef.current?.focus(), 0);
    }, [gameItems]);

    useEffect(() => {
        setupGame();
    }, [mode, setupGame]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newRomaji = e.target.value;
        setRomajiInput(newRomaji);
        setHiraganaOutput(convertRomajiToKana(newRomaji, mode));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAnswered || !romajiInput) return;

        const correctAnswer = questions[currentIndex]?.Hiragana.split(/[\(\/]/)[0].trim();
        const correct = hiraganaOutput === correctAnswer;
        
        setIsCorrect(correct);
        setIsAnswered(true);
        if (correct) {
            setScore(prev => prev + 1);
        }
    };
    
    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setRomajiInput('');
            setHiraganaOutput('');
            setIsAnswered(false);
            setIsCorrect(false);
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setIsFinished(true);
        }
    };

    if (gameItems.length < MIN_ITEMS) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-500 dark:text-slate-400 text-lg">Not enough <span className="font-semibold">{mode}</span> vocabulary items to start this game (need at least {MIN_ITEMS}). Try different units.</p>
                <div className="flex justify-center my-4 rounded-lg bg-slate-200 dark:bg-slate-700 p-1 max-w-xs mx-auto">
                    <button 
                        onClick={() => setMode('hiragana')}
                        className={`w-1/2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'hiragana' ? 'bg-white dark:bg-slate-800 shadow text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}
                        aria-pressed={mode === 'hiragana'}
                    >
                        Hiragana
                    </button>
                    <button 
                        onClick={() => setMode('katakana')}
                        className={`w-1/2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'katakana' ? 'bg-white dark:bg-slate-800 shadow text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}
                        aria-pressed={mode === 'katakana'}
                    >
                        Katakana
                    </button>
                </div>
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
                    <button onClick={setupGame} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Play Again</button>
                    <button onClick={onBack} className="px-6 py-2 bg-slate-500 dark:bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors">Change Activity</button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) return null;

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex flex-col h-full w-full relative">
            <button onClick={onBack} className="absolute top-0 left-0 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <BackArrowIcon className="w-8 h-8"/>
            </button>
            <div className="text-center mb-2">
                 <p className="text-slate-500 dark:text-slate-400">Question {currentIndex + 1} of {questions.length} • Score: {score}</p>
                 <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mt-2">
                    <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
            </div>
             <div className="flex justify-center my-4 rounded-lg bg-slate-200 dark:bg-slate-700 p-1 max-w-xs mx-auto">
                <button 
                    onClick={() => setMode('hiragana')}
                    className={`w-1/2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'hiragana' ? 'bg-white dark:bg-slate-800 shadow text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}
                    aria-pressed={mode === 'hiragana'}
                >
                    Hiragana
                </button>
                <button 
                    onClick={() => setMode('katakana')}
                    className={`w-1/2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'katakana' ? 'bg-white dark:bg-slate-800 shadow text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300'}`}
                    aria-pressed={mode === 'katakana'}
                >
                    Katakana
                </button>
            </div>

            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 text-center my-auto transition-colors duration-300">
                <p className="text-sm text-slate-500 dark:text-slate-400">Type the Japanese for:</p>
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{currentQuestion.English}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col items-center">
                <div className={`w-full max-w-md rounded-lg p-4 mb-2 transition-colors duration-200
                    ${isAnswered ? (isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50') : 'bg-slate-200 dark:bg-slate-800'}`}>
                    <p className="text-center text-4xl font-bold text-slate-800 dark:text-slate-100 min-h-[3rem]" aria-live="polite">
                        {hiraganaOutput || <span className="text-slate-400 dark:text-slate-600">...</span>}
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={romajiInput}
                    onChange={handleInputChange}
                    disabled={isAnswered}
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full max-w-md p-4 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-center text-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    aria-label="Romaji input"
                />

                {isAnswered && (
                    <div className="mt-4 text-center w-full max-w-md">
                        <div className="flex items-center justify-center gap-2">
                            {isCorrect ? 
                                <CheckIcon className="w-7 h-7 text-green-500" /> : 
                                <XIcon className="w-7 h-7 text-red-500" />
                            }
                            <p className={`text-xl font-bold ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isCorrect ? 'Correct!' : 'Not quite!'}
                            </p>
                        </div>
                        {!isCorrect && <p className="text-slate-600 dark:text-slate-400 mt-1">Correct answer: <span className="font-bold">{currentQuestion.Hiragana}</span> ({currentQuestion.Romaji})</p>}
                        <button type="button" onClick={handleNext} className="mt-4 w-full py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Game'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default TypingPractice;