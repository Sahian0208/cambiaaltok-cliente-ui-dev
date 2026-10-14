import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'cambiaaltok_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDarkMode = signal(this.loadTheme());

  constructor() {
    this.initTheme();
  }

  toggleDarkMode(): void {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    this.applyTheme(newValue);
    try {
      localStorage.setItem(THEME_KEY, newValue ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }

  initTheme(): void {
    this.applyTheme(this.isDarkMode());
  }

  private loadTheme(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    return false;
  }

  private applyTheme(dark: boolean): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    if (dark) {
      root.classList.add('dark-mode', 'dark');
      if (body) {
        body.classList.add('dark-mode', 'dark');
      }
    } else {
      root.classList.remove('dark-mode', 'dark');
      if (body) {
        body.classList.remove('dark-mode', 'dark');
      }
    }
  }
}
