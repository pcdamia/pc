import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { SnapSectionComponent } from '../../shared/snap-section/snap-section.component';
import { RepoService, type ExperienceWithCompany } from '../../core/services/repo.service';
import { ThemeService } from '../../core/services/theme.service';
import { DUMMY_EXPERIENCES } from '../../core/dummy-data';

@Component({
  selector: 'app-experience-page',
  standalone: true,
  imports: [SnapSectionComponent],
  templateUrl: './experience-page.component.html',
  styleUrl: './experience-page.component.css',
})
export class ExperiencePageComponent implements OnInit, OnDestroy {
  experiences = signal<ExperienceWithCompany[]>([]);
  scrollContainer = viewChild<ElementRef>('scrollContainer');
  activeSectionId = signal<string | null>(null);

  private observer: IntersectionObserver | null = null;

  constructor(
    private repo: RepoService,
    private theme: ThemeService,
  ) {}

  async ngOnInit() {
    try {
      const data = await this.repo.getExperiencesWithCompanies();
      const displayData = data.length > 0 ? data : DUMMY_EXPERIENCES;
      this.experiences.set(displayData);
      if (displayData.length > 0) {
        this.theme.setCompanyTheme(
          displayData[0].company.primaryColor ?? '#6e8faf',
          displayData[0].company.primaryColor,
        );
      }
      setTimeout(() => this.setupIntersectionObserver(), 100);
    } catch (err) {
      console.error('Failed to fetch experiences:', err);
      this.experiences.set(DUMMY_EXPERIENCES);
      this.theme.setCompanyTheme('#6e8faf');
      setTimeout(() => this.setupIntersectionObserver(), 100);
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.theme.resetToDefault();
  }

  scrollToSection(id: string) {
    const el = this.scrollContainer()?.nativeElement;
    const target = el?.querySelector(`[data-section-id="${id}"]`);
    if (el && target) {
      (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private setupIntersectionObserver() {
    this.observer?.disconnect();
    const el = this.scrollContainer();
    const container = el?.nativeElement as HTMLElement | undefined;
    if (!container) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const section = entry.target as HTMLElement;
          const primary = section.dataset['primaryColor'] ?? '#6e8faf';
          const id = section.dataset['sectionId'] ?? null;
          this.theme.setCompanyTheme(primary);
          this.activeSectionId.set(id);
        }
      },
      {
        root: container,
        threshold: 0.5,
        rootMargin: '0px',
      },
    );

    const sections = container.querySelectorAll('[data-section-id]');
    sections.forEach((el) => this.observer?.observe(el));
  }

  /** Extract 2-3 key outcomes from impact bullets (prioritize those with metrics) */
  protected getKeyOutcomes(bullets: string[]): string[] {
    const withNumbers = bullets.filter((b) => /\d+%|\d+K|\$\d+/.test(b));
    return (withNumbers.length >= 2 ? withNumbers : bullets).slice(0, 3);
  }

  /** Remaining bullets after key outcomes */
  protected getRemainingBullets(bullets: string[], keyOutcomes: string[]): string[] {
    if (keyOutcomes.length === 0) return bullets;
    const set = new Set(keyOutcomes);
    return bullets.filter((b) => !set.has(b));
  }

  /** Categorize technologies into Tech, Platforms, Governance */
  protected categorizeChips(techs: string[]): {
    tech: string[];
    platforms: string[];
    governance: string[];
  } {
    const gov = new Set([
      'hipaa', 'omh', 'mfa', 'mdm', 'vpn', 'disaster recovery', 'business continuity',
      'cybersecurity', 'security', 'passkey',
    ]);
    const platforms = new Set([
      'google workspace', 'windows server', 'cdk', 'macos', 'google chromebook',
    ]);
    const result = { tech: [] as string[], platforms: [] as string[], governance: [] as string[] };
    for (const t of techs) {
      const lower = t.toLowerCase();
      if (gov.has(lower) || gov.has(lower.replace(/\s*&\s*/g, ' '))) {
        result.governance.push(t);
      } else if (platforms.has(lower)) {
        result.platforms.push(t);
      } else {
        result.tech.push(t);
      }
    }
    return result;
  }

  /** Format employment date range as MM/YY-MM/YY (e.g. 12/22-Present, 09/10-07/18) */
  protected formatEmploymentDate(startDate: string, endDate: string): string {
    const toMmYy = (s: string): string => {
      const lower = s.trim().toLowerCase();
      if (lower === 'present' || lower === 'now') return 'Present';
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
        jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
      };
      const parts = s.split(/\s+/);
      if (parts.length >= 2) {
        const month = months[parts[0].toLowerCase().slice(0, 3)];
        const year = parts[1].slice(-2);
        if (month && year) return `${month}/${year}`;
      }
      return s;
    };
    const start = toMmYy(startDate);
    const end = toMmYy(endDate);
    return end === 'Present' ? `${start}...Present` : `${start}...${end}`;
  }
}
