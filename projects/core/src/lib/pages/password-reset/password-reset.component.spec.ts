import { render, screen } from '@testing-library/angular';
import { PasswordResetComponent } from './password-reset.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AutoFocusDirective } from '@tailormap-viewer/shared';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PasswordResetComponent', () => {

  test('should render', async () => {
    await render(PasswordResetComponent, {
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [AutoFocusDirective],
    });
    expect(screen.getByText('Username')).toBeInTheDocument();
  });

});
