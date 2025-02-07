export type UnitType = 'article' | 'quest' | 'collection';
export const UnitEnum = ['article', 'quest', 'collection'];
export const UnitDisplayValues = {
  article: 'Article',
  quest: 'Quest',
  collection: 'Sub-Collection',
};

export interface Unit {
  id: string;
  campaignId: string;
  title: string;
  type: UnitType;
  breadcrumbs: Breadcrumb[];
  hidden: boolean;
  lastEdited?: number;
}

export interface Collection extends Unit {
  unitIds: string[];
}

export interface Article extends Unit {
  content: Object;
  imageUrls: ImageUrl[];
}

export interface Quest extends Article {
  loot: Loot[];
  complete: boolean;
}

export interface Breadcrumb {
  url: string;
  unitId: string;
}

export interface ImageUrl {
  src: string;
  // height / width
  ratio: number;
}

export interface Loot {
  id: string;
  title: string;
  currencyType: 'pp' | 'gp' | 'sp' | 'cp';
  currencyQuantity: number;
}

export type CurrencyType = 'pp' | 'gp' | 'sp' | 'cp';
