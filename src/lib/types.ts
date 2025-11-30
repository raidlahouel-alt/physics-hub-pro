export type StudentLevel = 'second_year' | 'baccalaureate';
export type ContentType = 'lesson' | 'summary' | 'exercise';
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected';
export type PaymentMethod = 'ccp' | 'golden_card';

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

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference: string | null;
  status: PaymentStatus;
  month_paid_for: string;
  receipt_url: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
