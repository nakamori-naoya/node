import * as fs from 'fs';
import { ConfigValidator } from './configValidator';

interface Config {
    [key: string]: string | number | boolean;
}

export class ConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConfigError';
    }
}

export class ConfigParser {
    private lines: string[];
    private static MAX_LINE_LENGTH = 4096;
    private validator: ConfigValidator;

    constructor(filePath: string, validator: ConfigValidator) {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.lines = content.split('\n');
        this.validator = validator;
    }

    parse(): Config | null {
        const config = this.lines
            .map(this.trimLine)
            .filter(line => !this.shouldSkipLine(line))
            .reduce(this.processLine, {} as Config);

        if (this.validator.validate(config)) {
            return config;
        } else {
            console.error('Configuration does not meet the schema requirements');
            return null;
        }
    }

    private processLine = (config: Config, line: string): Config => {
        if (line.startsWith('-')) {
            return this.handleOptionalSetting(config, line);
        } else {
            return this.handleNormalSetting(config, line);
        }
    }

    private trimLine(line: string): string {
        return line.trim();
    }

    private shouldSkipLine(line: string): boolean {
        return line === '' || line.startsWith('#') || line.startsWith(';');
    }

    private handleNormalSetting(config: Config, line: string): Config {
        try {
            this.checkSyntax(line);
            this.checkLineLength(line);
            const [key, value] = this.extractKeyValue(line);
            if (key !== null && value !== null) {
                config[key] = this.parseValue(value);
            }
        } catch (error) {
            if (error instanceof ConfigError) {
                console.error(`Error in normal setting: ${error.message}`);
                throw error; // Re-throw the ConfigError for normal settings
            }
            throw new ConfigError(`Unexpected error in normal setting: ${error}`);
        }
        return config;
    }

    private handleOptionalSetting(config: Config, line: string): Config {
        line = line.slice(1).trim(); // Remove the leading '-'
        try {
            this.checkSyntax(line);
            this.checkLineLength(line);
            const [key, value] = this.extractKeyValue(line);
            if (key !== null && value !== null) {
                config[key] = this.parseValue(value);
            }
        } catch (error) {
            if (error instanceof ConfigError) {
                console.warn(`Warning in optional setting: ${error.message}`);
            } else {
                console.warn(`Unexpected warning in optional setting: ${error}`);
            }
        }
        return config;
    }

    private checkSyntax(line: string): void {
        if (!line.includes('=')) {
            throw new ConfigError(`Syntax error: Missing '=' in line: ${line}`);
        }
        const parts = line.split('=');
        if (parts.length > 2) {
            throw new ConfigError(`Syntax error: Multiple '=' in line: ${line}`);
        }
        if (parts[0].trim() === '') {
            throw new ConfigError(`Syntax error: Empty key in line: ${line}`);
        }
    }

    private checkLineLength(line: string): void {
        if (line.length > ConfigParser.MAX_LINE_LENGTH) {
            throw new ConfigError(`Line length exceeds maximum of ${ConfigParser.MAX_LINE_LENGTH} characters: ${line.substring(0, 50)}...`);
        }
    }

    private extractKeyValue(line: string): [string | null, string | null] {
        const separatorIndex = line.indexOf('=');
        if (separatorIndex === -1) {
            return [null, null];
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1);  // トリミングしない

        return [key || null, value];
    }

    private parseValue(value: string): string | number | boolean {
        const trimmedValue = value.trim();
        if (trimmedValue === '') return '';  // 空文字列や空白のみの場合
        if (trimmedValue.toLowerCase() === 'true') return true;
        if (trimmedValue.toLowerCase() === 'false') return false;
        const num = Number(trimmedValue);
        if (!isNaN(num)) return num;
        return trimmedValue;
    }
}