# Architecture

## Overview

Nagpur Connect is a **modular monolith** built as a single Next.js application with deliberate module boundaries. This architecture enables simple deployment while maintaining clean separation that allows future service extraction.

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
├──────┬──────┬───────┬──────────┬────────┬───────────────┤
│Public│Citizen│ Admin │Department│ Worker │  API Routes   │
├──────┴──────┴───────┴──────────┴────────┴───────────────┤
│                 Application Services                      │
├────────┬────────┬────────┬──────────┬──────────┬────────┤
│Incidents│  AI   │Routing │  Tasks   │  Media   │ Audit  │
├────────┴────────┴────────┴──────────┴──────────┴────────┤
│                    Provider Layer                         │
├──────┬──────┬───────┬──────────┬────────┬───────────────┤
│ TiDB │  S3  │  STT  │ Analysis │  Map   │Notifications  │
└──────┴──────┴───────┴──────────┴────────┴───────────────┘
```

## Module Boundaries

Each module contains:
- **domain/** — Types, rules, state machines
- **service/** — Use cases and business logic
- **repository/** — Database access (TiDB)
- **provider/** — External integration adapters

## Key Design Decisions

1. **ULID IDs** — Sortable, non-sequential, CHAR(26) in TiDB
2. **Multi-department incidents** — One incident can route to N departments
3. **State machines** — Explicit transition validation with audit history
4. **Provider pattern** — All external services behind interfaces
5. **Privacy by design** — Separated private details from display-safe data
6. **AI as advisor** — Model output is proposed data, never authorization
