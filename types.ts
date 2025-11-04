
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
