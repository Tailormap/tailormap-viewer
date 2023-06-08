import { render, screen } from '@testing-library/angular';
import { AuthorizationEditComponent } from './authorization-edit.component';
import { SharedImportsModule } from '@tailormap-viewer/shared';
import { AUTHORIZATION_RULE_ANONYMOUS, AuthorizationGroups, AuthorizationRuleDecision, AuthorizationRuleGroup, getGroup } from '@tailormap-admin/admin-api';
import { MatIconTestingModule } from '@angular/material/icon/testing';

const renderComponent = async (parentType?: string, parentAuthorizations?: AuthorizationRuleGroup[]) => {
    const component = await render(AuthorizationEditComponent, {
      componentInputs: {
        selfType: 'Test object',
        groups: [
            getGroup({ name: 'foo' }),
            getGroup({ name: 'bar' }),
            getGroup({ name: 'baz' }),
        ],

        ...(parentAuthorizations ? {
            parentAuthorizations: parentAuthorizations,
            parentType: parentType,
          } : { }),
      },
      imports: [ SharedImportsModule, MatIconTestingModule ],
    });

    return component;
};

describe('AuthorizationEditComponent', () => {
  test('selects "Specific groups" chip and lists groups', async () => {
    const component = await renderComponent();

    let value: AuthorizationRuleGroup[] = [];
    component.fixture.componentInstance.registerOnChange((v: AuthorizationRuleGroup[]) => { value = v; });
    component.fixture.componentInstance.writeValue([
       { groupName: 'foo', decisions: { read: AuthorizationRuleDecision.ALLOW } },
       { groupName: 'bar', decisions: { read: AuthorizationRuleDecision.DENY } },
    ]);
    component.detectChanges();

    expect((await screen.findByText("Specific groups")).parentElement).toHaveAttribute("aria-selected", "true");

    // Toggle "foo" from allow -> deny
    const fooCheckbox =  (await screen.findByText("foo")).parentElement?.querySelector("input");
    expect(fooCheckbox).not.toBeNull();
    expect(fooCheckbox?.checked).toBe(true);
    fooCheckbox?.click();
    component.detectChanges();
    expect(value).toEqual([
       { groupName: 'foo', decisions: { read: AuthorizationRuleDecision.DENY } },
       { groupName: 'bar', decisions: { read: AuthorizationRuleDecision.DENY } },
    ]);
    expect(fooCheckbox?.checked).toBe(false);

    // Toggle "bar" from deny -> allow
    const barCheckbox =  (await screen.findByText("bar")).parentElement?.querySelector("input");
    expect(barCheckbox).not.toBeNull();
    expect(barCheckbox?.checked).toBe(false);
    barCheckbox?.click();
    component.detectChanges();
    expect(barCheckbox?.checked).toBe(true);
    expect(value).toEqual([
       { groupName: 'foo', decisions: { read: AuthorizationRuleDecision.DENY } },
       { groupName: 'bar', decisions: { read: AuthorizationRuleDecision.ALLOW } },
    ]);
  });

  test('Toggling from "Specific groups" to "Anyone" works', async () => {
    const component = await renderComponent();

    let value: AuthorizationRuleGroup[] = [];
    component.fixture.componentInstance.registerOnChange((v: AuthorizationRuleGroup[]) => { value = v; });

    component.fixture.componentInstance.writeValue([
       { groupName: 'foo', decisions: { read: AuthorizationRuleDecision.ALLOW } },
       { groupName: 'bar', decisions: { read: AuthorizationRuleDecision.DENY } },
    ]);
    component.detectChanges();

    expect((await screen.findByText("Specific groups")).parentElement).toHaveAttribute("aria-selected", "true");

    (await screen.findByText('Anyone')).click();
    component.detectChanges();

    expect((await screen.findByText("Specific groups")).parentElement).toHaveAttribute("aria-selected", "false");
    expect((await screen.findByText("Anyone")).parentElement).toHaveAttribute("aria-selected", "true");

    expect(value).toEqual([AUTHORIZATION_RULE_ANONYMOUS]);
  });

  test('Toggling from "Specific groups" to "Logged in" works', async () => {
    const component = await renderComponent();

    let value: AuthorizationRuleGroup[] = [];
    component.fixture.componentInstance.registerOnChange((v: AuthorizationRuleGroup[]) => { value = v; });
    component.fixture.componentInstance.writeValue([
       { groupName: 'foo', decisions: { read: AuthorizationRuleDecision.ALLOW } },
       { groupName: 'bar', decisions: { read: AuthorizationRuleDecision.DENY } },
    ]);
    component.detectChanges();

    expect((await screen.findByText("Specific groups")).parentElement).toHaveAttribute("aria-selected", "true");
    (await screen.findByText('Logged in')).click();
    component.detectChanges();

    expect((await screen.findByText("Specific groups")).parentElement).toHaveAttribute("aria-selected", "false");
    expect((await screen.findByText("Logged in")).parentElement).toHaveAttribute("aria-selected", "true");

    expect(value).toEqual([{ groupName: AuthorizationGroups.AUTHENTICATED, decisions: { read: AuthorizationRuleDecision.ALLOW } }]);
  });

  test('Toggling from "Specific groups" to "Logged in" and back wipes the current groups', async () => {
    const component = await renderComponent();

    let value: AuthorizationRuleGroup[] = [];
    component.fixture.componentInstance.registerOnChange((v: AuthorizationRuleGroup[]) => { value = v; });
    component.fixture.componentInstance.writeValue([
       { groupName: 'foo', decisions: { read: AuthorizationRuleDecision.ALLOW } },
       { groupName: 'bar', decisions: { read: AuthorizationRuleDecision.DENY } },
    ]);
    component.detectChanges();

    expect((await screen.findByText("Specific groups")).parentElement).toHaveAttribute("aria-selected", "true");

    (await screen.findByText('Logged in')).click();
    (await screen.findByText('Specific groups')).click();

    expect(value).toEqual([]);
  });

  test('Parent inheritance is picked up', async () => {
      await renderComponent('Parent', [AUTHORIZATION_RULE_ANONYMOUS]);
      expect(await screen.findByText('Inherit from Parent (Anyone)')).not.toBeNull();
  });

  test('Parent groups-based inheritance is picked up, and denying rules work', async () => {
      const component = await renderComponent('Parent', [{ groupName: 'foo', decisions: { read: AuthorizationRuleDecision.ALLOW } }]);

      let value: AuthorizationRuleGroup[] = [];
      component.fixture.componentInstance.registerOnChange((v: AuthorizationRuleGroup[]) => { value = v; });
      component.detectChanges();

      expect(await screen.findByText('Specific groups (inherited)')).not.toBeNull();

      let fooCheckbox =  (await screen.findByText("foo")).parentElement?.querySelector("input");
      expect(fooCheckbox).not.toBeNull();
      expect(fooCheckbox?.checked).toBe(true);
      fooCheckbox?.click();
      component.detectChanges();

      expect(value).toEqual([{ groupName: 'foo', decisions: { read: AuthorizationRuleDecision.DENY } }]);

      fooCheckbox =  (await screen.findByText("foo")).parentElement?.querySelector("input");
      expect(fooCheckbox).not.toBeNull();
      expect(fooCheckbox?.checked).toBe(false);
      fooCheckbox?.click();
      component.detectChanges();

      expect(value).toEqual([]);
  });


  test('Overriding parent\'s "anyone" with "logged in" ', async () => {
      const component = await renderComponent('Parent', [AUTHORIZATION_RULE_ANONYMOUS]);

      let value: AuthorizationRuleGroup[] = [];
      component.fixture.componentInstance.registerOnChange((v: AuthorizationRuleGroup[]) => { value = v; });
      component.detectChanges();

      expect((await screen.findByText('Inherit from Parent (Anyone)')).parentElement).toHaveAttribute('aria-selected', 'true');
      (await screen.findByText('Logged in')).click();

      expect(value).toEqual([{ groupName: AuthorizationGroups.AUTHENTICATED, decisions: { read: AuthorizationRuleDecision.ALLOW } }]);
  });
});
