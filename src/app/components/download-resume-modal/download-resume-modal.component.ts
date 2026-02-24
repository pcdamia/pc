import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-download-resume-modal',
  standalone: true,
  templateUrl: './download-resume-modal.component.html',
  styleUrl: './download-resume-modal.component.css',
})
export class DownloadResumeModalComponent {
  isOpen = input.required<boolean>();
  resumeUrl = input<string | null>(null);
  closed = output<void>();

  close() {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('contact-modal__backdrop')) {
      this.close();
    }
  }

  download() {
    const url = this.resumeUrl();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    this.close();
  }
}
