# Backend setup and deployment lock

The package is locked to:

- Web app deployment: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Apps Script library ID: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`
- Library version: `3`
- Library URL: `https://script.google.com/macros/library/d/18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr/6`

## Keep the same web-app URL

Do not create another separate web-app deployment when publishing code changes. Update the existing active deployment instead:

1. Open the Apps Script project that owns the locked deployment.
2. Replace the project code with `backend/ttrpgmessenger.gs` when a backend update is needed.
3. Open **Deploy → Manage deployments**.
4. Select the active deployment associated with the locked URL and choose **Edit**.
5. In the version selector, choose **New version**.
6. Deploy the edited deployment.

This updates the code behind the existing deployment while retaining its deployment URL. Creating a separate **New deployment** creates another deployment identity and can produce another URL.

## Initial organizer/system-library setup

1. Add or replace `appsscript.json` with the included manifest.
2. In Apps Script **Services**, enable **Drive API** for best-effort PDF-to-text indexing.
3. Run `setupTtrpgMessenger()` once. It adds missing organizer, calendar, system-document, and rule-note sheets without deleting existing messenger sheets.
4. Run `createHourlyMaintenanceTrigger()` once if the trigger does not already exist.
5. Execute the web app as the deployment owner and use the same access policy as the existing deployment.

The frontend posts JSON as `text/plain;charset=utf-8` to avoid Apps Script CORS preflights.

## PDF indexing

TXT and JSON are decoded directly. DOCX text is extracted from `word/document.xml`. PDF extraction uses a temporary Google Docs conversion through the Advanced Drive service. If conversion is unavailable or the PDF is image-only, the file remains stored and downloadable with status `STORED_ONLY`; an authorized user can add a manual rule note with a page or section citation.
