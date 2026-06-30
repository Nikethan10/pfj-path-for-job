// Shared domain types consumed by the service layer and components.

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
}

export interface Skill {
  id: string;
  skill_name: string;
  category?: string;
  level?: string;
  progress_percent?: number;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  category: string;
  icon: string;
  metric: string;
  target: number;
  current: number;
  earned: boolean;
  progress: number;
  earned_at?: string | null;
}

export interface BadgesResponse {
  badges: Badge[];
  earned_count: number;
  total_count: number;
  newly_earned: string[];
  metrics: Record<string, number>;
}

export interface Readiness {
  total_score: number;
  level: string;
  skill_score: number;
  project_score: number;
  resume_score: number;
}
