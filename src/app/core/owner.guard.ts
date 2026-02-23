import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const ownerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await new Promise((r) => setTimeout(r, 200));

  if (!auth.isOwner) {
    router.navigateByUrl('/');
    return false;
  }
  return true;
};
