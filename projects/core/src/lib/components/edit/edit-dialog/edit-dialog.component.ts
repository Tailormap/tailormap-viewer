import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmDialogService, CssHelper } from '@tailormap-viewer/shared';
import { from, mergeMap, Observable, tap } from 'rxjs';
import {
  selectEditCreateNewOrCopyFeatureActive, selectEditDialogCollapsed, selectEditDialogVisible, selectEditFeatures, selectEditMapCoordinates,
  selectEditOpenedFromFeatureInfo, selectLoadingEditFeatures, selectSelectedEditFeature,
} from '../state/edit.selectors';
import { combineLatest, concatMap, filter, map, of, switchMap, take } from 'rxjs';
import { editNewlyCreatedFeature, expandCollapseEditDialog, hideEditDialog, setEditActive, updateEditFeature } from '../state/edit.actions';
import {
  AttachmentMetadataModel, BaseComponentTypeEnum, EditConfigModel, FeatureModelAttributes, UniqueValuesService,
} from '@tailormap-viewer/api';
import { ApplicationLayerService } from '../../../map/services/application-layer.service';
import { FeatureWithMetadataModel } from '../models/feature-with-metadata.model';
import { EditFeatureService } from '../services/edit-feature.service';
import { selectViewerId } from '../../../state/core.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditMapToolService } from '../services/edit-map-tool.service';
import { FeatureUpdatedService } from '../../../services/feature-updated.service';
import { hideFeatureInfoDialog, reopenFeatureInfoDialog } from '../../feature-info/state/feature-info.actions';
import { ComponentConfigHelper } from '../../../shared/helpers/component-config.helper';
import { withLatestFrom } from 'rxjs/operators';
import { activateTool } from '../../toolbar/state/toolbar.actions';
import { ToolbarComponentEnum } from '../../toolbar/models/toolbar-component.enum';

