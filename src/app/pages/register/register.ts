import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrl: './register.css',
  imports: [CommonModule, FormsModule]
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  message = '';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.auth.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.message = 'Usuario creado correctamente';
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      error: () => {
        this.error = 'Error al registrar usuario';
      }
    });
  }
}
