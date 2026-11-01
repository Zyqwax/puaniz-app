export type ThemeMode = "light" | "dark" | "system";
export type ExamType = "TYT" | "AYT";

/**
 * Session user exposed by `useAuth()`. Carries Firebase-era aliases
 * (`uid`, `displayName`, `photoURL`) so existing components keep working.
 */
export interface SessionUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  displayName: string;
  image: string | null;
  photoURL: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

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
  userPhoto?: string | null;
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
  userPhoto?: string | null;
  title?: string;
  content?: string;
  text?: string;
  tags?: string[];
  imageUrl?: string | null;
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
  user: SessionUser | null;
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

/* ── School & Multi-Tenant Types ─────────────────────────────────────────── */

export type UserRole = "superadmin" | "principal" | "teacher" | "student";

export interface School {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  district?: string | null;
  createdAt: any;
  studentCount?: number;
  teacherCount?: number;
  classCount?: number;
}

export interface ClassItem {
  id: string;
  schoolId: string;
  name: string;
  grade: string;
  field?: string | null;
  joinCode: string;
  studentCount?: number;
  createdAt?: any;
}

export interface SchoolMemberInfo {
  id: string;
  schoolId: string;
  schoolName: string;
  role: "principal" | "teacher" | "student";
  title?: string | null;
  classId?: string | null;
  className?: string | null;
  studentNumber?: string | null;
}

export interface SchoolExamRecord {
  id: string;
  schoolId: string;
  name: string;
  type: string;
  date: string;
  totalParticipants?: number;
  averageNet?: number;
  createdAt?: any;
}

export interface SchoolStudentExamResult {
  id: string;
  schoolExamId: string;
  examName: string;
  examDate: string;
  examType: string;
  studentNumber: string;
  studentName: string;
  scores: Record<string, SubjectScore>;
  totalNet: number;
  rankInClass?: number | null;
  rankInSchool?: number | null;
  totalInClass?: number;
  totalInSchool?: number;
}

/* ── Student Activities & Coaching Types ─────────────────────────────────── */

export interface StudySessionItem {
  id: string;
  userId: string;
  subject: string;
  durationMinutes: number;
  questionCount: number;
  notes?: string | null;
  date: string;
  createdAt: any;
}

export interface StudyStats {
  todayMinutes: number;
  todayQuestions: number;
  totalMinutes: number;
  totalQuestions: number;
  currentStreak: number;
  recentSessions: StudySessionItem[];
}

export interface TeacherFeedbackItem {
  id: string;
  teacherId: string;
  teacherName?: string;
  studentUserId: string;
  classId?: string | null;
  className?: string | null;
  note: string;
  createdAt: any;
}
