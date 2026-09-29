import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'cambiaaltok_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDarkMode = signal(this.loadTheme());

  toggleDarkMode(): void {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);
    this.applyTheme(newValue);
    localStorage.setItem(THEME_KEY, newValue ? 'dark' : 'light');
  }

  initTheme(): void {
    this.applyTheme(this.isDarkMode());
  }

  private loadTheme(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    // Respect system preference
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private applyTheme(dark: boolean): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
  }
}
