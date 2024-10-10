import path from "path";
import fs from "fs";
import * as yaml from "js-yaml";

export class Souls {
    private static instance?: Souls;
    public readonly iara;
    public readonly rafaela;

    constructor() {
        this.iara = this.readSoulFromFile('iara.yaml')
        this.rafaela = this.readSoulFromFile('rafaela.yaml')
    }

    private readSoulFromFile(fileSoul: string) {
      const soulsDir = path.resolve(process.cwd(), 'souls');
        const filePath = path.resolve(soulsDir, fileSoul);
        // Verifica se o arquivo existe antes de tentar ler
        if (!fs.existsSync(filePath)) {
            throw new Error(`Arquivo YAML não encontrado: ${filePath}`);
        }
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return yaml.load(fileContents);
    }

    static getInstance(): any {
        if (this.instance === undefined) {
            this.instance = new Souls();
        }
        return this.instance;
    }
}

export * from './'