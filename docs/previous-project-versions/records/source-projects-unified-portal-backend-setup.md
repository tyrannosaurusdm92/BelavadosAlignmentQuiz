# Backend Setup

The frontend is locked to the following deployment and library:

- Web app: `https://script.google.com/macros/s/AKfycbylmceRVx5UcgMvMDkwym_9h0wv8gM5B9Msuui7-7Z6lqoYlqZBR6Y47hmsauQgoGXY/exec`
- Library ID: `18ET55A9uVNx3IUzoAM_eRj8v7jqagPgjVdxil3P1SoUqrFnnAJp6CjVr`
- Library version: `5`

`docs/ttrpgmessenger.gs` is the unified reference backend. It includes messenger, organizer, rules-library, TableGate character/profile snapshot, shared 3D roll-posting support, and creator/admin private-DM roll validation.

To keep one web-app URL, edit the existing Apps Script deployment and select a new code version. Do not create a separate deployment.

Run `setupTtrpgMessenger()` after replacing the script so any newly added database sheets are created. Deploy the same web-app deployment after setup.
