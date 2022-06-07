type SignalListener = (done: () => void, event: any, signal: string) => (undefined | Promise<void> | Promise<any> | Promise<Error>)
type cancelSubscription = () => void


export declare module Graceful {
    let exitOnDouble: boolean;
    let timeout: number;

    function on(event: string, listener: Function, deadly?: boolean): cancelSubscription;
    function on(event: "SIGTERM", listener: SignalListener, deadly?: boolean): cancelSubscription;
    function on(event: "SIGINT", listener: SignalListener, deadly?: boolean): cancelSubscription;
    function on(event: "SIGBREAK", listener: SignalListener, deadly?: boolean): cancelSubscription;
    function on(event: "SIGHUP", listener: SignalListener, deadly?: boolean): cancelSubscription;
    function on(event: "exit", listener: SignalListener, deadly?: boolean): cancelSubscription;

    function off(event: string, listener: Function): void;

    function clear(signal?: string): void;

    function exit(code?: number | string, signal?: string): void;
}

export default Graceful
