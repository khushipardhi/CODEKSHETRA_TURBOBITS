# Emergency Contact Verification

## Policy

Emergency contact numbers displayed in Nagpur Connect **must be verified** before they are activated. The platform never displays unverified or fabricated helpline numbers.

## Verification Process

1. **Source identification**: Record where the contact information was obtained (official government website, physical verification, etc.)
2. **Verification date**: Record when the verification occurred
3. **Cross-reference**: Compare against official published directories
4. **Test call**: Where possible, verify the number is operational
5. **Record in database**: Store with `is_active = false` until verification is complete
6. **Activation**: Only a super admin can set `is_active = true` after verification

## Database Fields

| Field | Description |
| --- | --- |
| `service_name` | Name of the emergency service |
| `phone_number` | Contact number |
| `verification_source` | URL or description of verification source |
| `verification_date` | Date the number was last verified |
| `is_active` | Only active contacts are displayed |
| `category` | Service category (police, fire, medical, etc.) |
| `area` | Geographic applicability |

## Re-verification

Contacts should be re-verified periodically (recommended: every 6 months). Expired verifications should trigger an admin notification.

## Important

- Never seed unverified numbers in production
- Demo/fixture contacts must be clearly labeled
- Displaying a contact does NOT imply dispatch
- The platform must clearly state this distinction
