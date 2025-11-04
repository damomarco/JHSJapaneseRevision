import { ContentItem } from '../types';

export const BLANK_MARKER = '＿＿＿';

const WORD_EXCEPTIONS = [
    'こんにちは', 'ありがとう', 'どうぞよろしく', 'おやすみなさい', 'はじめまして',
];

const PARTICLES = ['は', 'が', 'を', 'に', 'へ', 'と', 'も', 'の', 'で', 'か', 'ね', 'よ', 'から', 'まで'];
const ENDINGS_PUNCTUATION = [
    'ます', 'ません', 'ました', 'ませんでした', 'ましょう',
    'です', 'でした', 'ですか', 'でしたか', 'ではありません', 'じゃありません',
    'ください', 'なさい',
    '。', '、', '！', '？', '「', '」'
];

export const createTokenizer = (contentItems: ContentItem[]) => {
    const vocabularyWords = contentItems.map(i => i.Hiragana.split(/[\(\s]/)[0].trim()).filter(Boolean);
    const allKnownWords = [...new Set([...vocabularyWords, ...WORD_EXCEPTIONS])];
    
    let allTokens = [...allKnownWords, ...PARTICLES, ...ENDINGS_PUNCTUATION];
    allTokens.sort((a, b) => b.length - a.length);
    const allTokensWithBlank = [BLANK_MARKER, ...allTokens];

    return (sentence: string): string[] => {
        if (!sentence) return [];
        const tokens: string[] = [];
        let remainingSentence = sentence.replace(/\s+/g, '');

        while (remainingSentence.length > 0) {
            let foundMatch = false;
            for (const token of allTokensWithBlank) {
                if (remainingSentence.startsWith(token)) {
                    tokens.push(token);
                    remainingSentence = remainingSentence.substring(token.length);
                    foundMatch = true;
                    break;
                }
            }
            if (!foundMatch) {
                // Fallback for unknown characters/words (e.g., from AI generation)
                tokens.push(remainingSentence[0]);
                remainingSentence = remainingSentence.substring(1);
            }
        }
        return tokens.filter(Boolean);
    };
};

const ROMANIZATION_TABLE: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'o', 'ん': 'n',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'ぢゃ': 'ja', 'ぢゅ': 'ju', 'ぢょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    '。': '.', '、': ',', '！': '!', '？': '?', '「':'`', '」':'`'
};

const toRomajiCharByChar = (text: string): string => {
    if (!text) return '';
    let result = '';
    for (let i = 0; i < text.length; i++) {
        if (text[i] === 'っ') {
            if (i + 1 < text.length) {
                const nextChar = text[i + 1];
                const nextRomaji = toRomajiCharByChar(nextChar);
                if (nextRomaji && !['a', 'i', 'u', 'e', 'o'].includes(nextRomaji[0])) {
                    result += nextRomaji[0];
                }
            }
            continue;
        }

        if (text[i] === 'ー') {
            if (result.length > 0) {
                 const lastChar = result[result.length - 1];
                 if (['a', 'i', 'u', 'e', 'o'].includes(lastChar)) {
                     result += lastChar;
                     continue;
                 }
            }
            continue;
        }

        if (i + 1 < text.length) {
            const twoChar = text.substring(i, i + 2);
            if (ROMANIZATION_TABLE[twoChar]) {
                result += ROMANIZATION_TABLE[twoChar];
                i++;
                continue;
            }
        }
        
        if (ROMANIZATION_TABLE[text[i]]) {
            result += ROMANIZATION_TABLE[text[i]];
        } else {
            result += text[i];
        }
    }
    return result;
};


export const createRomajiConverter = (contentItems: ContentItem[]) => {
    const dictionary = new Map<string, string>();
    contentItems.forEach(item => {
        const hiraganaBase = item.Hiragana.split(/[\(\s]/)[0].trim();
        const romajiBase = item.Romaji.split(/[\(\s]/)[0].trim();
        if (hiraganaBase && romajiBase && !dictionary.has(hiraganaBase)) {
            dictionary.set(hiraganaBase, romajiBase);
        }
        if (item.Japanese !== item.Hiragana && item.Japanese && romajiBase && !dictionary.has(item.Japanese)) {
            dictionary.set(item.Japanese, romajiBase);
        }
    });

     // Add common endings from grammar rules if not present
     const commonEndings = {
        'です': 'desu', 'ます': 'masu', 'ました': 'mashita', 'ません': 'masen', 'ください': 'kudasai'
     };
     for (const [jp, romaji] of Object.entries(commonEndings)) {
         if (!dictionary.has(jp)) {
             dictionary.set(jp, romaji);
         }
     }

    return (part: string): string => {
        if (part === 'は') return 'wa';
        if (part === 'へ') return 'e';
        if (dictionary.has(part)) {
            return dictionary.get(part)!;
        }
        return toRomajiCharByChar(part);
    };
};
