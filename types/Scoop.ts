// i·tem [ˈīdəm] (noun) - an individual article or unit, especially one that is part of a list, collection, or set.
// Synonyms: SCOOP (may rename later)

export type ScoopType = 'article' | 'quest' | 'collection';

export interface Scoop {
  id: string;
  campaignId: string;
  title: string;
  type: ScoopType;
  breadcrumbs: Breadcrumb[] | null;
}

export interface Collection extends Scoop {
  scoopIds: string[];
}

export interface Article extends Scoop {
  sections: Section[];
}

export interface Section {
  id: string;
  isHeader: boolean;
  title: string;
  body: string;
  authorId: string;
}

export interface Breadcrumb {
  id: string;
  title: string;
}
