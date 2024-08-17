import { UserBase } from '@/types/User';

export interface Campaign {
  id: string;
  title: string;
  baseCollectionId: string;
  dmId: string;
  players: UserBase[];
  pendingPlayers: UserBase[];
}
