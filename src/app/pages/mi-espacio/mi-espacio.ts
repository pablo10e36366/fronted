import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-mi-espacio',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="mi-espacio-page">
      <div class="page-header">
        <h1>Mi Espacio</h1>
        <p>Tu área personal de trabajo y notas</p>
      </div>
      <div class="espacio-content">
        <div class="empty-state">
          <span class="empty-icon">🏠</span>
          <h3>Mi Espacio próximamente</h3>
          <p>Aquí podrás organizar tu espacio de trabajo personal</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .mi-espacio-page { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.5rem; }
    .page-header p { color: var(--slate-500); font-size: 0.95rem; }
    .espacio-content { background: white; border-radius: var(--border-radius-lg); border: 1px solid var(--slate-200); padding: 3rem; }
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.25rem; font-weight: 600; color: var(--slate-700); margin-bottom: 0.5rem; }
    .empty-state p { color: var(--slate-500); font-size: 0.875rem; }
  `]
})
export class MiEspacioComponent { }
