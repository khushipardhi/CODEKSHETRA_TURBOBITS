# API Reference

## Base URL

```
http://localhost:3000/api
```

## Health Check

```
GET /api/health
```

Returns service status, version, and environment.

---

## Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register/citizen` | Create citizen account |
| POST | `/api/auth/login` | Authenticate and receive session |
| POST | `/api/auth/logout` | Revoke current session |
| POST | `/api/auth/password/forgot` | Request password reset |
| POST | `/api/auth/department-activation` | Redeem department activation code |
| POST | `/api/auth/worker-invite/accept` | Accept worker invitation |
| GET | `/api/me` | Current user profile and permissions |

---

## Citizen Report Flow

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/incidents/drafts` | Create report draft |
| PATCH | `/api/incidents/drafts/:id` | Update draft |
| POST | `/api/media/upload-intents` | Request upload URL |
| POST | `/api/incidents/drafts/:id/transcription` | Queue transcription |
| POST | `/api/incidents/drafts/:id/analyse` | Run AI analysis |
| GET | `/api/incidents/drafts/:id/analysis` | Get analysis result |
| POST | `/api/incidents/drafts/:id/confirm` | Confirm and route |
| GET | `/api/incidents/:reference` | Track incident |
| GET | `/api/citizen/incidents` | List own incidents |

---

## Admin APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/admin/incidents` | List all incidents (filtered) |
| GET | `/api/admin/incidents/:id` | Incident detail |
| GET | `/api/admin/map/incidents` | Map marker DTOs |
| GET/POST/PATCH | `/api/admin/departments` | Manage departments |
| POST | `/api/admin/departments/:id/activation-codes` | Issue activation code |
| GET/PATCH | `/api/admin/taxonomy/*` | Manage taxonomy |
| GET/PATCH | `/api/admin/emergency-contacts` | Manage contacts |
| GET | `/api/admin/analytics/*` | Aggregate metrics |
| GET | `/api/admin/audit-logs` | View audit trail |

---

## Department APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/department/incidents` | Department incident links |
| POST | `/api/department/incidents/:id/acknowledge` | Acknowledge receipt |
| POST | `/api/department/incidents/:id/tasks` | Create task |
| POST | `/api/department/tasks/:id/assign` | Assign worker |
| POST | `/api/department/tasks/:id/verify` | Verify task completion |
| GET/POST/PATCH | `/api/department/workers` | Worker management |

---

## Worker APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/worker/tasks` | Assigned tasks |
| GET | `/api/worker/tasks/:id` | Task detail |
| POST | `/api/worker/tasks/:id/transitions` | State transition |
| POST | `/api/worker/tasks/:id/media` | Upload evidence |

---

## Error Format

All errors use problem-detail format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description of the error",
    "details": {},
    "correlationId": "req_abc123"
  }
}
```

## Pagination

All list endpoints use cursor-based pagination:

```
GET /api/admin/incidents?cursor=xxx&limit=20
```
