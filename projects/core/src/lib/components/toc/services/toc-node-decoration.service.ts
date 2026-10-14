import { Service, signal } from '@angular/core';
import { TreeModel } from '@tailormap-viewer/shared';
import { AppLayerModel } from '@tailormap-viewer/api';

export interface TocNodeDecorationIcon {
  svgIcon: string;
  ariaLabel: string;
  tooltip?: string;
}

export interface TocNodeDecoration {
  cssClasses?: string[];
  labelCssClasses?: string[];
  icons?: TocNodeDecorationIcon[];
}

export type TocNodeDecorator = (node: TreeModel<AppLayerModel>) => TocNodeDecoration | null;

interface RegisteredTocNodeDecorator {
  id: string;
  decorator: TocNodeDecorator;
}

const EMPTY_DECORATION: Required<TocNodeDecoration> = { cssClasses: [], labelCssClasses: [], icons: [] };

@Service()
export class TocNodeDecorationService {

  private decorators = signal<RegisteredTocNodeDecorator[]>([]);

  public registerDecorator(id: string, decorator: TocNodeDecorator) {
    this.decorators.update(decorators => [ ...decorators.filter(d => d.id !== id), { id, decorator }]);
  }

  public deregisterDecorator(id: string) {
    this.decorators.update(decorators => decorators.filter(d => d.id !== id));
  }

  public getDecoration(node: TreeModel<AppLayerModel> | null): Required<TocNodeDecoration> {
    const decorators = this.decorators();
    if (!node || decorators.length === 0) {
      return EMPTY_DECORATION;
    }
    return decorators.reduce<Required<TocNodeDecoration>>((merged, { decorator }) => {
      const decoration = decorator(node);
      if (!decoration) {
        return merged;
      }
      return {
        cssClasses: [ ...merged.cssClasses, ...(decoration.cssClasses ?? []) ],
        labelCssClasses: [ ...merged.labelCssClasses, ...(decoration.labelCssClasses ?? []) ],
        icons: [ ...merged.icons, ...(decoration.icons ?? []) ],
      };
    }, EMPTY_DECORATION);
  }

}
