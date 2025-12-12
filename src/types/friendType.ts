// Friend request types for Firestore

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: FriendRequestStatus;
  createdAt: Date | null;
  updatedAt?: Date | null;
}

export interface Friend {
  odId: string;
  odName?: string;
  addedAt: Date | null;
}
