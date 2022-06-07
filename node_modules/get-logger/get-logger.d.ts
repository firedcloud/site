export interface Logger {
  debug(format: string | number, ...params: any[]): void;
  info(format: string | number, ...params: any[]): void;
  warn(format: string | number, ...params: any[]): void;
  error(format: string | number, ...params: any[]): void;
}

export function setLoggerProvider(provider: (name: string) => Logger): void;

// Not sure how to document this with TypeScript. This is actually the default
// export (the module). setLoggerProvider is a property on this.
export function getLogger(name: string): Logger;
