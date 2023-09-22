export enum AttributeType {
    DATE = 'date',
    TIMESTAMP = 'timestamp',
    STRING = 'string',
    DOUBLE = 'double',
    NUMBER = 'number',
    INTEGER = 'integer',
    BOOLEAN = 'boolean',
    LINESTRING = 'linestring',
    MULTILINESTRING = 'multilinestring',
    POINT = 'point',
    MULTIPOINT = 'multipoint',
    POLYGON = 'polygon',
    MULTIPOLYGON = 'multipolygon',
    GEOMETRY = 'geometry', // Usage note: you probably want to use AttributeTypeHelper.isGeometryType() instead of just comparing to this value
    GEOMETRY_COLLECTION = 'geometry_collection',
}
