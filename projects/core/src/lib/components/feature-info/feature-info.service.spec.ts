import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { FeatureInfoService } from './feature-info.service';

describe('FeatureInfoService', () => {

    let spectator: SpectatorService<FeatureInfoService>;
    const createService = createServiceFactory(FeatureInfoService);

    beforeEach(() => spectator = createService());

    test('should...', () => {
        expect(spectator.service).toBeTruthy();
    });

});
