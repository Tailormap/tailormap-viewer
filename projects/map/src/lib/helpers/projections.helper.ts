import { register } from 'ol/proj/proj4';
import { Proj4Helper } from './proj4.helper';

export class ProjectionsHelper {

  public static initProjection(
    projection: string,
    definition: string,
    projectionAliases?: string[],
  ) {
    ProjectionsHelper.registerProjection(projection, definition);
    (projectionAliases || []).forEach(alias => {
      ProjectionsHelper.registerProjection(alias, definition);
    });
    register(Proj4Helper.proj4);
  }

  private static registerProjection(projection: string, definition: string) {
    if (!Proj4Helper.proj4.defs(projection) && !!definition) {
      Proj4Helper.proj4.defs(projection, definition);
    }
  }

}
