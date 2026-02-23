import { Component, input } from '@angular/core';

@Component({
  selector: 'app-snap-section',
  standalone: true,
  imports: [],
  templateUrl: './snap-section.component.html',
  styleUrl: './snap-section.component.css',
})
export class SnapSectionComponent {
  id = input<string>('');
  isActive = input<boolean>(false);
  logoUrl = input<string | undefined>();
  title = input<string>('');
  subtitle = input<string>('');
  summary = input<string>('');
  bullets = input<string[]>([]);
  chipsA = input<string[]>([]);
  chipsB = input<string[]>([]);
  /** Case study mode: Key Outcomes callout (2-3 metrics) */
  keyOutcomes = input<string[]>([]);
  /** Case study mode: Role type label (e.g. "Leadership", "Executive") */
  roleTypeLabel = input<string | undefined>();
  /** Case study mode: Chips grouped by category */
  chipsTech = input<string[]>([]);
  chipsPlatforms = input<string[]>([]);
  chipsGovernance = input<string[]>([]);
  accentColor = input<string | undefined>();
  /** Employment date overlay (MM/YY-MM/YY format), shown top-right */
  dateDisplay = input<string | undefined>();
  /** Watermark title (e.g. "HEAD OF TECHNOLOGY"), large faded behind content */
  watermarkTitle = input<string | undefined>();
}
