import { Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

const P_SEQUENCE_COUNT = 5;
const P_SEQUENCE_WINDOW_MS = 2000;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('portfolio');
  protected readonly showSignInOverlay = signal(false);

  private auth = inject(AuthService);
  private router = inject(Router);

  private pCount = 0;
  private pWindowStart = 0;

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'p' || e.key === 'P') {
      const now = Date.now();
      if (now - this.pWindowStart > P_SEQUENCE_WINDOW_MS) {
        this.pCount = 0;
        this.pWindowStart = now;
      }
      this.pCount++;
      if (this.pCount >= P_SEQUENCE_COUNT) {
        this.pCount = 0;
        this.pWindowStart = 0;
        this.showSignInOverlay.set(true);
      }
    } else {
      this.pCount = 0;
      this.pWindowStart = 0;
    }
  }

  closeOverlay(): void {
    this.showSignInOverlay.set(false);
  }

  async signInWithGoogle(): Promise<void> {
    await this.auth.signInWithGoogle();
    if (this.auth.isOwner) {
      this.showSignInOverlay.set(false);
      this.router.navigateByUrl('/admin-pc');
    }
  }
}
