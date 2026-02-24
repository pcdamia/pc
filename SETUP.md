# Setup: Keys on Server (No Private Keys in Repo)

Firebase config and keys are stored on the server only. The client fetches config at runtime from `/api/config`.

## 1. Firebase Functions – Environment Variables

Create `functions/.env` (gitignored) from the example:

```bash
cp functions/.env.example functions/.env
```

Fill in your Firebase web config in `functions/.env` (use `APP_*` prefix—`FIREBASE_` is reserved):

```
APP_API_KEY=your_api_key
APP_AUTH_DOMAIN=your_project.firebaseapp.com
APP_PROJECT_ID=your_project_id
APP_STORAGE_BUCKET=your_project.firebasestorage.app
APP_MESSAGING_SENDER_ID=your_sender_id
APP_APP_ID=your_app_id
```

For production, set these in Google Cloud Console → Cloud Run (or Functions) → your service → Environment variables.

## 2. Local Development

**Terminal 1 – Functions emulator:**
```bash
cd functions
npm install
npm run build
npx firebase emulators:start --only functions
```

**Terminal 2 – Angular app:**
```bash
npm start
```

The Angular dev server proxies `/api` to the functions emulator.

## 3. Deploy to Firebase

**If your org has domain-restricted sharing**, use the deploy script (runs `firebase deploy` then fixes Cloud Run invoker):

```bash
npm run deploy
```

**Otherwise**, deploy manually:

```bash
npm run build
firebase deploy
```

If deploy fails with "Unable to set the invoker", run once:

```bash
gcloud run services update api --region=us-central1 --no-invoker-iam-check --project=portfolious-20286
```

Before deploying, set environment variables in `functions/.env` (or Google Cloud Console after first deploy).

Add: `APP_API_KEY`, `APP_AUTH_DOMAIN`, `APP_PROJECT_ID`, `APP_STORAGE_BUCKET`, `APP_MESSAGING_SENDER_ID`, `APP_APP_ID`

## 4. Cloud Function Permissions (if site-config returns 500 PERMISSION_DENIED)

The function needs Firestore and Storage access. Grant roles to the default service accounts:

```bash
PROJECT=portfolious-20286
PROJECT_NUM=$(gcloud projects describe $PROJECT --format='value(projectNumber)')

# App Engine default (used by some Firebase services)
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:${PROJECT}@appspot.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:${PROJECT}@appspot.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Compute default (used by Cloud Functions v2)
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
  --role="roles/storage.objectViewer"
```

## 5. Storage Files (Optional)

**Headshot:** Upload `me_headshot.png` to folder `hs/` in Firebase Storage.

**Resume PDF:** Upload `Paul_Crews_Jr_Executive_Resume_Final.pdf` to folder `documents/` in Storage.

1. Open [Firebase Console → Storage](https://console.firebase.google.com/project/portfolious-20286/storage)
2. Create folders `hs` and `documents` if needed
3. Upload the headshot and resume

Until uploaded, the headshot won't show and CV/Resume links may 404.

## 6. Rotate Exposed Keys (if keys were committed)

If you previously committed keys to GitHub:

1. In Firebase Console → Project Settings → General → Your apps → regenerate the web app config.
2. Update `functions/.env` (and production env vars) with the new values.
3. Use `git filter-branch` or BFG Repo-Cleaner to remove the keys from git history.
