import React, { useState } from 'react';
import { CheckIcon } from './icons';

interface UnitSelectorProps {
    onUnitsSelected: (units: number[]) => void;
}

const unitDetails = [
    { unit: 1, topics: ["Greeting and saying goodbye", "Asking someone's name and introducing yourself", "Giving instructions"] },
    { unit: 2, topics: ["Counting to 20", "Asking someone's age and responding", "Asking someone's phone number and responding"] },
    { unit: 3, topics: ["Asking where someone's from and responding", "Asking about nationality and responding", "Asking where someone lives and responding"] },
    { unit: 4, topics: ["Asking how many people in someone's family", "Saying who is in your family", "Asking about pets"] },
    { unit: 5, topics: ["Describing ownership", "Describing pets", "Asking what pets eat and drink"] },
    { unit: 6, topics: ["Asking about meals", "Asking about likes and dislikes", "Expressing likes and dislikes"] },
    { unit: 7, topics: ["Asking the day and date", "Asking when an event will take place"] },
    { unit: 8, topics: ["Asking and hobbies and interests", "Asking about sports", "Talking about what someone can do"] },
    { unit: 9, topics: ["Asking where someone is going", "Asking who someone is going with", "Asking how someone is getting there"] },
    { unit: 10, topics: ["Asking about daily activities", "Talking about daily activities you do or do not do"] },
    { unit: 11, topics: ["Asking about free time", "Suggesting something", "Expressing opinions"] },
    { unit: 12, topics: ["Asking what someone did", "Talking about what you did and did not do", "Asking what something was like"] },
];


const UnitSelector: React.FC<UnitSelectorProps> = ({ onUnitsSelected }) => {
    const [selectedUnits, setSelectedUnits] = useState<number[]>([]);

    const toggleUnit = (unitNumber: number) => {
        setSelectedUnits(prev =>
            prev.includes(unitNumber)
                ? prev.filter(u => u !== unitNumber)
                : [...prev, unitNumber]
        );
    };

    const handleStart = () => {
        onUnitsSelected(selectedUnits);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Choose Your Units</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-center">Select one or more units to start your revision session.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
                {unitDetails.map(detail => {
                    const isSelected = selectedUnits.includes(detail.unit);
                    return (
                        <button
                            key={detail.unit}
                            onClick={() => toggleUnit(detail.unit)}
                            className={`p-4 rounded-lg text-left border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900 focus:ring-teal-500
                                ${isSelected
                                    ? 'bg-teal-50 dark:bg-slate-800 border-teal-500'
                                    : 'bg-slate-200 dark:bg-slate-700 border-transparent hover:border-slate-400 dark:hover:border-slate-500'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-lg ${isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                    Unit {detail.unit}
                                </h3>
                                {isSelected && (
                                    <div className="bg-teal-500 rounded-full p-0.5 flex-shrink-0">
                                        <CheckIcon className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                {detail.topics.map((topic, index) => (
                                    <li key={index}>{topic}</li>
                                ))}
                            </ul>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={handleStart}
                disabled={selectedUnits.length === 0}
                className="w-full sm:w-auto px-12 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
            >
                Start Studying ({selectedUnits.length} {selectedUnits.length === 1 ? 'Unit' : 'Units'})
            </button>
        </div>
    );
};

export default UnitSelector;