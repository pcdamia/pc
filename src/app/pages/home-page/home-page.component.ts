import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RepoService } from '../../core/services/repo.service';
import { ThemeService } from '../../core/services/theme.service';
import { DEFAULT_SITE_CONFIG } from '../../core/dummy-data';
import type { SiteConfig } from '../../core/models';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
})
export class HomePageComponent implements OnInit {
  siteConfig = signal<SiteConfig>(DEFAULT_SITE_CONFIG);

  constructor(
    private repo: RepoService,
    protected theme: ThemeService,
  ) {}

  async ngOnInit() {
    try {
      const config = await this.repo.getSiteConfig();
      if (config) {
        this.siteConfig.set(config);
      } else {
        const defaultConfig = { ...DEFAULT_SITE_CONFIG };
        if (defaultConfig.headshotUrl?.startsWith('hs/')) {
          defaultConfig.headshotUrl = await this.repo.resolveHeadshotUrl(defaultConfig.headshotUrl);
          this.siteConfig.set(defaultConfig);
        }
      }
    } catch (err) {
      console.error('Failed to fetch home data:', err);
      this.siteConfig.set({ ...DEFAULT_SITE_CONFIG, headshotUrl: undefined });
    }
  }
}
