import { useState, useEffect, useMemo } from 'react';
import { ContentItem, AiScrambleResponseItem, AiFillBlanksResponseItem, AiCorrectTheErrorResponseItem } from '../types';
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
        2. In addition to the list, you can and should use the polite request ending "ください" (kudasai) after verbs that are in the te-form (like 'たって', 'すわって', etc.) to make polite commands. For example, "NAMEさん、たってください".
        3. Ensure the sentences are diverse. Avoid using the exact same sentence structure for every sentence. Create a mix of questions, statements, and polite requests.
        4. Each sentence must be unique and grammatically correct.
        5. The sentences must be suitable for a beginner Japanese learner, using polite forms where appropriate.
        6. For each sentence you generate, provide its simple English translation.
        
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
        Your task is to generate up to ${MAX_QUESTIONS} simple, semantically plausible Japanese sentences, each with a single word blanked out.

        **CRITICAL INSTRUCTIONS:**
        1.  **Vocabulary Focus:** The sentences must be constructed primarily using words from the vocabulary list provided below. You may use common particles (は, が, を, に, etc.) and conjugate verbs as needed for grammatical correctness.
        2.  **Blanked Word:** For each sentence, choose ONE word to remove. This can be a noun, adjective, verb, or particle.
        3.  **Sentence Quality:** Sentences must be grammatically correct, simple for beginners, and make logical sense.
        4.  **Output Format:** For each question, you will provide three pieces of information in a JSON object:
            a.  \`japanese_sentence\`: The full, complete Japanese sentence.
            b.  \`english_translation\`: The English translation of the sentence.
            c.  \`blanked_word\`: The **exact** word that was removed from the Japanese sentence. This value **MUST** be a substring of \`japanese_sentence\`.
        5.  **Quantity:** Generate ${MAX_QUESTIONS} unique questions.
        6.  **Return Type:** Return a JSON array of these objects.

        **Vocabulary List (use these words to build your sentences):**
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

async function generateCorrectTheError(ai: GoogleGenAI, vocabList: string): Promise<AiCorrectTheErrorResponseItem[]> {
    const prompt = `
        You are a Japanese language teacher creating 'spot the error' quiz questions.
        Your task is to generate ${MAX_QUESTIONS} simple Japanese sentences and an English translation for each.
        Crucially, for about half of the sentences, the English translation should be **perfectly correct**. For the other half, the translation must contain **one subtle but clear error**.

        **Instructions:**
        1.  **Vocabulary:** You MUST ONLY use words from the provided list:
            ${vocabList}
        2.  **Sentence Quality:** The Japanese sentences must be simple, grammatically correct, and suitable for beginners.
        3.  **Translation Quality:**
            *   **Correct Translations:** Must be accurate and natural-sounding English translations.
            *   **Incorrect Translations:** Must have a single, subtle mistake. Examples of good mistakes: wrong tense (e.g., 'ate' vs 'eat'), wrong particle meaning ('with' vs 'at'), slightly incorrect vocabulary ('house' vs 'home'), wrong subject/object. The mistake should be plausible, not nonsensical.
        4.  **Output Format:** For each question, provide a JSON object with four fields:
            a.  \`japanese_sentence\`: The original Japanese sentence.
            b.  \`is_correct\`: A boolean. \`true\` if the \`english_translation\` is correct, \`false\` if it is flawed.
            c.  \`english_translation\`: The English translation to show the student (which may be correct or incorrect).
            d.  \`correct_english_translation\`: The **definitively correct** English translation. This must be provided for *all* items, whether \`is_correct\` is true or false.

        **Return a JSON array of these objects.**
    `;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                japanese_sentence: { type: Type.STRING },
                is_correct: { type: Type.BOOLEAN },
                english_translation: { type: Type.STRING },
                correct_english_translation: { type: Type.STRING }
            },
            required: ['japanese_sentence', 'is_correct', 'english_translation', 'correct_english_translation']
        }
    };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.8 },
    });

    return JSON.parse(response.text) as AiCorrectTheErrorResponseItem[];
}


export const useAiGameGenerator = (contentItems: ContentItem[]) => {
    const [scrambleQuestions, setScrambleQuestions] = useState<ScrambleQuestion[]>([]);
    const [fillBlanksQuestions, setFillBlanksQuestions] = useState<FillBlanksQuestion[]>([]);
    const [correctTheErrorQuestions, setCorrectTheErrorQuestions] = useState<AiCorrectTheErrorResponseItem[]>([]);
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
            setCorrectTheErrorQuestions([]);
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
                
                const [scrambleResult, fillBlanksResult, correctTheErrorResult] = await Promise.all([
                    generateScramble(ai, vocabList),
                    generateFillBlanks(ai, vocabList),
                    generateCorrectTheError(ai, vocabList)
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

                // Process Correct the Error questions
                if (correctTheErrorResult.length === 0) throw new Error("AI failed to generate valid Correct the Error questions.");
                setCorrectTheErrorQuestions(correctTheErrorResult);

            } catch (err) {
                console.error("Failed to generate AI games:", err);
                const message = err instanceof Error ? err.message : 'An unknown error occurred.';
                setGenerationError(`AI Generation Error: ${message}`);
                setScrambleQuestions([]);
                setFillBlanksQuestions([]);
                setCorrectTheErrorQuestions([]);
            } finally {
                setIsGenerating(false);
            }
        };

        generateGames();

    }, [vocabularyItems, generationTrigger, tokenizer, getRomajiForPart, contentItems.length]);

    return { scrambleQuestions, fillBlanksQuestions, correctTheErrorQuestions, isGenerating, generationError, regenerate };
};
