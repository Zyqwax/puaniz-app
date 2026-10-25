import { User as FirebaseUser } from "firebase/auth";

export type ThemeMode = "light" | "dark" | "system";
export type ExamType = "TYT" | "AYT";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  name?: string | null;
  photoURL?: string | null;
  avatarUrl?: string | null;
  bio?: string;
  field?: "SAY" | "EA" | "SÖZ" | "DİL" | string;
  grade?: string;
  targetNet?: number;
  targetRanking?: number;
  targetDepartment?: string;
  targetUniversity?: string;
  goals?: any;
  welcomeMessage?: any;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface SubjectScore {
  d: number; // Doğru
  y: number; // Yanlış
  net: number;
}

export interface ExamRecord {
  id: string;
  userId?: string;
  title?: string;
  name: string;
  type: "TYT" | "AYT" | string;
  subtype?: string;
  examType?: "TYT" | "AYT" | string;
  date: string;
  totalNet: number;
  net?: number;
  calculatedScore?: number;
  score?: number;
  estimatedRank?: number;
  rank?: number;
  notes?: string;
  field?: "SAY" | "EA" | "SÖZ" | string;
  subjects?: Record<string, SubjectScore>;
  scores: Record<string, any>;
  createdAt?: any;
  [key: string]: any;
}

export interface PostComment {
  id: string;
  postId?: string;
  userId?: string;
  userName?: string;
  userPhoto?: string;
  content?: string;
  text?: string;
  replyToId?: string | null;
  replyToUser?: string | null;
  isEdited?: boolean;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface ForumPost {
  id: string;
  userId?: string;
  userName?: string;
  userPhoto?: string;
  title?: string;
  content?: string;
  text?: string;
  tags?: string[];
  imageUrl?: string;
  likes?: string[];
  likesCount?: number;
  commentsCount?: number;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export type Post = ForumPost;

export type TopicStatus = "not_started" | "in_progress" | "completed";

export interface TopicProgress {
  status: TopicStatus;
  notes?: string;
  updatedAt?: any;
}

export interface TopicTrackingItem {
  completed?: boolean;
  questionCount?: number;
  repeatCount?: number;
  lastStudied?: string | null;
  [key: string]: any;
}

export interface SubjectTopics {
  name: string;
  color: string;
  topics: string[];
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: any;
  status?: string;
  reasoning?: string;
  [key: string]: any;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  reloadUserProfile: () => Promise<void>;
}

export interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
}
