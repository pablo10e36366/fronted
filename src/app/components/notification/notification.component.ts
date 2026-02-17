import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../core/data-access/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="notification"
      class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-opacity duration-300"
      [ngClass]="{
        'bg-green-100 text-green-800 border border-green-300': notification.type === 'success',
        'bg-red-100 text-red-800 border border-red-300': notification.type === 'error',
        'bg-yellow-100 text-yellow-800 border border-yellow-300': notification.type === 'warning'
      }"
    >
      <div class="flex items-center justify-between">
        <span class="font-medium">{{ notification.message }}</span>
        <button
          (click)="clear()"
          class="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class NotificationComponent implements OnInit, OnDestroy {
  notification: Notification | null = null;
  private subscription: Subscription | null = null;
  private timeoutId: any = null;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.notification$.subscribe((notification) => {
      this.notification = notification;
      this.autoClear();
    });
  }

  autoClear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.clear();
    }, 5000);
  }

  clear() {
    this.notification = null;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}
