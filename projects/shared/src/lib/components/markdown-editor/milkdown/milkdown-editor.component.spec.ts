import { fireEvent, render } from '@testing-library/angular';
import { describe, expect, test, vi } from 'vitest';
import { MilkdownEditorComponent } from './milkdown-editor.component';
import { MarkdownEditorService } from '../markdown-editor.service';
import { MilkdownHelper } from './milkdown.helper';

type MarkdownUpdatedFn = (ctx: unknown, markdown: string, prevMarkdown: string) => void;

const mocks = vi.hoisted(() => {
  const viewFocus = vi.fn();
  const editorView = { focus: viewFocus };
  const editorViewCtx = Symbol('editorViewCtx');
  let resolveCreate: () => void = () => undefined;
  let created = Promise.resolve();
  const resetCreate = () => {
    created = new Promise<void>(resolve => resolveCreate = resolve);
  };
  resetCreate();
  const crepeOptions: Array<Record<string, unknown>> = [];
  const listenerCtx = Symbol('listenerCtx');
  /** The callback registered with the listener plugin's `markdownUpdated`, captured by the fake ctx below. */
  let markdownUpdated: MarkdownUpdatedFn | undefined;
  const ctx = {
    update: () => undefined,
    get: (key: unknown) => {
      if (key === editorViewCtx) {
        return editorView;
      }
      if (key === listenerCtx) {
        return { markdownUpdated: (fn: MarkdownUpdatedFn) => markdownUpdated = fn };
      }
      return undefined;
    },
  };
  return {
    viewFocus, editorView, editorViewCtx, get created() { return created; }, resolveCreate: () => resolveCreate(), resetCreate, crepeOptions,
    listenerCtx, ctx, get markdownUpdated() { return markdownUpdated; },
  };
});

/* eslint-disable @typescript-eslint/naming-convention -- mirrors the names of the Crepe API */
vi.mock('@milkdown/crepe', () => {
  class Crepe {
    public static Feature = { CodeMirror: 'code-mirror', Latex: 'latex', ImageBlock: 'image-block', Placeholder: 'placeholder', BlockEdit: 'block-edit' };
    public editor = {
      use: () => this.editor,
      config: (fn: (ctx: unknown) => void) => {
        fn(mocks.ctx);
        return this.editor;
      },
    };
    constructor(options: Record<string, unknown>) {
      mocks.crepeOptions.push(options);
    }
    public async create() {
      await mocks.created;
      return { ctx: mocks.ctx, destroy: vi.fn() };
    }
  }
  return { Crepe };
});
/* eslint-enable @typescript-eslint/naming-convention */
vi.mock('@milkdown/kit/core', () => ({ editorViewCtx: mocks.editorViewCtx }));
vi.mock('@milkdown/plugin-listener', () => ({ listener: {}, listenerCtx: mocks.listenerCtx }));

/** Renders the editor and waits until the (mocked) Crepe editor has been created. */
const setupCreatedEditor = async () => {
  mocks.viewFocus.mockClear();
  mocks.resetCreate();
  const updateContent = vi.spyOn(MilkdownHelper, 'updateContent').mockImplementation(() => undefined);
  const { fixture, debugElement } = await render(MilkdownEditorComponent, {
    providers: [MarkdownEditorService],
  });
  const service = debugElement.injector.get(MarkdownEditorService);
  const userChanges = vi.fn();
  service.getUserChanges$().subscribe(userChanges);
  // Focusing before creation focuses the view once the editor is created, which tells the test the editor exists
  fixture.componentInstance.focus();
  mocks.resolveCreate();
  await vi.waitFor(() => expect(mocks.viewFocus).toHaveBeenCalled());
  const editorEl = fixture.componentInstance.editorEl!.nativeElement;
  const markdownUpdated = (markdown: string, prevMarkdown: string) => mocks.markdownUpdated?.(mocks.ctx, markdown, prevMarkdown);
  return { service, userChanges, updateContent, editorEl, markdownUpdated };
};

describe('MilkdownEditorComponent', () => {

  test('focus() before the editor is created focuses it once created', async () => {
    mocks.viewFocus.mockClear();
    mocks.resetCreate();
    const { fixture } = await render(MilkdownEditorComponent, {
      inputs: { placeholder: 'Write something' },
      providers: [MarkdownEditorService],
    });
    fixture.componentInstance.focus();
    expect(mocks.viewFocus).not.toHaveBeenCalled();
    mocks.resolveCreate();
    await vi.waitFor(() => expect(mocks.viewFocus).toHaveBeenCalledTimes(1));
    fixture.componentInstance.focus();
    expect(mocks.viewFocus).toHaveBeenCalledTimes(2);
    const featureConfigs = mocks.crepeOptions[0]['featureConfigs'] as Record<string, unknown>;
    expect(featureConfigs['placeholder']).toEqual({ mode: 'doc', text: 'Write something' });
  });

  test('destroy() prevents a pending create callback from focusing after teardown', async () => {
    mocks.viewFocus.mockClear();
    mocks.resetCreate();
    const { fixture } = await render(MilkdownEditorComponent, {
      inputs: { placeholder: 'Write something' },
      providers: [MarkdownEditorService],
    });
    fixture.componentInstance.focus();
    fixture.componentInstance.ngOnDestroy();
    mocks.resolveCreate();
    await vi.waitFor(() => expect(mocks.viewFocus).not.toHaveBeenCalled());
  });

  test('does not report Markdown updates after loading content as user changes', async () => {
    const { userChanges, markdownUpdated } = await setupCreatedEditor();
    markdownUpdated('normalised', '');
    expect(userChanges).not.toHaveBeenCalled();
  });

  test('reports Markdown updates after an edit gesture inside the editor', async () => {
    const { userChanges, markdownUpdated, editorEl, service } = await setupCreatedEditor();
    fireEvent.keyDown(editorEl, { key: 'F' });
    markdownUpdated('Foo', '');
    expect(userChanges).toHaveBeenCalledWith('Foo');
    expect(service.getCurrentContent()).toBe('Foo');
  });

  test('drops an update still pending from the previous content and reloads content equal to the last edit', async () => {
    const { userChanges, markdownUpdated, editorEl, service, updateContent } = await setupCreatedEditor();
    fireEvent.keyDown(editorEl, { key: 'F' });
    markdownUpdated('Foo', '');
    userChanges.mockClear();
    // Other content is loaded while a debounced update with the previous content was still pending
    service.resetContent('Bar');
    expect(updateContent).toHaveBeenLastCalledWith(mocks.ctx, 'Bar');
    markdownUpdated('Foo2', 'Foo');
    expect(userChanges).not.toHaveBeenCalled();
    // Loading the last edited content again must reload the editor
    service.resetContent('Foo');
    expect(updateContent).toHaveBeenLastCalledWith(mocks.ctx, 'Foo');
  });

});
