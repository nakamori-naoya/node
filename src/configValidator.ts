import { Schema, SchemaRule } from './schemaParser';

interface Config {
    [key: string]: string | number | boolean;
}

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigError';
    }
}

export class ConfigValidator {
    private schema: Schema;

    constructor(schema: Schema) {
        this.schema = schema;
    }

    validate(config: Config): boolean {
        try {
            this.validateRequiredFields(config);
            this.validateNoExtraFields(config);
            this.validateTypes(config);
            return true;
        } catch (error) {
            if (error instanceof ConfigError) {
                console.error('Validation Error:', error.message);
            } else {
                console.error('Unexpected error during validation:', error);
            }
            return false;
        }
    }

    private validateRequiredFields(config: Config): void {
        for (const key of Object.keys(this.schema)) {
            if (!(key in config)) {
                throw new ConfigError(`Missing required configuration key: ${key}`);
            }
        }
    }

    private validateNoExtraFields(config: Config): void {
        for (const key of Object.keys(config)) {
            if (!(key in this.schema)) {
                throw new ConfigError(`Unknown configuration key: ${key}`);
            }
        }
    }

    private validateTypes(config: Config): void {
        for (const [key, value] of Object.entries(config)) {
            const rule = this.schema[key];
            this.validateField(key, value, rule);
        }
    }

    private validateField(key: string, value: any, rule: SchemaRule): void {
        switch (rule.type) {
            case 'string':
                if (typeof value !== 'string') {
                    throw new ConfigError(`Type mismatch for ${key}: expected string, got ${typeof value}`);
                }
                break;
            case 'number':
                if (typeof value !== 'number') {
                    throw new ConfigError(`Type mismatch for ${key}: expected number, got ${typeof value}`);
                }
                break;
            case 'boolean':
                if (typeof value !== 'boolean') {
                    throw new ConfigError(`Type mismatch for ${key}: expected boolean, got ${typeof value}`);
                }
                break;
            default:
                throw new ConfigError(`Unknown type in schema for ${key}: ${rule.type}`);
        }
    }
}

