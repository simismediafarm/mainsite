export type Role = 'admin' | 'editor' | 'author' | 'contributor' | 'system_ingestor';

export interface Profile {
  id: string;
  userId?: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  role: string;
}

export type SourceType = 'manual' | 'rss' | 'api' | 'webhook';
export type PostStatus = 'ingested' | 'draft' | 'pending_review' | 'approved' | 'published' | 'featured' | 'ranked' | 'monetized' | 'archived';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  author?: Profile;
  tags: string[];
  createdAt: number;
  readingTime: number;
  likes: number;
  views: number;
  sourceType: SourceType;
  status: PostStatus;
  trustScore: number;
  
  // V1.2 DB & Revenue fields
  impressions?: number;
  clicks?: number;
  ctr?: number;
  revenueTotal?: number;
  cpmReal?: number;
  rpmReal?: number;
  adSlotsFilled?: number;
  editorialBoost?: number;
  seoMetadata?: any;
}

export interface CreatePostDTO {
  title: string;
  content: string;
  excerpt?: string;
  authorId: string;
  tags: string[];
  sourceType?: SourceType;
  status?: PostStatus;
  trustScore?: number;
}

export interface SSEEvent<T = any> {
  type: 'post_created' | 'post_deleted' | 'post_updated' | 'like_updated' | 'post_viewed' | 'state_transition' | 'monetization_slot_assigned' | 'feed_reranked' | 'ad_auction_executed' | 'rpm_updated' | 'editorial_state_changed';
  payload: T;
}

export * from './schemas/command.schema';
export * from './constants/queue.constants';

