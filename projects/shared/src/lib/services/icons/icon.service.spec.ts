import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { IconService } from './icon.service';
import { ICON_SERVICE_ICON_LOCATION } from './icon-service.injection-token';

describe('IconService', () => {
  let spectator: SpectatorService<IconService>;
  const createService = createServiceFactory({
    service: IconService,
    providers: [
      { provide: ICON_SERVICE_ICON_LOCATION, useValue: '' },
    ],
  });

  beforeEach(() => spectator = createService());

  it('should...', () => {
    expect(spectator.service).toBeTruthy();
  });
});
