declare module 'asterisk-manager' {
  interface AsteriskManagerOptions {
    username?: string;
    password?: string;
  }
  interface ActionCallback {
    (err: any, res: any): void;
  }
  class AsteriskManager {
    constructor(port: number, host: string, username: string, password: string, events: boolean);
    action(options: any, callback: ActionCallback): void;
    on(event: string, listener: (evt: any) => void): void;
    disconnect(): void;
  }
  export = AsteriskManager;
} 