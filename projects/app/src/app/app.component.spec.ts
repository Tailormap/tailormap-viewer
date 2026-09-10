import { describe, test, expect } from 'vitest';
import { AppComponent } from './app.component';
import { render } from '@testing-library/angular';
import { RouterModule } from '@angular/router';

describe('AppComponent', () => {

  test('should create the app', async () => {
    const { fixture } = await render(AppComponent, {
      imports: [RouterModule.forRoot([])],
    });
    expect(fixture);
  });

});
