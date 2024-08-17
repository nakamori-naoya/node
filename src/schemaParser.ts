import * as fs from 'fs';

export interface SchemaRule {
    type: 'string' | 'number' | 'boolean';
}

export interface Schema {
    [key: string]: SchemaRule;
}

export class SchemaError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SchemaError';
    }
}

export class SchemaParser {
    private schema: Schema = {};

    constructor(schemaPath: string) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        this.parseSchema(schemaContent);
    }

    private parseSchema(content: string): void {
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '' || trimmedLine.startsWith('#')) continue;

            const [key, typeString] = trimmedLine.split('->').map(part => part.trim());
            if (!key || !typeString) {
                throw new SchemaError(`Invalid schema line: ${line}`);
            }

            this.schema[key] = this.parseRule(typeString);
        }
    }

    private parseRule(typeString: string): SchemaRule {
        if (!['string', 'number', 'boolean'].includes(typeString)) {
            throw new SchemaError(`Invalid type in schema: ${typeString}`);
        }
        return { type: typeString as 'string' | 'number' | 'boolean' };
    }

    getSchema(): Schema {
        return this.schema;
    }
}

// Usage example:
try {
    const schemaParser = new SchemaParser('./config.schema');
    const schema = schemaParser.getSchema();
    console.log(JSON.stringify(schema, null, 2));
} catch (error) {
    if (error instanceof SchemaError) {
        console.error('Schema Error:', error.message);
    } else {
        console.error('Unexpected error:', error);
    }
}