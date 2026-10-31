# 📬 EmailJS Integration Guide — Nagpur Connect

This document explains how EmailJS is configured to automatically send **4 Lifecycle Tracking Emails** to registered citizens from report submission to resolution, complete with website navigation links directed to `https://nagpur-connect.vercel.app`.

---

## 1. Quick Setup in EmailJS Dashboard

1. Log into your [EmailJS Dashboard](https://dashboard.emailjs.com/).
2. Navigate to **Email Templates** → Click your template (`template_dtaszud`).
3. Switch to the **HTML / Code Editor mode** and paste the entire HTML content from:
   👉 [`docs/emailjs-templates.html`](./emailjs-templates.html)
4. In the template settings:
   - **To Email:** `{{to_email}}`
   - **Subject:** `{{subject}}` (or `[Nagpur Connect] #{{report_id}}: {{status_title}}`)
   - **From Name:** `Nagpur Connect • NMC Response Team`
   - **Reply To:** `{{support_email}}` (or `mesapos.in@gmail.com`)
5. Click **Save** in EmailJS.

---

## 2. Dynamic Variable Mapping Reference

| EmailJS Variable | Database / Source Field | Example Data | Description |
| :--- | :--- | :--- | :--- |
| `{{to_name}}` | `citizens.name` | `Pooja Konge` | Citizen full name or "Citizen" |
| `{{to_email}}` | `citizens.email` | `citizen@example.com` | Target recipient email |
| `{{subject}}` | Auto-generated | `[Nagpur Connect] #NAG-2026-600010: Field Crew Dispatched` | Email subject line |
| `{{report_id}}` | `incidents.public_reference` | `NAG-2026-600010` | Tracking reference code |
| `{{report_title}}` | `incidents.title` / `summary` | `Pothole and road damage on Wardha Road` | Incident title |
| `{{category}}` | `incidents.category_slug` | `Road Maintenance` | Civic category |
| `{{status_badge}}` | `incidents.status` | `In Progress` / `Resolved` | Status badge pill text |
| `{{status_title}}` | Stage title | `Field Crew Dispatched to Site` | Clear stage headline |
| `{{status_color}}` | Stage color code | `#2563eb` (Blue), `#4f46e5` (Indigo), `#d97706` (Amber), `#059669` (Green) | Status card border & badge color |
| `{{status_message}}`| Stage detailed note | `Your report has been assigned to Rapid Response Unit 01.` | Summary explanation |
| `{{timeline_step}}` | Stage number (`1`-`4`) | `3` | Current progress milestone |
| `{{department_name}}`| `incident_departments.department_name` | `Public Works Department (PWD)` | Handling department |
| `{{location_text}}` | `incidents.location_text` | `Laxmi Nagar, Ward 14, Nagpur` | Address / GPS text |
| `{{action_notes}}` | `incident_departments.action_notes` | `Proceeding to site with repair crew & materials.` | Officer / crew action notes |
| `{{updated_at}}` | `NOW()` formatted | `18 Aug 2026, 03:15 AM` | Timestamp |
| `{{tracking_url}}` | `APP_URL/dashboard/[reference]` | `https://nagpur-connect.vercel.app/dashboard/NAG-2026-600010` | Direct live report tracking link |
| `{{portal_url}}` | `APP_URL` | `https://nagpur-connect.vercel.app` | Citizen Portal Home |
| `{{my_reports_url}}` | `APP_URL/my-reports` | `https://nagpur-connect.vercel.app/my-reports` | Citizen's full report history |
| `{{map_view_url}}` | `APP_URL/track?ref=[reference]` | `https://nagpur-connect.vercel.app/track?ref=NAG-2026-600010` | Live map locator link |
| `{{emergency_url}}` | `APP_URL/emergency` | `https://nagpur-connect.vercel.app/emergency` | Emergency helpline & services |
| `{{regards_team}}` | Fixed signature | **`Nagpur One / Nagpur Connect Team • Nagpur Municipal Corporation`** | Official sign-off |
| `{{support_email}}` | `EMAILJS_CONNECTED_EMAIL` | `mesapos.in@gmail.com` | Official contact email |

---

## 3. The 4 Lifecycle Email Triggers

### ✉️ Stage 1: Report Submitted (Confirmation)
- **Trigger:** Citizen submits a new report.
- **Status Badge:** `Submitted` (`#2563eb` Blue)
- **Status Title:** `Your Report Has Been Registered`
- **Status Message:** `Thank you for contributing to a cleaner, safer Nagpur. Your incident report has been securely registered in the municipal dispatch database and queued for AI verification and routing.`
- **Timeline Step:** `1`

### ✉️ Stage 2: Department Routed & Acknowledged
- **Trigger:** Department officer accepts the incident from queue.
- **Status Badge:** `Acknowledged` (`#4f46e5` Indigo)
- **Status Title:** `Routed to Department & Verified`
- **Status Message:** `Your report has been reviewed and acknowledged by the handling department. A response team is preparing necessary field resources.`
- **Timeline Step:** `2`

### ✉️ Stage 3: Field Crew Dispatched (Work In Progress)
- **Trigger:** Department assigns a field crew (e.g. `Quick Response Unit 01`) with instructions.
- **Status Badge:** `In Progress` (`#d97706` Amber)
- **Status Title:** `Field Crew Dispatched to Site`
- **Status Message:** `A municipal field crew has been deployed to the incident location to commence remediation work.`
- **Timeline Step:** `3`

### ✉️ Stage 4: Issue Resolved & Verified (Closure)
- **Trigger:** Department marks incident as `RESOLVED` with closure notes.
- **Status Badge:** `Resolved` (`#059669` Emerald Green)
- **Status Title:** `Civic Issue Successfully Resolved`
- **Status Message:** `Municipal operations on your report have concluded. Field verification is complete and the issue has been successfully remediated.`
- **Timeline Step:** `4`

---

## 4. Production Backend Execution

All 4 triggers are implemented in:
👉 [`src/lib/email-service.ts`](../src/lib/email-service.ts)

When any incident state change occurs, `email-service.ts` queries the citizen's email and credentials from the TiDB database, generates the corresponding stage variables, and calls EmailJS REST API (`https://api.emailjs.com/api/v1.0/email/send`) with your Service ID, Template ID, and API keys.
