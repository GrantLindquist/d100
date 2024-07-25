export interface Collection {
  id: string;
  parentId?: string;
  campaignId: string;
  title: string;
  description: string;
  articles: Article[];
}

export interface Article {
  id: string;
  campaignId: string;
  title: string;
  overview: string;
  sections: Section[];
}

export interface Section {
  title: string;
  body: string;
}
