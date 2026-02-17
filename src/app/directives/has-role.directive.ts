import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy, inject } from '@angular/core';
import { SessionService } from '../core/auth/data-access/session.service';
import { Subscription, interval } from 'rxjs';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private roles: string[] = [];
  private checkSubscription?: Subscription;
  private sessionService: SessionService;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {
    this.sessionService = inject(SessionService);
  }

  @Input() set appHasRole(roles: string | string[]) {
    this.roles = Array.isArray(roles) ? roles : [roles];
    this.updateView();
  }

  ngOnInit(): void {
    // Verificar rol periódicamente para detectar cambios (cada 2 segundos)
    this.checkSubscription = interval(2000).subscribe(() => {
      this.updateView();
    });
    
    // Verificar inicialmente
    this.updateView();
  }

  ngOnDestroy(): void {
    this.checkSubscription?.unsubscribe();
  }

  private updateView(): void {
    const hasRole = this.checkRole();
    
    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }

  private checkRole(): boolean {
    const currentRole = this.sessionService.getRole();
    
    if (!currentRole) {
      return false;
    }

    // Admin tiene acceso a todo
    if (currentRole === 'admin') {
      return true;
    }

    // Verificar si el rol actual está en la lista de roles permitidos
    return this.roles.includes(currentRole);
  }
}
