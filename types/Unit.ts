export type UnitType = 'article' | 'quest' | 'collection';

export interface Unit {
  id: string;
  campaignId: string;
  title: string;
  type: UnitType;
  breadcrumbs: Breadcrumb[] | null;
}

export interface Collection extends Unit {
  unitIds: string[];
}

export interface Article extends Unit {
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
