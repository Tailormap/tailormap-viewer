
import { NavigationErrorRouterService } from './navigation-error-router.service';

describe('NavigationErrorRouterService', () => {

  test('should return URL to specific app when error navigating without locale ID', () => {
    expect(NavigationErrorRouterService.getErrorNavigationUrl('/some-base/app/some-app', '/some-base/en/', 'en')).toBe('/app/some-app');
  });

});
