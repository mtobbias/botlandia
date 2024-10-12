
/**
 * Enumeração dos níveis de log disponíveis.
 */
export enum LogLevel {
    DEBUG = 0, // Detalhes de diagnóstico
    INFO = 1,  // Informações gerais
    WARN = 2,  // Avisos sobre possíveis problemas
    ERROR = 3, // Erros que ocorreram
}

/**
 * Enumeração das cores disponíveis para formatação de logs no console.
 */
export enum LogColor {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underline = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",

    // Cores de primeiro plano
    Black = "\x1b[30m",
    Red = "\x1b[31m",
    Green = "\x1b[32m",
    Yellow = "\x1b[33m",
    Blue = "\x1b[34m",
    Magenta = "\x1b[35m",
    Cyan = "\x1b[36m",
    White = "\x1b[37m",
    Gray = "\x1b[90m",

    // Cores de fundo
    BGGreen = "\x1b[42m",
    BGWhite = "\x1b[47m",
}

/**
 * Classe utilitária para gerenciamento de logs com diferentes níveis e cores.
 */
export class Logger {
    /**
     * Obtém a cor correspondente ao nível de log fornecido.
     * @param {LogLevel} level - O nível de log.
     * @returns {string} A sequência de escape ANSI correspondente à cor.
     */
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
            default:
                return LogColor.Reset;
        }
    }

    /**
     * Exibe uma mensagem de log com a cor especificada.
     * @param {LogColor} color - A cor a ser aplicada à mensagem.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static logColor(color: LogColor, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        console.log(`${color}[${timestamp}] ${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log com base no nível especificado.
     * @param {LogLevel} level - O nível de log.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    private static log(level: LogLevel, message: string, ...args: any[]): void {
        const color = this.getLevelColor(level);
        const timestamp = new Date().toISOString();
        console.log(`${color}[${timestamp}] [${LogLevel[level]}] ${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log no nível DEBUG.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    /**
     * Exibe uma mensagem de log no nível INFO.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    /**
     * Exibe uma mensagem de log no nível WARN.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    /**
     * Exibe uma mensagem de log no nível ERROR.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static error(message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }

    /**
     * Exibe uma mensagem de log de sucesso com destaque em verde e negrito.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static success(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Bright}${LogColor.Green}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log em preto.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static black(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Black}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log em azul.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static blue(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Blue}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log em magenta.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static magenta(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Magenta}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log em branco.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static white(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.White}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log em verde.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static green(message: string, ...args: any[]): void {
        this.logColor(LogColor.Green, `${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log em amarelo.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static yellow(message: string, ...args: any[]): void {
        this.logColor(LogColor.Yellow, `${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log em negrito.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static bright(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Bright}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log com texto embaçado.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static dim(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Dim}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log com sublinhado.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static underline(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Underline}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log com efeito de piscar.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static blink(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Blink}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log com efeito reverso.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static reverse(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Reverse}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log oculta.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static hidden(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, `${LogColor.Hidden}${message}${LogColor.Reset}`, ...args);
    }

    /**
     * Exibe uma mensagem de log personalizada com fundo verde e texto branco.
     * @param {string} message - A mensagem a ser exibida.
     * @param {...any[]} args - Argumentos adicionais para a mensagem.
     */
    public static whatslog(message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `${LogColor.BGGreen}${LogColor.White}[${timestamp}] BOTLANDIA-API-WHATSAPP: ${message.toUpperCase()}${LogColor.Reset}`;
        console.log(formattedMessage, ...args);
    }
}
