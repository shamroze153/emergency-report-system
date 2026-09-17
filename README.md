# QR Emergency Reporting System

A mobile-first emergency reporting page. Each physical location gets a QR
code sticker; scanning it opens this page with the location pre-filled, and
the person can report an incident via WhatsApp or a quick form (which logs
to a Google Sheet and emails the safety team).

## Files

- `index.html` — the report page (self-contained, no build step)
- `EmergencyReportBackend.gs` — Google Apps Script backend (Sheet logging + email)
- `README.md` — this file

## 1. Configure before deploying

Open `index.html` and edit the `CONFIG` block near the bottom of the
`<script>` tag:

```js
const CONFIG = {
  WHATSAPP_NUMBER: "923XXXXXXXXX",           // your real number, country code, no + or spaces
  APPS_SCRIPT_URL: "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE"
};
```

You'll get the `APPS_SCRIPT_URL` value from step 2 below — deploy the
backend first, then come back and paste it in.

## 2. Deploy the backend (Google Apps Script + Sheet)

1. Go to [sheets.new](https://sheets.new) and create a new Google Sheet
   (name it e.g. "Emergency Incident Log"). You don't need to add any
   headers or tabs — the script creates the "Incidents" tab and header
   row automatically on first submission.
2. In the Sheet, go to **Extensions > Apps Script**.
3. Delete the placeholder code and paste in the full contents of
   `EmergencyReportBackend.gs`.
4. At the top of the script, edit:
   ```js
   const CONFIG = {
     RESPONDER_EMAIL: "safety-team@example.com", // <-- your real responder email
     ...
   };
   ```
5. Click **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, then authorize the script when prompted (click
     through "Advanced" → "Go to project (unsafe)" — this is expected for
     your own script).
6. Copy the **Web app URL** (ends in `/exec`).
7. Paste that URL into `index.html` as `APPS_SCRIPT_URL` (see step 1).
8. Whenever you edit the `.gs` file later, redeploy via **Manage
   deployments > Edit > New version** so the live URL picks up your changes.

## 3. Deploy the frontend

### Option A — Vercel (recommended, fastest)

1. Push this folder to a GitHub repo (see below), or drag-and-drop the
   folder directly at [vercel.com/new](https://vercel.com/new).
2. If using GitHub: on [vercel.com/new](https://vercel.com/new), import the
   repo. Framework preset: **Other** (it's a static HTML file, no build
   command needed). Root directory: wherever `index.html` lives.
3. Deploy. Vercel gives you a URL like `https://your-project.vercel.app`.
4. Test it: `https://your-project.vercel.app/?location=Test-Location`

### Option B — GitHub Pages

1. Push this folder to a GitHub repo.
2. In the repo, go to **Settings > Pages**.
3. Under "Build and deployment", set Source to **Deploy from a branch**,
   branch `main`, folder `/ (root)`.
4. Save. Your page will be live at
   `https://<your-username>.github.io/<repo-name>/`
5. Note the query-parameter URL format below still applies.

### Pushing to GitHub (if you haven't already)

```bash
git init
git add .
git commit -m "Emergency reporting system"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

## 4. Generate a QR code per location

Once deployed, each location's QR code just needs to point to your
deployed URL with a `location` query parameter, e.g.:

```
https://your-project.vercel.app/?location=Floor2-Corridor
https://your-project.vercel.app/?location=Warehouse-GateA
```

Use spaces or hyphens in the location name — the page automatically
replaces `+` / `%20` with spaces when displaying it, so both
`Floor2-Corridor` and `Floor%202%20Corridor` will show cleanly.

Generate the actual QR image for each URL using any free generator, e.g.:
- [qr-code-generator.com](https://www.qr-code-generator.com/)
- [qrcode-monkey.com](https://www.qrcode-monkey.com/) (also lets you brand
  the QR with a logo/color, nice for printed stickers)

Print and place one sticker per physical location, each pointing to its own
`location=` value.

## 5. Before going live — checklist

- [ ] Replace `WHATSAPP_NUMBER` in `index.html` with the real emergency
      contact number
- [ ] Replace `RESPONDER_EMAIL` (and optionally `CC_EMAILS`) in the Apps
      Script with the real safety team email(s)
- [ ] Replace `APPS_SCRIPT_URL` in `index.html` with your deployed Web App URL
- [ ] Test end-to-end from an actual phone: scan a test QR, try both the
      WhatsApp button and the form, confirm the Sheet row + email arrive
- [ ] Print and place QR stickers at each location, matching their
      `location=` values to something responders will recognize

## Notes

- No login/auth is required to submit a report — this is intentional, since
  the person scanning may not have time or ability to sign in during an
  emergency.
- The Apps Script "Anyone" access setting is required for the same reason —
  it does not expose your Sheet publicly, only this one write-only endpoint.
- A WhatsApp auto-notification to the responder team (in addition to email)
  is stubbed out in `EmergencyReportBackend.gs` as
  `sendWhatsAppNotification_PLACEHOLDER` — wire it up once you have
  WhatsApp Business API / Twilio credentials.
