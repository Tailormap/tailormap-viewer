import { TocComponent } from './toc.component';
import { createComponentFactory, Spectator } from '@ngneat/spectator';
import { getApplicationServiceMockProvider } from '@tailormap/testing-utilities';
import { MenubarModule } from '../../menubar';
import { ApplicationTreeNodeComponent } from '../../shared';
import { OverlayPanelComponent, SharedModule } from '@tailormap/shared';

describe('TocComponent', () => {

  let spectator: Spectator<TocComponent>;
  const createComponent = createComponentFactory({
    component: TocComponent,
    declarations: [
      ApplicationTreeNodeComponent,
      OverlayPanelComponent,
    ],
    providers: [
      getApplicationServiceMockProvider(),
    ],
    imports: [
      MenubarModule,
      SharedModule,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });


  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
