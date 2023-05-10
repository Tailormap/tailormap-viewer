import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AuthorizationRuleDecision, AuthorizationRuleGroup, AuthorizationGroups, GroupModel } from '@tailormap-admin/admin-api';
import { Subject } from 'rxjs';

@Component({
  selector: 'tm-admin-authorization-edit',
  templateUrl: './authorization-edit.component.html',
  styleUrls: ['./authorization-edit.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    multi: true,
    useExisting: AuthorizationEditComponent,
  }],
})
export class AuthorizationEditComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private destroyed = new Subject();

  private _onChange: (_: any) => void = () => undefined;
  public value: AuthorizationRuleGroup[] = [];

  private _groups: GroupModel[] = [];

  public groupList: { name: string; used: boolean }[] = [];
  public canAddRule = true;

  @Input()
  public set groups(value: GroupModel[]) {
      this._groups = value;
      this.updateGroupList();
  }

  private updateGroupList() {
      this.groupList = this._groups.filter(a => !a.systemGroup).map(a => ({ name: a.name, used: this.value.find(b => b.groupName === a.name) !== undefined }));
      this.canAddRule = this.groupList.find(a => !a.used) !== undefined;
  }


  constructor() { }

  public ngOnInit(): void {
  }

  public ngOnDestroy() {
      this.destroyed.next(null);
      this.destroyed.complete();
  }

  public selectedChip = 'anonymous';

  private updateValue(value: AuthorizationRuleGroup[], notify: boolean) {
      this.value = value;
      this.updateGroupList();

      if (notify) {
          this._onChange(value);
      }

      const anonymousGroup = this.value.find(a => a.groupName === AuthorizationGroups.ANONYMOUS);
      const loggedInGroup = this.value.find(a => a.groupName === AuthorizationGroups.APP_AUTHENTICATED);

      if (anonymousGroup?.decisions?.['read'] === AuthorizationRuleDecision.ALLOW) {
          this.selectedChip = 'anonymous';
      } else if (loggedInGroup?.decisions?.['read'] === AuthorizationRuleDecision.ALLOW) {
          this.selectedChip = 'loggedIn';
      } else {
          this.selectedChip = 'specificGroups';
      }
  }

  public writeValue(value: AuthorizationRuleGroup[]) {
      this.updateValue(value, false);
  }

  public registerOnChange(fn: (_: any) => void): void {
      this._onChange = fn;
  }

  public registerOnTouched() { }

  public setDisabledState() { }

  public changeAuthenticationType(type: string) {
      switch (type) {
      case 'anonymous':
          this.updateValue([{ groupName: AuthorizationGroups.ANONYMOUS, decisions: { read: AuthorizationRuleDecision.ALLOW } }], true);
          break;
      case 'loggedIn':
          this.updateValue([{ groupName: AuthorizationGroups.APP_AUTHENTICATED, decisions: { read: AuthorizationRuleDecision.ALLOW } }], true);
          break;
      case 'specificGroups':
          this.updateValue(this.value.filter(a => a.groupName !== AuthorizationGroups.ANONYMOUS && a.groupName !== AuthorizationGroups.APP_AUTHENTICATED), true);
          break;
      }
  }

  public changeRule(groupName: string, typ: string, checked: boolean) {
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
}
