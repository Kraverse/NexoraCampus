export interface PublicUser {
  id: number;
  name: string;
  email: string;
  avatarColor: string;
  bio: string | null;
  college: string | null;
  collegeVerified: boolean;
  role: string;
  createdAt: string;
}

export interface FeedPost {
  id: number;
  title: string;
  body: string;
  summary: string | null;
  category: string;
  tags: string[];
  imageUrl: string | null;
  location: string | null;
  price: string | null;
  likeCount: number;
  saveCount: number;
  viewCount: number;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorColor: string;
  authorCollege: string | null;
  authorVerified: boolean;
  saved?: boolean;
}

export interface RelatedPost {
  id: number;
  title: string;
  summary: string | null;
  category: string;
  tags: string[];
  likeCount: number;
  saveCount: number;
  viewCount: number;
  createdAt: string;
  authorName: string;
  authorColor: string;
}
