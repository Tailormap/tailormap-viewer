import { Component, OnDestroy, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AuthorizationRuleDecision, AuthorizationRuleGroup, AuthorizationGroups, GroupModel } from '@tailormap-admin/admin-api';
import { Subject } from 'rxjs';

interface ExtendedAuthorizationRuleGroupInner extends AuthorizationRuleGroup {
    inherited: boolean;
    overridden: boolean;

    headerText?: string;
}

type ExtendedAuthorizationRuleGroup = ExtendedAuthorizationRuleGroupInner | { headerText: string };

@Component({
  selector: 'tm-admin-authorization-edit',
  templateUrl: './authorization-edit.component.html',
  styleUrls: ['./authorization-edit.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    multi: true,
    useExisting: AuthorizationEditComponent,
  }],
  standalone: false,
})
export class AuthorizationEditComponent implements OnDestroy, ControlValueAccessor {
  private destroyed = new Subject();

  private _onChange: (_: any) => void = () => undefined;
  public value: AuthorizationRuleGroup[] = [];

  private _parentAuthorizations: AuthorizationRuleGroup[] | null = null;

  private _groups: GroupModel[] = [];

  public groupList: { name: string; used: boolean }[] = [];
  public canAddRule = true;

  @Input()
  public parentType = '';

  @Input()
  public selfType = '';

  @Input()
  public set groups(value: GroupModel[]) {
      this._groups = value;
      this.updateGroupList();
  }

  private updateGroupList() {
      const allAuthorizations = [ ...this.value, ...(this._parentAuthorizations ?? []) ];
      this.groupList = this._groups.filter(a => !a.systemGroup).map(a => ({ name: a.name, used: allAuthorizations.find(b => b.groupName === a.name) !== undefined }));
      this.canAddRule = this.groupList.find(a => !a.used) !== undefined && this.parentChip !== 'specificGroups';
  }

  @Input()
  public set parentAuthorizations(value: AuthorizationRuleGroup[] | null) {
      this._parentAuthorizations = value;
      this.updateGroupList();
      this.updateValue(this.value, false);
  }

  public get decisions(): ExtendedAuthorizationRuleGroup[] {
      const parentDecisions = (this.parentChip === 'specificGroups' ? this._parentAuthorizations ?? [] : []).map(a => {
          const thisValue = this.value.find(b => b.groupName === a.groupName);
          if (thisValue !== undefined) {
              return { ...thisValue, inherited: false, overridden: true };
          }

          return { ...a, inherited: true, overridden: false };
      });

      const prefix: ExtendedAuthorizationRuleGroup[] = [];
      const postParent: ExtendedAuthorizationRuleGroup[] = [];

      const nonParentDecisions = this.value.filter(a => parentDecisions.find(b => b.groupName === a.groupName) === undefined)
                                           .map(a => ({ ...a, inherited: false, overridden: false }));

      if (this.parentChip === 'specificGroups') {
          if (parentDecisions.length > 0) {
              prefix.push({ headerText: $localize `:@@admin-core.authorizations.inherited-from:Inherited from ${this.parentType}` });
          }
          if (nonParentDecisions.length > 0) {
              postParent.push({ headerText: $localize `:@@admin-core.authorizations.configured-on:Configured on ${this.selfType}` });
          }
      }


      return [ ...prefix, ...parentDecisions, ...postParent, ...nonParentDecisions ];
  }

  public ngOnDestroy() {
      this.destroyed.next(null);
      this.destroyed.complete();
  }

  private static chipForRules(rules: AuthorizationRuleGroup[]): 'inherit' | 'anonymous' | 'loggedIn' | 'specificGroups' {
      if (rules.length === 0) {
          return 'inherit';
      }

      const anonymousGroup = rules.find(a => a.groupName === AuthorizationGroups.ANONYMOUS);
      const loggedInGroup = rules.find(a => a.groupName === AuthorizationGroups.AUTHENTICATED);

      if (anonymousGroup?.decisions?.['read'] === AuthorizationRuleDecision.ALLOW) {
          return 'anonymous';
      } else if (loggedInGroup?.decisions?.['read'] === AuthorizationRuleDecision.ALLOW) {
          return 'loggedIn';
      } else {
          return 'specificGroups';
      }
  }

  public selectedChip = 'anonymous';
  public parentChip: string | undefined = undefined;

