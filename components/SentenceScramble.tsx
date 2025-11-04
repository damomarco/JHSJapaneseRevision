import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon } from './icons';
import { GoogleGenAI, Type } from '@google/genai';
import { createTokenizer, createRomajiConverter } from './languageUtils';

interface SentenceScrambleProps {
    contentItems: ContentItem[];
    onBack: () => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

interface ScrambleQuestion {
    english: string;
    japanese: string;
    words: string[];
}

const MAX_QUESTIONS = 8;

const SentenceScramble: React.FC<SentenceScrambleProps> = ({ contentItems, onBack }) => {
    const [questions, setQuestions] = useState<ScrambleQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswer, setUserAnswer] = useState<{word: string, originalIndex: number}[]>([]);
    const [scrambledOptions, setScrambledOptions] = useState<{word: string, originalIndex: number}[]>([]);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generationTrigger, setGenerationTrigger] = useState(0);

    const vocabularyItems = useMemo(() => {
        return contentItems.filter(item => item.Category === 'Vocabulary' || (item.Category === 'Grammar' && item.SubCategory.startsWith('Verb')));
    }, [contentItems]);

    const tokenizer = useMemo(() => createTokenizer(contentItems), [contentItems]);
    const getRomajiForPart = useMemo(() => createRomajiConverter(contentItems), [contentItems]);

    useEffect(() => {
        const generateSentences = async () => {
            if (vocabularyItems.length < 10) {
                 setError("Not enough vocabulary in the selected units to generate sentences.");
                 setIsLoading(false);
                 return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const vocabList = shuffleArray(vocabularyItems).slice(0, 75).map((item: ContentItem) => `- ${item.Hiragana.split('/')[0].trim()} (${item.English})`).join('\n');
                
                const themes = [
                    "daily activities at home", "talking about school life", "weekend plans with friends", 
                    "hobbies and interests", "food and meals", "shopping in town", "describing pets and family"
                ];
                const randomTheme = themes[Math.floor(Math.random() * themes.length)];

                const prompt = `
                    You are a Japanese language teacher creating quiz questions for junior high school students.
                    Your task is to generate ${MAX_QUESTIONS} unique and varied, simple, grammatically correct Japanese sentences.
                    The sentences should be about the theme of "${randomTheme}".

                    **Instructions:**
                    1. You MUST ONLY use words from the following list. Each word is provided with its English meaning:
                       ${vocabList}
                    2. Ensure the sentences are diverse. Avoid using the exact same sentence structure for every sentence. Create a mix of questions, statements, and descriptions.
                    3. Each sentence must be unique.
                    4. The sentences must be suitable for a beginner Japanese learner.
                    5. For each sentence you generate, provide its simple English translation.
                    
                    Return the result as a JSON array of objects.
                `;

                const schema = {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            japanese: { 
                                type: Type.STRING,
                                description: "The generated Japanese sentence in Hiragana/Katakana."
                            },
                            english: {
                                type: Type.STRING,
                                description: "The English translation of the sentence."
                             }
                        },
                        required: ['japanese', 'english']
                    }
                };
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema,
                        temperature: 0.9,
                    },
                });

                const generatedData = JSON.parse(response.text) as { japanese: string; english: string }[];
                
                const generatedQuestions = generatedData.map(item => {
                    const cleanJapanese = item.japanese.replace(/[()（）]/g, '');
                    return {
                        english: item.english,
                        japanese: cleanJapanese,
                        words: tokenizer(cleanJapanese)
                    };
                }).filter(q => q.words.length >= 3); // Ensure there's something to scramble

                if (generatedQuestions.length < 1) {
                    throw new Error("AI failed to generate valid sentences. Please try selecting different units.");
                }

                setQuestions(generatedQuestions);
                setupRound(0, generatedQuestions);
            } catch (e) {
                console.error("Error generating sentences:", e);
                setError("Could not generate sentences with AI. Please check your connection or try again.");
            } finally {
                setIsLoading(false);
            }
        };

        generateSentences();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vocabularyItems, generationTrigger, tokenizer]);

    const setupRound = (index: number, currentQuestions: ScrambleQuestion[]) => {
        if (index >= currentQuestions.length) {
            setIsFinished(true);
            return;
        }
        const question = currentQuestions[index];
        const indexedWords = question.words.map((word, i) => ({ word, originalIndex: i }));
        setScrambledOptions(shuffleArray(indexedWords));
        setUserAnswer([]);
        setIsAnswered(false);
        setIsCorrect(false);
        setCurrentIndex(index);
    };

    const handleOptionClick = (option: {word: string, originalIndex: number}) => {
        setUserAnswer(prev => [...prev, option]);
        setScrambledOptions(prev => prev.filter(item => item.originalIndex !== option.originalIndex));
    };
    
    const handleAnswerClick = (option: {word: string, originalIndex: number}) => {
        setUserAnswer(prev => prev.filter(item => item.originalIndex !== option.originalIndex));
        setScrambledOptions(prev => [...prev, option]);
    };

    const handleCheck = () => {
        if (isAnswered || userAnswer.length === 0) return;
        const submittedAnswer = userAnswer.map(item => item.word).join('');
        const correctAnswer = questions[currentIndex].japanese;
        const correct = submittedAnswer === correctAnswer;
        
        setIsCorrect(correct);
        setIsAnswered(true);
        if (correct) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        setupRound(currentIndex + 1, questions);
    };

    const restartGame = () => {
        setScore(0);
        setIsFinished(false);
        setIsLoading(true);
        setQuestions([]);
        setGenerationTrigger(t => t + 1);
    };

    if (isLoading) {
        return (
             <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
                <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">Crafting unique sentences with AI...</p>
            </div>
        );
    }

    if (error || questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-500 text-lg">{error || "Not enough content available to start this game."}</p>
                <button onClick={onBack} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Go Back
                </button>
            </div>
        );
    }
    
    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400">Game Over!</h2>
                <p className="text-xl mt-4 text-slate-800 dark:text-slate-200">Your Score: <span className="font-bold text-slate-900 dark:text-white">{score} / {questions.length}</span></p>
                <div className="flex gap-4 mt-8">
                     <button onClick={restartGame} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Play Again</button>
                     <button onClick={onBack} className="px-6 py-2 bg-slate-500 dark:bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors">Change Activity</button>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex flex-col h-full w-full relative">
            <button onClick={onBack} className="absolute top-0 left-0 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <BackArrowIcon className="w-8 h-8"/>
            </button>
            <div className="text-center mb-4">
                 <p className="text-slate-500 dark:text-slate-400">Sentence {currentIndex + 1} of {questions.length} • Score: {score}</p>
                 <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mt-2">
                    <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 text-center my-4 transition-colors duration-300">
                <p className="text-sm text-slate-500 dark:text-slate-400">Translate this sentence:</p>
                <p className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">{currentQuestion.english}</p>
            </div>

            <div className={`min-h-[120px] bg-slate-200 dark:bg-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-center gap-2 transition-all duration-300
                ${isAnswered ? (isCorrect ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500') : 'ring-2 ring-transparent'}`}>
                {userAnswer.length === 0 && <span className="text-slate-400 dark:text-slate-500">Tap the words below to build the sentence...</span>}
                {userAnswer.map((item) => (
                    <button key={item.originalIndex} onClick={() => !isAnswered && handleAnswerClick(item)} className="px-3 py-2 bg-teal-500 text-white rounded-lg text-lg font-medium shadow-sm flex flex-col leading-tight">
                        <span className="text-lg">{item.word}</span>
                        <span className="text-xs opacity-80 mt-1">{getRomajiForPart(item.word)}</span>
                    </button>
                ))}
            </div>

             <div className="min-h-[120px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-3 my-4 flex flex-wrap items-center justify-center gap-2">
                {scrambledOptions.map((option) => (
                    <button key={option.originalIndex} onClick={() => !isAnswered && handleOptionClick(option)} className="px-3 py-2 bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-400 dark:hover:bg-slate-600 transition-colors flex flex-col leading-tight">
                        <span className="text-lg">{option.word}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{getRomajiForPart(option.word)}</span>
                    </button>
                ))}
            </div>
            
            <div className="mt-auto">
                {isAnswered ? (
                    <div className="text-center">
                        <p className={`text-xl font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {isCorrect ? 'Correct!' : 'Not quite!'}
                        </p>
                        {!isCorrect && <p className="text-slate-600 dark:text-slate-400 mt-1">Correct answer: {currentQuestion.japanese}</p>}
                        <button onClick={handleNext} className="mt-4 w-full py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                            {currentIndex < questions.length - 1 ? 'Next Sentence' : 'Finish Game'}
                        </button>
                    </div>
                ) : (
                    <button onClick={handleCheck} disabled={userAnswer.length === 0} className="w-full py-3 bg-sky-600 text-white font-bold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors">
                        Check Answer
                    </button>
                )}
            </div>
        </div>
    );
};

export default SentenceScramble;