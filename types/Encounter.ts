import { Unit } from '@/types/Unit';

export interface Encounter extends Unit {
  tokens: EncounterToken[];
  roundCount: number;
  turnCount: number;
  logs: EncounterLog[];
}

export interface EncounterLog {
  content: string;
  timestamp: number;
}

export interface EncounterToken {
  id: string;
  title: string;
  articleId?: string;
  currentHitPoints: number;
  maxHitPoints: number;
  tempHitPoints: number;
  conditions: {
    name: string;
    roundDuration: number;
  }[];
  isPlayer: boolean;
  deathSaves?: boolean[];
}
