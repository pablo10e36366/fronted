import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './components/notification/notification.component';
import { ThemeService } from './core/data-access/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('fronted');

  constructor(private readonly themeService: ThemeService) {
    // Inicializa el tema global al arrancar la app.
    void this.themeService;
  }
}
