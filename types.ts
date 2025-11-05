
export interface ContentItem {
  Unit: number;
  Category: string;
  SubCategory: string;
  Japanese: string;
  Hiragana: string;
  Romaji: string;
  English: string;
}

export interface UnitData {
  contentItems: ContentItem[];
}

export interface AiScrambleResponseItem {
  japanese: string;
  english: string;
}

export interface AiFillBlanksResponseItem {
  japanese_sentence: string;
  english_translation: string;
  blanked_word: string;
}

export interface AiCorrectTheErrorResponseItem {
  japanese_sentence: string;
  is_correct: boolean;
  english_translation: string;
  correct_english_translation: string;
}
