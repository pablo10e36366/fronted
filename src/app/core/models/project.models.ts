export type ProjectStatus =
  | 'activo'
  | 'completado'
  | 'archivado'
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'FINALIZADO';

export interface ProjectUserDto {
  id?: number;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  role?: string | null;
}

export interface ProjectDto {
  id: number;
  title: string;
  description?: string | null;
  status?: ProjectStatus | string | null;

  // fechas (tu backend puede mandar snake o camel)
  createdAt?: string | null;     // camelCase
  created_at?: string | null;    // snake_case

  // archivo (según tu backend / tabla)
  fileName?: string | null;
  filePath?: string | null;
  lastDownloadedAt?: string | null;

  // quién subió
  user?: ProjectUserDto | null;

  // si en algún punto usas url directa (opcional)
  fileUrl?: string | null;
}
