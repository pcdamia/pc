import { Component, input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-skill-bubble',
  standalone: true,
  imports: [],
  templateUrl: './skill-bubble.component.html',
  styleUrl: './skill-bubble.component.css',
})
export class SkillBubbleComponent {
  skillName = input.required<string>();
  /** Anchor ID for scroll target (e.g. skill-1). When set, renders as link. */
  anchorId = input<string | undefined>();

  constructor(private router: Router) {}

  handleClick(event: Event) {
    const id = this.anchorId();
    if (!id) return;

    event.preventDefault();

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      this.router.navigate(['/skills'], { fragment: id });
    }
  }
}
