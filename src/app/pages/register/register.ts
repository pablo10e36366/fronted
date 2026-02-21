import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../core/auth/data-access/session.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class RegisterComponent implements OnDestroy {
  step: 'methods' | 'email' | 'phone' | 'google' = 'methods';
  emailStage: 'enter_data' | 'enter_pin' = 'enter_data';

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  emailCode = '';
  phone = '';

  googleEmail = '';
  googleCode = '';
  googlePassword = '';
  googleConfirmPassword = '';
  googleStage: 'enter_email' | 'enter_code' = 'enter_email';

  loading = false;
  errorMessage = '';
  successMessage = '';
  emailResendCooldown = 0;
  private emailResendTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private auth: SessionService) {}

  selectMethod(method: 'google' | 'apple' | 'phone' | 'email') {
    this.errorMessage = '';
    this.successMessage = '';

    if (method === 'email') {
      this.step = 'email';
      this.emailStage = 'enter_data';
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
    this.emailStage = 'enter_data';
    this.errorMessage = '';
    this.successMessage = '';
    this.clearEmailResendTimer();
    this.emailResendCooldown = 0;
  }

  onSubmit() {
    if (this.step !== 'email') return;
    if (this.emailStage !== 'enter_data') return;

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
      next: (res) => {
        this.loading = false;
        this.emailStage = 'enter_pin';
        this.startEmailResendCooldown(60);
        this.successMessage =
          res?.message ||
          'Te enviamos un PIN por correo. Ingresalo para activar tu cuenta.';
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = this.toRegisterErrorMessage(err);
      },
    });
  }

  verifyEmailPin() {
    if (this.step !== 'email' || this.emailStage !== 'enter_pin') return;

    const email = this.email.trim();
    const code = this.emailCode.trim();

    if (!email) {
      this.errorMessage = 'Ingresa tu correo';
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      this.errorMessage = 'Ingresa el PIN de 6 digitos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.verifyRegistration(email, code).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Cuenta verificada. Bienvenido a ProManage';
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = this.toRegisterErrorMessage(err);
      },
    });
  }

  resendEmailPin() {
    if (this.step !== 'email' || this.emailStage !== 'enter_pin') return;

    const email = this.email.trim();
    if (!email) {
      this.errorMessage = 'Ingresa tu correo';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.resendRegistrationPin(email).subscribe({
      next: (res) => {
        this.loading = false;
        this.startEmailResendCooldown(res?.cooldown_seconds || 60);
        this.successMessage =
          res?.message || 'Te enviamos un nuevo PIN de verificacion a tu correo';
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = this.toRegisterErrorMessage(err);
      },
    });
  }

  ngOnDestroy(): void {
    this.clearEmailResendTimer();
  }

  private startEmailResendCooldown(seconds: number) {
    this.clearEmailResendTimer();
    this.emailResendCooldown = Math.max(0, Math.floor(seconds || 0));
    if (this.emailResendCooldown <= 0) return;

    this.emailResendTimer = setInterval(() => {
      this.emailResendCooldown = Math.max(0, this.emailResendCooldown - 1);
      if (this.emailResendCooldown === 0) {
        this.clearEmailResendTimer();
      }
    }, 1000);
  }

  private clearEmailResendTimer() {
    if (this.emailResendTimer) {
      clearInterval(this.emailResendTimer);
      this.emailResendTimer = null;
    }
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

