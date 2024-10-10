import robot from "robotjs";
// @ts-ignore
import {PNG} from "pngjs";
import * as fs from "fs";
import {Tool} from "botlandia/core/tools";
import {Logger} from "botlandia/utils/logger";

type MouseButton = "left" | "right" | "middle";
type MouseToggleDirection = "down" | "up";
type KeyModifier = "alt" | "command" | "control" | "shift" | "right_shift";

type Key =
    | "backspace"
    | "delete"
    | "enter"
    | "tab"
    | "escape"
    | "up"
    | "down"
    | "right"
    | "left"
    | "home"
    | "end"
    | "pageup"
    | "pagedown"
    | "f1"
    | "f2"
    | "f3"
    | "f4"
    | "f5"
    | "f6"
    | "f7"
    | "f8"
    | "f9"
    | "f10"
    | "f11"
    | "f12"
    | "command"
    | "alt"
    | "control"
    | "shift"
    | "right_shift"
    | "space"
    | "printscreen"
    | "insert"
    | "audio_mute"
    | "audio_vol_down"
    | "audio_vol_up"
    | "audio_play"
    | "audio_stop"
    | "audio_pause"
    | "audio_prev"
    | "audio_next"
    | "audio_rewind"
    | "audio_forward"
    | "audio_repeat"
    | "audio_random"
    | "numpad_0"
    | "numpad_1"
    | "numpad_2"
    | "numpad_3"
    | "numpad_4"
    | "numpad_5"
    | "numpad_6"
    | "numpad_7"
    | "numpad_8"
    | "numpad_9"
    | "lights_mon_up"
    | "lights_mon_down"
    | "lights_kbd_toggle"
    | "lights_kbd_up"
    | "lights_kbd_down"
    | string; // Para permitir letras e números

type Action =
    | "setKeyboardDelay"
    | "keyTap"
    | "keyToggle"
    | "typeString"
    | "typeStringDelayed"
    | "setMouseDelay"
    | "moveMouse"
    | "moveMouseSmooth"
    | "mouseClick"
    | "mouseToggle"
    | "dragMouse"
    | "getMousePos"
    | "scrollMouse"
    | "getPixelColor"
    | "getScreenSize"
    | "captureScreen";

interface RobotJSToolArgs {
    action: string; // Todos os valores agora são strings
    x?: string;
    y?: string;
    button?: string;
    double?: string;
    direction?: string;
    amount?: string;
    key?: string;
    modifiers?: string;
    text?: string;
    ms?: string;
    cpm?: string;
    width?: string;
    height?: string;
    filePath?: string; // Novo campo para o caminho do arquivo
}

export class RobotJSTool extends Tool {
    static UUID = "e5d2c5b4-7a2f-4c0a-8b8d-123456789abc";

    constructor() {
        super(
            RobotJSTool.UUID,
            "RobotJSTool",
            `
      Esta ferramenta permite automatizar ações de teclado e mouse usando o RobotJS.
      Você pode mover o mouse, realizar cliques, digitar strings, simular pressionamentos de teclas,
      obter a posição do mouse, obter a cor de um pixel, capturar partes da tela e recuperar o tamanho da tela.

      Todos os parâmetros devem ser passados como strings. Se um parâmetro requer um número, passe-o como string numérica.
      Para parâmetros que são arrays (como 'modifiers'), passe uma string com valores separados por vírgula e sem espaços.
      `
        );

        // Definição dos campos suportados
        this.addField({
            name: "action",
            type: "string",
            description: `A ação a ser executada. Valores possíveis: ${this.getAllowedActions().join(", ")}`,
        });
        this.addField({
            name: "x",
            type: "string",
            description: "A coordenada x (como string numérica).",
        });
        this.addField({
            name: "y",
            type: "string",
            description: "A coordenada y (como string numérica).",
        });
        this.addField({
            name: "button",
            type: "string",
            description: `O botão do mouse. Valores possíveis: 'left', 'right', 'middle'.`,
        });
        this.addField({
            name: "double",
            type: "string",
            description: "Se deve executar um duplo clique ('true' ou 'false').",
        });
        this.addField({
            name: "direction",
            type: "string",
            description: "A direção para 'mouseToggle'. Valores: 'up', 'down'.",
        });
        this.addField({
            name: "amount",
            type: "string",
            description: "A quantidade para 'scrollMouse' (como string numérica).",
        });
        this.addField({
            name: "key",
            type: "string",
            description: "A tecla a ser pressionada (para 'keyTap' e 'keyToggle').",
        });
        this.addField({
            name: "modifiers",
            type: "string",
            description: "Modificadores separados por vírgula (e.g., 'control,alt').",
        });
        this.addField({
            name: "text",
            type: "string",
            description: "O texto a ser digitado (para 'typeString' e 'typeStringDelayed').",
        });
        this.addField({
            name: "ms",
            type: "string",
            description: "Tempo em milissegundos (como string numérica).",
        });
        this.addField({
            name: "cpm",
            type: "string",
            description: "Caracteres por minuto (como string numérica).",
        });
        this.addField({
            name: "width",
            type: "string",
            description: "Largura (como string numérica).",
        });
        this.addField({
            name: "height",
            type: "string",
            description: "Altura (como string numérica).",
        });
        this.addField({
            name: "filePath",
            type: "string",
            description: "Caminho para salvar a captura de tela (para 'captureScreen').",
        });
    }

