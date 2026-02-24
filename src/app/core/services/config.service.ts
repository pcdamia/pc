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

export interface AppConfig {
  firebase: FirebaseConfig;
  recaptchaSiteKey: string;
}

let configCache: AppConfig | null = null;

@Injectable({ providedIn: 'root' })
export class ConfigService {
  constructor(private http: HttpClient) {}

  async getConfig(): Promise<AppConfig> {
    if (configCache) return configCache;
    try {
      const res = await firstValueFrom(this.http.get<AppConfig>('/api/config'));
      if (res?.firebase?.apiKey) {
        configCache = res;
        return configCache;
      }
    } catch {
      /* API unreachable - try static fallback for local dev */
    }
    try {
      const fallback = await firstValueFrom(this.http.get<AppConfig>('/config.json'));
      if (!fallback?.firebase?.apiKey) {
        throw new Error('Invalid config.json. See public/config.json.example.');
      }
      configCache = { ...fallback, recaptchaSiteKey: fallback.recaptchaSiteKey ?? '' };
      return configCache;
    } catch {
      throw new Error(
        'Firebase config not available. Start the Functions emulator (cd functions && npm run serve) or add public/config.json for local dev.'
      );
    }
  }

  async getFirebaseConfig(): Promise<FirebaseConfig> {
    const config = await this.getConfig();
    return config.firebase;
  }

  async getRecaptchaSiteKey(): Promise<string> {
    const config = await this.getConfig();
    return config.recaptchaSiteKey ?? '';
  }
}

export function initConfig(config: ConfigService) {
  return () => config.getFirebaseConfig();
}
