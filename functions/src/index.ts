import 'dotenv/config';
import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
// Use explicit bucket - try firebasestorage.app first (newer), appspot.com is legacy
const BUCKET = process.env.APP_STORAGE_BUCKET || 'portfolious-20286.firebasestorage.app';
const bucket = getStorage().bucket(BUCKET);

// Firebase config for client Auth - stored on server only, never in client code.
// Use APP_* prefix (FIREBASE_ is reserved). Set in functions/.env for local dev.
function getFirebaseConfig() {
  return {
    apiKey: process.env.APP_API_KEY ?? '',
    authDomain: process.env.APP_AUTH_DOMAIN ?? '',
    projectId: process.env.APP_PROJECT_ID ?? '',
    storageBucket: process.env.APP_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.APP_MESSAGING_SENDER_ID ?? '',
    appId: process.env.APP_APP_ID ?? '',
  };
}

const OWNER_UID = 'F4Z4NLTLKvP9UEgRoocJ1Z4YQPH2';

async function verifyOwner(req: express.Request): Promise<boolean> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid === OWNER_UID;
  } catch {
    return false;
  }
}

const app = express();
app.use(express.json());

// CORS for local dev
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

// Serve headshot from Storage - /hs/me_headshot.png redirects to signed URL
app.get('/hs/:filename', async (req, res) => {
  const path = 'hs/' + (req.params.filename ?? '');
  try {
    const url = await resolveStorageUrl(path);
    res.redirect(302, url);
  } catch {
    res.status(404).send('Not found');
  }
});

// Serve documents from Storage - /documents/Paul_Crews_... redirects to signed URL
app.get('/documents/:filename', async (req, res) => {
  const path = 'documents/' + (req.params.filename ?? '');
  try {
    const url = await resolveStorageUrl(path);
    res.redirect(302, url);
  } catch {
    res.status(404).send('Not found');
  }
});

// Client config - no keys in client code, fetched from server at runtime
app.get('/api/config', (req, res) => {
  const config = getFirebaseConfig();
  if (!config.apiKey) {
    return res.status(500).json({
      error: 'Firebase config not set. Set APP_API_KEY etc. in functions/.env or Google Cloud Console.',
    });
  }
  res.json({ firebase: config });
});

async function resolveStorageUrl(path: string): Promise<string> {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const file = bucket.file(cleanPath);

  // Try signed URL first
  try {
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 3600 * 1000 });
    return url;
  } catch {
    // Fallback: use public URL with token from metadata (if file exists)
    try {
      const [metadata] = await file.getMetadata();
      const meta = metadata as { metadata?: Record<string, string> };
      const token = meta.metadata?.firebaseStorageDownloadTokens;
      if (token) {
        const encoded = encodeURIComponent(cleanPath);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${token}`;
      }
    } catch {
      /* metadata failed */
    }
    throw new Error('File not found or no access');
  }
}

// Public read endpoints
app.get('/api/companies', async (req, res) => {
  try {
    const snap = await db.collection('companies').get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/experiences', async (req, res) => {
  try {
    const snap = await db.collection('experiences').get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const snap = await db.collection('projects').get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/skills', async (req, res) => {
  try {
    const snap = await db.collection('skills').get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/site-config', async (req, res) => {
  try {
    const snap = await db.collection('siteConfig').get();
    const doc = snap.docs[0];
    if (!doc) return res.json(null);
    let config: Record<string, unknown> = { id: doc.id, ...doc.data() };
    const headshotUrl = config.headshotUrl as string | undefined;
    if (headshotUrl && !headshotUrl.startsWith('http')) {
      try {
        config = { ...config, headshotUrl: await resolveStorageUrl(headshotUrl) };
      } catch {
        config = { ...config, headshotUrl: null };
      }
    }
    res.json(config);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/cv-url', async (req, res) => {
  try {
    const url = await resolveStorageUrl('documents/Paul_Crews_Jr_Executive_Resume_Final.pdf');
    res.json({ url });
  } catch {
    res.status(404).json({ error: 'Resume not found. Upload to Storage at documents/Paul_Crews_Jr_Executive_Resume_Final.pdf' });
  }
});

app.get('/api/resume-url', async (req, res) => {
  try {
    const url = await resolveStorageUrl('documents/Paul_Crews_Jr_Executive_Resume_Final.pdf');
    res.json({ url });
  } catch {
    res.status(404).json({ error: 'Resume not found. Upload to Storage at documents/Paul_Crews_Jr_Executive_Resume_Final.pdf' });
  }
});

app.get('/api/resolve-storage-url', async (req, res) => {
  try {
    const path = (req.query.path as string) ?? '';
    if (!path) return res.status(400).json({ error: 'path query param required' });
    const url = await resolveStorageUrl(path);
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/logo-url', async (req, res) => {
  try {
    let path = (req.query.path as string) ?? '';
    if (!path) return res.status(400).json({ error: 'path query param required' });
    if (!path.startsWith('logos/')) path = `logos/${path}`;
    const url = await resolveStorageUrl(path);
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// Admin write endpoints - require owner auth
app.post('/api/experiences', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    const ref = await db.collection('experiences').add(req.body);
    res.json({ id: ref.id });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.patch('/api/experiences/:id', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.collection('experiences').doc(req.params.id).update(req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/experiences/:id', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.collection('experiences').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/projects', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    const ref = await db.collection('projects').add(req.body);
    res.json({ id: ref.id });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.patch('/api/projects/:id', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.collection('projects').doc(req.params.id).update(req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.collection('projects').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/skills', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    const ref = await db.collection('skills').add(req.body);
    res.json({ id: ref.id });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.patch('/api/skills/:id', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.collection('skills').doc(req.params.id).update(req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.delete('/api/skills/:id', async (req, res) => {
  if (!(await verifyOwner(req))) return res.status(403).json({ error: 'Forbidden' });
  try {
    await db.collection('skills').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export const api = onRequest(
  { cors: true, region: 'us-central1', memory: '256MiB', invoker: 'public' },
  app
);
