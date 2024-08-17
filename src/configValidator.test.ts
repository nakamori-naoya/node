import { ConfigValidator, ConfigError } from './configValidator';
import { Schema } from './schemaParser';

describe('ConfigValidator', () => {
  let schema: Schema;
  let validator: ConfigValidator;

  beforeEach(() => {
    schema = {
      'string.key': { type: 'string' },
      'number.key': { type: 'number' },
      'boolean.key': { type: 'boolean' }
    };
    validator = new ConfigValidator(schema);
  });

  test('validates correct config', () => {
    const config = {
      'string.key': 'value',
      'number.key': 42,
      'boolean.key': true
    };
    expect(validator.validate(config)).toBe(true);
  });

  test('fails on missing required field', () => {
    const config = {
      'string.key': 'value',
      'number.key': 42
      // missing boolean.key
    };
    expect(validator.validate(config)).toBe(false);
  });

  test('fails on extra field', () => {
    const config = {
      'string.key': 'value',
      'number.key': 42,
      'boolean.key': true,
      'extra.key': 'extra'
    };
    expect(validator.validate(config)).toBe(false);
  });

  test('fails on type mismatch - string', () => {
    const config = {
      'string.key': 42, // should be string
      'number.key': 42,
      'boolean.key': true
    };
    expect(validator.validate(config)).toBe(false);
  });

  test('fails on type mismatch - number', () => {
    const config = {
      'string.key': 'value',
      'number.key': '42', // should be number
      'boolean.key': true
    };
    expect(validator.validate(config)).toBe(false);
  });

  test('fails on type mismatch - boolean', () => {
    const config = {
      'string.key': 'value',
      'number.key': 42,
      'boolean.key': 'true' // should be boolean
    };
    expect(validator.validate(config)).toBe(false);
  });

  test('handles empty config and schema', () => { 
    const emptySchema: Schema = {};
    const emptyValidator = new ConfigValidator(emptySchema);
    expect(emptyValidator.validate({})).toBe(true);
  });

  test('handles config with all types', () => {
    const config = {
      'string.key': '',
      'number.key': 0,
      'boolean.key': false
    };
    expect(validator.validate(config)).toBe(true);
  });

  test('fails on unknown type in schema', () => {
    const invalidSchema: Schema = {
      'invalid.key': { type: 'invalid' as any }
    };
    const invalidValidator = new ConfigValidator(invalidSchema);
    expect(invalidValidator.validate({ 'invalid.key': 'value' })).toBe(false);
  });

  test('console.error is called on validation failure', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const config = {
      'string.key': 42, // Type mismatch
      'number.key': 42,
      'boolean.key': true
    };
    validator.validate(config);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});