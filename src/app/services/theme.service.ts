import { Injectable, effect, signal } from '@angular/core';
import { SessionService } from '../core/auth/data-access/session.service';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly adminThemeKey = 'admin_theme';
  private readonly activeRole = signal<string | null>(null);
  readonly theme = signal<Theme>('light');

  constructor(private readonly auth: SessionService) {
    this.applyRole(this.auth.getRole());
    this.auth.currentUser$.subscribe((user) => this.applyRole(user?.role ?? null));

    effect(() => {
      if (typeof window === 'undefined') return;

      const role = this.activeRole();
      const currentTheme = this.theme();

      if (role === 'admin') {
        document.documentElement.setAttribute('data-theme', currentTheme);
        sessionStorage.setItem(this.adminThemeKey, currentTheme);
        return;
      }

      document.documentElement.setAttribute('data-theme', 'light');
    });
  }

  toggleTheme(): void {
    if (this.activeRole() !== 'admin') return;
    this.theme.update((value) => (value === 'light' ? 'dark' : 'light'));
  }

  setTheme(newTheme: Theme): void {
    if (this.activeRole() !== 'admin') return;
    this.theme.set(newTheme);
  }

  isDark(): boolean {
    return this.activeRole() === 'admin' && this.theme() === 'dark';
  }

  private applyRole(rawRole: string | null | undefined): void {
    const role = rawRole ? String(rawRole).toLowerCase() : null;
    this.activeRole.set(role);

    if (typeof window === 'undefined') return;

    if (role === 'admin') {
      const savedTheme = sessionStorage.getItem(this.adminThemeKey);
      this.theme.set(savedTheme === 'dark' ? 'dark' : 'light');
      return;
    }

    this.theme.set('light');
  }
}

