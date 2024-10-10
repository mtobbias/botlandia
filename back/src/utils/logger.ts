export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
}

export enum LogColor {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underline = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",

    Black = "\x1b[30m",
    Red = "\x1b[31m",
    Green = "\x1b[32m",
    Yellow = "\x1b[33m",
    Blue = "\x1b[34m",
    Magenta = "\x1b[35m",
    Cyan = "\x1b[36m",
    White = "\x1b[37m",
    Gray = "\x1b[90m",
}

export class Logger {
    private static getLevelColor(level: LogLevel): string {
        switch (level) {
            case LogLevel.DEBUG:
                return LogColor.Gray;
            case LogLevel.INFO:
                return LogColor.Cyan;
            case LogLevel.WARN:
                return LogColor.Yellow;
            case LogLevel.ERROR:
                return LogColor.Red;
        }
    }

    public static logColor(color: LogColor, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        console.log(`${color}[${timestamp}] ${message}${LogColor.Reset}`, ...args);
    }

    private static log(level: LogLevel, message: string, ...args: any[]): void {
        const color = this.getLevelColor(level);
        const timestamp = new Date().toISOString();
        console.log(`${color}[${timestamp}] [${LogLevel[level]}] ${message}${LogColor.Reset}`, ...args);
    }

    public static debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    public static info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    public static warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    public static error(message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }

    public static toolSaid(tool: string, message: string): void {
        this.log(LogLevel.INFO, `${LogColor.Magenta}[${tool}] said: ${message}${LogColor.Reset}`);
    }

    public static toolSaidSquad(agent: string, squad: string, message: string): void {
        this.log(LogLevel.INFO, `${LogColor.Bright}${LogColor.Red}[${squad}] - [${agent}] said: ${message}${LogColor.Reset}`);
    }

    public static agentSaidSquad(agent: string, squad: string, message: string): void {
        this.log(LogLevel.INFO, `${LogColor.Bright}${LogColor.Yellow}[${squad}] - [${agent}] said: ${message}${LogColor.Reset}`);
    }

    public static agentSaid(agent: string, message: string): void {
        this.log(LogLevel.INFO, `${LogColor.Green}[${agent}] said: ${message}${LogColor.Reset}`);
    }

    public static success(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Bright}${LogColor.Green}${message}${LogColor.Reset}`, ...args);
    }

    // Métodos para as cores não utilizadas:

    public static black(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Black}${message}${LogColor.Reset}`, ...args);
    }

    public static blue(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Blue}${message}${LogColor.Reset}`, ...args);
    }

    public static magenta(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Magenta}${message}${LogColor.Reset}`, ...args);
    }

    public static white(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.White}${message}${LogColor.Reset}`, ...args);
    }

    public static green(message: string, ...args: any[]): void {
        this.logColor(LogColor.Green, `${message}${LogColor.Reset}`, ...args);
    }

    public static yellow(message: string, ...args: any[]): void {
        this.logColor(LogColor.Yellow, `${message}${LogColor.Reset}`, ...args);
    }

    // Métodos para formatação de texto:

    public static bright(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Bright}${message}${LogColor.Reset}`, ...args);
    }

    public static dim(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Dim}${message}${LogColor.Reset}`, ...args);
    }

    public static underline(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Underline}${message}${LogColor.Reset}`, ...args);
    }

    public static blink(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Blink}${message}${LogColor.Reset}`, ...args);
    }

    public static reverse(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Reverse}${message}${LogColor.Reset}`, ...args);
    }

    public static hidden(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Hidden}${message}${LogColor.Reset}`, ...args);
    }
}
