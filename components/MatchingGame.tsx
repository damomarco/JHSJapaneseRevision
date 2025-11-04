import React, { useState, useEffect, useMemo } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon } from './icons';

interface MatchingGameProps {
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

interface CardContent {
    japanese: string;
    hiragana?: string;
}

interface Card {
    id: number;
    pairId: string;
    content: CardContent | string;
    status: 'down' | 'up' | 'matched';
}

const MIN_PAIRS = 6;
const MAX_PAIRS = 8;

const MatchingGame: React.FC<MatchingGameProps> = ({ contentItems, onBack }) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [isFinished, setIsFinished] = useState(false);
    const [moves, setMoves] = useState(0);

    const gameItems = useMemo(() => {
        const uniqueItems = contentItems.filter(item => 
            item.Category === 'Vocabulary' && 
            item.Japanese !== item.Romaji && 
            !item.Romaji.includes('(') // Exclude items with alternate readings for simplicity
        );
        const shuffled = shuffleArray(uniqueItems);
        return shuffled.slice(0, MAX_PAIRS);
    }, [contentItems]);
    
    useEffect(() => {
        if (gameItems.length >= MIN_PAIRS) {
            setupGame();
        }
    }, [gameItems]);

    useEffect(() => {
        if (cards.length > 0 && cards.every(c => c.status === 'matched')) {
             setTimeout(() => setIsFinished(true), 500);
        }
    }, [cards]);

    const setupGame = () => {
        const pairs = gameItems;
        const newCards: Card[] = [];
        pairs.forEach((item, index) => {
            const japaneseContent: CardContent = {
                japanese: item.Japanese,
                hiragana: item.Japanese !== item.Hiragana ? item.Hiragana : undefined
            };
            newCards.push({ id: index * 2, pairId: item.Romaji, content: japaneseContent, status: 'down' });
            newCards.push({ id: index * 2 + 1, pairId: item.Romaji, content: item.Romaji, status: 'down' });
        });

        setCards(shuffleArray(newCards));
        setFlippedIndices([]);
        setIsFinished(false);
        setMoves(0);
    };

    const handleCardClick = (index: number) => {
        if (flippedIndices.length >= 2 || cards[index].status !== 'down' || isFinished) {
            return;
        }
        
        const newCards = [...cards];
        newCards[index].status = 'up';
        setCards(newCards);

        const newFlippedIndices = [...flippedIndices, index];
        setFlippedIndices(newFlippedIndices);

        if (newFlippedIndices.length === 2) {
            setMoves(prev => prev + 1);
            const firstCard = newCards[newFlippedIndices[0]];
            const secondCard = newCards[newFlippedIndices[1]];

            if (firstCard.pairId === secondCard.pairId) {
                // Match
                setTimeout(() => {
                    setCards(prev => prev.map(card => 
                        card.pairId === firstCard.pairId ? { ...card, status: 'matched' } : card
                    ));
                    setFlippedIndices([]);
                }, 800);
            } else {
                // No match
                setTimeout(() => {
                    setCards(prev => prev.map((card, i) => 
                        newFlippedIndices.includes(i) ? { ...card, status: 'down' } : card
                    ));
                    setFlippedIndices([]);
                }, 1200);
            }
        }
    };

    if (gameItems.length < MIN_PAIRS) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-500 dark:text-slate-400 text-lg">Not enough unique vocabulary items to start a matching game (need at least {MIN_PAIRS}).</p>
                <button onClick={onBack} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Go Back
                </button>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-3xl font-bold text-teal-600 dark:text-teal-400">Congratulations!</h2>
                <p className="text-xl mt-4 text-slate-800 dark:text-slate-200">You found all {gameItems.length} pairs in <span className="font-bold text-slate-900 dark:text-white">{moves}</span> moves.</p>
                <div className="flex gap-4 mt-8">
                    <button onClick={setupGame} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Play Again</button>
                    <button onClick={onBack} className="px-6 py-2 bg-slate-500 dark:bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors">Change Activity</button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full w-full relative">
            <button onClick={onBack} className="absolute top-0 left-0 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
                <BackArrowIcon className="w-8 h-8"/>
            </button>
             <div className="text-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Matching Game</h2>
                <p className="text-slate-500 dark:text-slate-400">Moves: {moves}</p>
            </div>

            <div className="flex-grow flex items-center justify-center">
                <div className="w-full max-w-md mx-auto grid grid-cols-4 gap-2 sm:gap-4" style={{ perspective: '1000px' }}>
                    {cards.map((card, index) => {
                        const isFlipped = card.status === 'up' || card.status === 'matched';
                        const isMatched = card.status === 'matched';
                        return (
                            <div key={card.id} className="w-full aspect-square" onClick={() => handleCardClick(index)}>
                                <div
                                    className={`relative w-full h-full cursor-pointer transition-transform duration-500 ${isMatched ? 'opacity-50' : ''}`}
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                    }}
                                >
                                    {/* Card Back */}
                                    <div className="absolute w-full h-full bg-slate-300 dark:bg-slate-600 rounded-lg shadow-md flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                                        <span className="text-3xl text-slate-500 dark:text-slate-400">?</span>
                                    </div>
                                    {/* Card Front */}
                                    <div
                                        className={`absolute w-full h-full rounded-lg shadow-md flex items-center justify-center p-2 text-center transition-colors
                                            ${isMatched ? 'bg-green-500 dark:bg-green-800' : 'bg-sky-400 dark:bg-sky-600'}`}
                                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                                    >
                                        {typeof card.content === 'object' && card.content !== null ? (
                                            <div>
                                                <p className="text-lg sm:text-xl font-bold text-white break-words">{card.content.japanese}</p>
                                                {card.content.hiragana && (
                                                    <p className="text-sm font-normal text-slate-200 mt-1">{card.content.hiragana}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-lg sm:text-xl font-bold text-white break-all">{card.content}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MatchingGame;