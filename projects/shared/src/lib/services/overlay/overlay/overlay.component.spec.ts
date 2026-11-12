import { describe, test, expect } from 'vitest';
import { OverlayComponent } from './overlay.component';
import { OverlayContent } from '../overlay-content';
import { OverlayRef } from '../overlay-ref';
import { of } from 'rxjs';
import { render, screen } from '@testing-library/angular';
import { Component, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({
  selector: 'tm-overlay-test-host',
  template: '<ng-template #content let-data>Overlay contents {{ data }}</ng-template>',
})
class OverlayTestHostComponent {
  public content = viewChild.required<TemplateRef<unknown>>('content');
}

describe('OverlayComponent', () => {

  test('should render', async () => {
    const overlayRefMock = {
      data: 'with data',
      close: () => {},
      afterClosed$: of({
        type: 'close',
        data: null,
      }),
    };
    const { fixture: hostFixture } = await render(OverlayTestHostComponent, {
      providers: [
        { provide: OverlayRef, useValue: overlayRefMock },
        { provide: OverlayContent, useFactory: () => new OverlayContent(hostFixture.componentInstance.content()) },
      ],
    });
    const fixture = TestBed.createComponent(OverlayComponent);
    fixture.detectChanges();
    expect(await screen.findByText('Overlay contents with data')).toBeInTheDocument();
  });

});
