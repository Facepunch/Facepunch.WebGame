namespace Facepunch {
    export namespace WebGame {
        export enum MaterialPropertyType {
            Boolean = 1,
            Number = 2,
            TextureUrl = 3
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
            private static nextId = 0;

            readonly id = Material.nextId++;
            readonly properties: any = {};

            program: ShaderProgram;
            enabled = true;

            constructor();
            constructor(program: ShaderProgram);
            constructor(program?: ShaderProgram) {
                this.program = program;
            }
        }

        export class MaterialLoadable extends Material implements ILoadable {
            private readonly game: Game;
            private readonly url: string;

            constructor(game: Game, url: string) {
                super();

                this.game = game;
                this.url = url;
            }

            private addPropertyFromInfo(info: IMaterialProperty): void {
                switch (info.type) {
                    case MaterialPropertyType.Boolean:
                    case MaterialPropertyType.Number:
                        this.properties[info.name] = info.value as boolean | number;
                        break;
                    case MaterialPropertyType.TextureUrl:
                        this.properties[info.name] = this.game.textureLoader.load(info.value as string);
                        break;
                }
            }
            
            loadNext(callback: (requeue: boolean) => void): void {
                if (this.program != null) {
                    callback(false);
                    return;
                }

                Http.getJson<IMaterialInfo>(this.url, info => {
                    this.program = this.game.shaders.get(info.shader);

                    for (let i = 0; i < info.properties.length; ++i) {
                        this.addPropertyFromInfo(info.properties[i]);
                    }

                    callback(false);
                }, error => {
                    console.error(`Failed to load material ${this.url}: ${error}`);
                    callback(false);
                });
            }
        }
    }
}