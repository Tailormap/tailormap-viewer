import { Injectable, inject } from '@angular/core';
import { map, take } from 'rxjs';
import { UploadInUseItem, UploadRemoveServiceModel } from '../../../shared/components';
import { Routes } from '../../../routes';
import { ApplicationModelHelper } from '../../helpers/application-model.helper';
import { ApplicationService } from '../../services/application.service';
import { BaseComponentTypeEnum, HeaderComponentConfigModel } from '@tailormap-viewer/api';

@Injectable()
export class HeaderComponentLogoRemoveService implements UploadRemoveServiceModel {
  private applicationService = inject(ApplicationService);


  public isUploadInUse$(uploadId: string) {
    return this.applicationService.getApplications$()
      .pipe(
        take(1),
        map(applications => {
          return applications
            .filter(application => {
              const config = (application.components || []).find(c => c.type === BaseComponentTypeEnum.HEADER);
              const headerConfig = config?.config as HeaderComponentConfigModel | undefined;
              return headerConfig?.logoFileId === uploadId;
            })
            .map<UploadInUseItem>(app => ({
              id: app.id,
              name: ApplicationModelHelper.getApplicationLabel(app),
              url: ApplicationModelHelper.getApplicationUrl(app, Routes.APPLICATION_DETAILS_COMPONENTS),
            }));
        }),
      );
  }

}
