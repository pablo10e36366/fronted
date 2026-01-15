export type ProjectStatus = 'activo' | 'completado' | 'archivado';

export interface ProjectDto {
  id: number;
  title: string;
  description?: string | null;
  status?: ProjectStatus | string | null;

  // según tu backend:
  createdAt?: string;    // camelCase
  created_at?: string;   // snake_case

  fileUrl?: string | null;
}
