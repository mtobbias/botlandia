import {IncarnationsType} from "botlandia/core/interfaces";
import {Souls} from "botlandia/core/soul/index";

export class Incarnations {
    static iara: IncarnationsType = {
        role: Souls.getInstance().iara.assistent.role,
        name: Souls.getInstance().iara.assistent.name,
        description: Souls.getInstance().iara.assistent.description

    };
    static rafaela: IncarnationsType = {
        role: Souls.getInstance().rafaela.assistent.role,
        name: Souls.getInstance().rafaela.assistent.name,
        description: Souls.getInstance().rafaela.assistent.description

    };

}

