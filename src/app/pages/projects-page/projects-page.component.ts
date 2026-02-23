import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { SnapSectionComponent } from '../../shared/snap-section/snap-section.component';
import { RepoService, type ProjectWithCompany } from '../../core/services/repo.service';
import { ThemeService } from '../../core/services/theme.service';
import { DUMMY_PROJECTS } from '../../core/dummy-data';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [SnapSectionComponent],
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.css',
})
export class ProjectsPageComponent implements OnInit, OnDestroy {
  projects = signal<ProjectWithCompany[]>([]);
  scrollContainer = viewChild<ElementRef>('scrollContainer');
  activeSectionId = signal<string | null>(null);

  private observer: IntersectionObserver | null = null;

  constructor(
    private repo: RepoService,
    private theme: ThemeService,
  ) {}

  async ngOnInit() {
    try {
      const data = await this.repo.getProjectsWithCompanies();
      const displayData = data.length > 0 ? data : DUMMY_PROJECTS;
      this.projects.set(displayData);
      if (displayData.length > 0 && displayData[0].company) {
        this.theme.setCompanyTheme(
          displayData[0].company.primaryColor ?? '#6e8faf',
          displayData[0].company.primaryColor,
        );
      }
      setTimeout(() => this.setupIntersectionObserver(), 100);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      this.projects.set(DUMMY_PROJECTS);
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

  protected getProjectBullets(project: ProjectWithCompany): string[] {
    if (project.outcomeBullets?.length) return project.outcomeBullets;
    return project.outcome ? [project.outcome] : [];
  }

  protected getProjectSummary(project: ProjectWithCompany): string {
    const parts: string[] = [];
    if (project.problem) parts.push(`Problem: ${project.problem}`);
    if (project.intervention) parts.push(`Intervention: ${project.intervention}`);
    if (project.architecture) parts.push(`Architecture: ${project.architecture}`);
    return parts.join(' ');
  }
}