@Component({
  selector: 'tm-edit-dialog',
  templateUrl: './edit-dialog.component.html',
  styleUrls: ['./edit-dialog.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EditDialogComponent {
  private store$ = inject(Store);
  private editMapToolService = inject(EditMapToolService);
  private applicationLayerService = inject(ApplicationLayerService);
  private editFeatureService = inject(EditFeatureService);
  private destroyRef = inject(DestroyRef);
  private featureUpdatedService = inject(FeatureUpdatedService);
  private confirmService = inject(ConfirmDialogService);
  private uniqueValuesService = inject(UniqueValuesService);
  private cdr = inject(ChangeDetectorRef);


  public dialogOpen$;
  public dialogCollapsed$;
  public isCreateFeature$;
  public currentFeature$;
  public dialogTitle$;
  public layerDetails$;
  public selectableFeature$;

  public creatingSavingFeature = signal(false);
  public removingFeature = signal(false);

  public panelWidth = 300;
  private bodyMargin = CssHelper.getCssVariableValueNumeric('--body-margin');
  public panelWidthMargin = CssHelper.getCssVariableValueNumeric('--menubar-width') + (this.bodyMargin * 2);

  public loadingEditFeatureInfo$;
  public editCoordinates$;

  public updatedAttributes: FeatureModelAttributes | null = null;

  public newAttachments = new Map<string, File[]>();
  private deletedAttachmentIds = new Set<string>();
  public attachments$: Observable<Map<string, Array<AttachmentMetadataModel & { url: string }>>>;

  public formValid: boolean = false;

  private clearCacheValuesAfterSave = new Set<string>();
  private closeDialogAfterAddingFeature = false;

  constructor() {
    this.dialogOpen$ = this.store$.select(selectEditDialogVisible);
    this.dialogCollapsed$ = this.store$.select(selectEditDialogCollapsed);
    this.loadingEditFeatureInfo$ = this.store$.select(selectLoadingEditFeatures);
    this.editCoordinates$ = this.store$.select(selectEditMapCoordinates);
    this.currentFeature$ = this.store$.select(selectSelectedEditFeature);
    this.dialogTitle$ = this.currentFeature$.pipe(
      map(feature => feature?.feature.__fid !== 'new'
        ? $localize `:@@core.edit.edit:Edit feature`
        : $localize `:@@core.edit.add-new-feature:Add new feature`));
    this.isCreateFeature$ = this.store$.select(selectEditCreateNewOrCopyFeatureActive);
    this.selectableFeature$ = combineLatest([
      this.store$.select(selectEditFeatures),
      this.store$.select(selectSelectedEditFeature),
    ]).pipe(
        map(([ features, selectedFeature ]) => {
          if (selectedFeature) {
            return [];
          }
          return features;
        }),
    );
    this.layerDetails$ = this.currentFeature$
      .pipe(
        filter((feature): feature is FeatureWithMetadataModel => !!feature),
        switchMap(feature => {
          return this.applicationLayerService.getLayerDetails$(feature.feature.layerId);
        }),
      );
    this.currentFeature$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store$.dispatch(hideFeatureInfoDialog());
        this.resetChanges();
      });
    this.attachments$ = this.currentFeature$.pipe(
      switchMap(feature => {
        if (!feature || feature.feature.__fid === 'new') {
          return of(new Map());
        } else {
          let viewerId: string;
          return this.store$.select(selectViewerId)
            .pipe(
              take(1),
              tap(id => viewerId = id!),
              switchMap(() => this.editFeatureService.listAttachments$(viewerId, feature.feature.layerId, feature.feature.__fid)),
              map(attachments => attachments.map(attachment => ({
                    ...attachment,
                    url: this.editFeatureService.getAttachmentUrl(viewerId, feature.feature.layerId, attachment.attachmentId),
                })).reduce((attachmentsByAttributeName, attachment) => {
                  if (attachmentsByAttributeName.has(attachment.attributeName)) {
                    attachmentsByAttributeName.get(attachment.attributeName)?.push(attachment);
                  } else {
                    attachmentsByAttributeName.set(attachment.attributeName, [attachment]);
                  }
                  return attachmentsByAttributeName;
                }, new Map<string, Array<AttachmentMetadataModel & { url: string }>>()),
              ),
            );
        }
      }),
    );

    this.editMapToolService.allEditGeometry$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(geometry => {
      this.geometryChanged(geometry, false);
    });

    ComponentConfigHelper.useInitialConfigForComponent<EditConfigModel>(
      this.store$,
      BaseComponentTypeEnum.EDIT,
      config => {
        this.closeDialogAfterAddingFeature = config.closeAfterAddFeature;
      },
    );
  }

  private resetChanges() {
    this.newAttachments = new Map();
    this.deletedAttachmentIds = new Set();
    this.updatedAttributes = null;
    this.formValid = false;
    this.clearCacheValuesAfterSave = new Set();
  }

  private setAttributeUpdated(attribute: string, value: any) {
    if (this.updatedAttributes === null) {
      this.updatedAttributes = {};
    }
    this.updatedAttributes[attribute] = value;
}

  public closeDialog(reopenFeatureInfo = true) {
    this.store$.dispatch(hideEditDialog());
    this.store$.select(selectEditOpenedFromFeatureInfo).pipe(take(1)).subscribe(openedFromFeatureInfo => {
      if (openedFromFeatureInfo && reopenFeatureInfo) {
        this.store$.dispatch(setEditActive({ active: false }));
        this.store$.dispatch(activateTool({ tool: ToolbarComponentEnum.FEATURE_INFO }));
        this.store$.dispatch(reopenFeatureInfoDialog());
      }
    });
  }

  public expandCollapseDialog() {
    this.store$.dispatch(expandCollapseEditDialog());
  }

  public save(layerId: string, currentFeature: FeatureWithMetadataModel) {
    const updatedFeature = this.updatedAttributes;
    if (!updatedFeature && this.newAttachments.size === 0 && this.deletedAttachmentIds.size === 0) {
      return;
    }
    this.uniqueValuesService.clearCaches(Array.from(this.clearCacheValuesAfterSave));
    this.creatingSavingFeature.set(true);
    this.store$.select(selectViewerId)
      .pipe(
        take(1),
        concatMap(viewerId => {
          if (!viewerId) {
            return of(null);
          }
          if (updatedFeature === null) { // no changes to data, check if we have new or deleted attachments
            if (this.newAttachments.size === 0 && this.deletedAttachmentIds.size === 0) {
              return of(currentFeature.feature);
            } else {
              return this.uploadAttachments$(viewerId, layerId, currentFeature.feature.__fid)
                .pipe(
                  mergeMap(() => this.deleteAttachments$(viewerId, layerId, this.deletedAttachmentIds)),
                  mergeMap(() => {
                  return this.editFeatureService.getFeature$(viewerId, layerId, currentFeature.feature.__fid);
                }));
            }
          }
          return this.editFeatureService.updateFeature$(viewerId, layerId, {
            __fid: currentFeature.feature.__fid,
            attributes: updatedFeature,
          }).pipe(
            concatMap(result => {
              if (!result || this.newAttachments.size === 0) {
                return of(result);
              } else {
                return this.uploadAttachments$(viewerId, layerId, result.__fid).pipe(mergeMap(() => of(result)));
              }
            }),
            concatMap(result => {
              if (!result || this.deletedAttachmentIds.size === 0) {
                return of(result);
              } else {
                return this.deleteAttachments$(viewerId, layerId, this.deletedAttachmentIds).pipe(mergeMap(() => of(result)));
              }
            }),
          );
        }),
        withLatestFrom(this.store$.select(selectEditOpenedFromFeatureInfo)),
      )
      .subscribe(([ feature, openedFromFeatureInfo ]) => {
        if (feature) {
          this.store$.dispatch(updateEditFeature({ feature, layerId }));
          this.featureUpdatedService.updatedFeature(layerId, feature.__fid);
          this.resetChanges();
          if (openedFromFeatureInfo) {
            this.store$.dispatch(setEditActive({ active: false }));
            this.store$.dispatch(activateTool({ tool: ToolbarComponentEnum.FEATURE_INFO }));
            this.store$.dispatch(reopenFeatureInfoDialog());
          }
        }
        this.creatingSavingFeature.set(false);
      });
  }

  public add(layerId: string) {
    const updatedFeature = this.updatedAttributes;
    if (!updatedFeature) {
      return;
    }
    this.creatingSavingFeature.set(true);
    this.store$.select(selectViewerId)
        .pipe(
            take(1),
            concatMap(viewerId => {
              if (!viewerId) {
                return of({ success: false, feature: null });
              }
              return this.editFeatureService.createFeature$(viewerId, layerId, {
                __fid: '',
                attributes: updatedFeature,
              }).pipe(
                 concatMap(result => {
                   if (!result.success || !result.feature) {
                     return of(result);
                   }
                   if (this.newAttachments.size !== 0) {
                    return this.uploadAttachments$(viewerId, layerId, result.feature!.__fid).pipe(mergeMap(() => of(result)));
                   } else {
                     return of(result);
                   }
                 }));
            }),
        )
        .subscribe(result => {
          this.creatingSavingFeature.set(false);
          if (!result.success) {
            return;
          }
          this.featureUpdatedService.updatedFeature(layerId, result.feature?.__fid);
          this.resetChanges();
          if (this.closeDialogAfterAddingFeature || !result.feature) {
            this.closeDialog();
          } else {
            this.store$.dispatch(editNewlyCreatedFeature({ feature: { ...result.feature, layerId } }));
          }
        });
  }

  private uploadAttachments$(viewerId: string, layerId: string, featureId: string) {
    const uploads = Array.from(this.newAttachments.entries()).flatMap(([ attribute, files ]) =>
      files.map(file => ({ attribute, file })),
    );
    return from(uploads).pipe(
      mergeMap(upload => this.editFeatureService.addAttachment$(
        viewerId,
        layerId,
        featureId,
        upload.attribute,
        upload.file,
      ), 1));
  }

  private deleteAttachments$(viewerId: string, layerId: string, attachmentIds: Set<string>) {
    if (attachmentIds.size === 0) {
      return of(null);
    }
    return from(attachmentIds.values()).pipe(
      mergeMap(attachmentId => this.editFeatureService.deleteAttachment$(viewerId, layerId, attachmentId), 1));
  }

  public delete(layerId: string, currentFeature: FeatureWithMetadataModel) {
    this.removingFeature.set(true);
    const featureId = currentFeature.feature.__fid;
    this.store$.select(selectViewerId)
      .pipe(
        take(1),
        concatMap(viewerId => {
          if (!viewerId) {
            return of(null);
          }
          return this.confirmService.confirm$(
            $localize `:@@core.edit.delete-feature-confirm:Delete feature`,
            $localize `:@@core.edit.delete-feature-confirm-message:Are you sure you want to delete this feature? This cannot be undone.`,
            true,
          ).pipe(
            take(1),
            concatMap(confirm => {
              if (!confirm) {
                return of(null);
              }
              return this.editFeatureService.deleteFeature$(viewerId, layerId, {
                __fid: featureId,
                attributes: currentFeature.feature.attributes,
              });
            }),
          );
        }),
      )
      .subscribe(success => {
        if (success) {
          this.featureUpdatedService.updatedFeature(layerId, featureId);
          this.closeDialog(false);
        }
        this.removingFeature.set(false);
      });
  }

  public featureChanged($event: { attribute: string; value: any; invalid?: boolean }) {
    this.formValid = !$event.invalid;
    this.setAttributeUpdated($event.attribute, $event.value);
  }

  public geometryChanged(geometry: string | null, newFeature: boolean) {
    if (!this.currentFeature$ || geometry === null) {
      return;
    }
    this.currentFeature$.pipe(
      take(1),
      switchMap((feature: FeatureWithMetadataModel | null) => {
        if (!feature) {
          return of(null);
        }
        return this.applicationLayerService.getLayerDetails$(feature.feature.layerId);
      }))
      .subscribe(layerDetails => {
        if (layerDetails) {
          if (!newFeature && this.updatedAttributes === null) {
            // Edited feature but only geometry edited, set this so Save button is enabled
            this.formValid = true;
            this.cdr.detectChanges();
          }
          this.setAttributeUpdated(layerDetails.details.geometryAttribute, geometry);
        }
      });
  }

  public clearUniqueValuesCacheAfterSave(uniqueValueCacheKey: string) {
    this.clearCacheValuesAfterSave.add(uniqueValueCacheKey);
  }

  public onNewAttachmentsChanged($event: { attribute: string; files: File[] }) {
    this.newAttachments.set($event.attribute, $event.files);
    if (this.newAttachments.size > 0) {
      this.formValid = true;
    }
  }

  public onDeletedAttachmentsChanged(deletedAttachmentIds: Set<string>) {
    this.deletedAttachmentIds = deletedAttachmentIds;
  }
}
