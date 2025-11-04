import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon, CheckIcon, XIcon } from './icons';
import { createRomajiConverter, shuffleArray } from './languageUtils';

interface FillInTheBlanksProps {
    questions: GameQuestion[];
    isLoading: boolean;
    error: string | null;
    onRestart: () => void;
    contentItems: ContentItem[];
    onBack: () => void;
}

interface GameQuestionOption {
    japanese: string;
    romaji: string;
}

export interface GameQuestion {
    sentenceWithBlank: string;
    romajiSentenceWithBlank: string;
    englishHint: string;
    options: GameQuestionOption[];
    correctAnswer: string;
}

const FillInTheBlanks: React.FC<FillInTheBlanksProps> = ({ questions, isLoading, error, onRestart, contentItems, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (!isLoading && questions.length > 0) {
            setCurrentIndex(0);
            setScore(0);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setIsFinished(false);
        }
    }, [questions, isLoading]);
    
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
        } else {
            setIsFinished(true);
        }
    };
    
    const restartGame = () => {
        onRestart();
    };

    if (isLoading) {
        return (
             <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
                <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">Crafting and verifying smart questions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-500 text-lg">{error}</p>
                <div className="flex gap-4 mt-8">
                    <button onClick={restartGame} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Try Again</button>
                    <button onClick={onBack} className="px-6 py-2 bg-slate-500 dark:bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors">Go Back</button>
                </div>
            </div>
        );
    }

    if (isFinished || questions.length === 0) {
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

            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-8 text-center my-auto transition-colors duration-300 min-h-[150px] flex flex-col justify-center">
                <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wider leading-relaxed">{currentQuestion.sentenceWithBlank}</p>
                <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">{currentQuestion.romajiSentenceWithBlank}</p>
                <p className="text-md text-slate-500 dark:text-slate-400 mt-4">"{currentQuestion.englishHint}"</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
                {currentQuestion.options.map((option, index) => {
                    const isCorrect = option.japanese === currentQuestion.correctAnswer;
                    let buttonClass = 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600';
                    if (isAnswered && selectedAnswer === option.japanese) {
                        buttonClass = isCorrect ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white';
                    } else if (isAnswered && isCorrect) {
                         buttonClass = 'bg-green-500 opacity-70 text-white';
                    }
                    return (
                        <button 
                            key={index} 
                            onClick={() => handleAnswerSelect(option.japanese)} 
                            disabled={isAnswered} 
                            className={`p-2 rounded-lg transition-colors flex justify-center items-center min-h-[70px] ${buttonClass}`}
                        >
                            <div className="flex flex-col text-center items-center justify-center">
                                <span className="font-bold text-3xl">{option.japanese}</span>
                                {option.romaji && <span className="text-xs text-slate-600 dark:text-slate-300 mt-1">{option.romaji}</span>}
                            </div>
                            {isAnswered && selectedAnswer === option.japanese && (
                                isCorrect 
                                ? <CheckIcon className="w-6 h-6 text-white ml-3 flex-shrink-0"/> 
                                : <XIcon className="w-6 h-6 text-white ml-3 flex-shrink-0"/>
                            )}
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

export default FillInTheBlanks;