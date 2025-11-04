import { useState, useEffect, useMemo } from 'react';
import { ContentItem, AiScrambleResponseItem, AiFillBlanksResponseItem } from '../types';
import { ScrambleQuestion } from '../components/SentenceScramble';
import { GameQuestion as FillBlanksQuestion } from '../components/FillInTheBlanks';
import { GoogleGenAI, Type } from '@google/genai';
import { createTokenizer, createRomajiConverter, BLANK_MARKER, shuffleArray } from '../components/languageUtils';

const MAX_QUESTIONS = 8;
const PARTICLES = ['は', 'が', 'を', 'に', 'へ', 'と', 'も', 'の', 'で', 'か'];

async function generateScramble(ai: GoogleGenAI, vocabList: string): Promise<AiScrambleResponseItem[]> {
    const themes = [
        "daily activities at home", "talking about school life", "weekend plans with friends", 
        "hobbies and interests", "food and meals", "shopping in town", "describing pets and family"
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const prompt = `
        You are a Japanese language teacher creating quiz questions for junior high school students.
        Your task is to generate ${MAX_QUESTIONS} unique and varied, simple, grammatically correct Japanese sentences.
        The sentences should be about the theme of "${randomTheme}".

        **Instructions:**
        1. You MUST ONLY use words from the following list. Each word is provided with its English meaning:
            ${vocabList}
        2. Ensure the sentences are diverse. Avoid using the exact same sentence structure for every sentence. Create a mix of questions, statements, and descriptions.
        3. Each sentence must be unique.
        4. The sentences must be suitable for a beginner Japanese learner.
        5. For each sentence you generate, provide its simple English translation.
        
        Return the result as a JSON array of objects.
    `;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                japanese: { type: Type.STRING, description: "The generated Japanese sentence in Hiragana/Katakana." },
                english: { type: Type.STRING, description: "The English translation of the sentence." }
            },
            required: ['japanese', 'english']
        }
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.9, },
    });

    return JSON.parse(response.text) as AiScrambleResponseItem[];
}


