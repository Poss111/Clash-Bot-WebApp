import { KebabCasePipe } from './kebab-case.pipe';

describe('KebabCasePipe', () => {
  test('create an instance', () => {
    const pipe = new KebabCasePipe();
    expect(pipe).toBeTruthy();
  });

  test('Should transform a word with spaces and uppercases into snakecase.', () => {
    const pipe = new KebabCasePipe();
    expect(pipe.transform('I am All messed UP')).toEqual('i-am-all-messed-up');
  })

  test('Should transform a word with spaces, uppercases, and symbols into snakecase.', () => {
    const pipe = new KebabCasePipe();
    expect(pipe.transform('I am All% messed$^&@#(* UP')).toEqual('i-am-all-messed-up');
  })
});
