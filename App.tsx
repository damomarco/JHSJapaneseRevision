import React, { useState, useEffect } from 'react';
import { ContentItem } from './types';
import UnitSelector from './components/UnitSelector';
import ActivitySelector from './components/ActivitySelector';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import CategorySort from './components/CategorySort';
import MatchingGame from './components/MatchingGame';
import ListeningGame from './components/ListeningGame';
import SentenceScramble from './components/SentenceScramble';
import { useContentLoader } from './hooks/useContentLoader';
import { MoonIcon, SunIcon } from './components/icons';

type View = 'unit_selection' | 'activity_selection' | 'flashcards' | 'quiz' | 'category_sort' | 'matching_game' | 'listening_game' | 'sentence_scramble';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
    const [view, setView] = useState<View>('unit_selection');
    const [selectedUnits, setSelectedUnits] = useState<number[]>([]);
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };
    
    const { content, isLoading, error } = useContentLoader(selectedUnits);

    const handleUnitsSelected = (units: number[]) => {
        if (units.length > 0) {
            setSelectedUnits(units);
            setView('activity_selection');
        }
    };
    
    const handleActivitySelected = (activity: 'flashcards' | 'quiz' | 'category_sort' | 'matching_game' | 'listening_game' | 'sentence_scramble') => {
        setView(activity);
    };

    const handleBackToUnitSelection = () => {
        setSelectedUnits([]);
        setView('unit_selection');
    };

    const handleBackToActivitySelection = () => {
        setView('activity_selection');
    };

    const renderView = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-teal-500"></div>
                    <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">Loading content...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-red-500 text-xl">Oops! Something went wrong.</p>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">{error.message}</p>
                    <button onClick={handleBackToUnitSelection} className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Try Again
                    </button>
                </div>
            );
        }

        switch (view) {
            case 'unit_selection':
                return <UnitSelector onUnitsSelected={handleUnitsSelected} />;
            case 'activity_selection':
                return <ActivitySelector onActivitySelected={handleActivitySelected} onBack={handleBackToUnitSelection} />;
            case 'flashcards':
                return <Flashcards contentItems={content} onBack={handleBackToActivitySelection} />;
            case 'quiz':
                return <Quiz contentItems={content} onBack={handleBackToActivitySelection} />;
            case 'category_sort':
                return <CategorySort contentItems={content} onBack={handleBackToActivitySelection} />;
            case 'matching_game':
                return <MatchingGame contentItems={content} onBack={handleBackToActivitySelection} />;
            case 'listening_game':
                return <ListeningGame contentItems={content} onBack={handleBackToActivitySelection} />;
            case 'sentence_scramble':
                return <SentenceScramble contentItems={content} onBack={handleBackToActivitySelection} />;
            default:
                return <UnitSelector onUnitsSelected={handleUnitsSelected} />;
        }
    };

    return (
        <main className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white font-sans p-4 sm:p-6 md:p-8 transition-colors duration-300 flex flex-col items-center justify-center">
             <header className="w-full max-w-4xl mx-auto flex justify-between items-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                    Nihongo <span className="text-teal-500">Revision Hub</span>
                </h1>
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-slate-800" />}
                </button>
            </header>
            <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
                {renderView()}
            </div>
        </main>
    );
};

export default App;
