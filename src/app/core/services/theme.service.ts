import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private companyPrimary = signal<string>('#6e8faf');
  private companySecondary = signal<string>('#c7d6e5');

  readonly accentColor = computed(() => this.companyPrimary());

  setCompanyTheme(primary: string, secondary?: string) {
    this.companyPrimary.set(primary);
    this.companySecondary.set(secondary ?? primary);
    this.applyToRoot();
  }

  resetToDefault() {
    this.setCompanyTheme('#6e8faf', '#c7d6e5');
  }

  private applyToRoot() {
    document.documentElement.style.setProperty('--company-primary', this.companyPrimary());
    document.documentElement.style.setProperty('--company-secondary', this.companySecondary());
  }
}
