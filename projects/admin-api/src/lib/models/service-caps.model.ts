export interface ServiceCapsModel {
  serviceInfo?: {
    title?: string;
    keywords?: string[];
    description?: string;
    publisher?: string;
    schema?: string;
    source?: string;
  };
  capabilities: {
    version?: string;
    updateSequence?: string;
    abstractText?: string;
    request?: {
      'get-map'?: {
        formats?: string[];
      };
      'get-feature-info'?: {
        formats?: string[];
      };
      'describe-layer'?: boolean;
    };
  };
}
