import {
  Component,
  OnInit,
  AfterViewChecked,
  signal,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RepoService, type SkillWithJoins } from '../../core/services/repo.service';
import { DUMMY_SKILLS } from '../../core/dummy-data';

@Component({
  selector: 'app-skills-page',
  standalone: true,
  imports: [],
  templateUrl: './skills-page.component.html',
  styleUrl: './skills-page.component.css',
})
export class SkillsPageComponent implements OnInit, AfterViewChecked {
  skills = signal<SkillWithJoins[]>([]);
  searchQuery = signal('');

  private route = inject(ActivatedRoute);
  private hasScrolledToFragment = false;

  filteredSkills = computed(() => {
    const list = this.skills();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => s.name.toLowerCase().includes(q));
  });

  constructor(private repo: RepoService) {}

  async ngOnInit() {
    try {
      const data = await this.repo.getSkillsWithJoins();
      this.skills.set(data.length > 0 ? data : DUMMY_SKILLS);
    } catch (err) {
      console.error('Failed to fetch skills:', err);
      this.skills.set(DUMMY_SKILLS);
    }
  }

  ngAfterViewChecked() {
    if (this.hasScrolledToFragment) return;
    const fragment = this.route.snapshot.fragment;
    if (fragment) {
      const el = document.getElementById(fragment);
      if (el) {
        this.hasScrolledToFragment = true;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
  }
}
