import { render, screen } from '@testing-library/angular';
import { InfoComponent } from './info.component';
import { provideMockStore } from '@ngrx/store/testing';
import { MenubarService } from '../../menubar';
import { LoadingStateEnum, SharedDirectivesModule, SharedModule } from '@tailormap-viewer/shared';
import { BaseComponentTypeEnum, ComponentModel, InfoComponentConfigModel } from '@tailormap-viewer/api';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { of } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CoreSharedModule } from '../../../shared';
import { selectComponentsConfig, selectViewerLoadingState } from '../../../state';

describe('InfoComponent', () => {
  test('should render template content', async () => {
    const mockMenubarService = {
      isComponentVisible$: jest.fn(() => of(true)),
      registerComponent: jest.fn(),
      toggleActiveComponent: jest.fn(),
    };

    const mockConfig: ComponentModel<InfoComponentConfigModel> = {
      type: BaseComponentTypeEnum.INFO,
      config: {
        enabled: true,
        openOnStartup: true,
        templateContent: 'Test content',
      },
    };

    await render(InfoComponent, {
      imports: [
        SharedModule,
        CoreSharedModule,
        NoopAnimationsModule,
        SharedDirectivesModule,
        MatIconTestingModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        provideMockStore({ selectors: [
            { selector: selectComponentsConfig, value: [mockConfig] },
            { selector: selectViewerLoadingState, value: LoadingStateEnum.LOADED },
          ],
        }),
        { provide: MenubarService, useValue: mockMenubarService },
      ],
    });
    expect(mockMenubarService.toggleActiveComponent).toHaveBeenCalled();
    expect(screen.getByText('', { selector: '.template' })).toBeInTheDocument();
  });
});
