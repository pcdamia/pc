import { Component, input, output, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoverLetterService, type MatchResult } from '../../core/services/cover-letter.service';
import { RepoService } from '../../core/services/repo.service';
import type { SiteConfig } from '../../core/models';

@Component({
  selector: 'app-cover-letter-modal',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './cover-letter-modal.component.html',
  styleUrl: './cover-letter-modal.component.css',
})
export class CoverLetterModalComponent {
  isOpen = input.required<boolean>();
  siteConfig = input.required<SiteConfig>();
  closed = output<void>();

  mode = signal<'basic' | 'advanced'>('basic');
  jobTitle = signal('');
  jobDescription = signal('');
  matchResult = signal<MatchResult | null>(null);

  showLowMatchAlert = computed(
    () => this.matchResult()?.isBelowThreshold ?? false
  );

  constructor(
    private coverLetter: CoverLetterService,
    private repo: RepoService
  ) {}

  close() {
    this.closed.emit();
    this.mode.set('basic');
    this.jobTitle.set('');
    this.jobDescription.set('');
    this.matchResult.set(null);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('cover-letter-modal__backdrop')) {
      this.close();
    }
  }

  setMode(mode: 'basic' | 'advanced') {
    this.mode.set(mode);
    this.matchResult.set(null);
  }

  async checkMatch() {
    const title = this.jobTitle().trim();
    const desc = this.jobDescription().trim();
    if (!title && !desc) return;

    const skills = await this.repo.getSkills();
    const result = this.coverLetter.getMatchScore(title, desc, skills);
    this.matchResult.set(result);
  }

  downloadBasic() {
    this.coverLetter.generateBasicPdf(this.siteConfig());
    this.close();
  }

  downloadAdvanced() {
    this.coverLetter.generateAdvancedPdf(
      this.siteConfig(),
      this.jobTitle().trim() || 'Position',
      this.jobDescription().trim()
    );
    this.close();
  }
}
