import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../core/auth/data-access/session.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class RegisterComponent {
  step: 'methods' | 'email' | 'phone' | 'google' = 'methods';

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  phone = '';

  googleEmail = '';
  googleCode = '';
  googlePassword = '';
  googleConfirmPassword = '';
  googleStage: 'enter_email' | 'enter_code' = 'enter_email';

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: SessionService, private router: Router) {}

  selectMethod(method: 'google' | 'apple' | 'phone' | 'email') {
    this.errorMessage = '';
    this.successMessage = '';

    if (method === 'email') {
      this.step = 'email';
      return;
    }

    if (method === 'google') {
      this.step = 'google';
      this.googleStage = 'enter_email';
      this.googleEmail = '';
      this.googleCode = '';
      this.googlePassword = '';
      this.googleConfirmPassword = '';
      return;
    }

    if (method === 'phone') {
      this.step = 'phone';
      return;
    }

    // Google / Apple todavía no están configurados (requieren OAuth)
    this.step = 'methods';
    this.errorMessage = 'Registro con Apple aún no está disponible. Usa correo o Google por ahora.';
  }

  backToMethods() {
    this.step = 'methods';
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit() {
    if (this.step !== 'email') return;

    if (!this.name.trim() || !this.email.trim() || !this.password.trim() || !this.confirmPassword.trim()) {
      this.errorMessage = 'Complete todos los campos';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.register(this.name, this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Usuario registrado correctamente';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = this.toRegisterErrorMessage(err);
      },
    });
  }

  startGoogle() {
    if (this.step !== 'google') return;
    const email = this.googleEmail.trim();
    if (!email) {
      this.errorMessage = 'Ingresa tu correo de Gmail';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.startGoogleOtp(email).subscribe({
      next: () => {
        this.loading = false;
        this.googleStage = 'enter_code';
        this.successMessage = 'Te enviamos un código de 6 dígitos a tu correo';
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = this.toRegisterErrorMessage(err);
      },
    });
  }

  verifyGoogle() {
    if (this.step !== 'google') return;
    const email = this.googleEmail.trim();
    const code = this.googleCode.trim();
    const password = this.googlePassword.trim();
    const confirmPassword = this.googleConfirmPassword.trim();
    if (!email) {
      this.errorMessage = 'Ingresa tu correo de Gmail';
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      this.errorMessage = 'Ingresa el código de 6 dígitos';
      return;
    }
    if (password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.verifyGoogleOtp(email, code, password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Cuenta verificada. Bienvenido a ProManage';
        // La navegación se hace en SessionService al guardar el token
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = this.toRegisterErrorMessage(err);
      },
    });
  }

  private toRegisterErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const message =
        (typeof err.error?.message === 'string' && err.error.message) ||
        (typeof err.error?.error?.message === 'string' && err.error.error.message);

      if (err.status === 409) return message || 'Este correo ya está registrado';
      if (err.status === 400) return message || 'Datos inválidos. Revisa los campos.';
      if (err.status === 429) return message || 'Espera un momento e intenta nuevamente.';
      if (err.status === 0) return 'No se pudo conectar con el servidor';

      return message || 'Error al registrar usuario';
    }

    return 'Error al registrar usuario';
  }
}

