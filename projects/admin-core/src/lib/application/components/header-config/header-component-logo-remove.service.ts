import { Injectable } from '@angular/core';
import { map, take } from 'rxjs';
import { UploadInUseItem, UploadRemoveServiceModel } from '../../../shared/components';
import { Routes } from '../../../routes';
import { ApplicationService } from '../../services/application.service';
import { BaseComponentTypeEnum, HeaderComponentConfigModel } from '@tailormap-viewer/api';

@Injectable()
export class HeaderComponentLogoRemoveService implements UploadRemoveServiceModel {

  constructor(
    private applicationService: ApplicationService,
  ) {
  }

  public isImageInUse$(imageId: string) {
    return this.applicationService.getApplications$()
      .pipe(
        take(1),
        map(applications => {
          return applications
            .filter(application => {
              const config = (application.components || []).find(c => c.type === BaseComponentTypeEnum.HEADER);
              const headerConfig = config?.config as HeaderComponentConfigModel | undefined;
              return headerConfig?.logoFileId === imageId;
            })
            .map<UploadInUseItem>(app => ({
              id: app.id,
              name: app.title || app.name,
              url: [
                '/admin',
                Routes.APPLICATION,
                Routes.APPLICATION_DETAILS.replace(':applicationId', app.id),
                Routes.APPLICATION_DETAILS_COMPONENTS,
              ].join('/'),
            }));
        }),
      );
  }

}
