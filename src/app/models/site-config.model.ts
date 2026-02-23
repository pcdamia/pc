export interface SiteConfig {
  id: string;
  name: string;
  title: string;
  positioningStatement: string;
  strategicSummary: string;
  headshotUrl?: string;
  cvUrl?: string;
  metrics?: { label: string; value: string }[];
}
