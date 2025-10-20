/**
 * Types for OGC 3D Tiles Styling Language
 */

/** A single condition tuple: [testExpression, resultExpressionOrLiteral] */
export type StyleConditionTuple = [string, string];

export interface ConditionsExpression {
  conditions: StyleConditionTuple[];
}


export interface Tileset3dStyle {
  /**
   * show: controls visibility. Typically an expression that returns boolean.
   * Example: "(${type} === 'residential')"
   */
  show?: string | ConditionsExpression;

  /**
   * color: color expression for the feature. Can be 'color("#RRGGBB")', 'vec4(...)',
   * a literal vec/array, or a conditions expression.
   */
  color?: string | ConditionsExpression;

  /**
   * pointSize: for point clouds / point features. Usually a numeric expression.
   */
  pointSize?: string;

  /**
   * meta: arbitrary named expressions that can be evaluated by an application (UI text,
   * tooltips, etc.).
   */
  meta?: { [name: string]: string };

  /**
   * defines: expression variables (the spec allows creating variables via 'defines' in some
   * authoring contexts — many viewers implement support). Keep it permissive: map from name
   * to expression string.
   */
  defines?: { [name: string]: string };

}

export function isTileset3dStyle(obj: unknown): obj is Tileset3dStyle {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null;

  const isStyleConditionTuple = (v: unknown): v is StyleConditionTuple =>
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === 'string' &&
    typeof v[1] === 'string';

  const isConditionsExpression = (v: unknown): v is ConditionsExpression => {
    if (!isObject(v)) return false;
    const conds = v['conditions'];
    if (!Array.isArray(conds)) return false;
    return conds.every((c) => isStyleConditionTuple(c));
  };

  const isStringRecord = (v: unknown): v is { [k: string]: string } => {
    if (!isObject(v)) return false;
    return Object.values(v).every((val) => typeof val === 'string');
  };

  if (!isObject(obj)) return false;
  const allowedProps = new Set([ 'show', 'color', 'pointSize', 'meta', 'defines' ]);
  const objKeys = Object.keys(obj);
  if (!objKeys.every((k) => allowedProps.has(k))) return false;


  if ('show' in obj) {
    const v = obj['show'];
    if (!(typeof v === 'string' || isConditionsExpression(v))) return false;
  }

  if ('color' in obj) {
    const v = obj['color'];
    if (!(typeof v === 'string' || isConditionsExpression(v))) return false;
  }

  if ('pointSize' in obj) {
    if (typeof obj['pointSize'] !== 'string') return false;
  }

  if ('meta' in obj) {
    if (!isStringRecord(obj['meta'])) return false;
  }

  if ('defines' in obj) {
    if (!isStringRecord(obj['defines'])) return false;
  }

  return true;
}

