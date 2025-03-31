import { Unit } from '@/types/Unit';

export interface Encounter extends Unit {
  tokens: EncounterToken[];
  roundCount: number;
  turnCount: number;
  initiativeOrder: string[];
  activeConditions: Condition[];
  logs: EncounterLog[];
}

export interface EncounterLog {
  id: string;
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
  isPlayer: boolean;
  deathSaves: boolean[] | null;
  isDead: boolean;
}

export interface Condition {
  name: string;
  roundDuration: number;
  roundInflicted: number;
  inflictedTokenId: string;
  removeOnEnemyTurn: boolean;
}

