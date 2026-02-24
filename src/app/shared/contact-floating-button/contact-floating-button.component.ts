import { Component, output, signal, inject } from '@angular/core';
import { RepoService } from '../../core/services/repo.service';
import { CoverLetterModalComponent } from '../../components/cover-letter-modal/cover-letter-modal.component';
import { DownloadResumeModalComponent } from '../../components/download-resume-modal/download-resume-modal.component';
import type { SiteConfig } from '../../core/models';

export type ContactOption = 'cover-letter' | 'resume';

const SCHEDULE_EMAIL_BODY = `Hi Paul,

I would like to schedule a call with you to discuss [Position] at [Company]. I am available on [Day] at [Time]. If that works with you please reply with your confirmation.`;

@Component({
  selector: 'app-contact-floating-button',
  standalone: true,
  imports: [
    CoverLetterModalComponent,
    DownloadResumeModalComponent,
  ],
  templateUrl: './contact-floating-button.component.html',
  styleUrl: './contact-floating-button.component.css',
})
export class ContactFloatingButtonComponent {
  private repo = inject(RepoService);

  scheduleMailtoUrl = `mailto:pcrews.employ@gmail.com?subject=${encodeURIComponent('Schedule a call')}&body=${encodeURIComponent(SCHEDULE_EMAIL_BODY)}`;

  dropdownOpen = signal(false);
  activeModal = signal<ContactOption | null>(null);
  siteConfig = signal<SiteConfig | null>(null);
  resumeUrl = signal<string | null>(null);

  closed = output<void>();

  constructor() {
    this.repo.getSiteConfig().then((c) => this.siteConfig.set(c ?? null));
    this.repo.getResumeDownloadUrl().then((u) => this.resumeUrl.set(u)).catch(() => {});
  }

  toggleDropdown() {
    this.dropdownOpen.update((v) => !v);
  }

  closeDropdown() {
    this.dropdownOpen.set(false);
  }

  openModal(option: ContactOption) {
    this.closeDropdown();
    this.activeModal.set(option);
  }

  closeModal() {
    this.activeModal.set(null);
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('contact-floating__backdrop')) {
      this.closeDropdown();
    }
  }
}
