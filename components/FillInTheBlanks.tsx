import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ContentItem } from '../types';
import { BackArrowIcon, CheckIcon, XIcon } from './icons';
import { GoogleGenAI, Type } from '@google/genai';
import { createTokenizer, createRomajiConverter, BLANK_MARKER } from './languageUtils';


interface FillInTheBlanksProps {
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

const PARTICLES = ['は', 'が', 'を', 'に', 'へ', 'と', 'も', 'の', 'で', 'か'];
const MAX_QUESTIONS = 10;

interface GameQuestionOption {
    japanese: string;
    romaji: string;
}

interface GameQuestion {
    sentenceWithBlank: string;
    romajiSentenceWithBlank: string;
    englishHint: string;
    options: GameQuestionOption[];
    correctAnswer: string;
}

const FillInTheBlanks: React.FC<FillInTheBlanksProps> = ({ contentItems, onBack }) => {
    const [questions, setQuestions] = useState<GameQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [generationTrigger, setGenerationTrigger] = useState(0);

    const allVocabulary = useMemo(() => {
        return contentItems.filter(item => item.Category === 'Vocabulary');
    }, [contentItems]);
    
    const tokenizer = useMemo(() => createTokenizer(contentItems), [contentItems]);
    const getRomajiForPart = useMemo(() => createRomajiConverter(contentItems), [contentItems]);

    useEffect(() => {
        const generateAndSetQuestions = async () => {
            if (allVocabulary.length < 15) {
                setError("Not enough vocabulary in the selected units to generate sentences.");
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            setError(null);

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const vocabList = shuffleArray(allVocabulary).slice(0, 100).map((item: ContentItem) => `- ${item.Hiragana.split('/')[0].trim()} (${item.English})`).join('\n');
                
                const prompt = `
                    You are a Japanese language teacher creating 'fill-in-the-blank' quizzes for beginner students. 
                    Your task is to generate up to ${MAX_QUESTIONS} simple, semantically plausible Japanese sentences.

                    **CRITICAL INSTRUCTIONS:**
                    1.  **Strict Vocabulary Adherence:** You MUST ONLY use words from the provided vocabulary list below. Do NOT introduce any new words, even common ones like 'この', 'その', 'あの', if they are not explicitly on the list. Every single word in the generated sentences must be verifiable from the list.
                    2.  **Question Design:** For each sentence, choose ONE word to be the "blank". This word can be a NOUN, an ADJECTIVE, or a PARTICLE. Create a diverse mix of blank types.
                    3.  **Sentence Quality:** Sentences must be grammatically correct and make logical sense.
                    4.  **Quantity Flexibility:** If you cannot generate the full ${MAX_QUESTIONS} sentences while strictly following the vocabulary list, generate as many high-quality sentences as you can. It is better to have fewer, correct sentences than more sentences with unlisted words.
                    5.  **Output Format:** For each generated sentence, provide the full sentence, its English translation, and the word you chose to be the blank. Return a JSON array of objects.

                    **Vocabulary List:**
                    ${vocabList}
                `;

                const schema = {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            japanese_sentence: { type: Type.STRING },
                            english_translation: { type: Type.STRING },
                            blanked_word: { type: Type.STRING }
                        },
                        required: ['japanese_sentence', 'english_translation', 'blanked_word']
                    }
                };

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-pro',
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: schema,
                        temperature: 0.9,
                    },
                });

                const generatedData = JSON.parse(response.text) as { japanese_sentence: string; english_translation: string; blanked_word: string }[];
                
                const generatedQuestions: GameQuestion[] = [];

