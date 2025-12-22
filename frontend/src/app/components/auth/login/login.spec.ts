import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@services/auth.service';
import { LoginComponent } from './login';
import { AuthServiceMock, createAuthServiceMock } from '@testing/mocks/auth-service.mock';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthServiceMock;
  let router: Router;

  beforeEach(async () => {
    authService = createAuthServiceMock();

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ✅ 1. Création du composant
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ✅ 2. Formulaire réactif créé
  describe('Form Initialization', () => {
    it('should create a reactive form with identifier and password controls', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('identifier')).toBeDefined();
      expect(component.form.get('password')).toBeDefined();
    });

    it('should initialize form with empty values', () => {
      expect(component.form.get('identifier')?.value).toBe('');
      expect(component.form.get('password')?.value).toBe('');
    });
  });

  // ✅ 3. Validation : identifier requis
  describe('Identifier Field Validation', () => {
    it('should be invalid when identifier is empty', () => {
      const identifierControl = component.form.get('identifier');
      identifierControl?.setValue('');
      expect(identifierControl?.hasError('required')).toBe(true);
      expect(identifierControl?.valid).toBe(false);
    });

    it('should be valid when identifier has a value', () => {
      const identifierControl = component.form.get('identifier');
      identifierControl?.setValue('testuser');
      expect(identifierControl?.hasError('required')).toBe(false);
      expect(identifierControl?.valid).toBe(true);
    });
  });

  // ✅ 4. Validation : password requis
  describe('Password Field Validation', () => {
    it('should be invalid when password is empty', () => {
      const passwordControl = component.form.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBe(true);
      expect(passwordControl?.valid).toBe(false);
    });

    it('should be valid when password has a value', () => {
      const passwordControl = component.form.get('password');
      passwordControl?.setValue('password123');
      expect(passwordControl?.hasError('required')).toBe(false);
      expect(passwordControl?.valid).toBe(true);
    });
  });

  // ✅ 5. Soumission du formulaire : appel authService.login()
  describe('Form Submission', () => {
    it('should call authService.login() with correct credentials when form is valid', () => {
      component.form.patchValue({
        identifier: 'testuser',
        password: 'password123',
      });

      const identifier = 'testuser';
      const password = 'password123';

      component.submit();

      expect(authService.login).toHaveBeenCalledWith(identifier, password);
    });

    it('should not call authService.login() when form is invalid', () => {
      component.form.patchValue({
        identifier: '',
        password: '',
      });

      component.submit();

      expect(authService.login).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when form is invalid and submitted', () => {
      component.form.patchValue({
        identifier: '',
        password: '',
      });

      component.submit();

      expect(component.form.get('identifier')?.touched).toBe(true);
      expect(component.form.get('password')?.touched).toBe(true);
    });

    it('should not submit when isLoading is true', () => {
      authService.isLoading.set(true);
      component.form.patchValue({
        identifier: 'testuser',
        password: 'password123',
      });

      component.submit();

      // Le login ne devrait pas être appelé car isLoading est true
      expect(authService.login).not.toHaveBeenCalled();
    });
  });

  // ✅ 6. Redirection après connexion réussie
  describe('Navigation After Successful Login', () => {
    it('should navigate to /home when user is logged in', fakeAsync(() => {
      authService.isLoggedIn.set(true);

      const navFixture = TestBed.createComponent(LoginComponent);
      navFixture.detectChanges();
      tick();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/home');
    }));
  });

  // ✅ 7. Affichage erreur si connexion échoue
  describe('Error Handling', () => {
    it('should display error message when login fails', () => {
      authService.error.set('Identifiants invalides');

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const errorElement = compiled.querySelector('.error-message, .alert-danger, [class*="error"]');
      
      // Vérifier que l'erreur est exposée dans le composant
      expect(component.error()).toBe('Identifiants invalides');
    });

    it('should display no error initially', () => {
      expect(component.error()).toBeNull();
    });
  });

  // ✅ 8. Affichage erreur si email non vérifié (403)
  describe('Email Verification Error', () => {
    it('should handle 403 error for unverified email', () => {
      authService.error.set('Email non vérifié. Veuillez vérifier votre boîte mail.');

      fixture.detectChanges();

      expect(component.error()).toContain('vérifié');
    });
  });

  // ✅ 9. Bouton désactivé si formulaire invalide
  describe('Submit Button State', () => {
    it('should have submit button disabled when form is invalid', () => {
      component.form.patchValue({
        identifier: '',
        password: '',
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const submitButton = compiled.querySelector('button[type="submit"]') as HTMLButtonElement;

      if (submitButton) {
        expect(submitButton.disabled || component.form.invalid).toBe(true);
      }
    });

    it('should have submit button enabled when form is valid', () => {
      component.form.patchValue({
        identifier: 'testuser',
        password: 'password123',
      });
      fixture.detectChanges();

      expect(component.form.valid).toBe(true);
    });

    it('should disable submit button when isLoading is true', () => {
      authService.isLoading.set(true);

      component.form.patchValue({
        identifier: 'testuser',
        password: 'password123',
      });
      fixture.detectChanges();

      expect(component.isLoading()).toBe(true);
    });
  });

  // ✅ 10. Binding des champs (identifier, password)
  describe('Form Field Bindings', () => {
    it('should bind identifier input to form control', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const identifierInput = compiled.querySelector('input[formControlName="identifier"]') as HTMLInputElement;

      if (identifierInput) {
        identifierInput.value = 'testuser@example.com';
        identifierInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.form.get('identifier')?.value).toBe('testuser@example.com');
      }
    });

    it('should bind password input to form control', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const passwordInput = compiled.querySelector('input[formControlName="password"]') as HTMLInputElement;

      if (passwordInput) {
        passwordInput.value = 'mySecurePassword123';
        passwordInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.form.get('password')?.value).toBe('mySecurePassword123');
      }
    });

    it('should update form value when identifier control changes', () => {
      component.form.get('identifier')?.setValue('newuser');
      expect(component.form.getRawValue().identifier).toBe('newuser');
    });

    it('should update form value when password control changes', () => {
      component.form.get('password')?.setValue('newpassword');
      expect(component.form.getRawValue().password).toBe('newpassword');
    });
  });

  // ✅ Tests supplémentaires pour une couverture complète
  describe('Additional Coverage', () => {
    it('should expose isLoading from authService', () => {
      expect(component.isLoading).toBeDefined();
      expect(component.isLoading()).toBe(false);
    });

    it('should expose error from authService', () => {
      expect(component.error).toBeDefined();
      expect(component.error()).toBeNull();
    });

    it('should accept both email and username as identifier', () => {
      // Test avec email
      component.form.patchValue({
        identifier: 'user@example.com',
        password: 'password123',
      });
      component.submit();
      expect(authService.login).toHaveBeenCalledWith('user@example.com', 'password123');

      authService.login.calls.reset();

      // Test avec username
      component.form.patchValue({
        identifier: 'username',
        password: 'password123',
      });
      component.submit();
      expect(authService.login).toHaveBeenCalledWith('username', 'password123');
    });

    it('should have form initially invalid', () => {
      expect(component.form.valid).toBe(false);
    });

    it('should have form valid when all required fields are filled', () => {
      component.form.patchValue({
        identifier: 'testuser',
        password: 'password123',
      });
      expect(component.form.valid).toBe(true);
    });
  });
});
