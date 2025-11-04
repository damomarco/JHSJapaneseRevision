
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon, CheckIcon, XIcon } from './icons';

interface CategorySortProps {
    contentItems: ContentItem[];
    onBack: () => void;
}

// FIX: The generic constraint on shuffleArray was incorrect and has been removed to ensure proper type inference.
const shuffleArray = (array: any[]): any[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const ALLOWED_SUBCATEGORIES = [
    'Pets', 'Family', 'Food', 'Drink', 'Hobbies', 'Sports', 'Language', 
    'Places', 'Transport', 'Nation', 'Nationality', 'Japanese City', 'World City',
    'Number', 'Age', 'Time (Day of Week)', 'Event', 'Activity/Event',
    'Time (Month)', 'Time (Date)', 'Meals', 'Pet Food'
];

const MAX_QUESTIONS = 10;

// FIX: Re-wrapped component logic in a React.FC and added a default export to resolve all scope and export-related errors.
const CategorySort: React.FC<CategorySortProps> = ({ contentItems, onBack }) => {
    const [score, setScore] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [activeCategories, setActiveCategories] = useState<string[]>([]);
    const [draggedOverCategory, setDraggedOverCategory] = useState<string | null>(null);


    const gameItems = useMemo(() => {
        const validItems = contentItems.filter(item => 
            item.Category === 'Vocabulary' && ALLOWED_SUBCATEGORIES.includes(item.SubCategory)
        );
        return shuffleArray(validItems).slice(0, MAX_QUESTIONS);
    }, [contentItems]);

    const allPossibleCategories = useMemo(() => 
        [...new Set(gameItems.map(item => item.SubCategory))],
    [gameItems]);

    const setupRound = useCallback((index: number) => {
        if (index >= gameItems.length) {
            setIsFinished(true);
            return;
        }

        const currentItem = gameItems[index];
        const correctAnswer = currentItem.SubCategory;
        
        const distractorPool = allPossibleCategories.filter(cat => cat !== correctAnswer);
        const shuffledDistractors = shuffleArray(distractorPool).slice(0, 2);
        
        const currentOptions = shuffleArray([correctAnswer, ...shuffledDistractors]);

        setActiveCategories(currentOptions);
        setCurrentIndex(index);
        setSelectedAnswer(null);
        setIsAnswered(false);
    }, [gameItems, allPossibleCategories]);

    useEffect(() => {
        if (gameItems.length > 0) {
            setupRound(0);
        }
    }, [gameItems, setupRound]);
    
    const processAnswer = (category: string) => {
        if (isAnswered) return;

        setSelectedAnswer(category);
        setIsAnswered(true);
        if (gameItems[currentIndex] && category === gameItems[currentIndex].SubCategory) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            setupRound(currentIndex + 1);
        }, 1500);
    }

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: ContentItem) => {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); // Necessary to allow dropping
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCategory: string) => {
        e.preventDefault();
        setDraggedOverCategory(null);
        const droppedItem: ContentItem = JSON.parse(e.dataTransfer.getData('application/json'));
        
        // Ensure the dropped item is the one for the current question
        if (gameItems[currentIndex] && droppedItem.Romaji === gameItems[currentIndex].Romaji) {
            processAnswer(targetCategory);
        }
    };


    const restartGame = () => {
        setScore(0);
        setIsFinished(false);
        setupRound(0);
    };

    if (gameItems.length < 3 || allPossibleCategories.length < 3) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-500 dark:text-slate-400 text-lg">Not enough different categories to start this game (need at least 3).</p>
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
                <p className="text-xl mt-4 text-slate-800 dark:text-slate-200">Your Score: <span className="font-bold text-slate-900 dark:text-white">{score} / {gameItems.length}</span></p>
                <div className="flex gap-4 mt-8">
                    <button onClick={restartGame} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Play Again</button>
                    <button onClick={onBack} className="px-6 py-2 bg-slate-500 dark:bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors">Change Activity</button>
                </div>
            </div>
        );
    }

    if (gameItems.length === 0 || !gameItems[currentIndex]) return null;
    
    const currentItem = gameItems[currentIndex];

    return (
        <div className="flex flex-col h-full w-full relative">
            <button onClick={onBack} className="absolute top-0 left-0 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <BackArrowIcon className="w-8 h-8"/>
            </button>
            <div className="text-center mb-6">
                 <p className="text-slate-500 dark:text-slate-400">Item {currentIndex + 1} of {gameItems.length} • Score: {score}</p>
                 <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 mt-2">
                    <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / gameItems.length) * 100}%` }}></div>
                </div>
            </div>

            <div 
                draggable={!isAnswered}
                onDragStart={(e) => handleDragStart(e, currentItem)}
                className={`bg-slate-100 dark:bg-slate-700 rounded-lg p-8 text-center my-auto transition-all duration-300 min-h-[150px] flex flex-col justify-center ${!isAnswered ? 'cursor-grab active:cursor-grabbing hover:scale-105 hover:shadow-xl' : 'opacity-50'}`}
            >
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{currentItem.Japanese}</p>
                {currentItem.Japanese !== currentItem.Hiragana && (
                     <p className="text-xl text-slate-700 dark:text-slate-200 mt-2">{currentItem.Hiragana}</p>
                )}
                <p className={`text-lg text-slate-600 dark:text-slate-300 ${currentItem.Japanese === currentItem.Hiragana ? 'mt-2' : 'mt-1'}`}>{currentItem.Romaji}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {activeCategories.map((category) => {
                    const isCorrect = category === currentItem.SubCategory;
                    let buttonClass = 'bg-slate-200 dark:bg-slate-700 border-transparent';

                    if (isAnswered && selectedAnswer === category) {
                        buttonClass = isCorrect ? 'bg-green-500' : 'bg-red-500';
                    } else if (isAnswered && isCorrect) {
                        buttonClass = 'bg-green-500 opacity-70';
                    } else if (draggedOverCategory === category && !isAnswered) {
                        buttonClass = 'bg-slate-300 dark:bg-slate-600 border-teal-500';
                    }

                    return (
                        <div 
                            key={category} 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, category)}
                            onDragEnter={() => !isAnswered && setDraggedOverCategory(category)}
                            onDragLeave={() => !isAnswered && setDraggedOverCategory(null)}
                            className={`p-4 rounded-lg font-medium transition-colors text-center flex justify-center items-center min-h-[60px] border-2 ${buttonClass}`}
                        >
                            <span className="text-lg text-slate-900 dark:text-white">{category}</span>
                            {isAnswered && selectedAnswer === category && (isCorrect ? <CheckIcon className="w-6 h-6 text-white ml-3"/> : <XIcon className="w-6 h-6 text-white ml-3"/>)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CategorySort;
