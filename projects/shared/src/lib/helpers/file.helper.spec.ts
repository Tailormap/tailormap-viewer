import { FileHelper } from './file.helper';

describe('test file helper util', () => {

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

  it('should return the default value for invalud Content-Disposition header', () => {
    const header = 'no-header';
    expect(FileHelper.extractFileNameFromContentDispositionHeader(header, 'default.pdf')).toEqual('default.pdf');
  });

});
