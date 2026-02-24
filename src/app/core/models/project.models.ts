export type ProjectStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'PUBLISHED';

export type EvidenceType = 'LINK' | 'TEXT' | 'FILE';

export type EvidenceStatus = 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface ProjectDto {
  id: string;
  title: string;
  description?: string | null;
  status?: ProjectStatus | string | null;
  isArchived?: boolean | null;
  archivedAt?: string | null;
  archivedBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
  fileUrl?: string | null;
  deadline?: string | null;
  owner?: { name: string; email: string };
  filename?: string | null;
}
export type Project = ProjectDto;

// Repository View DTO interfaces
export interface RepositoryHeaderDto {
  title: string;
  description: string;
  owner: string;
  avatarUrl: string;
  status: ProjectStatus;
  tags: string[];
}

export interface RepositoryStatsDto {
  commits: number;
  contributors: number;
  lastUpdate: string;
}

export interface RepositoryFileTreeItemDto {
  name: string;
  type: 'file' | 'dir';
  message: string;
  date: string;
}

export interface RepositoryViewDto {
  header: RepositoryHeaderDto;
  stats: RepositoryStatsDto;
  fileTree: RepositoryFileTreeItemDto[];
  readme: string;
}

// Evidence DTOs
export interface CreateEvidenceDto {
  title: string;
  type: EvidenceType;
  content: string;
  projectId: string;
  milestoneId?: string;
  description?: string | null;
  url?: string;
  parentId?: string | null;
  assignmentId?: string;
  contentBlob?: string | null;
  mimeType?: string | null;
}

export interface EvidenceDto {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  url?: string | null;
  type: EvidenceType;
  status: EvidenceStatus;
  feedback?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    name: string;
    email: string;
  };
  // New File System fields
  isFolder: boolean;
  contentBlob?: string | null;
  parentId?: string | null;
  mimeType?: string | null;
}
