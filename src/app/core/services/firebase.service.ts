import { Injectable, inject } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private configService = inject(ConfigService);

  private _app: FirebaseApp | null = null;
  private _initPromise: Promise<FirebaseApp> | null = null;

  async ensureInit(): Promise<FirebaseApp> {
    if (this._app) return this._app;
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      const config = await this.configService.getFirebaseConfig();
      this._app = initializeApp(config);
      return this._app;
    })();
    return this._initPromise;
  }

  get app(): FirebaseApp {
    if (!this._app) {
      throw new Error('Firebase not initialized. Ensure APP_INITIALIZER loaded config.');
    }
    return this._app;
  }

  private _db: Firestore | null = null;
  private _storage: FirebaseStorage | null = null;

  get db(): Firestore {
    if (!this._db) {
      this._db = getFirestore(this.app);
    }
    return this._db;
  }

  get storage(): FirebaseStorage {
    if (!this._storage) {
      this._storage = getStorage(this.app);
    }
    return this._storage;
  }

  async getApp(): Promise<FirebaseApp> {
    return this.ensureInit();
  }
}
