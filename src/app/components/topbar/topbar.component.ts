import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../core/auth/data-access/session.service';
import { Observable } from 'rxjs';
import type { JwtUserPayload } from '../../core/models/auth.models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
  user$: Observable<JwtUserPayload | null>;
  menuOpen = false;

  constructor(private SessionService: SessionService) {
    this.user$ = this.SessionService.currentUser$;
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.menuOpen = false;
    this.SessionService.logout();
  }

  getInitials(name?: string | null, fallbackEmail?: string | null): string {
    const base = (name || '').trim() || (fallbackEmail || '').split('@')[0] || 'Usuario';
    const parts = base
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const initials = (parts[0]?.[0] || 'U') + (parts[1]?.[0] || '');
    return initials.toUpperCase();
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen = false;
  }
}

