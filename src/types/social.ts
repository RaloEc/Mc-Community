// =================================================================
// TIPOS PARA SISTEMA SOCIAL
// =================================================================

export interface SocialFollow {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  user_a_id: string;
  user_b_id: string;
  requester_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  responded_at: string | null;
}

export interface Friendship {
  id: string;
  user_one_id: string;
  user_two_id: string;
  created_at: string;
}

export interface SocialBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

// =================================================================
// TIPOS EXTENDIDOS CON INFORMACIÓN DE PERFIL
// =================================================================

export interface FollowerWithProfile extends SocialFollow {
  follower: {
    id: string;
    username: string;
    public_id: string;
    avatar_url: string | null;
    color: string | null;
    role: string;
  };
}

export interface FollowingWithProfile extends SocialFollow {
  followed: {
    id: string;
    username: string;
    public_id: string;
    avatar_url: string | null;
    color: string | null;
    role: string;
  };
}

export interface FriendRequestWithProfiles extends FriendRequest {
  requester: {
    id: string;
    username: string;
    public_id: string;
    avatar_url: string | null;
    color: string | null;
  };
  other_user: {
    id: string;
    username: string;
    public_id: string;
    avatar_url: string | null;
    color: string | null;
  };
}

export interface FriendshipWithProfile extends Friendship {
  friend: {
    id: string;
    username: string;
    public_id: string;
    avatar_url: string | null;
    color: string | null;
    role: string;
  };
}

// =================================================================
// TIPOS PARA RESPUESTAS DE API
// =================================================================

export interface FollowersResponse {
  followers: FollowerWithProfile[];
  total: number;
  page: number;
  limit: number;
}

export interface FollowingResponse {
  following: FollowingWithProfile[];
  total: number;
  page: number;
  limit: number;
}

export interface FriendRequestsResponse {
  requests: FriendRequestWithProfiles[];
  total: number;
}

export interface FriendsResponse {
  friends: FriendshipWithProfile[];
  total: number;
}

export interface SocialStats {
  followers_count: number;
  following_count: number;
  friends_count: number;
  is_following?: boolean;
  is_followed_by?: boolean;
  friendship_status?: 'none' | 'pending_sent' | 'pending_received' | 'friends';
  is_blocked?: boolean;
}
