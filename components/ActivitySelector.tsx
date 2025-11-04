import React from 'react';
import { BackArrowIcon, CardIcon, QuizIcon, SortIcon } from './icons';

interface ActivitySelectorProps {
    onActivitySelected: (activity: 'flashcards' | 'quiz' | 'category_sort') => void;
    onBack: () => void;
}

const ActivitySelector: React.FC<ActivitySelectorProps> = ({ onActivitySelected, onBack }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
             <button 
                onClick={onBack} 
                className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors group"
                aria-label="Back to change selected units"
            >
                <BackArrowIcon className="w-6 h-6 transition-transform group-hover:-translate-x-1"/>
                <span className="font-semibold hidden sm:inline">Change Units</span>
            </button>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Choose an Activity</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">How would you like to revise today?</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                <button
                    onClick={() => onActivitySelected('flashcards')}
                    className="group bg-slate-100 dark:bg-slate-700 p-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-teal-500 text-left"
                >
                    <CardIcon className="w-12 h-12 text-teal-500 dark:text-teal-400 mb-4 transition-transform duration-300 group-hover:rotate-[-5deg]"/>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Flashcards</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Review terms and their translations.</p>
                </button>
                <button
                    onClick={() => onActivitySelected('quiz')}
                    className="group bg-slate-100 dark:bg-slate-700 p-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-teal-500 text-left"
                >
                    <QuizIcon className="w-12 h-12 text-teal-500 dark:text-teal-400 mb-4 transition-transform duration-300 group-hover:rotate-[5deg]"/>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Test your knowledge with multiple choice questions.</p>
                </button>
                 <button
                    onClick={() => onActivitySelected('category_sort')}
                    className="group bg-slate-100 dark:bg-slate-700 p-8 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-teal-500 text-left"
                >
                    <SortIcon className="w-12 h-12 text-teal-500 dark:text-teal-400 mb-4 transition-transform duration-300 group-hover:scale-[1.03]"/>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Category Sort</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Sort vocabulary into the correct groups.</p>
                </button>
            </div>
        </div>
    );
};

export default ActivitySelector;