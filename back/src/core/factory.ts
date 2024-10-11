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
}
