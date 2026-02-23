import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { RepoService } from '../../core/services/repo.service';
import type { Company, Experience, Project, Skill } from '../../core/models';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css',
})
export class AdminPageComponent implements OnInit {
  companies = signal<Company[]>([]);
  experiences = signal<Experience[]>([]);
  projects = signal<Project[]>([]);
  skills = signal<Skill[]>([]);
  companyMap = computed(() => {
    const c = this.companies();
    return new Map(c.map((x) => [x.id, x]));
  });

  editingId = signal<string | null>(null);
  isAdding = signal(false);
  editingProjId = signal<string | null>(null);
  isAddingProj = signal(false);
  editingSkillId = signal<string | null>(null);
  isAddingSkill = signal(false);
  form = signal({
    companyId: '',
    title: '',
    startDate: '',
    endDate: '',
    summary: '',
    impactBulletsText: '',
    technologiesText: '',
    order: 1,
  });
  formProj = signal({
    companyId: '' as string | null,
    name: '',
    problem: '',
    intervention: '',
    architecture: '',
    outcome: '',
    outcomeBulletsText: '',
    stakeholdersText: '',
    technologiesText: '',
    order: 1,
  });
  formSkill = signal({
    name: '',
    whereUsedText: '',
    whereLearned: '',
    order: 1,
  });

  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    public auth: AuthService,
    private repo: RepoService,
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const [companies, experiences, projects, skills] = await Promise.all([
        this.repo.getCompanies(),
        this.repo.getExperiences(),
        this.repo.getProjects(),
        this.repo.getSkills(),
      ]);
      this.companies.set(companies);
      this.experiences.set([...experiences].sort((a, b) => a.order - b.order));
      this.projects.set([...projects].sort((a, b) => a.order - b.order));
      this.skills.set([...skills].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      this.loading.set(false);
    }
  }

  startAdd() {
    this.editingId.set(null);
    this.isAdding.set(true);
    this.form.set({
      companyId: this.companies()[0]?.id ?? '',
      title: '',
      startDate: '',
      endDate: '',
      summary: '',
      impactBulletsText: '',
      technologiesText: '',
      order: (this.experiences().length + 1),
    });
  }

  startEdit(exp: Experience) {
    this.editingId.set(exp.id);
    this.isAdding.set(false);
    this.form.set({
      companyId: exp.companyId,
      title: exp.title,
      startDate: exp.startDate,
      endDate: exp.endDate,
      summary: exp.summary,
      impactBulletsText: (exp.impactBullets ?? []).join('\n'),
      technologiesText: (exp.technologies ?? []).join(', '),
      order: exp.order,
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.isAdding.set(false);
  }

  async save() {
    const f = this.form();
    const order = typeof f.order === 'number' ? f.order : parseInt(String(f.order), 10) || 1;
    const impactBullets = f.impactBulletsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const technologies = f.technologiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.loading.set(true);
    this.error.set(null);
    try {
      const id = this.editingId();
      if (id) {
        await this.repo.updateExperience(id, {
          companyId: f.companyId,
          title: f.title,
          startDate: f.startDate,
          endDate: f.endDate,
          summary: f.summary,
          impactBullets,
          technologies,
          order,
        });
      } else {
        await this.repo.addExperience({
          companyId: f.companyId,
          title: f.title,
          startDate: f.startDate,
          endDate: f.endDate,
          summary: f.summary,
          impactBullets,
          technologies,
          order,
        });
      }
      this.editingId.set(null);
      this.isAdding.set(false);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteExperience(exp: Experience) {
    if (!confirm(`Delete "${exp.title}"?`)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.repo.deleteExperience(exp.id);
      if (this.editingId() === exp.id) {
        this.editingId.set(null);
        this.isAdding.set(false);
      }
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      this.loading.set(false);
    }
  }

  updateForm<K extends keyof ReturnType<typeof this.form>>(key: K, value: ReturnType<typeof this.form>[K]) {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  updateFormProj<K extends keyof ReturnType<typeof this.formProj>>(key: K, value: ReturnType<typeof this.formProj>[K]) {
    this.formProj.update((f) => ({ ...f, [key]: value }));
  }

  updateFormSkill<K extends keyof ReturnType<typeof this.formSkill>>(key: K, value: ReturnType<typeof this.formSkill>[K]) {
    this.formSkill.update((f) => ({ ...f, [key]: value }));
  }

  // Projects
  startAddProj() {
    this.editingProjId.set(null);
    this.isAddingProj.set(true);
    this.formProj.set({
      companyId: this.companies()[0]?.id ?? null,
      name: '',
      problem: '',
      intervention: '',
      architecture: '',
      outcome: '',
      outcomeBulletsText: '',
      stakeholdersText: '',
      technologiesText: '',
      order: this.projects().length + 1,
    });
  }

  startEditProj(proj: Project) {
    this.editingProjId.set(proj.id);
    this.isAddingProj.set(false);
    this.formProj.set({
      companyId: proj.companyId ?? null,
      name: proj.name,
      problem: proj.problem ?? '',
      intervention: proj.intervention ?? '',
      architecture: proj.architecture ?? '',
      outcome: proj.outcome ?? '',
      outcomeBulletsText: (proj.outcomeBullets ?? []).join('\n'),
      stakeholdersText: (proj.stakeholders ?? []).join(', '),
      technologiesText: (proj.technologies ?? []).join(', '),
      order: proj.order,
    });
  }

  cancelEditProj() {
    this.editingProjId.set(null);
    this.isAddingProj.set(false);
  }

  async saveProj() {
    const f = this.formProj();
    const order = typeof f.order === 'number' ? f.order : parseInt(String(f.order), 10) || 1;
    const outcomeBullets = f.outcomeBulletsText.split('\n').map((s) => s.trim()).filter(Boolean);
    const stakeholders = f.stakeholdersText.split(',').map((s) => s.trim()).filter(Boolean);
    const technologies = f.technologiesText.split(',').map((s) => s.trim()).filter(Boolean);

    this.loading.set(true);
    this.error.set(null);
    try {
      const id = this.editingProjId();
      if (id) {
        await this.repo.updateProject(id, {
          name: f.name,
          companyId: f.companyId || undefined,
          problem: f.problem,
          intervention: f.intervention,
          architecture: f.architecture,
          outcome: f.outcome,
          outcomeBullets,
          stakeholders,
          technologies,
          order,
        });
      } else {
        await this.repo.addProject({
          name: f.name,
          companyId: f.companyId || undefined,
          problem: f.problem,
          intervention: f.intervention,
          architecture: f.architecture,
          outcome: f.outcome,
          outcomeBullets,
          stakeholders,
          technologies,
          order,
        });
      }
      this.editingProjId.set(null);
      this.isAddingProj.set(false);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to save project');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProject(proj: Project) {
    if (!confirm(`Delete "${proj.name}"?`)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.repo.deleteProject(proj.id);
      if (this.editingProjId() === proj.id) {
        this.editingProjId.set(null);
        this.isAddingProj.set(false);
      }
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to delete project');
    } finally {
      this.loading.set(false);
    }
  }

  // Skills
  startAddSkill() {
    this.editingSkillId.set(null);
    this.isAddingSkill.set(true);
    this.formSkill.set({
      name: '',
      whereUsedText: '',
      whereLearned: '',
      order: this.skills().length + 1,
    });
  }

  startEditSkill(skill: Skill) {
    this.editingSkillId.set(skill.id);
    this.isAddingSkill.set(false);
    this.formSkill.set({
      name: skill.name,
      whereUsedText: (skill.whereUsed ?? []).join(', '),
      whereLearned: skill.whereLearned ?? '',
      order: skill.order ?? 1,
    });
  }

  cancelEditSkill() {
    this.editingSkillId.set(null);
    this.isAddingSkill.set(false);
  }

  async saveSkill() {
    const f = this.formSkill();
    const order = typeof f.order === 'number' ? f.order : parseInt(String(f.order), 10) || 1;
    const whereUsed = f.whereUsedText.split(',').map((s) => s.trim()).filter(Boolean);

    this.loading.set(true);
    this.error.set(null);
    try {
      const id = this.editingSkillId();
      if (id) {
        await this.repo.updateSkill(id, {
          name: f.name,
          whereUsed,
          whereLearned: f.whereLearned || undefined,
          order,
        });
      } else {
        await this.repo.addSkill({
          name: f.name,
          whereUsed,
          whereLearned: f.whereLearned || undefined,
          order,
        });
      }
      this.editingSkillId.set(null);
      this.isAddingSkill.set(false);
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to save skill');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteSkill(skill: Skill) {
    if (!confirm(`Delete "${skill.name}"?`)) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.repo.deleteSkill(skill.id);
      if (this.editingSkillId() === skill.id) {
        this.editingSkillId.set(null);
        this.isAddingSkill.set(false);
      }
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to delete skill');
    } finally {
      this.loading.set(false);
    }
  }
}
