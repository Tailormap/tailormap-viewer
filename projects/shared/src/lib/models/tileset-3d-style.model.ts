/**
 * Types for OGC 3D Tiles Styling Language (declarative styling).
 *
 * Notes:
 *  - The official styling language evaluates expressions written as strings (a small subset
 *    of JavaScript plus built-in helper functions). Many style properties accept either:
 *      * an expression string (e.g. "(${height} > 10)"), or
 *      * a "conditions" object: { conditions: [ [testExpr, valueExpr], ... ] }
 *  - The spec also allows literal values (numbers, arrays) in some places; this model
 *    permits those as well.
 *
 * Sources: OGC 3D Tiles Declarative Styling & Cesium docs. See:
 *  - OGC 3D Tiles Declarative Styling (spec). :contentReference[oaicite:1]{index=1}
 *  - Cesium3DTileStyle reference & examples. :contentReference[oaicite:2]{index=2}
 */

/** A single condition tuple: [testExpression, resultExpressionOrLiteral] */
export type StyleConditionTuple =
  | [string, string | number | boolean | null | number[]]
  | [string, ExpressionLiteral];

/** Object form for conditional expressions */
export interface ConditionsExpression {
  conditions: StyleConditionTuple[];
}

/** Acceptable literal values used directly in style JSON (fallback type) */
export type ExpressionLiteral = string | number | boolean | null | number[] | Array<string | number>;

/** A style expression may be:
 *  - a string expression (the common case),
 *  - a conditions object,
 *  - OR a plain literal (number, array, boolean) in some usages.
 */
export type StyleExpression = string | ConditionsExpression | ExpressionLiteral;

/**
 * Meta dictionary: application-specific named expressions (the spec defines `meta`
 * for holding UI-friendly or otherwise named expressions).
 *
 * Example:
 *   meta: {
 *     description: '"Building id ${id} has height ${Height}."'
 *   }
 */
export type MetaExpressions = { [key: string]: StyleExpression };

/**
 * The core Tileset Style type.
 *
 * This covers the most commonly-used visual properties defined by the spec and exposed by
 * Cesium (show, color, pointSize, label, etc.). Implementations often support additional
 * visual properties (anchorLineColor, backgroundColor, translucencyByDistance, etc.);
 * to remain flexible the index signature permits additional keys.
 */
export interface TilesetStyle {
  /**
   * show: controls visibility. Typically an expression that returns boolean.
   * Example: "(${type} === 'residential')"
   */
  show?: StyleExpression;

  /**
   * color: color expression for the feature. Can be 'color("#RRGGBB")', 'vec4(...)',
   * a literal vec/array, or a conditions expression.
   */
  color?: StyleExpression;

  /**
   * pointSize: for point clouds / point features. Usually a numeric expression.
   */
  pointSize?: StyleExpression;

  /**
   * meta: arbitrary named expressions that can be evaluated by an application (UI text,
   * tooltips, etc.).
   */
  meta?: MetaExpressions;

  /**
   * defines: expression variables (the spec allows creating variables via 'defines' in some
   * authoring contexts — many viewers implement support). Keep it permissive: map from name
   * to expression string.
   */
  defines?: { [name: string]: string };

  /**
   * Any other style property supported by a viewer / extension (e.g. anchorLineColor,
   * translucencyByDistance, disableDepthTestDistance, distanceDisplayCondition, etc.)
   * The types above model the common cases (string expressions or conditions) but real-world
   * tilesets may contain many vendor/extension-specific properties.
   */
  [other: string]: StyleExpression | MetaExpressions | undefined;
}
