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
