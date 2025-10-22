/** A single condition tuple: [testExpression, resultExpressionOrLiteral] */
export type StyleConditionTuple = [string, string];

export interface ConditionsExpression {
  conditions: StyleConditionTuple[];
}

/**
 * Type for OGC 3D Tiles Styling Language
 */
export interface Tileset3dStyle {
  show?: string | ConditionsExpression;
  color?: string | ConditionsExpression;
  pointSize?: string;
  meta?: { [name: string]: string };
  defines?: { [name: string]: string };
}
