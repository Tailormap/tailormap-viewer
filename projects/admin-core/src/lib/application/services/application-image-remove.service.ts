import { Injectable, inject } from '@angular/core';
import { UploadInUseItem, UploadRemoveServiceModel } from '../../shared/components/select-upload/models/upload-remove-service.model';
import { map, take } from 'rxjs';
import { ApplicationService } from './application.service';
import { Routes } from '../../routes';
import { ApplicationModelHelper } from '../helpers/application-model.helper';

@Injectable({
  providedIn: 'root',
})
export class ApplicationImageRemoveService implements UploadRemoveServiceModel {
  private applicationService = inject(ApplicationService);


  public isUploadInUse$(uploadId: string) {
    return this.applicationService.getApplications$()
      .pipe(
        take(1),
        map(applications => {
          return applications
            .filter(application => application.styling?.logo === uploadId)
            .map<UploadInUseItem>(app => ({
              id: app.id,
              name: ApplicationModelHelper.getApplicationLabel(app),
              url: ApplicationModelHelper.getApplicationUrl(app, Routes.APPLICATION_DETAILS_STYLING),
            }));
        }),
      );
  }

}
