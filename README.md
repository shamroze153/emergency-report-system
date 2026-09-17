# QR Emergency Reporting System

A mobile-first emergency reporting page. Each physical location gets a QR
code sticker; scanning it opens this page with the location pre-filled, and
the person can report an incident via WhatsApp or a quick form (which logs
to a Google Sheet and emails the safety team).

## Files

- `index.html` — the public report page (this is what the QR codes point to)
- `admin.html` — **the admin portal**: Dashboard (live incident list), Generate
  QR (campus + location → printable QR codes), Scan & Verify (camera-based QR
  tester), and Settings (all in one page with tabs)
- `qr-generator.html` — standalone QR generator (optional — everything it does
  is now also in admin.html's "Generate QR" tab; keep it or delete it, your call)
- `EmergencyReportBackend.gs` — Google Apps Script backend (Sheet logging,
  email alerts, and a token-protected endpoint the Dashboard reads from)
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
     ADMIN_TOKEN: "CHANGE-THIS-TO-A-LONG-RANDOM-VALUE" // <-- set a real secret
   };
   ```
   `ADMIN_TOKEN` is what protects the Dashboard tab in `admin.html` — it's the
   only thing stopping a random visitor from reading your incident log, since
   the Web App itself is set to "Anyone" access. Pick a long random string
   (e.g. generate one at [1password.com/password-generator](https://1password.com/password-generator)
   or similar) and keep it private — you'll paste the same value into
   `admin.html`'s Settings tab.
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

## 4. Using the Admin Portal (admin.html)

After deploying, open:
```
https://your-project.vercel.app/admin.html
```

It has four tabs:

### Settings (fill this in first)
- **Live report page URL** — your deployed `index.html` URL (pre-filled with
  your Vercel domain, double check it after deploying).
- **Apps Script Web App URL** — same URL you put in `index.html`'s
  `APPS_SCRIPT_URL`.
- **Admin Token** — must exactly match `CONFIG.ADMIN_TOKEN` in
  `EmergencyReportBackend.gs`.

Click **Save Settings**. These are stored only in this browser
(localStorage) — not sent anywhere except to your own Apps Script.

### Generate QR
1. Enter a **Campus / Site name** (optional — useful if you have more than
   one building/site; leave blank for a single site).
2. Enter one **location** per line, e.g.:
   ```
   Floor2-Corridor
   Warehouse-GateA
   Reception
   Cafeteria
   ```
3. Click **Generate QR Codes** — one QR appears per location (prefixed with
   the campus name if you gave one), each pointing to your live report page
   with that location pre-filled.
4. Click **Download PNG** under any QR to save it individually, or click
   **Print All (sticker sheet)** to open a print-ready grid layout (3 per
   row) — print that directly onto sticker paper or regular paper to cut out.

### Scan & Verify
Use this after printing to confirm each sticker is correct without manually
opening every one on your phone:
1. Click **Start Camera** (allow camera access when your browser asks).
2. Point it at a printed QR sticker.
3. It decodes the QR, shows the location it encodes, and flags whether the
   URL matches your configured live site (green = good, red = mismatch —
   e.g. wrong domain or a typo in the location).

### Dashboard
Shows the most recent incident reports read live from your Google Sheet:
1. Make sure Settings has your Apps Script URL + Admin Token saved.
2. Click **Refresh** to pull the latest reports.
3. Click **Open Google Sheet** to jump to the full spreadsheet any time.

No third-party website, account, or app install needed — the whole admin
portal runs in your browser and talks only to your own Apps Script backend.

## 5. Before going live — checklist

- [ ] Replace `WHATSAPP_NUMBER` in `index.html` with the real emergency
      contact number
- [ ] Replace `RESPONDER_EMAIL` (and optionally `CC_EMAILS`) in the Apps
      Script with the real safety team email(s)
- [ ] Set a real, long random `ADMIN_TOKEN` in the Apps Script — this
      protects the Dashboard from public access
- [ ] Replace `APPS_SCRIPT_URL` in `index.html` with your deployed Web App URL
- [ ] In `admin.html`, open Settings and save your live URL, Apps Script
      URL, and the same Admin Token
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
