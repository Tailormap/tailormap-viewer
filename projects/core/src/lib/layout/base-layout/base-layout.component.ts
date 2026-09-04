import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { LayoutService } from '../layout.service';
import { HeaderComponent } from '../../components/header/header/header.component';
import { MenubarComponent } from '../../components/menubar/menubar.component';
import { MenubarPanelComponent } from '../../components/menubar/menubar-panel/menubar-panel.component';
import { InfoComponent } from '../../components/info/info/info.component';
import { TocComponent } from '../../components/toc/toc/toc.component';
import { LegendComponent } from '../../components/legend/legend/legend.component';
import { DrawingComponent } from '../../components/drawing/drawing/drawing.component';
import { PrintComponent } from '../../components/print/print/print.component';
import { FilterComponent } from '../../components/filter/filter/filter.component';
import { RegisteredComponentsRendererComponent } from '../../components/registered-components-renderer/registered-components-renderer.component';
import { FeatureInfoComponent } from '../../components/feature-info/feature-info/feature-info.component';
import { EditDialogComponent } from '../../components/edit/edit-dialog/edit-dialog.component';
import { MapComponent } from '@tailormap-viewer/map';
import { AttributeListComponent } from '../../components/attribute-list/attribute-list/attribute-list.component';
import { MeasureComponent } from '../../components/toolbar/measure/measure.component';
import { ClickedCoordinatesComponent } from '../../components/toolbar/clicked-coordinates/clicked-coordinates.component';
import { StreetviewComponent } from '../../components/toolbar/streetview/streetview.component';
import { SimpleSearchComponent } from '../../components/toolbar/simple-search/simple-search.component';
import { EditComponent } from '../../components/edit/edit/edit.component';
import { CoordinateLinkWindowComponent } from '../../components/toolbar/coordinate-link-window/coordinate-link-window.component';
import { ShareViewerComponent } from '../../components/toolbar/share-viewer/share-viewer.component';
import { Switch3dComponent } from '../../components/toolbar/switch3d/switch3d.component';
import { TerrainControlsComponent } from '../../components/toolbar/terrain-controls/terrain-controls.component';
import { SnappingComponent } from '../../components/toolbar/snapping/snapping.component';
import { BackgroundLayerToggleComponent } from '../../components/background-layer-toggle/background-layer-toggle.component';
import { ZoomButtonsComponent } from '../../components/toolbar/zoom-buttons/zoom-buttons.component';
import { GeolocationComponent } from '../../components/toolbar/geolocation/geolocation.component';
import { ScaleBarComponent } from '../../components/toolbar/scale-bar/scale-bar.component';
import { MouseCoordinatesComponent } from '../../components/toolbar/mouse-coordinates/mouse-coordinates.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-base-layout',
    templateUrl: './base-layout.component.html',
    styleUrls: ['./base-layout.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        HeaderComponent,
        MenubarComponent,
        MenubarPanelComponent,
        InfoComponent,
        TocComponent,
        LegendComponent,
        DrawingComponent,
        PrintComponent,
        FilterComponent,
        RegisteredComponentsRendererComponent,
        FeatureInfoComponent,
        EditDialogComponent,
        MapComponent,
        AttributeListComponent,
        MeasureComponent,
        ClickedCoordinatesComponent,
        StreetviewComponent,
        SimpleSearchComponent,
        EditComponent,
        CoordinateLinkWindowComponent,
        ShareViewerComponent,
        Switch3dComponent,
        TerrainControlsComponent,
        SnappingComponent,
        BackgroundLayerToggleComponent,
        ZoomButtonsComponent,
        GeolocationComponent,
        ScaleBarComponent,
        MouseCoordinatesComponent,
        AsyncPipe,
    ],
})
export class BaseLayoutComponent {
  public layoutService = inject(LayoutService);
  public componentTypes = BaseComponentTypeEnum;
}
