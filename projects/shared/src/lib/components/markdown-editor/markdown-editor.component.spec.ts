import { Component, input, Input } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MarkdownEditorAppearance, MarkdownEditorComponent, MarkdownEditorMode } from './markdown-editor.component';
import { MilkdownEditorComponent } from './milkdown/milkdown-editor.component';
import { MarkdownEditorService } from './markdown-editor.service';
import { TemplatePicklistConfig } from './template-picklist.model';

const milkdownFocus = vi.fn();

/**
 * Stands in for the Milkdown editor (Crepe does not run in jsdom). It is provided as MilkdownEditorComponent so the
 * `viewChild` query in MarkdownEditorComponent finds it.
 */
@Component({
  selector: 'tm-milkdown-editor',
  template: '<div data-testid="milkdown-stub"></div>',
  providers: [{ provide: MilkdownEditorComponent, useExisting: MilkdownEditorStubComponent }],
})
class MilkdownEditorStubComponent {
  @Input()
  public templatePicklistConfig: TemplatePicklistConfig | undefined;
  @Input()
  public uploadService$: unknown;
  public insertUpload$ = input<unknown>();
  public resolveImageUrl = input<unknown>();
  public placeholder = input<string>();
  public focus = milkdownFocus;
}

interface SetupOptions {
  appearance?: MarkdownEditorAppearance;
  mode?: MarkdownEditorMode;
  content?: string;
}

const setup = async (options: SetupOptions = {}) => {
  const contentChanged = vi.fn();
  const inputs: Record<string, unknown> = { content: options.content ?? 'Hello' };
  if (options.appearance) {
    inputs['appearance'] = options.appearance;
  }
  if (options.mode) {
    inputs['mode'] = options.mode;
  }
  const result = await render(MarkdownEditorComponent, {
    inputs,
    on: { contentChanged },
    configureTestBed: tb => tb.overrideComponent(MarkdownEditorComponent, {
      remove: { imports: [MilkdownEditorComponent] },
      add: { imports: [MilkdownEditorStubComponent] },
    }),
  });
  const host = result.fixture.nativeElement as HTMLElement;
  return { ...result, host, contentChanged };
};

describe('MarkdownEditorComponent', () => {

  afterEach(() => {
    milkdownFocus.mockReset();
    window.localStorage.removeItem('tm-markdown-editor-pick');
  });

  test('renders the header with the editor toggle in the default appearance', async () => {
    const { host } = await setup();
    expect(screen.getByText('Visual editor')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByTestId('milkdown-stub')).toBeInTheDocument();
    expect(host).not.toHaveClass('tm-markdown-editor--inline');
  });

  test('hides the header in the inline appearance', async () => {
    const { host } = await setup({ appearance: 'inline' });
    expect(screen.queryByText('Visual editor')).not.toBeInTheDocument();
    expect(screen.queryByText('Source')).not.toBeInTheDocument();
    expect(screen.getByTestId('milkdown-stub')).toBeInTheDocument();
    expect(host).toHaveClass('tm-markdown-editor--inline');
  });

  test('uses the editor stored in local storage when no mode is set', async () => {
    window.localStorage.setItem('tm-markdown-editor-pick', 'source');
    await setup();
    expect(screen.getByRole('textbox')).toHaveValue('Hello');
    expect(screen.queryByTestId('milkdown-stub')).not.toBeInTheDocument();
  });

  test('the mode input overrides the stored editor and switches the view from outside', async () => {
    window.localStorage.setItem('tm-markdown-editor-pick', 'milkdown');
    const { rerender } = await setup({ appearance: 'inline', mode: 'source' });
    expect(screen.getByRole('textbox')).toHaveValue('Hello');
    expect(screen.queryByTestId('milkdown-stub')).not.toBeInTheDocument();
    await rerender({ inputs: { content: 'Hello', appearance: 'inline', mode: 'milkdown' }, partialUpdate: true });
    expect(screen.getByTestId('milkdown-stub')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('the header toggle keeps working when a mode is set', async () => {
    await setup({ mode: 'milkdown' });
    await userEvent.click(screen.getByText('Source'));
    expect(screen.getByRole('textbox')).toHaveValue('Hello');
    expect(window.localStorage.getItem('tm-markdown-editor-pick')).toBe('source');
  });

  test('keeps edits made in the visual editor when switching the mode from outside', async () => {
    const { fixture, debugElement, contentChanged } = await setup({ mode: 'milkdown' });
    const service = debugElement.injector.get(MarkdownEditorService);
    service.contentChanged('Hello world');
    expect(contentChanged).toHaveBeenCalledWith('Hello world');
    fixture.componentRef.setInput('mode', 'source');
    fixture.detectChanges();
    expect(screen.getByRole('textbox')).toHaveValue('Hello world');
  });

  test('emits contentChanged when typing in the source editor', async () => {
    const { contentChanged } = await setup({ mode: 'source', content: '' });
    await userEvent.type(screen.getByRole('textbox'), 'Hi');
    expect(contentChanged).toHaveBeenLastCalledWith('Hi');
  });

  test('does not emit contentChanged for content set from outside or when switching editors', async () => {
    const { fixture } = await setup({ mode: 'milkdown' });
    const contentChanged = vi.fn();
    fixture.componentInstance.contentChanged.subscribe(contentChanged);
    fixture.componentRef.setInput('content', 'Other content');
    fixture.detectChanges();
    fixture.componentRef.setInput('mode', 'source');
    fixture.detectChanges();
    expect(screen.getByRole('textbox')).toHaveValue('Other content');
    await userEvent.click(screen.getByText('Visual editor'));
    await userEvent.click(screen.getByText('Source'));
    expect(screen.getByRole('textbox')).toHaveValue('Other content');
    expect(contentChanged).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole('textbox'), '!');
    expect(contentChanged).toHaveBeenCalledTimes(1);
    expect(contentChanged).toHaveBeenCalledWith('Other content!');
  });

  test('focus() focuses the visual editor', async () => {
    const { fixture } = await setup({ appearance: 'inline', mode: 'milkdown' });
    fixture.componentInstance.focus();
    expect(milkdownFocus).toHaveBeenCalledTimes(1);
  });

  test('focus() focuses the source textarea', async () => {
    const { fixture } = await setup({ mode: 'source' });
    fixture.componentInstance.focus();
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  test('focus() right after changing the mode focuses the new editor once it is rendered', async () => {
    const { fixture } = await setup({ mode: 'milkdown' });
    fixture.componentRef.setInput('mode', 'source');
    fixture.componentInstance.focus();
    fixture.detectChanges();
    await vi.waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    expect(milkdownFocus).not.toHaveBeenCalled();
  });

});
