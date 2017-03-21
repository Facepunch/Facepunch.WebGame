namespace Facepunch {
    export namespace WebGame {
        export enum MaterialPropertyType {
            Boolean,
            Number,
            TextureUrl
        }

        export interface IMaterialProperty {
            type: MaterialPropertyType;
            name: string;
            value: boolean | number | string;
        }
        
        export interface IMaterialInfo {
            shader: string;
            properties: IMaterialProperty[];
        }

        export class Material {
            private static nextSortIndex = 0;

            readonly sortIndex: number;

            readonly properties: any = {};
            readonly program: ShaderProgram;

            enabled = true;

            constructor(game: Game, info: IMaterialInfo);
            constructor(game: Game, shaderCtor: IProgramCtor);
            constructor(game: Game, shaderName: string);
            constructor(game: Game, infoOrShader: IMaterialInfo | IProgramCtor | string) {
                this.sortIndex = Material.nextSortIndex++;

                if (typeof infoOrShader === "string") {
                    this.program = game.shaders.get(infoOrShader as string);
                } else if (typeof infoOrShader === "function") {
                    this.program = game.shaders.get(infoOrShader as IProgramCtor);
                } else {
                    const info = infoOrShader as IMaterialInfo;
                    this.program = game.shaders.get(info.shader);

                    for (let i = 0; i < info.properties.length; ++i) {
                        this.addPropertyFromInfo(game, info.properties[i]);
                    }
                }
            }

            private addPropertyFromInfo(game: Game, info: IMaterialProperty): void {
                switch (info.type) {
                    case MaterialPropertyType.Boolean:
                    case MaterialPropertyType.Number:
                        this.properties[info.name] = info.value as boolean | number;
                        break;
                    case MaterialPropertyType.TextureUrl:
                        this.properties[info.name] = game.textureLoader.load(info.value as string);
                        break;
                }
            }
        }
    }
}