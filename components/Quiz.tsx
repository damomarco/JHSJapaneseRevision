import React, { useState, useEffect, useMemo } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon, CheckIcon, XIcon } from './icons';
import { shuffleArray } from './languageUtils';

interface QuizProps {
    contentItems: ContentItem[];
    onBack: () => void;
}

interface QuizOption {
    text: string;
    romaji?: string;
}

interface QuizQuestion {
    questionText: string;
    questionHiragana?: string;
    questionRomaji?: string;
    options: QuizOption[];
    correctAnswer: string;
    questionItem: ContentItem;
}

const generateQuestions = (items: ContentItem[], count: number): QuizQuestion[] => {
    if (items.length < 4) return [];

    const shuffledItems = shuffleArray([...items]);
    const selectedItems = shuffledItems.slice(0, count);

    return selectedItems.map(item => {
        const correctAnswer = item.English;
        
        const distractors = shuffledItems
            .filter(distractor => distractor.Romaji !== item.Romaji)
            .slice(0, 3);
        
        const optionItems = [item, ...distractors];

        const options: QuizOption[] = shuffleArray(optionItems.map(optItem => ({
            text: optItem.English,
        })));

        return {
            questionText: item.Japanese,
            questionHiragana: item.Japanese !== item.Hiragana ? item.Hiragana : undefined,
            questionRomaji: item.Romaji,
            options,
            correctAnswer,
            questionItem: item,
        };
    });
};


const Quiz: React.FC<QuizProps> = ({ contentItems, onBack }) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const quizItems = useMemo(() => contentItems.filter(item => item.Category !== 'Grammar'), [contentItems]);

    useEffect(() => {
        if (quizItems.length >= 4) {
            setQuestions(generateQuestions(quizItems, Math.min(10, quizItems.length)));
        }
    }, [quizItems]);

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
    
    const restartQuiz = () => {
        setQuestions(generateQuestions(quizItems, Math.min(10, quizItems.length)));
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setIsFinished(false);
    };

    if (quizItems.length < 4) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-500 dark:text-slate-400 text-lg">Not enough vocabulary items to start a quiz (need at least 4).</p>
                <button onClick={onBack} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400">Quiz Complete!</h2>
                <p className="text-xl mt-4 text-slate-800 dark:text-slate-200">Your Score: <span className="font-bold text-slate-900 dark:text-white">{score} / {questions.length}</span></p>
                <div className="flex gap-4 mt-8">
                    <button onClick={restartQuiz} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Try Again</button>
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
            <div className="text-center mb-6">
                 <p className="text-slate-500 dark:text-slate-400">Question {currentIndex + 1} of {questions.length} • Score: {score}</p>
                 <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mt-2">
                    <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-8 text-center my-auto transition-colors duration-300 min-h-[150px] flex flex-col justify-center">
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{currentQuestion.questionText}</p>
                {currentQuestion.questionHiragana && (
                     <p className="text-xl text-slate-700 dark:text-slate-200 mt-2">{currentQuestion.questionHiragana}</p>
                )}
                {currentQuestion.questionRomaji && <p className={`text-lg text-slate-600 dark:text-slate-300 ${!currentQuestion.questionHiragana ? 'mt-2' : 'mt-1'}`}>{currentQuestion.questionRomaji}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {currentQuestion.options.map((option, index) => {
                    const isCorrect = option.text === currentQuestion.correctAnswer;
                    let buttonClass = 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600';
                    if (isAnswered && selectedAnswer === option.text) {
                        buttonClass = isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600';
                    } else if (isAnswered && isCorrect) {
                         buttonClass = 'bg-green-500 opacity-70';
                    }

                    return (
                        <button key={index} onClick={() => handleAnswerSelect(option.text)} disabled={isAnswered} className={`p-4 rounded-lg font-medium transition-colors text-left flex justify-between items-center ${buttonClass}`}>
                            <div>
                                <p className="text-lg text-slate-900 dark:text-white">{option.text}</p>
                                {option.romaji && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{option.romaji}</p>}
                            </div>
                            {isAnswered && selectedAnswer === option.text && (isCorrect ? <CheckIcon className="w-6 h-6 text-white flex-shrink-0"/> : <XIcon className="w-6 h-6 text-white flex-shrink-0"/>)}
                        </button>
                    );
                })}
            </div>
             {isAnswered && (
                <button onClick={handleNext} className="mt-6 w-full py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                    {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </button>
            )}
        </div>
    );
};

export default Quiz;