import { inject, Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

const OWNER_UID = 'F4Z4NLTLKvP9UEgRoocJ1Z4YQPH2';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = getAuth(inject(FirebaseService).app);
  private _user$ = new BehaviorSubject<User | null>(null);

  user$ = this._user$.asObservable();

  get user(): User | null {
    return this._user$.value;
  }

  get isOwner(): boolean {
    return !!this.user && this.user.uid === OWNER_UID;
  }

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this._user$.next(user);
    });
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}
