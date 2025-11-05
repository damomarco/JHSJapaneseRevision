import React, { useState } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface FlashcardsProps {
    contentItems: ContentItem[];
    onBack: () => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ contentItems, onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (contentItems.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-500 dark:text-slate-400 text-lg">No content available for the selected units.</p>
                <button onClick={onBack} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    const currentItem = contentItems[currentIndex];

    const goToNext = () => {
        // Reset flip state before changing the index to prevent the new card
        // from briefly appearing in a flipped state.
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % contentItems.length);
    };

    const goToPrev = () => {
        // Reset flip state before changing the index to prevent the new card
        // from briefly appearing in a flipped state.
        setIsFlipped(false);
        setCurrentIndex(prev => (prev - 1 + contentItems.length) % contentItems.length);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsFlipped(!isFlipped);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full relative">
            <button onClick={onBack} className="absolute top-0 left-0 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <BackArrowIcon className="w-8 h-8"/>
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Flashcards</h2>
            
            <div className="w-full max-w-xl h-72" style={{ perspective: '1000px' }}>
                 <div
                    className="relative w-full h-full cursor-pointer transition-transform duration-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-teal-500 rounded-xl"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                    onClick={() => setIsFlipped(!isFlipped)}
                    onKeyDown={handleKeyDown}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isFlipped}
                    aria-label={`Flashcard: ${isFlipped ? currentItem.English : currentItem.Japanese}. Click or press Enter to flip.`}
                >
                    {/* Front of card (Japanese) */}
                    <div 
                        className="absolute w-full h-full bg-slate-200 dark:bg-slate-700 rounded-xl shadow-lg flex flex-col items-center justify-center p-6 text-center transition-colors duration-300"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{currentItem.Japanese}</p>
                        {currentItem.Japanese !== currentItem.Hiragana && (
                            <p className="text-xl text-slate-700 dark:text-slate-200 mt-2">{currentItem.Hiragana}</p>
                        )}
                        <p className={`text-lg text-slate-600 dark:text-slate-300 ${currentItem.Japanese === currentItem.Hiragana ? 'mt-2' : 'mt-1'}`}>{currentItem.Romaji}</p>
                    </div>

                    {/* Back of card (English) */}
                     <div 
                        className="absolute w-full h-full bg-teal-500 dark:bg-teal-800 rounded-xl shadow-lg flex flex-col items-center justify-center p-6 text-center transition-colors duration-300"
                        style={{ 
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)' 
                        }}
                     >
                        <p className="text-sm text-teal-100 dark:text-teal-200">{currentItem.Category} / {currentItem.SubCategory}</p>
                        <p className="text-3xl md:text-4xl font-bold my-2 text-white">{currentItem.English}</p>
                    </div>
                 </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-xl mt-6">
                <button onClick={goToPrev} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{currentIndex + 1} / {contentItems.length}</p>
                <button onClick={goToNext} className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default Flashcards;