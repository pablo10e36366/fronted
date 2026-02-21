import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/data-access/session.service';

@Component({
  standalone: true,
  selector: 'app-register-verify',
  templateUrl: './register-verify.html',
  styleUrls: ['./register-verify.css'],
  imports: [CommonModule, RouterLink],
})
export class RegisterVerifyComponent implements OnInit {
  loading = true;
  success = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    const email = String(this.route.snapshot.queryParamMap.get('email') || '').trim();
    const code = String(this.route.snapshot.queryParamMap.get('code') || '').trim();
    if (!email || !code) {
      this.loading = false;
      this.errorMessage = 'Enlace invalido. Verifica tu cuenta desde la pantalla de registro con tu PIN.';
      return;
    }

    this.sessionService.verifyRegistration(email, code).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err: unknown) => {
        this.loading = false;
        this.errorMessage = this.toErrorMessage(err);
      },
    });
  }

  private toErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const message =
        (typeof err.error?.message === 'string' && err.error.message) ||
        (typeof err.error?.error?.message === 'string' && err.error.error.message);
      return message || 'No se pudo verificar tu cuenta.';
    }
    return 'No se pudo verificar tu cuenta.';
  }
}
