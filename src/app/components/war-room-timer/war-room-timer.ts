import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-war-room-timer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <ng-container *ngIf="isVisible()">
      <div class="war-timer" [class.critical]="isCritical()">
        <div class="timer-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="timer-content">
          <span class="timer-label">ENTREGA INMINENTE</span>
          <span class="timer-value">{{ formattedTime() }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercent()"></div>
        </div>
      </div>
    </ng-container>
  `,
    styles: [`
    .war-timer {
      position: fixed;
      top: 24px;
      right: 24px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.3);
      display: flex;
      align-items: center;
      gap: 16px;
      z-index: 9000;
      min-width: 220px;
      animation: slideIn 0.3s ease-out;
      overflow: hidden;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .war-timer.critical {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.4);
      animation: pulse-critical 2s infinite;
    }

    @keyframes pulse-critical {
      0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
      100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }

    .timer-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timer-icon svg {
      width: 24px;
      height: 24px;
    }

    .timer-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .timer-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.9;
      font-weight: 600;
    }

    .timer-value {
      font-size: 1.5rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(0,0,0,0.1);
    }

    .progress-fill {
      height: 100%;
      background: rgba(255,255,255,0.7);
      transition: width 1s linear;
    }
  `]
})
export class WarRoomTimerComponent implements OnInit, OnDestroy {
    @Input() deadline?: Date | string;
    @Input() warningHours = 24; // Show timer when less than X hours remaining

    timeLeft = signal(0); // in seconds
    private intervalId?: number;

    isVisible = computed(() => {
        const seconds = this.timeLeft();
        return seconds > 0 && seconds <= this.warningHours * 3600;
    });

    isCritical = computed(() => this.timeLeft() <= 3600); // 1 hour

    progressPercent = computed(() => {
        const seconds = this.timeLeft();
        const maxSeconds = this.warningHours * 3600;
        return Math.max(0, Math.min(100, (seconds / maxSeconds) * 100));
    });

    formattedTime = computed(() => {
        const seconds = this.timeLeft();
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    });

    ngOnInit(): void {
        this.updateTimeLeft();
        this.intervalId = window.setInterval(() => {
            this.updateTimeLeft();
        }, 1000);
    }

    ngOnDestroy(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    private updateTimeLeft(): void {
        if (!this.deadline) {
            this.timeLeft.set(0);
            return;
        }

        const deadlineDate = typeof this.deadline === 'string'
            ? new Date(this.deadline)
            : this.deadline;

        const now = new Date();
        const diffSeconds = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 1000));
        this.timeLeft.set(diffSeconds);
    }
}
