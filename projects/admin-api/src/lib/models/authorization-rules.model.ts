export enum AuthorizationRuleDecision {
    ALLOW = 'allow',
    DENY = 'deny',
}

export interface AuthorizationRuleGroup {
  groupName: string;
  decisions: { [name: string]: AuthorizationRuleDecision },
}

export enum AuthorizationGroups {
  ANONYMOUS = 'anonymous',
  APP_AUTHENTICATED = 'app-authenticated',
}

export const AUTHORIZATION_RULE_ANONYMOUS: AuthorizationRuleGroup = {
    groupName: AuthorizationGroups.ANONYMOUS,
    decisions: { read: AuthorizationRuleDecision.ALLOW },
};
