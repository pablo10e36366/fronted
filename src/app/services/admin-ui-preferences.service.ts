import { Injectable, signal } from '@angular/core';
import { SessionService } from '../core/auth/data-access/session.service';

@Injectable({
  providedIn: 'root'
})
export class AdminUiPreferencesService {
  private readonly godModeVisibleKey = 'admin_god_mode_visible';
  private readonly activeRole = signal<string | null>(null);
  readonly godModeVisible = signal<boolean>(true);

  constructor(private readonly auth: SessionService) {
    this.applyRole(this.auth.getRole());
    this.auth.currentUser$.subscribe((user) => this.applyRole(user?.role ?? null));
  }

  isGodModeVisible(): boolean {
    return this.activeRole() === 'admin' && this.godModeVisible();
  }

  setGodModeVisibility(visible: boolean): void {
    if (this.activeRole() !== 'admin') return;
    this.godModeVisible.set(visible);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.godModeVisibleKey, String(visible));
    }
  }

  toggleGodModeVisibility(): void {
    this.setGodModeVisibility(!this.godModeVisible());
  }

  private applyRole(rawRole: string | null | undefined): void {
    const role = rawRole ? String(rawRole).toLowerCase() : null;
    this.activeRole.set(role);

    if (typeof window === 'undefined') return;

    if (role === 'admin') {
      const saved = sessionStorage.getItem(this.godModeVisibleKey);
      this.godModeVisible.set(saved !== 'false');
      return;
    }

    this.godModeVisible.set(false);
  }
}

