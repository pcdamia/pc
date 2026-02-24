import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeAccentComponent } from '../theme-accent/theme-accent.component';
import { RepoService } from '../../core/services/repo.service';
import { DEFAULT_SITE_CONFIG } from '../../core/dummy-data';
import type { SiteConfig } from '../../core/models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ThemeAccentComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {
  siteConfig = signal<SiteConfig>(DEFAULT_SITE_CONFIG);
  cvUrl = signal<string | null>(null);
  resumeUrl = signal<string | null>(null);

  constructor(private repo: RepoService) {}

  openInNewTab(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async ngOnInit() {
    try {
      const config = await this.repo.getSiteConfig();
      if (config) this.siteConfig.set(config);

      const [cv, resume] = await Promise.all([
        this.repo.getCvDownloadUrl(),
        this.repo.getResumeDownloadUrl(),
      ]);
      this.cvUrl.set(cv);
      this.resumeUrl.set(resume);
    } catch {
      // Fallback path - served by /documents/** rewrite if PDF exists in Storage
      const fallback = '/documents/Paul_Crews_Jr_Executive_Resume_Final.pdf';
      this.cvUrl.set(fallback);
      this.resumeUrl.set(fallback);
    }
  }
}