async function generateFillBlanks(ai: GoogleGenAI, vocabList: string): Promise<AiFillBlanksResponseItem[]> {
     const prompt = `
        You are a Japanese language teacher creating 'fill-in-the-blank' quizzes for beginner students. 
        Your task is to generate up to ${MAX_QUESTIONS} simple, semantically plausible Japanese sentences.

        **CRITICAL INSTRUCTIONS:**
        1.  **Strict Vocabulary Adherence:** You MUST ONLY use words from the provided vocabulary list below. Do NOT introduce any new words. Every single word in the generated sentences must be verifiable from the list.
        2.  **Question Design:** For each sentence, choose ONE word to be the "blank". This word can be a NOUN, an ADJECTIVE, or a PARTICLE. Create a diverse mix of blank types.
        3.  **Sentence Quality:** Sentences must be grammatically correct and make logical sense.
        4.  **Quantity Flexibility:** If you cannot generate the full ${MAX_QUESTIONS} sentences while strictly following the vocabulary list, generate as many high-quality sentences as you can.
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
        config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.9, },
    });
    
    return JSON.parse(response.text) as AiFillBlanksResponseItem[];
}


export const useAiGameGenerator = (contentItems: ContentItem[]) => {
    const [scrambleQuestions, setScrambleQuestions] = useState<ScrambleQuestion[]>([]);
    const [fillBlanksQuestions, setFillBlanksQuestions] = useState<FillBlanksQuestion[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [generationTrigger, setGenerationTrigger] = useState(0);

    const vocabularyItems = useMemo(() => {
        return contentItems.filter(item => item.Category === 'Vocabulary' || (item.Category === 'Grammar' && item.SubCategory.startsWith('Verb')));
    }, [contentItems]);

    const tokenizer = useMemo(() => createTokenizer(contentItems), [contentItems]);
    const getRomajiForPart = useMemo(() => createRomajiConverter(contentItems), [contentItems]);
    
    const regenerate = () => setGenerationTrigger(t => t + 1);

    useEffect(() => {
        if (vocabularyItems.length < 15) {
            setScrambleQuestions([]);
            setFillBlanksQuestions([]);
            setIsGenerating(false);
            setGenerationError(contentItems.length > 0 ? "Not enough vocabulary for AI games." : null);
            return;
        }

        const generateGames = async () => {
            setIsGenerating(true);
            setGenerationError(null);
            
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const vocabList = shuffleArray(vocabularyItems).slice(0, 100).map((item: ContentItem) => `- ${item.Hiragana.split('/')[0].trim()} (${item.English})`).join('\n');
                
                const [scrambleResult, fillBlanksResult] = await Promise.all([
                    generateScramble(ai, vocabList),
                    generateFillBlanks(ai, vocabList)
                ]);

                // Process Scramble questions
                const processedScramble = scrambleResult.map(item => ({
                    ...item,
                    japanese: item.japanese.replace(/[()（）]/g, ''),
                    words: tokenizer(item.japanese.replace(/[()（）]/g, ''))
                })).filter(q => q.words.length >= 3);
                
                if(processedScramble.length === 0) throw new Error("AI failed to generate valid Sentence Scramble questions.");
                setScrambleQuestions(processedScramble);


                // Process Fill in the Blanks questions
                const processedFillBlanks: FillBlanksQuestion[] = [];
                for (const item of fillBlanksResult) {
                    const correctAnswer = item.blanked_word;
                    if (!item.japanese_sentence.includes(correctAnswer)) continue;

                    const sentenceWithBlank = item.japanese_sentence.replace(correctAnswer, BLANK_MARKER);
                    const partsWithBlank = tokenizer(sentenceWithBlank);
                    const romajiSentenceWithBlank = partsWithBlank.map(part => part === BLANK_MARKER ? BLANK_MARKER : getRomajiForPart(part)).join(' ');

                    let distractors: string[] = [];
                    const answerItem = vocabularyItems.find(v => v.Hiragana.startsWith(correctAnswer));
                    if (PARTICLES.includes(correctAnswer)) {
                        distractors = shuffleArray(PARTICLES.filter(p => p !== correctAnswer)).slice(0, 2);
                    } else if (answerItem) {
                        const distractorPool = vocabularyItems.filter(v => v.SubCategory === answerItem.SubCategory && !v.Hiragana.startsWith(correctAnswer));
                        distractors = shuffleArray(distractorPool).slice(0, 2).map((d: ContentItem) => d.Hiragana.split('/')[0].trim());
                    }
                    if (distractors.length < 2) {
                        const fallbackPool = vocabularyItems.filter(v => !v.Hiragana.startsWith(correctAnswer));
                        distractors.push(...shuffleArray(fallbackPool).slice(0, 2 - distractors.length).map((d: ContentItem) => d.Hiragana.split('/')[0].trim()));
                    }

                    const options = shuffleArray([correctAnswer, ...distractors]);
                    processedFillBlanks.push({
                        sentenceWithBlank, romajiSentenceWithBlank, englishHint: item.english_translation,
                        options: options.map(opt => ({ japanese: opt, romaji: getRomajiForPart(opt) })),
                        correctAnswer
                    });
                }
                if(processedFillBlanks.length === 0) throw new Error("AI failed to generate valid Fill-in-the-Blanks questions.");
                setFillBlanksQuestions(processedFillBlanks);


            } catch (err) {
                console.error("Failed to generate AI games:", err);
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setGenerationError(`AI Generation Error: ${message}`);
                setScrambleQuestions([]);
                setFillBlanksQuestions([]);
            } finally {
                setIsGenerating(false);
            }
        };

        generateGames();

    }, [vocabularyItems, generationTrigger, tokenizer, getRomajiForPart, contentItems.length]);

    return { scrambleQuestions, fillBlanksQuestions, isGenerating, generationError, regenerate };
};