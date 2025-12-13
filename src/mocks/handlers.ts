import { http, HttpResponse } from "msw";

// Mock data types
interface MockRiskObservation {
  id: string;
  case_id: string;
  narrative: string;
  risk_level: string;
  signal_strength: number;
  category: string;
  created_at: string;
  created_by: string;
  explanation_for_humans?: string;
}

interface MockFirewallEvent {
  id: string;
  household_id: string;
  occurred_at: string;
  source: string;
  category: string;
  description: string;
  risk_level: string;
  explanation_for_humans?: string;
}

interface CreateObservationBody {
  narrative: string;
  risk_level?: string;
  signal_strength?: number;
  category?: string;
}

// Mock data
const mockCases = [
  {
    id: 1,
    title: "Child Safety Concern - Home Visit Required",
    description:
      "Initial intake regarding concerns about living conditions and supervision.",
    category: "child_safety",
    risk_level: 4,
    status: "open",
    household_id: "demo-household",
    created_at: "2025-12-01T14:30:00Z",
    updated_at: "2025-12-05T10:15:00Z",
  },
  {
    id: 2,
    title: "Family Support - Education Barriers",
    description:
      "Case opened to address school attendance and family resource gaps.",
    category: "family_support",
    risk_level: 2,
    status: "active",
    household_id: "demo-household",
    created_at: "2025-11-20T09:00:00Z",
    updated_at: "2025-12-04T16:45:00Z",
  },
  {
    id: 3,
    title: "Elder Care Assessment",
    description: "Ongoing monitoring of caregiver arrangements and health.",
    category: "elder_care",
    risk_level: 1,
    status: "active",
    household_id: "demo-household",
    created_at: "2025-10-15T11:20:00Z",
    updated_at: "2025-12-05T08:00:00Z",
  },
];

const mockRiskObservations: Record<number, MockRiskObservation[]> = {
  1: [
    {
      id: "obs-101",
      case_id: "1",
      narrative:
        "Visited home on 12/4/2025. Living room showed minimal furnishings and dampness on walls. Three children present, all appearing clean and engaged. Mother reported recent job loss, expressed concern about utility payments.",
      risk_level: "HIGH",
      signal_strength: 4,
      category: "home_conditions",
      created_at: "2025-12-04T14:00:00Z",
      created_by: "Maria Santos",
      explanation_for_humans:
        "This observation indicates housing instability risk. Guardian recommends coordinating with utility assistance programs and employment services.",
    },
    {
      id: "obs-102",
      case_id: "1",
      narrative:
        "Phone check-in with mother. She reports accessing emergency assistance funds and connecting with local food bank. Discussed school enrollment status for youngest child.",
      risk_level: "LOW",
      signal_strength: 2,
      category: "support_access",
      created_at: "2025-12-05T10:00:00Z",
      created_by: "James Chen",
    },
  ],
  2: [
    {
      id: "obs-201",
      case_id: "2",
      narrative:
        "School reported 8 absences in past 4 weeks. Father reports transportation challenges. Discussed alternative school options closer to home.",
      risk_level: "MEDIUM",
      signal_strength: 2,
      category: "education",
      created_at: "2025-11-25T13:30:00Z",
      created_by: "Alex Rodriguez",
    },
  ],
  3: [],
};

const mockFirewallEvents: Record<string, MockFirewallEvent[]> = {
  "demo-household": [
    {
      id: "fw-001",
      household_id: "demo-household",
      occurred_at: "2025-12-07T18:45:00Z",
      source: "WHATSAPP",
      category: "SCAM",
      description:
        "Suspicious link in message claiming to be from family member requesting money. Link blocked by Firewall.",
      risk_level: "HIGH",
      explanation_for_humans:
        "Classic phishing attempt. The message format matches known scam patterns. Recipients have been alerted and the link is blocked network-wide.",
    },
    {
      id: "fw-002",
      household_id: "demo-household",
      occurred_at: "2025-12-07T14:20:00Z",
      source: "SMS",
      category: "FRAUD",
      description:
        "Text claiming to be from banking app requesting account verification. Flagged as spoofing attempt.",
      risk_level: "MEDIUM",
      explanation_for_humans:
        "SMS spoofing detected. Real banks never request login credentials via SMS. Message has been flagged and reported.",
    },
    {
      id: "fw-003",
      household_id: "demo-household",
      occurred_at: "2025-12-06T10:15:00Z",
      source: "WEB_FORM",
      category: "ABUSE",
      description:
        "Harassing comments reported on family community forum. Account flagged and moderation team notified.",
      risk_level: "MEDIUM",
    },
    {
      id: "fw-004",
      household_id: "demo-household",
      occurred_at: "2025-12-05T16:30:00Z",
      source: "WHATSAPP",
      category: "MANIPULATION",
      description:
        "Suspicious contact from unknown account with manipulative messaging patterns identified.",
      risk_level: "LOW",
      explanation_for_humans:
        "Pattern analysis detected minor manipulation tactics. Family members have been made aware to exercise caution.",
    },
  ],
};

export const handlers = [
  // Cases endpoints
  http.get("/cases", () => {
    return HttpResponse.json(mockCases);
  }),

  http.get("/cases/:caseId", ({ params }) => {
    const caseId = parseInt(params.caseId as string);
    const caseData = mockCases.find((c) => c.id === caseId);

    if (!caseData) {
      return HttpResponse.json(
        {
          message: "Case not found",
          code: "CASE_NOT_FOUND",
          explanation_for_humans:
            "This case ID does not exist or has been deleted.",
        },
        { status: 404 },
      );
    }

    return HttpResponse.json(caseData);
  }),

  http.get("/cases/:caseId/risk-observations", ({ params }) => {
    const caseId = parseInt(params.caseId as string);
    const observations = mockRiskObservations[caseId] ?? [];

    return HttpResponse.json(observations);
  }),

  http.post("/cases/:caseId/risk-observations", async ({ params, request }) => {
    const caseId = parseInt(params.caseId as string);
    const body = (await request.json()) as CreateObservationBody;

    const newObservation: MockRiskObservation = {
      id: `obs-${Math.floor(Math.random() * 1000000)}`,
      case_id: String(caseId),
      narrative: body.narrative,
      risk_level: body.risk_level ?? "LOW",
      signal_strength: body.signal_strength ?? 2,
      category: body.category ?? "general",
      created_at: new Date().toISOString(),
      created_by: "Current User",
    };

    if (!mockRiskObservations[caseId]) {
      mockRiskObservations[caseId] = [];
    }

    mockRiskObservations[caseId].push(newObservation);

    return HttpResponse.json(newObservation, { status: 201 });
  }),

  // Firewall events endpoints
  http.get("/firewall/households/:householdId/events", ({ params }) => {
    const householdId = params.householdId as string;
    const events = mockFirewallEvents[householdId] ?? [];

    return HttpResponse.json(events);
  }),

  // Example: auth/me
  http.get("/auth/me", () => {
    return HttpResponse.json({
      id: "user-1",
      name: "Test User",
      email: "user@example.com",
      roles: ["operator"],
    });
  }),
];
