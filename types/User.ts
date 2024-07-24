// User session info
export interface UserSession {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

// User info that needs to be stored in Firebase for app use
export interface UserFunctional extends UserSession {
  campaigns: string[];
  createdAt: number;
}
