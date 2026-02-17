import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService, Review } from '../../core/data-access/review.service';
import { SessionService } from '../../core/auth/data-access/session.service';

@Component({
  selector: 'app-review-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="review-panel">
      <h3>Revisiones y Calificaciones</h3>

      <!-- SUMMARY -->
      <div class="rating-summary" *ngIf="reviews.length > 0">
        <div class="big-rating">{{ averageRating | number:'1.1-1' }}</div>
        <div class="stars">
          <span *ngFor="let s of [1,2,3,4,5]" [class.filled]="s <= averageRating">★</span>
        </div>
        <div class="count">{{ reviews.length }} evaluaciones</div>
      </div>

      <!-- REVIEWS LIST -->
      <div class="reviews-list">
        <div *ngIf="loading" class="loading">Cargando...</div>
        
        <div *ngFor="let review of reviews" class="review-card">
          <div class="review-header">
            <span class="reviewer-name">{{ review.reviewer?.name || 'Anónimo' }}</span>
            <span class="review-date">{{ review.createdAt | date:'mediumDate' }}</span>
          </div>
          <div class="review-stars">
            <span *ngFor="let s of [1,2,3,4,5]" [style.color]="s <= review.rating ? '#fbbf24' : '#e5e7eb'">★</span>
          </div>
          <p class="review-comment">{{ review.comments }}</p>
        </div>
      </div>

      <!-- ADD REVIEW FORM (Only Professor/Admin) -->
      <div class="add-review" *ngIf="canReview">
        <h4>Agregar Evaluación</h4>
        
        <div class="star-input">
          <span *ngFor="let s of [1,2,3,4,5]" 
                (click)="newRating = s"
                [class.selected]="s <= newRating">★</span>
        </div>

        <textarea 
          [(ngModel)]="newComment" 
          placeholder="Escribe un comentario..." 
          rows="3"
        ></textarea>

        <button class="btn-primary" (click)="submitReview()" [disabled]="submitting || newRating === 0">
          Publicar Evaluación
        </button>
      </div>
    </div>
  `,
  styles: [`
    .review-panel {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid var(--slate-200);
    }

    h3 { margin-top: 0; color: var(--slate-800); font-size: 1.1rem; }

    .rating-summary {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--slate-100);
    }

    .big-rating { font-size: 3rem; font-weight: 800; color: var(--slate-800); line-height: 1; }
    
    .stars { color: #e5e7eb; font-size: 1.5rem; margin: 0.5rem 0; }
    .stars .filled { color: #fbbf24; }
    
    .count { color: var(--slate-500); font-size: 0.9rem; }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .review-card {
      background: var(--slate-50);
      padding: 1rem;
      border-radius: 8px;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .reviewer-name { font-weight: 600; color: var(--slate-700); font-size: 0.9rem; }
    .review-date { color: var(--slate-400); font-size: 0.8rem; }
    
    .review-comment { margin: 0.5rem 0 0; color: var(--slate-600); font-size: 0.95rem; line-height: 1.5; }

    /* FORM */
    .add-review { border-top: 1px solid var(--slate-200); padding-top: 1.5rem; }
    h4 { margin: 0 0 1rem; color: var(--slate-700); }

    .star-input {
      font-size: 1.8rem;
      color: #e5e7eb;
      cursor: pointer;
      margin-bottom: 1rem;
    }
    .star-input .selected { color: #fbbf24; }

    textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--slate-300);
      border-radius: 6px;
      margin-bottom: 1rem;
      font-family: inherit;
      resize: vertical;
    }

    .btn-primary {
      background: var(--primary-600);
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
    }
    .btn-primary:disabled { background: var(--slate-300); cursor: not-allowed; }
  `]
})
export class ReviewPanelComponent implements OnInit {
  @Input() projectId!: string;
  reviews: Review[] = [];
  loading = false;
  submitting = false;

  newRating = 0;
  newComment = '';

  constructor(
    private reviewService: ReviewService,
    private SessionService: SessionService
  ) { }

  ngOnInit() {
    if (this.projectId) {
      this.loadReviews();
    }
  }

  get canReview(): boolean {
    const role = this.SessionService.getRole();
    return role === 'professor' || role === 'admin';
  }

  get averageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return sum / this.reviews.length;
  }

  loadReviews() {
    this.loading = true;
    this.reviewService.getProjectReviews(this.projectId).subscribe({
      next: (data) => {
        this.reviews = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  submitReview() {
    if (this.newRating === 0) return;

    this.submitting = true;
    this.reviewService.createReview(this.projectId, {
      rating: this.newRating,
      comments: this.newComment
    }).subscribe({
      next: (review) => {
        this.reviews.unshift(review); // Add to top
        this.newRating = 0;
        this.newComment = '';
        this.submitting = false;
      },
      error: () => {
        alert('Error al enviar evaluación');
        this.submitting = false;
      }
    });
  }
}

