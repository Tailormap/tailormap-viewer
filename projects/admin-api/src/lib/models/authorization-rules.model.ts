export enum AuthorizationRuleDecision {
    ALLOW = 'allow',
    DENY = 'deny',
}

export interface AuthorizationRule {
    decision: AuthorizationRuleDecision,
}

export interface AuthorizationRuleGroup {
  groupName: string;
  decisions: { [name: string]: AuthorizationRule },
}

export const AUTHORIZATION_RULE_ANONYMOUS: AuthorizationRuleGroup = {
    groupName: 'anonymous',
    decisions: { read: { decision: AuthorizationRuleDecision.ALLOW } },
};
