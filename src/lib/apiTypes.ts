/**
 * Shared API types for the Guardian Console
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface FirewallEvent {
  id: string;
  household_id: string;
  occurred_at: string; // ISO datetime
  source: string; // e.g. "WHATSAPP", "SMS", "WEB_FORM"
  category: string; // e.g. "SCAM", "FRAUD", "ABUSE"
  description: string;
  risk_level: RiskLevel;
  metadata?: Record<string, unknown>;
  explanation_for_humans?: string;
}

export interface Household {
  id: string;
  name: string;
  members_count: number;
  created_at: string;
  updated_at: string;
}

/** Case-level risk observation created by a human operator + AI support */
export interface CaseRiskObservation {
  id: string;
  case_id: string;
  created_at: string; // ISO datetime
  created_by?: string;
  narrative: string;
  risk_level: RiskLevel;
  /** 0–5: how strong is this risk signal in your judgment? */
  signal_strength: number;
  /** Optional category like SCAM, ABUSE, NEGLECT, OTHER */
  category?: string;
  metadata?: Record<string, unknown>;
  explanation_for_humans?: string;
}

/** Payload used when recording a new observation */
export interface CreateCaseRiskObservationInput {
  narrative: string;
  risk_level: RiskLevel;
  signal_strength: number;
  category?: string;
}

/** Darknet Shield RAG Search types */
export interface SearchRequest {
  query: string;
  mode?: "standard" | "deep" | "summarized";
}

export interface SearchResponse {
  answer: string;
  citations: string[];
}

/** Phishing Inoculator types */
export type DrillStatus = "pending" | "active" | "completed" | "failed";
export type ThreatType = "email_phishing" | "sms_smishing" | "voice_vishing" | "fake_delivery" | "fake_support";

export interface PhishingDrill {
  id: string;
  title: string;
  description: string;
  target_user_id: string;
  target_member_name: string;
  threat_type: ThreatType;
  status: DrillStatus;
  scheduled_for: string; // ISO datetime
  created_at: string;
  context?: Record<string, unknown>;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string; // "parent", "child", "guardian", "elder"
  age?: number;
  created_at: string;
}

export interface SecurityScore {
  score: number; // 0-100
  percentage: number; // 0-100
  drills_completed: number;
  passed: number;
  needs_training: number;
  last_updated: string;
}
