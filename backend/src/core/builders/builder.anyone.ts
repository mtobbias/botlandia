import {BrainType} from "botlandia/core/enums";
import {ITool} from "botlandia/core/interfaces";
import {Anyone} from "botlandia/core/anyone";
import {BrainFactory} from "botlandia/core/factory";

export class BuilderAnyone {
    private brainType?: BrainType;
    private incarnation?: string
    private role?: string
    private name?: string
    private avatarUrl?: string;
    private tools: ITool[] = []

    withTool(tool: ITool): BuilderAnyone {
        this.tools.push(tool);
        return this;
    }

    withAllTool(tools: ITool[]): BuilderAnyone {
        this.tools.push(...tools)
        return this;
    }

    withBrain(brainType: BrainType): BuilderAnyone {
        this.brainType = brainType;
        return this;
    }

    withThisIncarnation(incarnation: string): BuilderAnyone {
        this.incarnation = incarnation
        return this;
    }

    withName(name: string): BuilderAnyone {
        this.name = name
        return this;
    }

    withAvatarUrl(avatarUrl: string): BuilderAnyone {
        this.avatarUrl = avatarUrl
        return this;
    }

    withRole(role: string): BuilderAnyone {
        this.role = role
        return this;
    }

    build(): Anyone {
        if ((this.brainType !== undefined) && (this.incarnation !== undefined) && (this.role !== undefined) && (this.name !== undefined)) {
            const brainIncarnate = BrainFactory.giveMeOneIncarnate(this.incarnation, this.brainType)
            return new Anyone(brainIncarnate, this.role, this.tools, this.name, this.avatarUrl);
        }
        throw new Error("Invalid brain or incarnation, i need one brain and one incarnation");
    }
}
