import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

let configCache: FirebaseConfig | null = null;

@Injectable({ providedIn: 'root' })
export class ConfigService {
  constructor(private http: HttpClient) {}

  async getFirebaseConfig(): Promise<FirebaseConfig> {
    if (configCache) return configCache;
    const res = await firstValueFrom(this.http.get<{ firebase: FirebaseConfig }>('/api/config'));
    if (!res?.firebase?.apiKey) {
      throw new Error('Firebase config not available. Ensure the API is running and config is set.');
    }
    configCache = res.firebase;
    return configCache;
  }
}

export function initConfig(config: ConfigService) {
  return () => config.getFirebaseConfig();
}
