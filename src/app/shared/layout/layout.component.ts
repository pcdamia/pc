import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeAccentComponent } from '../theme-accent/theme-accent.component';
import { ContactFloatingButtonComponent } from '../contact-floating-button/contact-floating-button.component';
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
    ContactFloatingButtonComponent,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent implements OnInit {
  siteConfig = signal<SiteConfig>(DEFAULT_SITE_CONFIG);

  constructor(private repo: RepoService) {}

  async ngOnInit() {
    try {
      const config = await this.repo.getSiteConfig();
      if (config) this.siteConfig.set(config);
    } catch {
      // keep default
    }
  }
}
