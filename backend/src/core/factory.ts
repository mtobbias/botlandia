import {BrainType} from "botlandia/core/enums";
import {OpenaiBrain} from "botlandia/core/brains/openai.brain";
import {OllamaBrain} from "botlandia/core/brains/ollama.brain";
import {IBrain} from "botlandia/core/interfaces";
import {GoogleBrain} from "botlandia/core/brains/google.brain";

export class BrainFactory {
    static giveMeOneIncarnate(incarnation: string, brainType?: BrainType): IBrain {
        switch (brainType) {
            case BrainType.OPEN_AI:
                return new OpenaiBrain(incarnation);
            case BrainType.OLLAMA:
                return new OllamaBrain();
            case BrainType.GOOGLE:
                return new GoogleBrain();
            default:
                return new OpenaiBrain(incarnation);
        }

    }

    static giveMeThis(brain?: string): BrainType {
        if (!brain) {
            return BrainType.OLLAMA;
        }
        switch (brain.toUpperCase()) {
            case 'OPEN_AI':
                return BrainType.OPEN_AI;
            case 'OLLAMA':
                return BrainType.OLLAMA;
            case 'GOOGLE':
                return BrainType.GOOGLE;
            case 'GROQ':
                return BrainType.GROQ;
            default:
                return BrainType.OLLAMA;
        }
    }

}
