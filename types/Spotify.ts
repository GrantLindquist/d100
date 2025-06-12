export interface SpotifyBase {
  id: string;
  title: string;
  creatorName: string;
  type: string;
  albumArtUrl?: string;
  trackCount?: number;
}

export interface Playlist {
  id: string;
  title: string;
  spotifyItems: SpotifyBase[];
}