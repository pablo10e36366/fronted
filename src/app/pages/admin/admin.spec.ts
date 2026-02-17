import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminComponent } from './admin';
import { AuthService } from '../../services/auth';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'getUserFromToken',
      'logout',
    ]);
    authServiceMock.getUserFromToken.and.returnValue({
      name: 'Admin User',
      role: 'admin',
    } as any);

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load current user from token', () => {
    expect(authServiceMock.getUserFromToken).toHaveBeenCalled();
    expect(component.currentUser?.name).toBe('Admin User');
  });

  it('should expose dashboard title by default', () => {
    expect(component.getTitle()).toBe('Dashboard General');
  });
});
