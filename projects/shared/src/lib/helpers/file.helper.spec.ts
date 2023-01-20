import { FileHelper } from './file.helper';

describe('test file helper util', () => {

  // Parsed by TinyHTTP package, see https://github.com/tinyhttp/tinyhttp/blob/master/tests/modules/content-disposition.test.ts

  it('should extract the file name from the Content-Disposition header', () => {
    const header = 'attachment; filename="test.pdf"';
    expect(FileHelper.extractFileNameFromContentDispositionHeader(header)).toEqual('test.pdf');
  });

  it('should extract the file name from the Content-Disposition header without spaces and quotes', () => {
    const header = 'inline;filename=test.pdf';
    expect(FileHelper.extractFileNameFromContentDispositionHeader(header)).toEqual('test.pdf');
  });

  it('should extract the file name from the Content-Disposition header with UTF-8 notation', () => {
    const header = 'attachment; filename=test.pdf; filename*=UTF-8\'\'test.pdf';
    expect(FileHelper.extractFileNameFromContentDispositionHeader(header)).toEqual('test.pdf');
  });

  it('should return the default value for invalid Content-Disposition header', () => {
    const header = 'no-header';
    expect(FileHelper.extractFileNameFromContentDispositionHeader(header, 'default.pdf')).toEqual('default.pdf');
  });

});
