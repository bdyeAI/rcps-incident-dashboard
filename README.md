# RCPS Student Incident Dashboard — Deployment Guide

This is a ready-to-deploy package for the Student Incident Report dashboard. It's built as an
installable web app: principals can open it in a browser on phone, tablet, or desktop, and
"Add to Home Screen" so it behaves like a regular app icon.

## What's in this folder

- `index.html` — the dashboard itself. Fetches `data.json` live on every page load.
- `data.json` — the current data. This file is what makes the dashboard "auto-update" —
  a scheduled GitHub Action (below) regenerates it from your Google Drive Incidents workbooks.
- `manifest.json`, `service-worker.js`, `icon-192.png`, `icon-512.png` — enable "Add to Home
  Screen" / installable app behavior.
- `.github/workflows/refresh-data.yml` — a GitHub Action that runs on a schedule (nightly by
  default) and refreshes `data.json` from Drive.
- `scripts/refresh_data.py` — the script the Action runs. Reads the Incidents workbooks and
  rebuilds `data.json`.

## Step 1 — Create the GitHub repo and enable Pages

1. Create a new repository on GitHub (e.g. `rcps-incident-dashboard`). It can be private or
   public — GitHub Pages works either way (private repos need GitHub Pro/Team/Enterprise for
   Pages, so if you're on a free personal account, use a public repo).
2. Upload everything in this folder to the repo (keep the folder structure, especially the
   `.github/workflows/` folder).
3. In the repo, go to **Settings → Pages**. Under "Build and deployment," set Source to
   "Deploy from a branch," pick your main branch and the root folder, and save.
4. GitHub will give you a URL like `https://yourusername.github.io/rcps-incident-dashboard/`.
   That's the link to share with principals.

At this point the site is live, but `data.json` is just the snapshot baked in today — the
next step wires up the automatic refresh.

## Step 2 — Set up the Google Drive service account (for auto-refresh)

The scheduled refresh needs its own Google identity with read access to your Drive folders
(separate from any individual's personal login, so it keeps working even if staff change).

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project (or use an
   existing one), then enable the **Google Drive API**.
2. Go to **IAM & Admin → Service Accounts → Create Service Account**. Give it a name like
   `rcps-dashboard-reader`. No special roles needed at the project level.
3. Open the service account, go to **Keys → Add Key → Create new key → JSON**. This downloads
   a JSON key file — keep it secret, treat it like a password.
4. In Google Drive, share **both** district Incidents folders (this year and last year) with
   the service account's email address (it looks like
   `rcps-dashboard-reader@your-project.iam.gserviceaccount.com`), with **Viewer** access.

## Step 3 — Add secrets and variables to the GitHub repo

In your repo, go to **Settings → Secrets and variables → Actions**:

- Under **Secrets**, add `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the entire contents of the
  JSON key file from Step 2.
- Under **Variables**, add:
  - `DRIVE_FOLDER_ID_THIS_YEAR` — the folder ID for the 26-27 school year folder (the long ID
    in the folder's Drive URL, after `/folders/`)
  - `DRIVE_FOLDER_ID_LAST_YEAR` — the folder ID for the 25-26 school year folder (only needed
    if you want the Action to re-verify last year's numbers too; otherwise last year's data
    stays as whatever's already in `data.json`)

## Step 4 — Test the refresh

Go to the **Actions** tab in your repo, select "Refresh incident dashboard data," and click
"Run workflow" to trigger it manually. Check that it completes without errors, and that
`data.json` gets updated in the repo (look for a new commit from `github-actions[bot]`).

Once that works, it'll keep running automatically every night (see the `cron` schedule in
`.github/workflows/refresh-data.yml` — edit the schedule if you want it more/less frequent).

## How principals install it

Once the GitHub Pages link is live, principals can:

- **On phone/tablet (iOS or Android):** open the link in the browser, then use the browser's
  "Add to Home Screen" option. It'll appear as an app icon.
- **On desktop (Chrome/Edge):** open the link, then click the install icon in the address bar
  (or the browser menu → "Install [site name]").

No app store, no download — just the link.

## Known data-quality notes carried over from the prototype

- December and June 25-26 Incidents workbooks contained duplicated/mislabeled data at the time
  this dashboard was built. Once those source sheets are corrected in Drive, the next
  scheduled refresh will pick up the fix automatically.
- The "flagged" status for a month is preserved across refreshes (the script won't overwrite
  your manual flag unless you edit `data.json` directly), so once you fix a source sheet,
  also clear that month's `"flagged": true` in `data.json` (or ask for help doing this in
  Claude Code) so the dashboard stops showing the warning outline.
