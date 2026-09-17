# 11 — Booking Form Spec

The site's one conversion surface (plus WhatsApp/call). Keep it short to maximize submissions.

## Channels (in priority order as shown on /contact)
1. **WhatsApp** — primary for Lebanon market → `https://wa.me/96170211041` with prefilled text
   (e.g. `Hello Cedars Trail Riding! I'd like to book a ride.`)
2. **Call** — `tel:+96170211041` and `tel:+96176004686`
3. **Form** — below (submits via email/Web3Forms, no backend required)

## Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | text | ✅ | |
| Phone / WhatsApp | tel | ✅ | preferred contact |
| Email | email | ⬜ | optional if phone given |
| Interested in | select | ✅ | Trail Ride / Multi-day Trek / Group-Event / Custom / Not sure |
| Trail or duration | select | ⬜ | options mirror trails + "Custom" |
| Desired date | date | ⬜ | |
| Number of riders | number | ⬜ | |
| Experience level | select | ⬜ | None / Beginner / Intermediate / Advanced |
| Message | textarea | ⬜ | |
| Language preference | select | ⬜ | English / العربية / Français |

## Behavior
- Submit → shows success state: `Request sent! We'll reply on WhatsApp within 24 hours.`
  (`[CONFIRM reply-time promise]`)
- No live availability — explicitly a *request* form (avoid claiming instant confirmation).
- Include checkbox: `I agree to be contacted about my booking.` (privacy-considerate)

## Anti-spam
- Honeypot field + rate-limit. (Cloudflare Turnstile optional.)

## Notes
- **No prices** displayed anywhere near booking (per client decision).
- Form labels must be i18n-able (EN/AR/FR) — same string keys in the translation file.
