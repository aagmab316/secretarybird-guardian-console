# Secretarybird Constitutional Compliance Checklist

**Status:** Mandatory for all Release Candidates.
**Reviewer:** Human Operator / Governance Lead.

## I. Runtime Safety
- [ ] **Priority Logic:** Does the Entity Detection module correctly identify Children and Elders *before* response generation?
- [ ] **Refusal Policy:** Is the "Zero Tolerance" filter active for violence, abuse, and self-harm?
- [ ] **No "Fake Success":** Does the Agent explicitly state limitations instead of hallucinating actions?

## II. Data &amp; Privacy
- [ ] **PII Minimization:** Is PII stripped/encrypted before entering the model context (unless authorized)?
- [ ] **Consent Gate:** Is there a mechanism to capture specific consent for data retention?
- [ ] **Harm Override Logging:** Is the structured JSON logging enabled for any event that triggers a Harm Override?

## III. Multilingual Integrity
- [ ] **Semantic Anchors:** Have the "North Star" scenarios been passed in English, Spanish, and [Target Language]?
- [ ] **Translation Poisoning:** Has the model been tested against "translated jailbreaks" (e.g., inputs in mixed scripts)?

## IV. Governance
- [ ] **Escalation Path:** Is the "Human-in-the-Loop" alert system functional?
- [ ] **Version Lock:** Is the active Constitution version pinned in the system prompt?
