import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { SearchService, DocumentSearchResultDto } from '../../core/data-access/search.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="search-container">
      <div class="input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          [formControl]="searchControl"
          type="text"
          placeholder="Buscar documentos (ej. 'informe', 'docx', 'matematicas')..."
          (focus)="showSuggestions = true"
          (blur)="hideSuggestionsDelayed()"
        />
      </div>

      <!-- Sugerencias / Chips -->
      <div class="suggestions-panel" *ngIf="showSuggestions && !results.length">
        <div class="chip-group">
          <span class="chip-label">Sugerencias:</span>
          <button class="chip" (click)="applySearch('pdf')">PDF</button>
          <button class="chip" (click)="applySearch('docx')">DOCX</button>
          <button class="chip" (click)="applySearch('ppt')">PPT</button>
        </div>
      </div>

      <!-- Resultados Dropdown -->
      <div class="results-dropdown" *ngIf="results.length > 0">
        <div 
          *ngFor="let doc of results" 
          class="result-item"
          (click)="goToEvidence(doc.projectId, doc.id)">
          <div class="result-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          </div>
          <div class="result-info">
            <span class="result-title">{{ doc.title || 'Documento' }}</span>
            <span class="result-meta">{{ doc.projectTitle || 'Proyecto' }} - {{ doc.updatedAt | date:'shortDate' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      position: relative;
      width: 100%;
      max-width: 600px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      width: 18px;
      height: 18px;
      color: #667eea;
      pointer-events: none;
      transition: color 0.2s;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 2px solid rgba(102, 126, 234, 0.2);
      border-radius: 12px;
      font-size: 0.9rem;
      background: rgba(248, 250, 252, 0.8);
      color: #1e293b;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    input:focus {
      background: white;
      border-color: #667eea;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
    }

    input::placeholder {
      color: #94a3b8;
    }

    .suggestions-panel {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid rgba(102, 126, 234, 0.1);
      border-radius: 16px;
      padding: 1rem;
      z-index: 10;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.15);
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .chip-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .chip-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-right: 0.25rem;
      font-weight: 600;
    }

    .chip {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
      border: 1px solid rgba(102, 126, 234, 0.2);
      padding: 0.375rem 0.875rem;
      border-radius: 20px;
      font-size: 0.75rem;
      color: #667eea;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
    }

    .chip:hover {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: transparent;
      transform: translateY(-1px);
    }

    .results-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: white;
      border: 1px solid rgba(102, 126, 234, 0.1);
      border-radius: 16px;
      max-height: 360px;
      overflow-y: auto;
      z-index: 20;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.15);
      animation: fadeIn 0.2s ease-out;
    }

    .result-item {
      display: flex;
      align-items: center;
      padding: 0.875rem 1rem;
      cursor: pointer;
      border-bottom: 1px solid rgba(102, 126, 234, 0.05);
      transition: all 0.2s;
    }

    .result-item:last-child {
      border-bottom: none;
    }

    .result-item:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.04) 0%, rgba(118, 75, 162, 0.02) 100%);
    }

    .result-icon {
      margin-right: 0.875rem;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      color: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .result-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .result-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
    }

    .result-meta {
      font-size: 0.75rem;
      color: #64748b;
    }
  `]
})
export class SearchBarComponent implements OnInit, OnDestroy {
  searchControl = new FormControl('');
  results: DocumentSearchResultDto[] = [];
  showSuggestions = false;
  private searchSub?: Subscription;

  constructor(
    private searchService: SearchService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(term => (term || '').length > 1),
      switchMap(term => this.searchService.searchMyDocuments(term || ''))
    ).subscribe({
      next: (results) => {
        this.results = results;
      },
      error: (err) => console.error('Search error', err)
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  applySearch(term: string): void {
    this.searchControl.setValue(term);
  }

  goToEvidence(projectId: string, evidenceId: string): void {
    this.router.navigate(['/projects', projectId, 'evidence', evidenceId]);
    this.showSuggestions = false;
    this.results = [];
    this.searchControl.setValue('');
  }

  hideSuggestionsDelayed(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.results = [];
    }, 200);
  }
}
