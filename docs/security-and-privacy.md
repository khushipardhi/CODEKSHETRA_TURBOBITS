# Security & Privacy

## Authentication

- **Password hashing**: Argon2id with per-password salts
- **Sessions**: Opaque random tokens stored hashed, secure HttpOnly/SameSite cookies
- **Session rotation**: On login and privilege escalation
- **Session revocation**: On logout, password change, and admin action

## Authorization

- **RBAC**: Role-based access control with resource scoping
- **Service-layer enforcement**: Permission checks in both route boundary and service layer
- **Scope validation**: Every department/worker request scoped by department_id, task assignment, and privacy policy
- **Activation codes**: Hashed storage, attempt limits, expiry, single use, revocation

## Privacy Levels

| Level | Rule |
| --- | --- |
| PUBLIC | Exact location only to authorized operational users |
| RESTRICTED | Broad area/ward shown; contact and narrative hidden |
| SENSITIVE | No map marker; only authorized role/department access |

## Data Protection

- `incident_private_details` separated from display-safe data
- AI output treated as untrusted external input
- Schema-validated before acceptance
- Emergency contacts require verification before activation
- Append-only audit logging for all mutations
- PII scrubbed from error tracking and logs

## Rate Limiting

Applied to: login, registration, activation code redemption, report creation, AI/transcription requests, upload intents, tracking lookups.

## Media Security

- Server-issued upload intents with short-lived URLs
- MIME/type/size allowlist with magic byte validation
- Malware scanning before availability
- EXIF/metadata stripping per privacy policy
- Private signed download URLs
