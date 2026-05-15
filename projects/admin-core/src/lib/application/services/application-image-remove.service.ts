import { Injectable, inject } from '@angular/core';
import { UploadInUseItem, UploadRemoveServiceModel } from '../../shared/components/select-upload/models/upload-remove-service.model';
import { map, take } from 'rxjs';
import { ApplicationService } from './application.service';
import { Routes } from '../../routes';

@Injectable({
  providedIn: 'root',
})
export class ApplicationImageRemoveService implements UploadRemoveServiceModel {
  private applicationService = inject(ApplicationService);


  public isImageInUse$(imageId: string) {
    return this.applicationService.getApplications$()
      .pipe(
        take(1),
        map(applications => {
          return applications
            .filter(application => application.styling?.logo === imageId)
            .map<UploadInUseItem>(app => ({
              id: app.id,
              name: app.title || app.name,
              url: [
                '/admin',
                Routes.APPLICATION,
                Routes.APPLICATION_DETAILS.replace(':applicationId', app.id),
                Routes.APPLICATION_DETAILS_STYLING,
              ].join('/'),
            }));
        }),
      );
  }

}
