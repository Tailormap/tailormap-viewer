import { ConditionsExpression, StyleConditionTuple, Tileset3dStyle } from '@tailormap-viewer/api';

export class Tileset3dStyleHelper {
  private static isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

  private static isStyleConditionTuple = (v: unknown): v is StyleConditionTuple =>
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === 'string' &&
    typeof v[1] === 'string';

  private static isConditionsExpression = (v: unknown): v is ConditionsExpression => {
    if (!Tileset3dStyleHelper.isObject(v) || !Array.isArray(v['conditions'])) {
      return false;
    }
    return v['conditions'].every((c) => Tileset3dStyleHelper.isStyleConditionTuple(c));
  };

  private static isStringRecord = (v: unknown): v is { [k: string]: string } => {
    if (!Tileset3dStyleHelper.isObject(v)) {
      return false;
    }
    return Object.values(v).every((val) => typeof val === 'string');
  };

  /**
   * Type guard to check if an object conforms to the 3D Tiles Styling Language structure
   */
  public static isTileset3dStyle(obj: unknown): obj is Tileset3dStyle {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }

    const allowedProps = new Set([ 'show', 'color', 'pointSize', 'meta', 'defines' ]);
    const objKeys = Object.keys(obj);
    if (!objKeys.every((k) => allowedProps.has(k))) {
      return false;
    }

    if ('show' in obj) {
      if (!(typeof obj['show'] === 'string' || Tileset3dStyleHelper.isConditionsExpression(obj['show']))) {
        return false;
      }
    }

    if ('color' in obj) {
      if (!(typeof obj['color'] === 'string' || Tileset3dStyleHelper.isConditionsExpression(obj['color']))) {
        return false;
      }
    }

    if ('pointSize' in obj) {
      if (typeof obj['pointSize'] !== 'string') {
        return false;
      }
    }

    if ('meta' in obj) {
      if (!Tileset3dStyleHelper.isStringRecord(obj['meta'])) {
        return false;
      }
    }

    if ('defines' in obj) {
      if (!Tileset3dStyleHelper.isStringRecord(obj['defines'])) {
        return false;
      }
    }

    return true;
  }
}
