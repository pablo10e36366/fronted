import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProjectService } from './project';
import { NotificationService } from './notification.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let notificationServiceMock: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    notificationServiceMock = jasmine.createSpyObj<NotificationService>('NotificationService', [
      'showError',
      'showSuccess',
      'showWarning',
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: NotificationService, useValue: notificationServiceMock }],
    });
    service = TestBed.inject(ProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
