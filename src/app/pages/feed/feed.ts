import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityFeedComponent } from '../../components/activity-feed/activity-feed';

@Component({
    selector: 'app-feed',
    standalone: true,
    imports: [CommonModule, ActivityFeedComponent],
    template: `
    <div class="feed-page">
      <div class="page-header">
        <h1>Feed</h1>
        <p>Actividad reciente de tu equipo</p>
      </div>
      <div class="feed-content">
        <app-activity-feed></app-activity-feed>
      </div>
    </div>
  `,
    styles: [`
    .feed-page { max-width: 800px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--slate-900); margin-bottom: 0.5rem; }
    .page-header p { color: var(--slate-500); font-size: 0.95rem; }
    .feed-content { background: white; border-radius: var(--border-radius-lg); border: 1px solid var(--slate-200); overflow: hidden; }
  `]
})
export class FeedComponent { }
