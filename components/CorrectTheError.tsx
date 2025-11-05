import React, { useState, useEffect, useMemo } from 'react';
import { AiCorrectTheErrorResponseItem, ContentItem } from '../types';
import { BackArrowIcon, CheckIcon, XIcon } from './icons';
import { createTokenizer, createRomajiConverter } from './languageUtils';

interface CorrectTheErrorProps {
    questions: AiCorrectTheErrorResponseItem[];
    isLoading: boolean;
    error: string | null;
    onRestart: () => void;
    onBack: () => void;
    contentItems: ContentItem[];
}

type UserChoice = 'correct' | 'incorrect';

const CorrectTheError: React.FC<CorrectTheErrorProps> = ({ questions, isLoading, error, onRestart, onBack, contentItems }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedChoice, setSelectedChoice] = useState<UserChoice | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const getRomajiForSentence = useMemo(() => {
        const tokenizer = createTokenizer(contentItems);
        const romajiConverter = createRomajiConverter(contentItems);
        return (sentence: string) => {
            if (!sentence) return '';
            const parts = tokenizer(sentence);
            return parts.map(part => romajiConverter(part)).join(' ');
        }
    }, [contentItems]);
    
    useEffect(() => {
        if (!isLoading && questions.length > 0) {
            setCurrentIndex(0);
            setScore(0);
            setSelectedChoice(null);
            setIsAnswered(false);
            setIsFinished(false);
        }
    }, [questions, isLoading]);

    const handleChoice = (choice: UserChoice) => {
        if (isAnswered) return;
        
        setSelectedChoice(choice);
        setIsAnswered(true);
        
        const question = questions[currentIndex];
        const userWasCorrect = (choice === 'correct' && question.is_correct) || (choice === 'incorrect' && !question.is_correct);
        
        if (userWasCorrect) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedChoice(null);
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
                <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">Generating tricky translations...</p>
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
    const userWasCorrect = (selectedChoice === 'correct' && currentQuestion.is_correct) || (selectedChoice === 'incorrect' && !currentQuestion.is_correct);

    const renderFeedback = () => {
        if (!isAnswered) return null;

        return (
            <div className={`mt-4 p-4 rounded-lg text-center ${userWasCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                <h3 className={`text-xl font-bold ${userWasCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {userWasCorrect ? 'Correct!' : 'Not quite!'}
                </h3>
                {!currentQuestion.is_correct && (
                    <p className="text-slate-700 dark:text-slate-200 mt-2">
                        The correct translation is: <strong className="font-semibold">{currentQuestion.correct_english_translation}</strong>
                    </p>
                )}
                 {userWasCorrect && !currentQuestion.is_correct && (
                     <p className="text-slate-600 dark:text-slate-300 mt-1">You correctly spotted the error.</p>
                 )}
                 {!userWasCorrect && currentQuestion.is_correct && (
                     <p className="text-slate-600 dark:text-slate-300 mt-1">This translation was actually correct.</p>
                 )}
            </div>
        )
    };

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

            <div className="flex flex-col gap-4 my-auto">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Japanese Sentence:</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{currentQuestion.japanese_sentence}</p>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">{getRomajiForSentence(currentQuestion.japanese_sentence)}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 text-center">
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Is this English translation correct?</p>
                     <p className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100">"{currentQuestion.english_translation}"</p>
                </div>
            </div>
            
            {isAnswered ? (
                <>
                    {renderFeedback()}
                    <button onClick={handleNext} className="mt-6 w-full py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                        {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Game'}
                    </button>
                </>
            ) : (
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button onClick={() => handleChoice('correct')} disabled={isAnswered} className="p-4 rounded-lg font-bold text-xl transition-colors flex justify-center items-center gap-3 bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                        <CheckIcon className="w-7 h-7" /> Correct
                    </button>
                     <button onClick={() => handleChoice('incorrect')} disabled={isAnswered} className="p-4 rounded-lg font-bold text-xl transition-colors flex justify-center items-center gap-3 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
                        <XIcon className="w-7 h-7" /> Incorrect
                    </button>
                </div>
            )}
        </div>
    );
};

export default CorrectTheError;