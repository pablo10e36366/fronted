import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentSearchResultDto {
  id: string;
  title: string | null;
  mimeType: string | null;
  updatedAt: string;
  projectId: string;
  projectTitle: string | null;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Búsqueda global de documentos del usuario logeado.
   * Devuelve SOLO archivos subidos por el usuario.
   */
  searchMyDocuments(query: string): Observable<DocumentSearchResultDto[]> {
    return this.http.get<DocumentSearchResultDto[]>(`${this.apiUrl}/evidences/search`, {
      params: { q: query }
    });
  }
}
