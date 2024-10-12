import {ElevenLabsClient, play} from "elevenlabs";
import {Tool} from "botlandia/core/tools";
import {Logger} from "../../../../api-whatsapp/src/logger";

interface SpeakToolArgs {
    speak: string;
    voice?: string;
}

export class ElevenLabsSpeakTool extends Tool {
    static UUID = "b0dc3ffa-b59f-4bc7-8d91-961c07fd200b";
    private elevenlabs: ElevenLabsClient;

    constructor() {
        super(
            ElevenLabsSpeakTool.UUID,
            "ElevenLabsSpeakTool",
            `
                Dá voz ao agente, permitindo que ele fale e se expresse por meio de áudio.
                Forneça o texto que você deseja que o agente fale como um argumento.
                Opcionalmente, forneça a voz que será utilizada. Se não for fornecida, a voz será obtida a partir da variável de ambiente 'BOTLANDIA_BACKEND_ELEVENLABS_VOICE'.
                Esta ferramenta utiliza a API da ElevenLabs para síntese de texto para fala.
            `
        );

        this.elevenlabs = new ElevenLabsClient({
            apiKey: process.env.BOTLANDIA_BACKEND_ELEVENLABS_KEY,
        });

        this.addField({
            name: "speak",
            type: "string",
            description: "O texto que o agente irá falar.",
        });

        this.addField({
            name: "voice",
            type: "string",
            description: "Opcionalmente, a voz que será utilizada para a síntese de fala. Se não for fornecida, a voz será obtida a partir da variável de ambiente 'BOTLANDIA_BACKEND_ELEVENLABS_VOICE' ou será usado um valor padrão.",
        });
    }

    /**
     * Executa a ferramenta com os argumentos fornecidos.
     * @param arg String JSON contendo os campos 'speak' e opcionalmente 'voice'.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    async run(arg: string): Promise<string> {
        Logger.toolSaid(this.name, `Executando com os argumentos: ${arg}`);
        let objArgs: SpeakToolArgs;

        try {
            objArgs = JSON.parse(arg);
        } catch (error) {
            Logger.error("[ElevenLabsSpeakTool] Entrada JSON inválida.");
            throw new Error("Formato de entrada inválido. Esperado uma string JSON.");
        }

        const {speak, voice} = objArgs;

        if (!speak) {
            Logger.error("[ElevenLabsSpeakTool] Argumento 'speak' ausente.");
            throw new Error("Argumento 'speak' ausente.");
        }

        // Determina a voz a ser utilizada: prioriza o campo 'voice', depois a variável de ambiente, e finalmente um valor padrão
        const selectedVoice = voice || process.env.BOTLANDIA_BACKEND_ELEVENLABS_VOICE || "Alcione";

        try {
            const result = await this.say(speak, selectedVoice);
            Logger.toolSaid(this.name, `Texto falado com sucesso: "${speak}" usando a voz: "${selectedVoice}"`);
            return result;
        } catch (error: any) {
            const errorMessage = error.message || "Ocorreu um erro desconhecido.";
            Logger.error(`[ElevenLabsSpeakTool] Erro: ${errorMessage}`);
            throw new Error(`Erro no ElevenLabsSpeakTool: ${errorMessage}`);
        }
    }

    /**
     * Gera e reproduz áudio a partir do texto fornecido usando a API da ElevenLabs.
     * @param speak O texto que será sintetizado em fala.
     * @param voice A voz a ser utilizada para a síntese de fala.
     * @returns Uma promessa que resolve com uma mensagem de sucesso ou rejeita com um erro.
     */
    private async say(speak: string, voice: string): Promise<string> {
        try {
            const audio = await this.elevenlabs.generate({
                voice: voice,
                text: speak,
                model_id: "eleven_multilingual_v2",
            });

            await play(audio);
            return "Fala sintetizada e reproduzida com sucesso.";
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message;
            Logger.error(
                `[ElevenLabsSpeakTool] Erro ao gerar ou reproduzir a fala: ${errorMessage}`
            );
            throw new Error(`Erro ao gerar ou reproduzir a fala: ${errorMessage}`);
        }
    }
}
