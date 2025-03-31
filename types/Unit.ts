import { SpotifyBase } from '@/types/Spotify';

export type UnitType = 'article' | 'quest' | 'collection' | 'encounter';
export const UnitEnum = ['article', 'quest', 'collection', 'encounter'];
export const UnitDisplayValues = {
  article: 'Article',
  quest: 'Quest',
  collection: 'Sub-Collection',
  encounter: 'Encounter',
};

export interface Unit {
  id: string;
  campaignId: string;
  title: string;
  type: UnitType;
  breadcrumbs: Breadcrumb[];
  hidden: boolean;
  lastEdited?: number;
  spotifyItems?: SpotifyBase[];
}

export interface Collection extends Unit {
  unitIds: string[];
}

export interface Article extends Unit {
  content: Object;
  imageUrls: ImageUrl[];
}

export interface Quest extends Article {
  loot: Loot[] | null;
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
