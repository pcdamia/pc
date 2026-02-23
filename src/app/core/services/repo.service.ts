import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { FirebaseService } from './firebase.service';
import type { Company, Experience, Project, Skill, SiteConfig } from '../models';

export interface ExperienceWithCompany extends Experience {
  company: Company;
  resolvedLogoUrl?: string;
}

export interface ProjectWithCompany extends Project {
  company?: Company;
  resolvedLogoUrl?: string;
}

export interface SkillWithJoins extends Skill {
  usedAtCompanies: string[];
  learnedAtCompany?: string;
  relatedProjects: { id: string; name: string }[];
}

@Injectable({ providedIn: 'root' })
export class RepoService {
  constructor(private firebase: FirebaseService) {}

  private get db(): Firestore {
    return this.firebase.db;
  }

  async getCompanies(): Promise<Company[]> {
    const snapshot = await getDocs(collection(this.db, 'companies'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Company));
  }

  async getExperiences(): Promise<Experience[]> {
    const snapshot = await getDocs(collection(this.db, 'experiences'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Experience));
  }

  async addExperience(data: Omit<Experience, 'id'>): Promise<string> {
    const ref = await addDoc(collection(this.db, 'experiences'), {
      companyId: data.companyId,
      title: data.title,
      startDate: data.startDate,
      endDate: data.endDate,
      summary: data.summary,
      impactBullets: data.impactBullets ?? [],
      technologies: data.technologies ?? [],
      order: data.order,
    });
    return ref.id;
  }

  async updateExperience(id: string, data: Partial<Omit<Experience, 'id'>>): Promise<void> {
    const ref = doc(this.db, 'experiences', id);
    await updateDoc(ref, data as Record<string, unknown>);
  }

  async deleteExperience(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'experiences', id));
  }

  async getProjects(): Promise<Project[]> {
    const snapshot = await getDocs(collection(this.db, 'projects'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
  }

  async addProject(data: Omit<Project, 'id'>): Promise<string> {
    const ref = await addDoc(collection(this.db, 'projects'), {
      name: data.name,
      companyId: data.companyId ?? null,
      problem: data.problem ?? '',
      intervention: data.intervention ?? '',
      architecture: data.architecture ?? '',
      outcome: data.outcome ?? '',
      outcomeBullets: data.outcomeBullets ?? [],
      stakeholders: data.stakeholders ?? [],
      technologies: data.technologies ?? [],
      order: data.order,
    });
    return ref.id;
  }

  async updateProject(id: string, data: Partial<Omit<Project, 'id'>>): Promise<void> {
    const ref = doc(this.db, 'projects', id);
    await updateDoc(ref, data as Record<string, unknown>);
  }

  async deleteProject(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'projects', id));
  }

  async getSkills(): Promise<Skill[]> {
    const snapshot = await getDocs(collection(this.db, 'skills'));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Skill));
  }

  async addSkill(data: Omit<Skill, 'id'>): Promise<string> {
    const ref = await addDoc(collection(this.db, 'skills'), {
      name: data.name,
      whereUsed: data.whereUsed ?? [],
      whereLearned: data.whereLearned ?? null,
      order: data.order ?? 0,
    });
    return ref.id;
  }

  async updateSkill(id: string, data: Partial<Omit<Skill, 'id'>>): Promise<void> {
    const ref = doc(this.db, 'skills', id);
    await updateDoc(ref, data as Record<string, unknown>);
  }

  async deleteSkill(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'skills', id));
  }

  async getSiteConfig(): Promise<SiteConfig | null> {
    const snapshot = await getDocs(collection(this.db, 'siteConfig'));
    const doc = snapshot.docs[0];
    if (!doc) return null;
    const config = { id: doc.id, ...doc.data() } as SiteConfig;
    if (config.headshotUrl) {
      config.headshotUrl = await this.resolveHeadshotUrl(config.headshotUrl);
    }
    return config;
  }

  async resolveHeadshotUrl(headshotUrl: string): Promise<string> {
    if (headshotUrl.startsWith('http://') || headshotUrl.startsWith('https://')) {
      return headshotUrl;
    }
    if (headshotUrl.startsWith('/') || headshotUrl.startsWith('assets/')) {
      return headshotUrl.startsWith('/') ? headshotUrl : `/${headshotUrl}`;
    }
    return getDownloadURL(ref(this.firebase.storage, headshotUrl));
  }

  async getCvDownloadUrl(): Promise<string> {
    const path = 'documents/Paul_Crews_Jr_Executive_Resume_Final.pdf';
    return getDownloadURL(ref(this.firebase.storage, path));
  }

  async getResumeDownloadUrl(): Promise<string> {
    const path = 'documents/Paul_Crews_Jr_Executive_Resume_Final.pdf';
    return getDownloadURL(ref(this.firebase.storage, path));
  }

  async getExperiencesWithCompanies(): Promise<ExperienceWithCompany[]> {
    const [companies, experiences] = await Promise.all([
      this.getCompanies(),
      this.getExperiences(),
    ]);
    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const sorted = [...experiences].sort((a, b) => a.order - b.order);

    const result: ExperienceWithCompany[] = [];
    for (const exp of sorted) {
      const company = companyMap.get(exp.companyId);
      if (!company) continue;

      let resolvedLogoUrl: string | undefined;
      if (company.logoUrl) {
        resolvedLogoUrl = await this.resolveLogoUrl(company.logoUrl);
      }

      result.push({
        ...exp,
        company,
        resolvedLogoUrl,
      });
    }
    return result;
  }

  async getProjectsWithCompanies(): Promise<ProjectWithCompany[]> {
    const [companies, projects] = await Promise.all([
      this.getCompanies(),
      this.getProjects(),
    ]);
    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const sorted = [...projects].sort((a, b) => a.order - b.order);

    const result: ProjectWithCompany[] = [];
    for (const proj of sorted) {
      const company = proj.companyId ? companyMap.get(proj.companyId) : undefined;
      let resolvedLogoUrl: string | undefined;
      if (company?.logoUrl) {
        resolvedLogoUrl = await this.resolveLogoUrl(company.logoUrl);
      }

      result.push({
        ...proj,
        company,
        resolvedLogoUrl,
      });
    }
    return result;
  }

  async getSkillsWithJoins(): Promise<SkillWithJoins[]> {
    const [skills, companies, projects] = await Promise.all([
      this.getSkills(),
      this.getCompanies(),
      this.getProjects(),
    ]);
    const companyMap = new Map(companies.map((c) => [c.id, c]));
    const sorted = [...skills].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const result: SkillWithJoins[] = [];
    for (const skill of sorted) {
      const usedAtCompanies = (skill.whereUsed ?? [])
        .map((id) => companyMap.get(id)?.name)
        .filter((n): n is string => !!n);

      const learnedAtCompany = skill.whereLearned
        ? companyMap.get(skill.whereLearned)?.name ?? skill.whereLearned
        : undefined;

      const relatedProjects = projects
        .filter(
          (p) =>
            p.technologies?.some(
              (t) => t.toLowerCase() === skill.name.toLowerCase()
            )
        )
        .map((p) => ({ id: p.id, name: p.name }));

      result.push({
        ...skill,
        usedAtCompanies,
        learnedAtCompany,
        relatedProjects,
      });
    }
    return result;
  }

  private async resolveLogoUrl(logoUrl: string): Promise<string> {
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }
    if (logoUrl.startsWith('/') || logoUrl.startsWith('assets/')) {
      return logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    }
    const path = logoUrl.startsWith('logos/') ? logoUrl : `logos/${logoUrl}`;
    return getDownloadURL(ref(this.firebase.storage, path));
  }
}
