import {IncarnationsType} from "botlandia/core/interfaces";
import {Souls} from "botlandia/core/soul/index";

export class Incarnations {
    static iara: IncarnationsType = {
        role: Souls.getInstance().iara.assistent.role,
        name: Souls.getInstance().iara.assistent.name,
        description: Souls.getInstance().iara.assistent.description

    };
}