                for (const item of generatedData) {
                    const correctAnswer = item.blanked_word;
                    
                    if (!item.japanese_sentence.includes(correctAnswer)) continue;
                    
                    const sentenceWithBlank = item.japanese_sentence.replace(correctAnswer, BLANK_MARKER);
                    const partsWithBlank = tokenizer(sentenceWithBlank);
                    
                    const romajiSentenceWithBlank = partsWithBlank.map(part => {
                        if (part === BLANK_MARKER) {
                            return BLANK_MARKER;
                        }
                        return getRomajiForPart(part);
                    }).join(' ').replace(` ${BLANK_MARKER} `, ` ${BLANK_MARKER} `);


                    let distractors: string[] = [];
                    const answerItem = allVocabulary.find((v: ContentItem) => v.Hiragana.startsWith(correctAnswer));

                    if (PARTICLES.includes(correctAnswer)) {
                        distractors = shuffleArray(PARTICLES.filter(p => p !== correctAnswer)).slice(0, 2);
                    } else if (answerItem) {
                        const distractorPool = allVocabulary.filter((v: ContentItem) => 
                            v.SubCategory === answerItem.SubCategory && !v.Hiragana.startsWith(correctAnswer)
                        );
                        distractors = shuffleArray(distractorPool).slice(0, 2).map((d: ContentItem) => d.Hiragana.split('/')[0].trim());
                    }
                    
                    if (distractors.length < 2) {
                        const fallbackPool = allVocabulary.filter((v: ContentItem) => !v.Hiragana.startsWith(correctAnswer));
                        distractors.push(...shuffleArray(fallbackPool).slice(0, 2 - distractors.length).map((d: ContentItem) => d.Hiragana.split('/')[0].trim()));
                    }

                    const options = shuffleArray([correctAnswer, ...distractors]);
                    
                    generatedQuestions.push({
                        sentenceWithBlank,
                        romajiSentenceWithBlank,
                        englishHint: item.english_translation,
                        options: options.map(opt => ({ japanese: opt, romaji: getRomajiForPart(opt) })),
                        correctAnswer: correctAnswer
                    });
                }

                if (generatedQuestions.length < 1) {
                    throw new Error("AI failed to generate valid sentences. Please try selecting different units.");
                }

                setQuestions(generatedQuestions);

            } catch (e) {
                console.error("Error generating sentences:", e);
                setError(e instanceof Error ? e.message : "An unknown error occurred while generating questions.");
            } finally {
                setIsLoading(false);
            }
        };

        generateAndSetQuestions();
    }, [allVocabulary, generationTrigger, getRomajiForPart, tokenizer]);


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
    
    const restartGame = () => {
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setIsFinished(false);
        setGenerationTrigger(t => t + 1);
    };

    if (isLoading) {
        return (
             <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
                <p className="mt-4 text-lg text-slate-500 dark:text-slate-300">Crafting and verifying smart questions...</p>
            </div>
        );
    }

    if (error || questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-red-500 text-lg">{error || "Could not generate questions."}</p>
                <div className="flex gap-4 mt-8">
                    <button onClick={restartGame} className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Try Again</button>
                    <button onClick={onBack} className="px-6 py-2 bg-slate-500 dark:bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors">Go Back</button>
                </div>
            </div>
        );
    }


    if (isFinished) {
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
                <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-wider leading-relaxed">{currentQuestion.sentenceWithBlank}</p>
                <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">{currentQuestion.romajiSentenceWithBlank}</p>
                <p className="text-md text-slate-500 dark:text-slate-400 mt-4">"{currentQuestion.englishHint}"</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
                {currentQuestion.options.map((option, index) => {
                    const isCorrect = option.japanese === currentQuestion.correctAnswer;
                    let buttonClass = 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600';
                    if (isAnswered && selectedAnswer === option.japanese) {
                        buttonClass = isCorrect ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white';
                    } else if (isAnswered && isCorrect) {
                         buttonClass = 'bg-green-500 opacity-70 text-white';
                    }
                    return (
                        <button 
                            key={index} 
                            onClick={() => handleAnswerSelect(option.japanese)} 
                            disabled={isAnswered} 
                            className={`p-2 rounded-lg transition-colors flex justify-center items-center min-h-[70px] ${buttonClass}`}
                        >
                            <div className="flex flex-col text-center items-center justify-center">
                                <span className="font-bold text-3xl">{option.japanese}</span>
                                {option.romaji && <span className="text-xs text-slate-600 dark:text-slate-300 mt-1">{option.romaji}</span>}
                            </div>
                            {isAnswered && selectedAnswer === option.japanese && (
                                isCorrect 
                                ? <CheckIcon className="w-6 h-6 text-white ml-3 flex-shrink-0"/> 
                                : <XIcon className="w-6 h-6 text-white ml-3 flex-shrink-0"/>
                            )}
                        </button>
                    );
                })}
            </div>
             {isAnswered && (
                <button onClick={handleNext} className="mt-6 w-full py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 transition-colors">
                    {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Game'}
                </button>
            )}
        </div>
    );
};

export default FillInTheBlanks;