# State Machines

## Incident State Machine (City-Level)

```
DRAFT → AI_PROCESSING → AWAITING_CITIZEN_CONFIRMATION → CONFIRMED → ROUTED
                ↓                    ↓                                  ↓
        NEEDS_INFORMATION    EMERGENCY_GUIDANCE              IN_PROGRESS
                ↓                    ↓                      ↓         ↓
          AI_PROCESSING      CONFIRMED/CANCELLED   PENDING_VERIFICATION
                                                            ↓
                                                        RESOLVED → CLOSED
                                                            ↓
Terminal: CANCELLED, EXPIRED, AI_FAILED               REOPENED
```

### Transitions

| From | Valid Next States |
| --- | --- |
| DRAFT | AI_PROCESSING, CANCELLED |
| AI_PROCESSING | AWAITING_CITIZEN_CONFIRMATION, NEEDS_INFORMATION, EMERGENCY_GUIDANCE, AI_FAILED, CANCELLED |
| NEEDS_INFORMATION | AI_PROCESSING, CANCELLED |
| AWAITING_CITIZEN_CONFIRMATION | CONFIRMED, NEEDS_INFORMATION, CANCELLED, EXPIRED |
| EMERGENCY_GUIDANCE | AWAITING_CITIZEN_CONFIRMATION, CONFIRMED, CANCELLED |
| CONFIRMED | ROUTED |
| ROUTED | IN_PROGRESS, PENDING_VERIFICATION, RESOLVED, ESCALATED |
| IN_PROGRESS | PENDING_VERIFICATION, ESCALATED, RESOLVED |
| PENDING_VERIFICATION | IN_PROGRESS, RESOLVED, ESCALATED |
| ESCALATED | IN_PROGRESS, PENDING_VERIFICATION, RESOLVED |
| RESOLVED | CLOSED, REOPENED |
| CLOSED | REOPENED |

## Department Link States

```
ROUTED → RECEIVED → ASSIGNED → IN_PROGRESS → WORK_COMPLETED → VERIFIED → RESOLVED
                                    ↓
                                ESCALATED
                                    ↓
Alternative: DECLINED (requires reason)
```

## Task States

```
UNASSIGNED → ASSIGNED → ACCEPTED → EN_ROUTE → REACHED_SITE → WORK_STARTED → WORK_COMPLETED → AWAITING_VERIFICATION → VERIFIED → RESOLVED
```

Exception paths: REASSIGNED, BLOCKED, CANCELLED

## Citizen Tracking Labels

Internal states are mapped to five simple citizen-facing labels:

| Internal State | Citizen Sees |
| --- | --- |
| CONFIRMED, ROUTED | Submitted |
| RECEIVED, ASSIGNED | Received |
| IN_PROGRESS, ESCALATED | In Progress |
| PENDING_VERIFICATION | In Progress |
| RESOLVED, CLOSED | Resolved |
