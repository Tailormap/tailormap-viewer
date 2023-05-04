export enum AuthorizationRuleDecision {
    ALLOW = 'allow',
    DENY = 'deny',
}

export interface AuthorizationRuleGroup {
  groupName: string;
  decisions: { [name: string]: AuthorizationRuleDecision },
}

export const AUTHORIZATION_RULE_ANONYMOUS: AuthorizationRuleGroup = {
    groupName: 'anonymous',
    decisions: { read: AuthorizationRuleDecision.ALLOW },
};
