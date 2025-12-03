export type Cql2JsonFilter =
  | Cql2JsonLogicalOp
  | Cql2JsonNotOp
  | Cql2JsonComparisonOp
  | Cql2JsonSpatialOp
  | Cql2JsonBetweenOp
  | Cql2JsonLikeOp
  | Cql2JsonInOp
  | Cql2JsonIsNullOp;
export type NumberComparisonOperator = '=' | '<>' | '<' | '>' | '<=' | '>=';

export interface Cql2JsonLogicalOp {
  op: 'and' | 'or';
  args: Cql2JsonFilter[];
}

export interface Cql2JsonNotOp {
  op: 'not';
  args: [ Cql2JsonFilter ];
}

export interface Cql2JsonComparisonOp {
  op: NumberComparisonOperator;
  args: [ Cql2JsonProperty, string | number | boolean ];
}

export interface Cql2JsonBetweenOp {
  op: 'between';
  args: [ Cql2JsonProperty, string | number, string | number ];
}

export interface Cql2JsonLikeOp {
  op: 'like';
  args: [ Cql2JsonProperty, string ] | [ Cql2JsonProperty, string, boolean ];
}

export interface Cql2JsonInOp {
  op: 'in';
  args: [ Cql2JsonProperty, Array<string | number | boolean> ];
}

export interface Cql2JsonIsNullOp {
  op: 'isNull';
  args: [ Cql2JsonProperty ];
}

export interface Cql2JsonSpatialOp {
  op: 's_intersects';
  args: [ Cql2JsonProperty, Cql2JsonGeometry | Cql2JsonSpatialFunction ];
}

export interface Cql2JsonSpatialFunction {
  function: 'buffer';
  args: [ Cql2JsonGeometry, number ];
}

export interface Cql2JsonProperty {
  property: string;
}

export interface Cql2JsonGeometry {
  type: string;
  coordinates: unknown;
}
