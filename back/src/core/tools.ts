import * as dotenv from "dotenv";
import {FieldTool, ITool} from "botlandia/core/interfaces";
dotenv.config();


export class Tool implements ITool {
    uuid;
    name;
    description;
    fields: FieldTool[] = [];

    constructor(uuid: string, name: string, description: string) {
        this.uuid = uuid;
        this.name = name;
        this.description = description;
        this.addField({
            name: "help",
            type: "string",
            description:
                "help about this tool.",
        });
    }

    public addField(field: FieldTool) {
        this.fields.push(field);
    }

    run(args: any): any {
    }

    help(): string {
        return "";
    }

}