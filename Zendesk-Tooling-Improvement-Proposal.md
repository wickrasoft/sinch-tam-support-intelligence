# Zendesk & Tooling Improvement Proposal

**Author:** EMEA Team Lead (first 30 days)  
**Audience:** Support Operations, Zendesk Admin, Regional Leadership  
**Scope:** EMEA support workflow — customer tickets, supplier escalations, and reporting hygiene

---

## Executive Summary

After two weeks in the EMEA Team Lead role, three recurring friction patterns are increasing handle time, duplicating effort, and reducing visibility for both agents and TAMs. This proposal addresses **two issues already observed in production** (duplicate customer tickets and supplier escalation updates not reopening parent tickets) and recommends **three additional improvements** for evaluation.

Each item includes the problem, proposed change, low-disruption implementation plan, and success metrics.

---

## Issue 1: Duplicate Tickets When Customers Reply on the Same Issue

### What the problem is

When a customer replies on an existing issue — especially after a ticket is **Solved** or **Closed**, or when the reply comes via a **different channel or subject line** — Zendesk often creates a **new ticket** instead of threading to the original. Agents then:

- Work the same problem twice across separate ticket records
- Lose conversation history and prior troubleshooting context
- Report inflated ticket volumes and distorted MTTR/CSAT
- Confuse customers who receive multiple ticket numbers for one issue

**Common root causes in Zendesk:**

| Cause | Example |
|-------|---------|
| Closed-ticket follow-up policy | Customer replies to closure email → new ticket created |
| Email threading break | Subject line changed, missing `In-Reply-To` header |
| Multiple entry points | Same customer uses web form + email + API |
| Organization/contact mismatch | Reply from different email address on the account |
| Auto-routing triggers | New ticket created before merge rules run |

### What I would change and why

**A. Standardise closed-ticket follow-up behaviour**

- Enable **“Allow follow-ups on closed tickets”** with a defined policy:
  - **Reopen** if closed ≤ 7 days and same requester + same organization
  - **Create linked follow-up** if closed > 7 days (preserves clean SLA history on original ticket)
- *Why:* Stops the most common duplicate source without losing audit trail on aged closures.

**B. Add duplicate-detection automation**

- Trigger on new ticket creation:
  - If same **organization + requester** has an **open or pending** ticket in the last 14 days with similar subject (fuzzy match) or same **custom field: Issue ID / Case Reference** → auto-add internal note + suggest merge to assignee
  - Optional: auto-merge when confidence is high (same thread ID in email headers)
- *Why:* Catches duplicates at creation time rather than after duplicate work begins.

**C. Fix email channel hygiene**

- Audit inbound addresses, support aliases, and forwarding rules
- Enforce consistent subject-line format in outbound emails: `[Ticket #{{ticket.id}}] {{ticket.title}}`
- Document “one issue, one ticket number” for customers in closure and auto-reply templates
- *Why:* Prevents threading breaks at the source.

**D. Introduce a mandatory **Issue Reference** custom field**

- For enterprise accounts, agents set or inherit a case reference on first touch
- Duplicate detection keys off this field in addition to subject matching
- *Why:* Enterprise customers often open multiple threads; a shared reference ties them together.

### How to implement without disrupting customers

| Phase | Timeline | Actions | Customer impact |
|-------|----------|---------|-----------------|
| **Discover** | Week 1–2 | Export 90-day duplicate analysis (same org, same day, similar subject); audit email channels | None |
| **Pilot** | Week 3–4 | Enable follow-up-on-closed in **sandbox**; test with one EMEA pod; internal merge suggestions only (no auto-merge) | None — internal only |
| **Roll out** | Week 5–6 | Production: follow-up policy + subject-line template update; agent training (15-min huddle) | Minor — emails show consistent ticket ID in subject |
| **Optimise** | Week 7+ | Enable auto-merge for high-confidence cases; refine triggers from pilot data | Positive — fewer duplicate ticket numbers |

**Safeguards:**
- No auto-merge without assignee notification in phase 1
- TAM-facing accounts flagged for manual review before merge
- Rollback plan: disable triggers individually, not wholesale

### How to measure success

| Metric | Baseline (capture now) | Target (90 days) |
|--------|------------------------|------------------|
| Duplicate ticket rate | % of new tickets merged within 48h / total new tickets | ↓ 40% |
| Reopened vs new-on-reply ratio | Track follow-ups on closed tickets | ↑ reopen rate where appropriate |
| Repeat handle time | Avg touches on duplicate clusters | ↓ 25% |
| Customer complaint rate | “New ticket number for same issue” tags | ↓ to near zero |
| Agent sentiment | Quick pulse survey on duplicate frustration | ↑ improvement |

---

## Issue 2: Supplier Escalation Updates Do Not Reopen Parent Zendesk Tickets

### What the problem is

When we escalate to an external supplier (carrier, aggregator, platform vendor), updates from the supplier **do not reopen or surface on the parent customer Zendesk ticket**. In our previous **JIRA** workflow, supplier ticket updates automatically transitioned the parent issue and notified the assignee.

