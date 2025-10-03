import { inject, Injectable } from '@angular/core';
import { map, take } from 'rxjs';
import { OIDCConfigurationService } from './oidc-configuration.service';
import { UploadInUseItem, UploadRemoveServiceModel } from '../../shared/components';


@Injectable({
  providedIn: 'root',
})
export class OidcImageRemoveService implements UploadRemoveServiceModel {
  private oidcConfigurationService = inject(OIDCConfigurationService);


  public isImageInUse$(imageId: string) {
    return this.oidcConfigurationService.getOIDCConfigurations$()
      .pipe(
        take(1),
        map(configurations => {
          return configurations
            .filter(configuration => configuration.image === imageId)
            .map<UploadInUseItem>(configuration => ({
              id: configuration.id.toString(),
              name: configuration.name,
              url: `/login/${configuration.id}`,
            }));
        }),
      );
  }

}