  private updateValue(value: AuthorizationRuleGroup[], notify: boolean) {
      this.value = value;
      this.updateGroupList();

      if (notify) {
          this._onChange(value);
      }

      let newChip = AuthorizationEditComponent.chipForRules(this.value);
      // The 'inherit' chip value is lightly ambiguous, because in the case where we just selected "Specific groups",
      // it's possible no groups have been selected yet.
      if (this._parentAuthorizations !== null && newChip === 'inherit' && this.selectedChip === 'specificGroups') {
          newChip = 'specificGroups';
      }

      this.selectedChip = newChip;

      if (this._parentAuthorizations === null && this.selectedChip === 'inherit') {
          this.selectedChip = 'specificGroups';
      }

      if (this._parentAuthorizations !== null) {
          this.parentChip = AuthorizationEditComponent.chipForRules(this._parentAuthorizations);

          if (this.parentChip === 'specificGroups' && this.selectedChip === 'inherit') {
              this.selectedChip = 'specificGroups';
          }
      } else {
          this.parentChip = undefined;
      }
  }

  public writeValue(value: AuthorizationRuleGroup[]) {
      this.updateValue(value, false);
  }

  public registerOnChange(fn: (_: any) => void): void {
      this._onChange = fn;
  }

  public registerOnTouched() {
    // do nothing
  }

  public setDisabledState() {
    // do nothing
  }

  public changeAuthenticationType(type: string) {
      switch (type) {
      case 'inherit':
          this.updateValue([], true);
          break;
      case 'anonymous':
          this.updateValue([{ groupName: AuthorizationGroups.ANONYMOUS, decisions: { read: AuthorizationRuleDecision.ALLOW } }], true);
          break;
      case 'loggedIn':
          this.updateValue([{ groupName: AuthorizationGroups.AUTHENTICATED, decisions: { read: AuthorizationRuleDecision.ALLOW } }], true);
          break;
      case 'specificGroups':
          this.selectedChip = 'specificGroups';
          this.updateValue(this.value.filter(a => a.groupName !== AuthorizationGroups.ANONYMOUS && a.groupName !== AuthorizationGroups.AUTHENTICATED), true);
          break;
      }
  }

  public changeRule(groupName: string, typ: string, checked: boolean) {
      if (this.value.find(a => a.groupName === groupName) === undefined) {
          // Copy the value up from the parent
          const existingValue = (this._parentAuthorizations ?? []).find(a => a.groupName === groupName);
          if (existingValue === undefined) {
              return;
          }

          // Clone the object, we don't want to modify the parent by accident.
          const newValue = { groupName: existingValue.groupName, decisions: { ...existingValue.decisions } };
          newValue.decisions[typ] = checked ? AuthorizationRuleDecision.ALLOW : AuthorizationRuleDecision.DENY;

          this.updateValue([ ...this.value, newValue ], true);
          return;
      } else {
          const parentValue = (this._parentAuthorizations ?? []).find(a => a.groupName === groupName);

          // One cannot set a value to ALLOW when its parent has it set to DENY.
          if (parentValue !== undefined && checked) {
              this.updateValue(this.value.filter(a => a.groupName !== groupName), true);
              return;
          }

          const newValue = this.value.map(a => {
              if (a.groupName === groupName) {
                  const newDecisions = { ...a.decisions };
                  if (checked) {
                      newDecisions[typ] = AuthorizationRuleDecision.ALLOW;
                  } else {
                      newDecisions[typ] = AuthorizationRuleDecision.DENY;
                  }

                  return { groupName, decisions: newDecisions };
              }

              return a;
          });

          this.updateValue(newValue, true);
      }
  }

  public deleteRule(groupName: string) {
      const newValue = this.value.filter(a => a.groupName !== groupName);
      this.updateValue(newValue, true);
  }

  public newRuleDecision = true;
  public addRule(newGroup: string): void {
      const newValue = [
        ...this.value,
        {
            groupName: newGroup,
            decisions: { read: this.newRuleDecision ? AuthorizationRuleDecision.ALLOW : AuthorizationRuleDecision.DENY },
        },
      ];

      this.updateValue(newValue, true);
      this.newRuleDecision = true;
  }

  // Disable the select options actually changing.
  public compareValues(): boolean {
      return false;
  }

  public isNormalRow(_index: number, rowData: ExtendedAuthorizationRuleGroup): boolean {
      return rowData.headerText === undefined;
  }

  public isHeaderRow(_index: number, rowData: ExtendedAuthorizationRuleGroup): boolean {
      return rowData.headerText !== undefined;
  }

  protected readonly undefined = undefined;
}
