import React from 'react';
import { BackArrowIcon, CardIcon, QuizIcon, SortIcon, GridIcon, SpeakerIcon, ScrambleIcon, KanjiConnectIcon, FillBlanksIcon } from './icons';

interface ActivitySelectorProps {
    onActivitySelected: (activity: 'flashcards' | 'quiz' | 'category_sort' | 'matching_game' | 'listening_game' | 'sentence_scramble' | 'kanji_connect' | 'fill_in_the_blanks') => void;
    onBack: () => void;
}

interface Activity {
    id: 'flashcards' | 'quiz' | 'category_sort' | 'matching_game' | 'listening_game' | 'sentence_scramble' | 'kanji_connect' | 'fill_in_the_blanks';
    name: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const activities: Activity[] = [
    { id: 'flashcards', name: 'Flashcards', icon: CardIcon },
    { id: 'quiz', name: 'Quiz', icon: QuizIcon },
    { id: 'category_sort', name: 'Category Sort', icon: SortIcon },
    { id: 'matching_game', name: 'Matching Game', icon: GridIcon },
    { id: 'kanji_connect', name: 'Kanji Connect', icon: KanjiConnectIcon },
    { id: 'listening_game', name: 'Listening Game', icon: SpeakerIcon },
    { id: 'sentence_scramble', name: 'Sentence Scramble', icon: ScrambleIcon },
    { id: 'fill_in_the_blanks', name: 'Fill in the Blanks', icon: FillBlanksIcon },
];


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
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-center">Select how you'd like to revise the content.</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-2xl">
                {activities.map(activity => (
                    <button
                        key={activity.id}
                        onClick={() => onActivitySelected(activity.id)}
                        className="group flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-teal-100 dark:hover:bg-teal-900 hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                        <activity.icon className="w-12 h-12 text-teal-500 dark:text-teal-400 mb-3 transition-transform group-hover:scale-110" />
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-center">{activity.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ActivitySelector;