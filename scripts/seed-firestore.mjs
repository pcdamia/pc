#!/usr/bin/env node
/**
 * Seed Firestore with resume-derived data.
 * Uses Firebase Admin SDK (bypasses security rules).
 *
 * No service account key needed. Uses Application Default Credentials.
 *
 * Setup (one-time):
 *   gcloud auth application-default login
 *   gcloud config set project portfolious-20286
 *
 * Run: npm run seed
 *
 * For CI/automation: set GOOGLE_APPLICATION_CREDENTIALS to a service account key path
 * (or use Workload Identity Federation in your pipeline).
 */
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'portfolious-20286';

if (!admin.apps.length) {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyPath && existsSync(keyPath)) {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
}

const db = admin.firestore();

async function seed() {
  const dataPath = join(__dirname, 'seed-data.json');
  const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

  if (data.siteConfig) {
    await db.collection('siteConfig').doc('main').set(data.siteConfig);
    console.log('Added siteConfig');
  }

  for (const company of data.companies) {
    const { id, ...rest } = company;
    await db.collection('companies').doc(id).set(rest);
    console.log('Added company:', company.name);
  }

  for (let i = 0; i < data.experiences.length; i++) {
    const exp = data.experiences[i];
    const id = `exp-${i + 1}`;
    const { companyId, title, startDate, endDate, summary, impactBullets, technologies, order } = exp;
    await db.collection('experiences').doc(id).set({
      companyId,
      title,
      startDate,
      endDate,
      summary,
      impactBullets: impactBullets ?? [],
      technologies: technologies ?? [],
      order: order ?? i + 1,
    });
    console.log('Added experience:', exp.title);
  }

  for (let i = 0; i < (data.projects ?? []).length; i++) {
    const proj = data.projects[i];
    const id = proj.id ?? `proj-${i + 1}`;
    await db.collection('projects').doc(id).set({
      name: proj.name,
      companyId: proj.companyId ?? null,
      problem: proj.problem ?? '',
      intervention: proj.intervention ?? '',
      architecture: proj.architecture ?? '',
      outcome: proj.outcome ?? '',
      outcomeBullets: proj.outcomeBullets ?? [],
      stakeholders: proj.stakeholders ?? [],
      technologies: proj.technologies ?? [],
      order: proj.order ?? 1,
    });
    console.log('Added project:', proj.name);
  }

  for (const skill of data.skills ?? []) {
    const { id, ...rest } = skill;
    await db.collection('skills').doc(id).set(rest);
    console.log('Added skill:', skill.name);
  }

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
