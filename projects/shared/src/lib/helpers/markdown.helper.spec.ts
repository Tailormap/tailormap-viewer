import { MarkdownHelper } from './markdown.helper';

describe('MarkdownHelper', () => {

  test('escapes markdown', () => {
    expect(MarkdownHelper.markdownEscape('123')).toEqual('123');
    expect(MarkdownHelper.markdownEscape('* _123_')).toEqual('\\* \\_123\\_');
    expect(MarkdownHelper.markdownEscape('___ abc # test ## test2')).toEqual('\\_\\_\\_ abc \\# test \\#\\# test2');
  });

  test('parses template and replaces variables', () => {
    const variables = new Map([
      [ 'var1', 'Some value' ],
      [ 'var2', 'Value 2' ],
      [ 'var3', 'Other one' ],
    ]);
    const template = 'Some story about {{var1}}. {{ var2 }} should be replaced. {{ Leave this {{ var3 }} and this }}';
    const result = MarkdownHelper.templateParser(template, variables);
    expect(result).toEqual('Some story about Some value. Value 2 should be replaced. {{ Leave this Other one and this }}');
  });

});
