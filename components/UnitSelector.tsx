import React, { useState } from 'react';
import { CheckIcon } from './icons';

interface UnitSelectorProps {
    onUnitsSelected: (units: number[]) => void;
}

const TOTAL_UNITS = 12;

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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full mb-8">
                {Array.from({ length: TOTAL_UNITS }, (_, i) => i + 1).map(unit => {
                    const isSelected = selectedUnits.includes(unit);
                    return (
                        <button
                            key={unit}
                            onClick={() => toggleUnit(unit)}
                            className={`relative p-4 rounded-lg font-bold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-teal-500 aspect-square flex items-center justify-center
                                ${isSelected
                                    ? 'bg-teal-500 text-white shadow-lg scale-105 ring-2 ring-teal-300'
                                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                                }`}
                        >
                            {isSelected && (
                                <div className="absolute top-1.5 right-1.5 bg-white rounded-full p-0.5">
                                    <CheckIcon className="w-4 h-4 text-teal-600" />
                                </div>
                            )}
                            Unit {unit}
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