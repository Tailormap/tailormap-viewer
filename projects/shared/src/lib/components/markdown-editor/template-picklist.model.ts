export interface TemplateVariable {
  label: string;
  value: string;
}

export interface TemplatePicklistConfig {
  label: string;
  shortLabel: string;
  variables: TemplateVariable[];
}
