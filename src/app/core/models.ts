export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
}

export interface Experience {
  id: string;
  companyId: string;
  title: string;
  startDate: string;
  endDate: string;
  summary: string;
  impactBullets: string[];
  technologies?: string[];
  order: number;
}

export interface Project {
  id: string;
  name: string;
  companyId?: string;
  problem: string;
  intervention: string;
  architecture: string;
  outcome: string;
  outcomeBullets?: string[];
  stakeholders: string[];
  technologies?: string[];
  order: number;
}

export interface Skill {
  id: string;
  name: string;
  whereUsed?: string[];
  whereLearned?: string;
  order?: number;
}

export interface SiteConfig {
  id: string;
  name: string;
  title: string;
  positioningStatement: string;
  strategicSummary: string;
  headshotUrl?: string;
  cvStoragePath?: string;
  metrics?: { label: string; value: string }[];
}
