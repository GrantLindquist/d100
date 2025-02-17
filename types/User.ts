export interface UserBase {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface User extends UserBase {
  campaignIds: string[];
  createdAt: number;
  spotifyRefreshToken?: string;
}

export interface SpotifyAccessToken {
  token: string;
  expiresAt: number;
}
