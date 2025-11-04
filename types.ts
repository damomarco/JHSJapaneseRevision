
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
