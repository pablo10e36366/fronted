import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ActivityHeatmapData {
  date: string;
  count: number;
}

@Component({
  selector: 'app-activity-heatmap',
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
  template: `
    <div class="heatmap-container">
      <div class="heatmap-grid">
        <div
          *ngFor="let day of calendarDays"
          class="heatmap-cell"
          [ngClass]="getColorClass(day.count)"
          [matTooltip]="getTooltip(day)">
        </div>
      </div>
      <div class="heatmap-legend">
        <span>Less</span>
        <div class="legend-cells">
          <div class="heatmap-cell level-0"></div>
          <div class="heatmap-cell level-1"></div>
          <div class="heatmap-cell level-2"></div>
          <div class="heatmap-cell level-3"></div>
          <div class="heatmap-cell level-4"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  `,
  styles: [`
    .heatmap-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: #fff;
      border: 1px solid #d0d7de;
      border-radius: 6px;
    }

    .heatmap-grid {
      display: grid;
      grid-template-rows: repeat(7, 10px);
      grid-auto-flow: column;
      gap: 3px;
    }

    .heatmap-cell {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      background-color: #ebedf0; /* Nivel 0 */
    }

    .heatmap-cell.level-1 { background-color: #cce5ff; }
    .heatmap-cell.level-2 { background-color: #66b2ff; }
    .heatmap-cell.level-3 { background-color: #0066cc; }
    .heatmap-cell.level-4 { background-color: #004080; }

    .heatmap-legend {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      font-size: 12px;
      color: #57606a;
    }

    .legend-cells {
      display: flex;
      gap: 3px;
    }
  `]
})
export class ActivityHeatmapComponent {
  @Input() data: ActivityHeatmapData[] = [];

  get calendarDays() {
    // Generar últimos 365 días (simplificado para demo)
    const days = [];
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(today.getDate() - (364 - i));
      const dateStr = date.toISOString().split('T')[0];
      const activity = this.data.find(d => d.date === dateStr);
      days.push({ date: dateStr, count: activity ? activity.count : 0 });
    }
    return days;
  }

  getColorClass(count: number): string {
    if (count === 0) return 'level-0';
    if (count <= 2) return 'level-1';
    if (count <= 5) return 'level-2';
    if (count <= 10) return 'level-3';
    return 'level-4';
  }

  getTooltip(day: any): string {
    return `${day.count} activities on ${day.date}`;
  }
}
