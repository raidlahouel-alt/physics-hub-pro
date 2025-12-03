export type StudentLevel = 'second_year' | 'baccalaureate';
export type ContentType = 'lesson' | 'summary' | 'exercise';
export type AppRole = 'teacher' | 'student';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  phone_verified?: boolean | null;
  level: StudentLevel | null;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: string;
  title: string;
  description: string | null;
  content_type: ContentType;
  level: StudentLevel;
  difficulty: number | null;
  file_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  level: StudentLevel | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  content_id: string | null;
  parent_id: string | null;
  message: string;
  is_question: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  content_id: string | null;
  is_read: boolean;
  created_at: string;
}
