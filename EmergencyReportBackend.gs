/**
 * ============================================================================
 * EMERGENCY REPORT SYSTEM — GOOGLE APPS SCRIPT BACKEND
 * ============================================================================
 *
 * WHAT THIS DOES
 * ----------------------------------------------------------------------------
 * Receives incident reports (POST requests) from the emergency report web
 * page, logs each one as a new row in a Google Sheet, and immediately emails
 * a fixed responder address so a human sees it fast.
 *
 * ----------------------------------------------------------------------------
 * SETUP — STEP BY STEP
 * ----------------------------------------------------------------------------
 * 1. Create a new Google Sheet (sheets.new). Name it something like
 *    "Emergency Incident Log". You do NOT need to create tabs or headers
 *    manually — this script creates the "Incidents" sheet and header row
 *    automatically on first submission.
 *
 * 2. In the Sheet, go to Extensions > Apps Script.
 *
 * 3. Delete any starter code in the editor and paste this entire file in.
 *
 * 4. Edit the CONFIG block just below to set your responder email address.
 *
 * 5. Click "Deploy" (top right) > "New deployment".
 *      - Click the gear icon next to "Select type" and choose "Web app".
 *      - Description: anything, e.g. "Emergency report intake v1".
 *      - Execute as: "Me" (your account).
 *      - Who has access: "Anyone" (required so the public report page,
 *        which has no login, can reach it).
 *      - Click "Deploy".
 *
 * 6. The first time you deploy, Google will ask you to authorize the script
 *    (it needs permission to edit the Sheet and send email as you). Click
 *    through the "Advanced" / "Go to (unsafe)" prompt — this is expected
 *    for scripts you wrote yourself.
 *
 * 7. Copy the "Web app URL" shown after deployment. It looks like:
 *      https://script.google.com/macros/s/XXXXXXXXXXXXXXXX/exec
 *
 * 8. Paste that URL into index.html, in the CONFIG.APPS_SCRIPT_URL constant
 *    near the bottom of the file.
 *
 * 9. IMPORTANT — whenever you edit this script after the first deploy, you
 *    must create a "New deployment" again (or use "Manage deployments" >
 *    edit > New version) for the changes to go live at the same URL.
 *
 * ----------------------------------------------------------------------------
 */

// ============================================================================
// CONFIG — EDIT THIS BEFORE DEPLOYING
// ============================================================================
const CONFIG = {
  RESPONDER_EMAIL: "safety-team@example.com",   // <-- change to real responder email
  SHEET_NAME: "Incidents",
  // Optional: comma-separated list of extra emails to CC on every alert
  CC_EMAILS: "" // e.g. "manager@example.com,facilities@example.com"
};
// ============================================================================

/**
 * Handles POST requests from the report page.
 */
function doPost(e) {
  try {
    const data = parseRequestData(e);

    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    const location = sanitize(data.location) || "Unknown";
    const incidentType = sanitize(data.incidentType) || "Unspecified";
    const description = sanitize(data.description) || "";
    const reporterName = sanitize(data.reporterName) || "";
    const reporterPhone = sanitize(data.reporterPhone) || "";

    appendRow(timestamp, location, incidentType, description, reporterName, reporterPhone);

    sendNotificationEmail(timestamp, location, incidentType, description, reporterName, reporterPhone);

    // Placeholder for future WhatsApp notification integration (see function below).
    sendWhatsAppNotification_PLACEHOLDER(location, incidentType);

    return jsonResponse({ status: "success", message: "Incident logged and notification sent." });

  } catch (err) {
    return jsonResponse({ status: "error", message: err && err.message ? err.message : String(err) });
  }
}

/**
 * Optional: lets you open the Web App URL in a browser to sanity-check
 * that the deployment is live (GET requests aren't used by the form).
 */
function doGet(e) {
  return ContentService
    .createTextOutput("Emergency Report backend is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function parseRequestData(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("No POST data received.");
  }
  // Frontend sends JSON as text/plain to avoid CORS preflight; parse it either way.
  try {
    return JSON.parse(e.postData.contents);
  } catch (jsonErr) {
    // Fallback: form-encoded data
    if (e.parameter) return e.parameter;
    throw new Error("Could not parse request body.");
  }
}

function sanitize(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    const headers = ["Timestamp", "Location", "Incident Type", "Description", "Reporter Name", "Reporter Phone"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendRow(timestamp, location, incidentType, description, reporterName, reporterPhone) {
  const sheet = getOrCreateSheet();
  sheet.appendRow([timestamp, location, incidentType, description, reporterName, reporterPhone]);
}

function sendNotificationEmail(timestamp, location, incidentType, description, reporterName, reporterPhone) {
  const subject = `🚨 New Incident Report: ${location}`;

  const body =
    `A new emergency/incident report was just submitted.\n\n` +
    `Location:        ${location}\n` +
    `Incident Type:   ${incidentType}\n` +
    `Description:     ${description || "(none provided)"}\n` +
    `Reporter Name:   ${reporterName || "(not provided)"}\n` +
    `Reporter Phone:  ${reporterPhone || "(not provided)"}\n` +
    `Timestamp:       ${timestamp}\n\n` +
    `This alert was generated automatically by the QR emergency reporting system.`;

  const options = {};
  if (CONFIG.CC_EMAILS && CONFIG.CC_EMAILS.trim()) {
    options.cc = CONFIG.CC_EMAILS.trim();
  }

  MailApp.sendEmail(CONFIG.RESPONDER_EMAIL, subject, body, options);
}

/**
 * PLACEHOLDER — WhatsApp notification for the responder team.
 *
 * Not implemented yet. Once you have credentials for a WhatsApp Business
 * API provider (e.g. Twilio's WhatsApp API, or Meta's Cloud API directly),
 * you can send an outbound notification here using UrlFetchApp, similar to:
 *
 *   function sendWhatsAppNotification_PLACEHOLDER(location, incidentType) {
 *     const url = "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json";
 *     const payload = {
 *       To: "whatsapp:+92XXXXXXXXXX",
 *       From: "whatsapp:+14155238886", // Twilio sandbox/prod WhatsApp number
 *       Body: `🚨 New incident (${incidentType}) reported at ${location}`
 *     };
 *     const options = {
 *       method: "post",
 *       payload: payload,
 *       headers: {
 *         Authorization: "Basic " + Utilities.base64Encode("{AccountSid}:{AuthToken}")
 *       },
 *       muteHttpExceptions: true
 *     };
 *     UrlFetchApp.fetch(url, options);
 *   }
 *
 * Left as a no-op for now so the rest of the pipeline works without
 * requiring WhatsApp API credentials up front.
 */
function sendWhatsAppNotification_PLACEHOLDER(location, incidentType) {
  // Intentionally empty — see comment block above for how to wire this up later.
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
