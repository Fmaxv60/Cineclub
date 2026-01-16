export type UserRole = 'user' | 'admin';
export type RoomMemberRole = 'member' | 'moderator' | 'owner';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface Room {
  id: string;
  name: string;
  owner_id: string;
  is_private: boolean;
  created_at: Date;
}

export interface RoomMember {
  user_id: string;
  room_id: string;
  role: RoomMemberRole;
}

export interface Rating {
  id: string;
  user_id: string;
  tmdb_movie_id: number;
  score: number;
  comment: string | null;
  created_at: Date;
}
