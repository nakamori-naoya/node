import { ConfigParser, ConfigError } from './parser';
import { ConfigValidator } from './configValidator';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('./configValidator');

// Validatorのテストは別のファイルで行うので、ここではモックを使う
describe('ConfigParser', () => {
  let mockReadFileSync: jest.MockedFunction<typeof fs.readFileSync>;
  let mockValidator: jest.Mocked<ConfigValidator>;

  beforeEach(() => {
    mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
    mockValidator = new ConfigValidator({}) as jest.Mocked<ConfigValidator>;
    mockValidator.validate.mockReturnValue(true); // デフォルトで検証を通過させる
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('parses normal string value', () => {
    mockReadFileSync.mockReturnValue('kernel.domainname = example.com');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'kernel.domainname': 'example.com' });
    expect(mockValidator.validate).toHaveBeenCalledWith({ 'kernel.domainname': 'example.com' });
  });

  test('parses normal string with whitespace', () => {
    mockReadFileSync.mockReturnValue('kernel.modprobe = /sbin/mod probe');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'kernel.modprobe': '/sbin/mod probe' });
  });

  test('parses normal integer values', () => {
    mockReadFileSync.mockReturnValue('integer.value1 = 1\ninteger.value2 = -1');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'integer.value1': 1, 'integer.value2': -1 });
  });

  test('parses normal float value', () => {
    mockReadFileSync.mockReturnValue('float.value = 3.14');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'float.value': 3.14 });
  });

  test('parses normal boolean values', () => {
    mockReadFileSync.mockReturnValue('boolean.true.value = true\nboolean.false.value = false');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'boolean.true.value': true, 'boolean.false.value': false });
  });

  test('parses optional string value', () => {
    mockReadFileSync.mockReturnValue('-kernel.optional_domain = optional.example.com');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'kernel.optional_domain': 'optional.example.com' });
  });

  test('parses optional string with whitespace', () => {
    mockReadFileSync.mockReturnValue('-kernel.optional_path = /opt/custom module');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'kernel.optional_path': '/opt/custom module' });
  });

  test('parses optional integer values', () => {
    mockReadFileSync.mockReturnValue('-integer.optional_value1 = 1\n-optional.integer.value2 = -1');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'integer.optional_value1': 1, 'optional.integer.value2': -1 });
  });

  test('parses optional float value', () => {
    mockReadFileSync.mockReturnValue('-optional.float.value = 2.718');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'optional.float.value': 2.718 });
  });

  test('parses optional boolean values', () => {
    mockReadFileSync.mockReturnValue('-optional.boolean.true = true\n-optional.boolean.false = false');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'optional.boolean.true': true, 'optional.boolean.false': false });
  });

  test('handles normal setting with empty value', () => {
    mockReadFileSync.mockReturnValue('empty.value =');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'empty.value': '' });
  });

  test('handles normal setting with only whitespace after equals sign', () => {
    mockReadFileSync.mockReturnValue('whitespace.value =   ');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'whitespace.value': '' });
  });

  test('handles optional setting with empty value', () => {
    mockReadFileSync.mockReturnValue('-optional.empty.value =');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'optional.empty.value': '' });
  });

  test('handles optional setting with only whitespace after equals sign', () => {
    mockReadFileSync.mockReturnValue('-optional.whitespace.value =   ');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'optional.whitespace.value': '' });
  });

  test('throws error for normal setting with syntax error (missing =)', () => {
    mockReadFileSync.mockReturnValue('invalid_setting_no_equals');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    expect(() => parser.parse()).toThrow(ConfigError);
  });

  test('throws error for normal setting with syntax error (empty key)', () => {
    mockReadFileSync.mockReturnValue(' = invalid_empty_key');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    expect(() => parser.parse()).toThrow(ConfigError);
  });

  test('throws error for normal setting with syntax error (multiple =)', () => {
    mockReadFileSync.mockReturnValue('invalid.multiple.equals = value1 = value2');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    expect(() => parser.parse()).toThrow(ConfigError);
  });

  test('warns but does not throw for optional setting with syntax error (missing =)', () => {
    mockReadFileSync.mockReturnValue('-invalid_optional_no_equals');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const config = parser.parse();
    expect(config).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('warns but does not throw for optional setting with syntax error (empty key)', () => {
    mockReadFileSync.mockReturnValue('- = invalid_optional_empty_key');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const config = parser.parse();
    expect(config).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('warns but does not throw for optional setting with syntax error (multiple =)', () => {
    mockReadFileSync.mockReturnValue('-invalid.optional.multiple.equals = value1 = value2');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const config = parser.parse();
    expect(config).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  test('handles empty file', () => {
    mockReadFileSync.mockReturnValue('');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({});
  });

  test('ignores comment lines', () => {
    mockReadFileSync.mockReturnValue('# This is a comment\n; This is another comment\nvalid.key = value');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'valid.key': 'value' });
  });

  test('ignores empty lines', () => {
    mockReadFileSync.mockReturnValue('\n\nvalid.key = value\n\n');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'valid.key': 'value' });
  });

  test('handles values with special characters', () => {
    mockReadFileSync.mockReturnValue('special.chars = !@#$%^&*()');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'special.chars': '!@#$%^&*()' });
  });

  test('handles values with quotes', () => {
    mockReadFileSync.mockReturnValue('quoted.value = "This is a quoted string"');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'quoted.value': '"This is a quoted string"' });
  });

  test('handles scientific notation', () => {
    mockReadFileSync.mockReturnValue('scientific.notation = 1.23e-10');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'scientific.notation': 1.23e-10 });
  });

  test('handles keys with dots', () => {
    mockReadFileSync.mockReturnValue('key.with.many.dots = value');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'key.with.many.dots': 'value' });
  });

  test('handles multiple lines with mixed types', () => {
    mockReadFileSync.mockReturnValue('string.key = value\ninteger.key = 42\nboolean.key = true\n-optional.key = optional');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({
      'string.key': 'value',
      'integer.key': 42,
      'boolean.key': true,
      'optional.key': 'optional'
    });
  });

  test('handles value with trailing spaces', () => {
    mockReadFileSync.mockReturnValue('key.with.trailing.spaces = value   ');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'key.with.trailing.spaces': 'value' });
  });

  test('returns null when validation fails', () => {
    mockReadFileSync.mockReturnValue('valid.key = value');
    mockValidator.validate.mockReturnValue(false);
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toBeNull();
  });

  test('returns config when validation passes', () => {
    mockReadFileSync.mockReturnValue('valid.key = value');
    mockValidator.validate.mockReturnValue(true);
    const parser = new ConfigParser('dummy.conf', mockValidator);
    const config = parser.parse();
    expect(config).toEqual({ 'valid.key': 'value' });
  });

  test('calls validator with parsed config', () => {
    mockReadFileSync.mockReturnValue('key1 = value1\nkey2 = 42\nkey3 = true');
    const parser = new ConfigParser('dummy.conf', mockValidator);
    parser.parse();
    expect(mockValidator.validate).toHaveBeenCalledWith({
      key1: 'value1',
      key2: 42,
      key3: true
    });
  });
});