In Zendesk today:

- Supplier replies may land on a **side conversation**, **child ticket**, or **unmonitored mailbox** without bubbling up
- Parent ticket stays **Pending** or **On-hold** with no assignee alert
- Customer-facing SLA clocks and internal follow-up SLAs are missed
- Agents manually check supplier threads — inconsistent and region-dependent

**Business impact:** Delayed customer updates, missed escalations, EMEA inconsistency, and TAM blind spots on critical incidents.

### What I would change and why

**A. Standardise supplier escalation model in Zendesk**

Choose one pattern (recommend **Side Conversations** or **linked child tickets** — not ad-hoc email):

| Model | Best for | Reopen behaviour |
|-------|----------|------------------|
| **Side Conversation (email)** | Email-based supplier comms | Trigger on inbound supplier reply → update parent |
| **Child ticket** | Formal supplier tracking + separate SLA | Child update trigger → reopen/notify on parent |
| **Webhook (API)** | Supplier portals with API | External event → Zendesk API updates parent |

*Why:* One model per supplier type — not mixed workflows across EMEA agents.

**B. Build “supplier reply → parent ticket action” automations**

Example trigger logic:

```
WHEN: Comment or email received on side conversation / child ticket
AND: Sender domain in [supplier allowlist] OR tagged supplier_escalation
THEN on PARENT ticket:
  - Set status → Open (or custom "Supplier Responded")
  - Add internal note: "Supplier update received — review required"
  - Notify assignee + escalation group
  - If parent On-hold > X days → also notify Team Lead
```

*Why:* Replicates JIRA auto-transition behaviour agents already expect.

**C. Custom fields for escalation traceability**

- `supplier_name`, `supplier_ticket_id`, `escalation_opened_at`, `escalation_type`
- Display on parent ticket sidebar via Zendesk app or macro
- *Why:* Searchable, reportable, and visible to TAMs without opening side threads.

**D. Optional: lightweight integration layer**

- If suppliers cannot email side conversations reliably, use **Zendesk Webhooks + middleware** (e.g. Make/Zapier/internal service) to map supplier portal events → parent ticket update
- *Why:* Matches JIRA webhook pattern for non-email suppliers.

### How to implement without disrupting customers

| Phase | Timeline | Actions | Customer impact |
|-------|----------|---------|-----------------|
| **Discover** | Week 1–2 | Map top 10 supplier escalation paths; document current vs JIRA behaviour; identify mailboxes and side conv usage | None |
| **Design** | Week 3 | Agree one escalation model per supplier category; write trigger spec with Zendesk admin | None |
| **Pilot** | Week 4–5 | One supplier type (e.g. carrier escalations) in EMEA only; shadow mode triggers (notify only, no status change) | None |
| **Roll out** | Week 6–8 | Enable status change + assignee notify; update escalation macro and agent playbook | Positive — faster customer updates |
| **Scale** | Week 9+ | Extend to all EMEA suppliers; share playbook with US/APAC | None if model is consistent |

**Safeguards:**
- Shadow mode first: log what *would* have fired without changing tickets
- Exclude “supplier auto-acknowledgement” emails from reopen triggers (regex on subject/body)
- Clear agent override: “Supplier noise — keep on hold” macro

### How to measure success

| Metric | Baseline | Target (90 days) |
|--------|----------|------------------|
| Time from supplier reply → parent ticket action | Manual sample audit (median hours) | ↓ 70% (e.g. 24h → < 4h) |
| On-hold tickets with missed supplier updates | Monthly audit count | ↓ 80% |
| Customer wait time on supplier-dependent tickets | MTTR for tagged escalations | ↓ 15% |
| Agent manual checks | Self-reported “how often do you poll supplier threads?” | ↓ significantly |
| Reopen accuracy | False-positive reopens / total supplier triggers | < 10% |

---

## Issue 3 (Suggested): Inconsistent Ticket Tagging — Weak Reporting for TAMs and QBRs

### What the problem is

Product area (SMS, 10DLC, Conversation API), priority justification, and root-cause tags are applied **inconsistently across EMEA agents**. Leadership and TAMs cannot reliably answer:

- How many P1/P2 incidents per account this quarter?
- Which product line drives SLA breaches?
- What are the top escalation themes by region?

Data is either missing, buried in free-text fields, or requires manual ticket sampling before QBRs.

### What I would change and why

- Define a **minimal required tag set** at ticket creation (product, issue type, customer impact)
- Use **Zendesk drop-down custom fields** (not free tags) for reporting consistency
- Add **macro-enforced tagging** on save for P1/P2 and supplier escalations
- Monthly **tag compliance report** by team — coaching, not punishment

*Why:* Directly supports TAM portfolio reviews and the metrics we present in service reviews.

### Implementation (low disruption)

- Week 1–2: Agree field list with TAMs and ops (5–7 fields max)
- Week 3: Make fields required only on **P1/P2 and escalation** ticket forms first
- Week 4+: Expand to all enterprise tickets; backfill not required

