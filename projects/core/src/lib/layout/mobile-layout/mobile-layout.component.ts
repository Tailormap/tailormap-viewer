import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseComponentTypeEnum } from '@tailormap-viewer/api';
import { LayoutService } from '../layout.service';
import { HeaderComponent } from '../../components/header/header/header.component';
import { FeatureInfoComponent } from '../../components/feature-info/feature-info/feature-info.component';
import { MapComponent } from '@tailormap-viewer/map';
import { SimpleSearchComponent } from '../../components/toolbar/simple-search/simple-search.component';
import { GeolocationComponent } from '../../components/toolbar/geolocation/geolocation.component';
import { BackgroundLayerToggleComponent } from '../../components/background-layer-toggle/background-layer-toggle.component';
import { ScaleBarComponent } from '../../components/toolbar/scale-bar/scale-bar.component';
import { MenubarLogoComponent } from '../../components/menubar/menubar-logo/menubar-logo.component';
import { MobileMenubarPanelComponent } from '../../components/mobile-menubar/mobile-menubar-panel/mobile-menubar-panel.component';
import { TocComponent } from '../../components/toc/toc/toc.component';
import { LegendComponent } from '../../components/legend/legend/legend.component';
import { EditMobilePanelComponent } from '../../components/edit/edit-mobile-panel/edit-mobile-panel.component';
import { MobileMenubarHomeComponent } from '../../components/mobile-menubar/mobile-menubar-home/mobile-menubar-home.component';
import { ProfileComponent } from '../../components/menubar/profile/profile.component';
import { InfoComponent } from '../../components/info/info/info.component';
import { TerrainControlsComponent } from '../../components/toolbar/terrain-controls/terrain-controls.component';
import { FilterComponent } from '../../components/filter/filter/filter.component';
import { CoordinateLinkWindowComponent } from '../../components/toolbar/coordinate-link-window/coordinate-link-window.component';
import { ClickedCoordinatesComponent } from '../../components/toolbar/clicked-coordinates/clicked-coordinates.component';
import { FeatureInfoDialogComponent } from '../../components/feature-info/feature-info-dialog/feature-info-dialog.component';
import { MobileMenubarComponent } from '../../components/mobile-menubar/mobile-menubar/mobile-menubar.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'tm-mobile-layout',
    templateUrl: './mobile-layout.component.html',
    styleUrls: ['./mobile-layout.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        HeaderComponent,
        FeatureInfoComponent,
        MapComponent,
        SimpleSearchComponent,
        GeolocationComponent,
        BackgroundLayerToggleComponent,
        ScaleBarComponent,
        MenubarLogoComponent,
        MobileMenubarPanelComponent,
        TocComponent,
        LegendComponent,
        EditMobilePanelComponent,
        MobileMenubarHomeComponent,
        ProfileComponent,
        InfoComponent,
        TerrainControlsComponent,
        FilterComponent,
        CoordinateLinkWindowComponent,
        ClickedCoordinatesComponent,
        FeatureInfoDialogComponent,
        MobileMenubarComponent,
        AsyncPipe,
    ],
})
export class MobileLayoutComponent {
  public layoutService = inject(LayoutService);
  public componentTypes = BaseComponentTypeEnum;
}
