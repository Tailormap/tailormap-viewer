import { AppComponent } from './app.component';
import { render } from '@testing-library/angular';
import { RouterTestingModule } from '@angular/router/testing';

describe('AppComponent', () => {

  test('should create the app', async () => {
    const { fixture } = await render(AppComponent, {
      imports: [ RouterTestingModule ],
    });
    expect(fixture);
  });

});
