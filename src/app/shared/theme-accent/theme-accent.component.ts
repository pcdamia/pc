import { Component } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-accent',
  standalone: true,
  imports: [],
  templateUrl: './theme-accent.component.html',
  styleUrl: './theme-accent.component.css',
})
export class ThemeAccentComponent {
  constructor(public theme: ThemeService) {}
}
