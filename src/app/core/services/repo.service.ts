import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
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
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private async authHeaders(): Promise<Record<string, string>> {
    const user = this.auth.user;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  }

  async getCompanies(): Promise<Company[]> {
    return firstValueFrom(this.http.get<Company[]>('/api/companies'));
  }

  async getExperiences(): Promise<Experience[]> {
    return firstValueFrom(this.http.get<Experience[]>('/api/experiences'));
  }

  async addExperience(data: Omit<Experience, 'id'>): Promise<string> {
    const headers = await this.authHeaders();
    const res = await firstValueFrom(
      this.http.post<{ id: string }>('/api/experiences', data, { headers })
    );
    return res.id;
  }

  async updateExperience(id: string, data: Partial<Omit<Experience, 'id'>>): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(this.http.patch(`/api/experiences/${id}`, data, { headers }));
  }

  async deleteExperience(id: string): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(this.http.delete(`/api/experiences/${id}`, { headers }));
  }

  async getProjects(): Promise<Project[]> {
    return firstValueFrom(this.http.get<Project[]>('/api/projects'));
  }

  async addProject(data: Omit<Project, 'id'>): Promise<string> {
    const headers = await this.authHeaders();
    const res = await firstValueFrom(
      this.http.post<{ id: string }>('/api/projects', data, { headers })
    );
    return res.id;
  }

  async updateProject(id: string, data: Partial<Omit<Project, 'id'>>): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(this.http.patch(`/api/projects/${id}`, data, { headers }));
  }

  async deleteProject(id: string): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(this.http.delete(`/api/projects/${id}`, { headers }));
  }

  async getSkills(): Promise<Skill[]> {
    return firstValueFrom(this.http.get<Skill[]>('/api/skills'));
  }

  async addSkill(data: Omit<Skill, 'id'>): Promise<string> {
    const headers = await this.authHeaders();
    const res = await firstValueFrom(
      this.http.post<{ id: string }>('/api/skills', data, { headers })
    );
    return res.id;
  }

  async updateSkill(id: string, data: Partial<Omit<Skill, 'id'>>): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(this.http.patch(`/api/skills/${id}`, data, { headers }));
  }

  async deleteSkill(id: string): Promise<void> {
    const headers = await this.authHeaders();
    await firstValueFrom(this.http.delete(`/api/skills/${id}`, { headers }));
  }

  async getSiteConfig(): Promise<SiteConfig | null> {
    return firstValueFrom(this.http.get<SiteConfig | null>('/api/site-config'));
  }

  async getCvDownloadUrl(): Promise<string> {
    const res = await firstValueFrom(this.http.get<{ url: string }>('/api/cv-url'));
    return res.url;
  }

  async getResumeDownloadUrl(): Promise<string> {
    const res = await firstValueFrom(this.http.get<{ url: string }>('/api/resume-url'));
    return res.url;
  }

  async resolveHeadshotUrl(headshotUrl: string): Promise<string> {
    if (headshotUrl.startsWith('http://') || headshotUrl.startsWith('https://')) return headshotUrl;
    if (headshotUrl.startsWith('/') || headshotUrl.startsWith('assets/')) {
      return headshotUrl.startsWith('/') ? headshotUrl : `/${headshotUrl}`;
    }
    const res = await firstValueFrom(
      this.http.get<{ url: string }>('/api/resolve-storage-url', { params: { path: headshotUrl } })
    );
    return res.url;
  }

  private async resolveLogoUrl(logoUrl: string): Promise<string> {
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
    if (logoUrl.startsWith('/') || logoUrl.startsWith('assets/')) {
      return logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`;
    }
    const path = logoUrl.startsWith('logos/') ? logoUrl : `logos/${logoUrl}`;
    const res = await firstValueFrom(
      this.http.get<{ url: string }>('/api/logo-url', { params: { path } })
    );
    return res.url;
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

      result.push({ ...exp, company, resolvedLogoUrl });
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
      result.push({ ...proj, company, resolvedLogoUrl });
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

    return sorted.map((skill) => {
      const usedAtCompanies = (skill.whereUsed ?? [])
        .map((id) => companyMap.get(id)?.name)
        .filter((n): n is string => !!n);
      const learnedAtCompany = skill.whereLearned
        ? companyMap.get(skill.whereLearned)?.name ?? skill.whereLearned
        : undefined;
      const relatedProjects = projects
        .filter((p) =>
          p.technologies?.some((t) => t.toLowerCase() === skill.name.toLowerCase())
        )
        .map((p) => ({ id: p.id, name: p.name }));

      return { ...skill, usedAtCompanies, learnedAtCompany, relatedProjects };
    });
  }
}
