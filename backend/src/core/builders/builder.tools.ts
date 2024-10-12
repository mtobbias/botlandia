import {FieldTool, ITool} from "botlandia/core/interfaces";
import {Tool} from "botlandia/core/tools";

export class BuilderTools {
    private description?: string;
    private name?: string;
    private uuid?: string;
    private callbackTool?: CallbackTool
    private fields: FieldTool[] = [];

    withName(name: string): BuilderTools {
        this.name = name;
        return this;
    }

    withUuid(uuid: string): BuilderTools {
        this.uuid = uuid;
        return this;
    }

    withDescription(description: string): BuilderTools {
        this.description = description
        return this;
    }

    withField(fieldTool: FieldTool): BuilderTools {
        this.fields.push(fieldTool)
        return this;
    }

    withRun(callbackTool: CallbackTool): BuilderTools {
        this.callbackTool = callbackTool
        return this;
    }

    build(): ITool {
        if (this.name && this.description && this.callbackTool && this.uuid) {
            return new AbstractTools(this.uuid, this.name, this.description, this.fields, this.callbackTool)
        }
        throw new Error("to build tool i need all fields");
    }
}

type CallbackTool = (args: any) => any;

export class AbstractTools extends Tool {
    callbackTool: CallbackTool
    fields: FieldTool[] = [];

    constructor(uuid: string, name: string, description: string, fields: FieldTool[], callbackTool: CallbackTool) {
        super(uuid, name, description);
        this.fields = fields;
        this.callbackTool = callbackTool;
    }

    run(args: any): any {
        return this.callbackTool(args)
    }


}

export class BuilderFieldTool {
    private name?: string;
    private type?: string;
    private description?: string;

    withName(name: string): BuilderFieldTool {
        this.name = name
        return this;
    }

    withDescription(description: string): BuilderFieldTool {
        this.description = description
        return this;
    }

    withType(type: string): BuilderFieldTool {
        this.type = type
        return this;
    }

    build(): FieldTool {
        if (this.name && this.description && this.type) {
            return {
                type: this.type,
                name: this.name,
                description: this.description
            }
        }
        throw new Error("to build tool i need all fields");
    }


}