    private getAllowedActions(): Action[] {
        return [
            "setKeyboardDelay",
            "keyTap",
            "keyToggle",
            "typeString",
            "typeStringDelayed",
            "setMouseDelay",
            "moveMouse",
            "moveMouseSmooth",
            "mouseClick",
            "mouseToggle",
            "dragMouse",
            "getMousePos",
            "scrollMouse",
            "getPixelColor",
            "getScreenSize",
            "captureScreen",
        ];
    }

    private validateArgs(args: RobotJSToolArgs): void {
        const {action} = args;

        if (!this.getAllowedActions().includes(action as Action)) {
            throw new Error(`Ação inválida: ${action}. Ações permitidas: ${this.getAllowedActions().join(", ")}`);
        }

        // Validações específicas para cada ação
        switch (action) {
            // ... (Outras validações permanecem iguais)

            case "captureScreen":
                // x, y, width, height são opcionais, mas se fornecidos, devem ser números
                ["x", "y", "width", "height"].forEach((param) => {
                    const value = args[param as keyof RobotJSToolArgs];
                    if (value && isNaN(parseInt(value))) {
                        throw new Error(`O parâmetro '${param}' deve ser um número (como string) para 'captureScreen'.`);
                    }
                });
                if (!args.filePath) {
                    throw new Error("O parâmetro 'filePath' é obrigatório para 'captureScreen'.");
                }
                break;

            // Ações sem parâmetros adicionais
            case "getMousePos":
            case "getScreenSize":
                break;

            default:
                throw new Error(`Ação não suportada: ${action}`);
        }
    }

    async run(arg: string): Promise<any> {
        Logger.toolSaid(this.name, `Executando com argumentos: ${arg}`);

        let args: RobotJSToolArgs;

        try {
            args = JSON.parse(arg);
        } catch (error) {
            Logger.error("[RobotJSTool] Entrada JSON inválida.");
            throw new Error("Formato de entrada inválido. Esperado uma string JSON.");
        }

        try {
            this.validateArgs(args);
        } catch (validationError: any) {
            Logger.error(`[RobotJSTool] Erro de validação: ${validationError.message}`);
            throw validationError;
        }

        // Parsing dos valores
        const action = args.action;
        const x = args.x ? parseInt(args.x) : undefined;
        const y = args.y ? parseInt(args.y) : undefined;
        const button = args.button as MouseButton || "left";
        const double = args.double === "true";
        const direction = args.direction as MouseToggleDirection;
        const key = args.key as Key;
        const modifiers = args.modifiers ? args.modifiers.split(",") as KeyModifier[] : [];
        const text = args.text;
        const ms = args.ms ? parseInt(args.ms) : undefined;
        const cpm = args.cpm ? parseInt(args.cpm) : undefined;
        const width = args.width ? parseInt(args.width) : undefined;
        const height = args.height ? parseInt(args.height) : undefined;
        const filePath = args.filePath;

        try {
            switch (action) {
                // ... (Outros casos permanecem iguais)

                case "captureScreen":
                    const screenWidth = robot.getScreenSize().width;
                    const screenHeight = robot.getScreenSize().height;

                    const captureX = x || 0;
                    const captureY = y || 0;
                    const captureWidth = width || screenWidth;
                    const captureHeight = height || screenHeight;

                    const img = robot.screen.capture(
                        captureX,
                        captureY,
                        captureWidth,
                        captureHeight
                    );

                    // Cria um novo objeto PNG
                    const png = new PNG({
                        width: img.width,
                        height: img.height,
                    });

                    // Converte de BGRA para RGBA
                    for (let i = 0; i < img.image.length; i += 4) {
                        // BGRA -> RGBA
                        png.data[i] = img.image[i + 2];     // R
                        png.data[i + 1] = img.image[i + 1]; // G
                        png.data[i + 2] = img.image[i];     // B
                        png.data[i + 3] = img.image[i + 3]; // A
                    }

                    // Escreve o PNG para o caminho especificado
                    await new Promise<void>((resolve, reject) => {
                        const writeStream = fs.createWriteStream(filePath!);
                        png.pack().pipe(writeStream)
                            .on('finish', resolve)
                            .on('error', reject);
                    });

                    Logger.toolSaid(this.name, `Captura de tela salva em '${filePath}'.`);
                    return `Captura de tela salva em '${filePath}'.`;

                default:
                    Logger.error(`[RobotJSTool] Ação não reconhecida: ${action}`);
                    throw new Error(`Ação não reconhecida: ${action}`);
            }
        } catch (error: any) {
            Logger.error(`[RobotJSTool] Erro ao executar ação '${action}': ${error.message}`);
            throw new Error(`Erro ao executar ação '${action}': ${error.message}`);
        }
    }
}
