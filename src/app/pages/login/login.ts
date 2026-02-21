import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SessionService } from '../../core/auth/data-access/session.service';
import { NotificationService } from '../../core/data-access/notification.service';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  loading = false;

  constructor(
    private SessionService: SessionService,
    private notificationService: NotificationService
  ) { }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.email.trim() || !this.password.trim()) {
      this.notificationService.showError('Complete todos los campos');
      return;
    }

    this.loading = true;

    this.SessionService.login(this.email, this.password).subscribe({
      next: () => {},
      error: (err) => {
        this.loading = false;
        const message = typeof err === 'string' ? err : (err?.message || 'Error de autenticación');
        this.notificationService.showError(message);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}

