import { SchemaParser, SchemaError } from './schemaParser';
import * as fs from 'fs';

jest.mock('fs');

describe('SchemaParser', () => {
  let mockReadFileSync: jest.MockedFunction<typeof fs.readFileSync>;

  beforeEach(() => {
    mockReadFileSync = fs.readFileSync as jest.MockedFunction<typeof fs.readFileSync>;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('parses valid schema with all types', () => {
    mockReadFileSync.mockReturnValue(
      'string.key -> string\n' +
      'number.key -> number\n' +
      'boolean.key -> boolean'
    );
    const parser = new SchemaParser('dummy.schema');
    const schema = parser.getSchema();
    expect(schema).toEqual({
      'string.key': { type: 'string' },
      'number.key': { type: 'number' },
      'boolean.key': { type: 'boolean' }
    });
  });

  test('ignores empty lines and comments', () => {
    mockReadFileSync.mockReturnValue(
      '# This is a comment\n' +
      '\n' +
      'valid.key -> string\n' +
      '  # Another comment\n' +
      '  \n' +
      'another.key -> number'
    );
    const parser = new SchemaParser('dummy.schema');
    const schema = parser.getSchema();
    expect(schema).toEqual({
      'valid.key': { type: 'string' },
      'another.key': { type: 'number' }
    });
  });

  test('throws SchemaError for invalid schema line', () => {
    mockReadFileSync.mockReturnValue('invalid_line_without_arrow');
    expect(() => new SchemaParser('dummy.schema')).toThrow(SchemaError);
  });

  test('throws SchemaError for invalid type', () => {
    mockReadFileSync.mockReturnValue('key -> invalid_type');
    expect(() => new SchemaParser('dummy.schema')).toThrow(SchemaError);
  });

  test('handles multiple lines with mixed types', () => {
    mockReadFileSync.mockReturnValue(
      'string.key -> string\n' +
      'number.key -> number\n' +
      'boolean.key -> boolean\n' +
      'another.string -> string'
    );
    const parser = new SchemaParser('dummy.schema');
    const schema = parser.getSchema();
    expect(schema).toEqual({
      'string.key': { type: 'string' },
      'number.key': { type: 'number' },
      'boolean.key': { type: 'boolean' },
      'another.string': { type: 'string' }
    });
  });

  test('handles keys with dots', () => {
    mockReadFileSync.mockReturnValue('key.with.many.dots -> string');
    const parser = new SchemaParser('dummy.schema');
    const schema = parser.getSchema();
    expect(schema).toEqual({
      'key.with.many.dots': { type: 'string' }
    });
  });

  test('throws SchemaError for empty key', () => {
    mockReadFileSync.mockReturnValue(' -> string');
    expect(() => new SchemaParser('dummy.schema')).toThrow(SchemaError);
  });

  test('throws SchemaError for empty type', () => {
    mockReadFileSync.mockReturnValue('key -> ');
    expect(() => new SchemaParser('dummy.schema')).toThrow(SchemaError);
  });

  test('handles whitespace around arrow', () => {
    mockReadFileSync.mockReturnValue('key   ->   string');
    const parser = new SchemaParser('dummy.schema');
    const schema = parser.getSchema();
    expect(schema).toEqual({
      'key': { type: 'string' }
    });
  });

  test('handles empty schema file', () => {
    mockReadFileSync.mockReturnValue('');
    const parser = new SchemaParser('dummy.schema');
    const schema = parser.getSchema();
    expect(schema).toEqual({});
  });

  test('throws SchemaError for multiple arrows in one line', () => {
    mockReadFileSync.mockReturnValue('key -> type -> invalid');
    expect(() => new SchemaParser('dummy.schema')).toThrow(SchemaError);
  });
});