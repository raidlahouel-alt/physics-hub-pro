export type StudentLevel = 'second_year' | 'baccalaureate';
export type ContentType = 'lesson' | 'summary' | 'exercise';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string | null;
  level: StudentLevel | null;
  is_teacher: boolean;
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
