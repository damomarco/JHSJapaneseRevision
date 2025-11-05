import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon } from './icons';
import { createTokenizer, createRomajiConverter, shuffleArray } from './languageUtils';

interface SentenceScrambleProps {
    questions: ScrambleQuestion[];
    isLoading: boolean;
    error: string | null;
    onRestart: () => void;
    contentItems: ContentItem[];
    onBack: () => void;
}

export interface ScrambleQuestion {
    english: string;
    japanese: string;
    words: string[];
}

const SentenceScramble: React.FC<SentenceScrambleProps> = ({ questions, isLoading, error, onRestart, contentItems, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [userAnswer, setUserAnswer] = useState<{word: string, originalIndex: number}[]>([]);
    const [scrambledOptions, setScrambledOptions] = useState<{word: string, originalIndex: number}[]>([]);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // State for drag-and-drop functionality
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
    const [dragOverItemIndex, setDragOverItemIndex] = useState<number | null>(null);

    const getRomajiForPart = useMemo(() => createRomajiConverter(contentItems), [contentItems]);

    const setupRound = useCallback((index: number, currentQuestions: ScrambleQuestion[]) => {
        if (!currentQuestions || currentQuestions.length === 0) return;
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
    }, []);

    useEffect(() => {
        if (questions && questions.length > 0) {
            setupRound(0, questions);
        }
    }, [questions, setupRound]);


    const handleOptionClick = (option: {word: string, originalIndex: number}) => {
        setUserAnswer(prev => [...prev, option]);
        setScrambledOptions(prev => prev.filter(item => item.originalIndex !== option.originalIndex));
    };
    
    const handleAnswerClick = (option: {word: string, originalIndex: number}) => {
        setUserAnswer(prev => prev.filter(item => item.originalIndex !== option.originalIndex));
        setScrambledOptions(prev => [...prev, option]);
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
        if (draggedItemIndex !== null && draggedItemIndex !== index) {
            setDragOverItemIndex(index);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // This is necessary to allow dropping
    };
    
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedItemIndex !== null && dragOverItemIndex !== null && draggedItemIndex !== dragOverItemIndex) {
            setUserAnswer(prevAnswer => {
                const newAnswer = [...prevAnswer];
                const [draggedItem] = newAnswer.splice(draggedItemIndex, 1);
                newAnswer.splice(dragOverItemIndex, 0, draggedItem);
                return newAnswer;
            });
        }
        // Cleanup after drop
        setDraggedItemIndex(null);
        setDragOverItemIndex(null);
    };

    const handleDragEnd = () => {
        // Cleanup in case drag is cancelled
        setDraggedItemIndex(null);
        setDragOverItemIndex(null);
    };


    const handleCheck = () => {
        if (isAnswered || userAnswer.length === 0) return;
        const submittedAnswer = userAnswer.map(item => item.word).join('');
        // The AI can sometimes add spaces. The tokenizer strips them when creating the words.
        // We must compare against a similarly stripped version of the correct answer.
        const correctAnswer = questions[currentIndex].japanese.replace(/\s+/g, '');
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
        onRestart();
    };

    if (isLoading) {
        return (
             <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
                <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">Crafting unique sentences with AI...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-500 text-lg">{error}</p>
                <button onClick={onBack} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Go Back
                </button>
            </div>
        );
    }
    
    if (isFinished || questions.length === 0) {
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

            <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`min-h-[120px] bg-slate-200 dark:bg-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-center gap-2 transition-all duration-300
                ${isAnswered ? (isCorrect ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500') : 'ring-2 ring-transparent'}`}>
                {userAnswer.length === 0 && <span className="text-slate-400 dark:text-slate-500">Tap the words below to build the sentence...</span>}
                {userAnswer.map((item, index) => {
                     const isBeingDragged = draggedItemIndex === index;
                     const isDragOverTarget = dragOverItemIndex === index;
                     return (
                        <button 
                            key={item.originalIndex} 
                            onClick={() => !isAnswered && handleAnswerClick(item)} 
                            draggable={!isAnswered}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`px-3 py-2 rounded-lg text-lg font-medium shadow-sm flex flex-col leading-tight transition-all duration-200 cursor-move
                                ${isBeingDragged ? 'opacity-30 scale-95' : 'opacity-100'}
                                ${isDragOverTarget ? 'bg-teal-700 text-white ring-2 ring-teal-400' : 'bg-teal-500 text-white'}
                            `}>
                            <span className="text-lg">{item.word}</span>
                            <span className="text-xs opacity-80 mt-1">{getRomajiForPart(item.word)}</span>
                        </button>
                    )
                })}
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
                        {!isCorrect && <p className="text-slate-600 dark:text-slate-400 mt-1">Correct answer: {currentQuestion.words.join('')}</p>}
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