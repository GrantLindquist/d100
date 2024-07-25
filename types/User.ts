// User session info
export interface UserSession {
  id: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// User info that needs to be stored in Firebase for app use
export interface UserFunctional extends UserSession {
  campaignIds: string[];
  createdAt: number;
}