### Success metrics

- Tag compliance rate on enterprise tickets: **> 90%** within 60 days
- Time to prepare QBR support data per account: **↓ 50%**
- Report accuracy: spot-check 20 tickets/month — **< 5%** correction rate

---

## Issue 4 (Suggested): TAMs Lack Portfolio-Level Visibility Inside Zendesk

### What the problem is

TAMs manage **dedicated accounts** but Zendesk does not give them a single view of open P1/P2, SLA risk, stale tickets, and CSAT trends per account without building manual searches or relying on spreadsheets.

Agents see tickets; TAMs see accounts — the tooling gap creates reactive TAM engagement.

### What I would change and why

- Ensure every enterprise account has correct **Organization ↔ TAM** mapping (custom org field)
- Deploy **Zendesk Explore dashboards** (or linked external dashboard) filtered by TAM portfolio
- Add **views** shared with TAMs: “My accounts — open P1/P2”, “My accounts — SLA at risk”, “My accounts — no update 48h+”
- Optional: scheduled **weekly portfolio digest** email to TAMs from Explore

*Why:* Proactive TAM engagement before QBRs and exec escalations.

### Implementation (low disruption)

- No change to customer ticket flow
- Phase 1: Fix org data + read-only TAM views (2 weeks)
- Phase 2: Explore dashboards + digest (4 weeks)

### Success metrics

- TAM login / view usage: **> 80%** of EMEA TAMs weekly
- Proactive TAM outreach on at-risk accounts: track via CRM or TAM activity log — **↑ 25%**
- Executive escalations with no prior TAM awareness: **↓ 30%**

---

## Issue 5 (Suggested): Stale and On-Hold Tickets Lack Automated Nudges

### What the problem is

Tickets sit in **Pending** (awaiting customer) or **On-hold** (awaiting supplier) without update for days. No systematic nudge goes to the assignee, team lead, or TAM until SLA breach or customer chase.

This is especially painful for supplier-dependent tickets (links to Issue 2).

### What I would change and why

- Automations at **48h / 72h / 5 days** without public comment:
  - Internal note + assignee reminder
  - At 5 days on-hold: notify Team Lead + add “stale” tag
- Different thresholds for P1/P2 vs P3/P4
- *Why:* Low effort, high impact on perceived responsiveness.

### Implementation (low disruption)

- Internal notifications only — no customer-facing messages until agent acts
- Pilot on EMEA enterprise queue for 2 weeks

### Success metrics

- Tickets open > 5 days without activity: **↓ 30%**
- Mean age of on-hold tickets: **↓ 20%**
- Customer “any update?” messages on stale tickets: **↓ 25%**

---

## Recommended Priority Order

| Priority | Issue | Effort | Impact | Why first |
|----------|-------|--------|--------|-----------|
| **P1** | Supplier escalation reopen (Issue 2) | Medium | High | Direct customer wait time + agent pain; JIRA regression |
| **P1** | Duplicate tickets (Issue 1) | Medium | High | Data quality + customer experience |
| **P2** | Stale ticket nudges (Issue 5) | Low | Medium | Quick win while larger work is in flight |
| **P2** | Tagging / reporting (Issue 3) | Medium | Medium | Enables QBR and leadership reporting |
| **P3** | TAM portfolio visibility (Issue 4) | Medium | Medium | Strategic — depends on clean org data (Issue 3) |

---

## Governance & Ownership

| Area | Owner | Cadence |
|------|-------|---------|
| Zendesk trigger/automation changes | Support Ops + Zendesk Admin | Change window: Tuesday/Thursday |
| EMEA agent adoption & coaching | EMEA Team Lead | Weekly huddle |
| Supplier escalation playbook | EMEA Team Lead + Escalation SMEs | Update on each pilot |
| TAM reporting & dashboards | TAM Lead + Ops | Monthly review |
| Success metrics | Team Lead + Ops Analytics | 30 / 60 / 90-day review |

---

## 30 / 60 / 90-Day Plan (Summary)

**Days 1–30:** Baseline metrics, duplicate audit, supplier path mapping, sandbox pilot triggers  
**Days 31–60:** EMEA production pilot (supplier reopen + duplicate detection), stale nudge automations  
**Days 61–90:** Full EMEA roll-out, tagging compliance, TAM views live, 90-day metrics review  

---

## Conclusion

The two observed issues — **duplicate customer tickets** and **supplier updates not reopening parent tickets** — are fixable within Zendesk with configuration, disciplined email hygiene, and automations that mirror our previous JIRA behaviour. The three suggested additions (tagging, TAM visibility, stale nudges) strengthen reporting and proactive account management without changing what customers see day-to-day.

All changes can be introduced in **phased, internal-first pilots** with clear rollback paths and measurable outcomes at 30, 60, and 90 days.

---

*Prepared for internal evaluation. Adjust supplier names, field names, and timelines to match your live Zendesk instance.*
