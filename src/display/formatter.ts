import chalk from 'chalk';

// Unicode Box Drawing Characters
export const BOX_CHARS = {
  HORIZONTAL: '─',
  VERTICAL: '│',
  TOP_LEFT: '┌',
  TOP_RIGHT: '┐',
  BOTTOM_LEFT: '└',
  BOTTOM_RIGHT: '┘',
  CROSS: '┼',
  TOP: '┬',
  BOTTOM: '┴'
} as const;

// Status Icons
export const ICONS = {
  SUCCESS: '✓',
  ERROR: '✗',
  WARNING: '⚠',
  INFO: 'ℹ',
  RUNNING: '⏳',
  COMPLETE: '✅',
  FAILED: '❌'
} as const;

export class Formatter {
  static header(text: string, width: number = 60): string {
    const padding = Math.floor((width - text.length - 2) / 2);
    const leftPadding = ' '.repeat(padding);
    const rightPadding = ' '.repeat(width - text.length - 2 - padding);
    
    const topLine = chalk.cyan(BOX_CHARS.TOP_LEFT + BOX_CHARS.HORIZONTAL.repeat(width) + BOX_CHARS.TOP_RIGHT);
    const middleLine = chalk.cyan(BOX_CHARS.VERTICAL) + leftPadding + chalk.bold.white(text) + rightPadding + chalk.cyan(BOX_CHARS.VERTICAL);
    const bottomLine = chalk.cyan(BOX_CHARS.BOTTOM_LEFT + BOX_CHARS.HORIZONTAL.repeat(width) + BOX_CHARS.BOTTOM_RIGHT);
    
    return [topLine, middleLine, bottomLine].join('\n');
  }

  static iterationHeader(current: number, total: number, width: number = 60): string {
    const text = `ITERATION ${current}/${total}`;
    const padding = Math.floor((width - text.length - 2) / 2);
    const leftPadding = ' '.repeat(padding);
    const rightPadding = ' '.repeat(width - text.length - 2 - padding);
    
    const topLine = chalk.magenta(BOX_CHARS.TOP_LEFT + BOX_CHARS.HORIZONTAL.repeat(width) + BOX_CHARS.TOP_RIGHT);
    const middleLine = chalk.magenta(BOX_CHARS.VERTICAL) + leftPadding + chalk.bold.white(text) + rightPadding + chalk.magenta(BOX_CHARS.VERTICAL);
    const bottomLine = chalk.magenta(BOX_CHARS.BOTTOM_LEFT + BOX_CHARS.HORIZONTAL.repeat(width) + BOX_CHARS.BOTTOM_RIGHT);
    
    return [topLine, middleLine, bottomLine].join('\n');
  }

  static section(text: string): string {
    return `\n${chalk.bold.blue('▶ ' + text)}`;
  }

  static success(text: string): string {
    return `  ${chalk.green(ICONS.SUCCESS)} ${text}`;
  }

  static error(text: string): string {
    return `  ${chalk.red(ICONS.ERROR)} ${text}`;
  }

  static warning(text: string): string {
    return `  ${chalk.yellow(ICONS.WARNING)} ${text}`;
  }

  static info(text: string): string {
    return `  ${chalk.blue(ICONS.INFO)} ${text}`;
  }

  static status(level: 'running' | 'complete' | 'failed', text: string): string {
    switch (level) {
      case 'running':
        return `  ${chalk.yellow(ICONS.RUNNING)} ${text}`;
      case 'complete':
        return `  ${chalk.green(ICONS.COMPLETE)} ${text}`;
      case 'failed':
        return `  ${chalk.red(ICONS.FAILED)} ${text}`;
      default:
        return `  ${text}`;
    }
  }

  static separator(width: number = 60): string {
    return chalk.dim(BOX_CHARS.HORIZONTAL.repeat(width));
  }

  static highlight(text: string): string {
    return chalk.magenta(text);
  }

  static dim(text: string): string {
    return chalk.dim(text);
  }

  static bold(text: string): string {
    return chalk.bold(text);
  }
}