import { Inject, Injectable } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ICON_SERVICE_ICON_LOCATION } from './icon-service.injection-token';
import { APP_BASE_HREF } from '@angular/common';

type IconDefinition = string | { folder: string; icons: string[] };

@Injectable({
  providedIn: 'root',
})
export class IconService {

  public icons: IconDefinition[] = [
    'draw_polygon', 'draw_line', 'draw_point', 'split', 'new_object', 'merge', 'error', 'remove_all', 'remove',
    'drag', 'resize', 'chevron_bottom', 'chevron_left', 'chevron_right', 'chevron_top',
    'close', 'minimize', 'drop_down', 'drop_top', 'search', 'copy', 'menu',
    'expand_close', 'expand_open', 'table_filled', 'selection_outline', 'selection_filled',
    'trash_filled', 'table_outline', 'logo', 'layers_filled', 'zoom_max', 'coordinates',
    'folder_filled', 'folder_outline', 'filter_filled', 'filter_outline', 'user', 'login', 'plus', 'minus',
    'check', 'check_all', 'uncheck_all', 'edit', 'edit_square', 'info', 'reset', 'reorder', 'location_searching',
    'visibility_off', 'visibility', 'my_location', 'key', 'settings', 'fullscreen', 'fullscreen_exit', 'show_position', 'map',
    { folder: 'markers', icons: [ 'arrow', 'circle', 'cross', 'square', 'star', 'triangle', 'diamond' ] },
    { folder: 'components', icons: [ 'attribute_list', 'legend', 'table_of_contents', 'drawing', 'print', 'filter', 'coordinate_link_window' ] },
    {
      folder: 'tools',
      icons: [
        'cursor', 'measure_area', 'measure_length', 'position', 'push_pin', 'measure_length_outline', 'measure_area_outline',
        'draw_point', 'draw_line', 'draw_polygon', 'draw_circle', 'draw_label', 'draw_ellipse', 'draw_rectangle', 'draw_square', 'draw_star',
        'streetview', 'share', '3d',
      ],
    },
    { folder: 'style', icons: [ 'bold', 'italic' ] },
    { folder: 'languages', icons: [ 'gb', 'nl', 'de' ] },
  ];

  constructor(
    @Inject(ICON_SERVICE_ICON_LOCATION) private iconLocation: string,
    @Inject(APP_BASE_HREF) private baseHref: string,
  ) {}

  public getUrl() {
    const separator = this.baseHref[this.baseHref.length - 1] === '/' ? '' : '/';
    const endSlash = this.iconLocation[this.iconLocation.length - 1] === '/' ? '' : '/';
    return `${this.baseHref}${separator}${this.iconLocation}${endSlash}`;
  }

  public getUrlForIcon(icon: string, folder?: string) {
    const path = [this.getUrl()];
    if (folder) {
      path.push(folder, '/');
    }
    path.push(icon, '.svg');
    return path.join('');
  }

  public loadIconsToIconRegistry(
    matIconRegistry: MatIconRegistry,
    domSanitizer: DomSanitizer,
    icons: IconDefinition[] = this.icons,
  ) {
    const addIcon = (iconName: string, iconFile: string, folder?: string) => {
      matIconRegistry.addSvgIcon(
        iconName,
        domSanitizer.bypassSecurityTrustResourceUrl(this.getUrlForIcon(iconFile, folder)),
      );
    };
    icons.forEach(value => {
      if (typeof value === 'string') {
        addIcon(value, value);
        return;
      }
      value.icons.forEach(folderIcon => {
        addIcon(`${value.folder}_${folderIcon}`, folderIcon, value.folder);
      });
    });
  }

}
