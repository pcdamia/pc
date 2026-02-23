import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layout/layout.component';
import { HomePageComponent } from './pages/home-page/home-page.component';
import { ExperiencePageComponent } from './pages/experience-page/experience-page.component';
import { ProjectsPageComponent } from './pages/projects-page/projects-page.component';
import { SkillsPageComponent } from './pages/skills-page/skills-page.component';
import { AdminPageComponent } from './pages/admin-page/admin-page';
import { ownerGuard } from './core/owner.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomePageComponent },
      { path: 'experience', component: ExperiencePageComponent },
      { path: 'projects', component: ProjectsPageComponent },
      { path: 'skills', component: SkillsPageComponent },
    ],
  },
  {
    path: 'admin-pc',
    component: AdminPageComponent,
    canActivate: [ownerGuard],
  },
  { path: '**', redirectTo: '' },
];
