// i·tem [ˈīdəm] (noun) - an individual article or unit, especially one that is part of a list, collection, or set.
// Synonyms: SCOOP (may rename later)

export interface Scoop {
  id: string;
  campaignId: string;
  title: string;
  description?: string;
  type: 'article' | 'collection';
}

export interface Collection extends Scoop {
  scoopIds: string[];
}

export interface Article extends Scoop {
  articlePath: string;
  overview: string;
  sections: Section[];
}

export interface Section {
  title: string;
  body: string;
}
