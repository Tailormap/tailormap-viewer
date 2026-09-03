import { PanelResizerComponent } from './panel-resizer.component';
import { render, screen } from '@testing-library/angular';
import { describe, test, expect } from 'vitest';

describe('PanelResizerComponent', () => {

  test('should create', async () => {
    await render(PanelResizerComponent);
    expect(await screen.findByRole('separator')).toBeInTheDocument();
  });

});
