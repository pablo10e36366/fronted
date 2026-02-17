import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { ProjectsComponent } from './projects';
import { ProjectService } from '../../services/project';
import { AuthService } from '../../services/auth';
import { MilestoneService } from '../../services/milestone.service';
import { EvidenceService } from '../../services/evidence.service';
import { AssignmentService } from '../../services/assignment.service';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;
  let projectServiceMock: jasmine.SpyObj<ProjectService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let milestoneServiceMock: jasmine.SpyObj<MilestoneService>;
  let evidenceServiceMock: jasmine.SpyObj<EvidenceService>;
  let assignmentServiceMock: jasmine.SpyObj<AssignmentService>;

  beforeEach(async () => {
    projectServiceMock = jasmine.createSpyObj<ProjectService>('ProjectService', [
      'getMyProjects',
      'searchProjects',
      'joinByCode',
      'downloadProjectFile',
      'deleteProject',
      'updateProject',
      'getProjectDetails',
      'getProjectTransitions',
      'changeProjectStatus',
      'forceStatusChange',
      'archiveProject',
      'uploadProject',
    ]);
    projectServiceMock.getMyProjects.and.returnValue(of([]));
    projectServiceMock.searchProjects.and.returnValue(of([]));

    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['getRole']);
    authServiceMock.getRole.and.returnValue('docente');

    milestoneServiceMock = jasmine.createSpyObj<MilestoneService>('MilestoneService', ['createMilestone']);
    evidenceServiceMock = jasmine.createSpyObj<EvidenceService>('EvidenceService', ['listProjectFiles']);
    assignmentServiceMock = jasmine.createSpyObj<AssignmentService>('AssignmentService', ['getByProject', 'review']);

    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [
        provideRouter([]),
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: MilestoneService, useValue: milestoneServiceMock },
        { provide: EvidenceService, useValue: evidenceServiceMock },
        { provide: AssignmentService, useValue: assignmentServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
