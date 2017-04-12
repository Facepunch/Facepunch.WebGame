/// <reference path="RenderResource.ts"/>

namespace Facepunch {
    export namespace WebGame {
        export enum MaterialPropertyType {
            Boolean = 1,
            Number = 2,
            Color = 3,
            TextureUrl = 4,
            TextureIndex = 5,
            TextureInfo = 6
        }

        export interface IMaterialProperty {
            type: MaterialPropertyType;
            name: string;
            value: boolean | number | string | ITextureInfo | IColor;
        }
        
        export interface IMaterialInfo {
            shader: string;
            properties: IMaterialProperty[];
        }

        export class Material extends RenderResource<Material> {
            private static nextId = 0;

            readonly id = Material.nextId++;

            properties: any;

            program: ShaderProgram;
            enabled = true;

            constructor();
            constructor(program: ShaderProgram);
            constructor(program?: ShaderProgram) {
                super();

                this.program = program;

                if (program != null) {
                    this.properties = program.createMaterialProperties();
                } else {
                    this.properties = {};
                }
            }

            isLoaded(): boolean {
                return this.program != null;
            }
        }

        export class MaterialLoadable extends Material implements ILoadable {
            private static nextDummyId = 0;

            private readonly game: Game;
            private readonly url: string;

            private textureSource: (index: number) => Texture;

            constructor(game: Game, url?: string) {
                super();

                this.game = game;
                this.url = url;
            }

            private addPropertyFromInfo(info: IMaterialProperty): void {
                switch (info.type) {
                    case MaterialPropertyType.Boolean:
                    case MaterialPropertyType.Number: {
                        this.properties[info.name] = info.value as boolean | number;
                        break;
                    }
                    case MaterialPropertyType.Color: {
                        let vec = this.properties[info.name];
                        if (vec === undefined) {
                            vec = this.properties[info.name] = new Vector4();
                        }

                        const color = info.value as IColor;

                        vec.set(color.r, color.g, color.b, color.a);
                        break;
                    }
                    case MaterialPropertyType.TextureUrl: {
                        const texUrl = Http.getAbsUrl(info.value as string, this.url);
                        const tex = this.properties[info.name] = this.game.textureLoader.load(texUrl);
                        tex.addDependent(this);
                        break;
                    }
                    case MaterialPropertyType.TextureIndex: {
                        if (this.textureSource == null) {
                            console.warn("No texture source provided for material.");
                            break;
                        }

                        const tex = this.properties[info.name] = this.textureSource(info.value as number);
                        tex.addDependent(this);
                        break;
                    }
                    case MaterialPropertyType.TextureInfo: {
                        const texInfo = info.value as ITextureInfo;
                        const tex = this.properties[info.name] = texInfo.path != null
                            ? this.game.textureLoader.load(texInfo.path)
                            : this.game.textureLoader.load(`__dummy_${MaterialLoadable.nextDummyId++}`);

                        tex.addDependent(this);
                        tex.loadFromInfo(texInfo);
                    }
                }
            }

            loadFromInfo(info: IMaterialInfo, textureSource?: (index: number) => Texture): void {
                this.program = this.game.shaders.get(info.shader);
                this.textureSource = textureSource;

                if (this.program != null) {
                    this.properties = this.program.createMaterialProperties();

                    for (let i = 0; i < info.properties.length; ++i) {
                        this.addPropertyFromInfo(info.properties[i]);
                    }
                } else {
                    this.properties = {};
                }

                if (this.program != null) {
                    this.dispatchOnLoadCallbacks();
                }
            }
            
            loadNext(callback: (requeue: boolean) => void): void {
                if (this.program != null) {
                    callback(false);
                    return;
                }

                Http.getJson<IMaterialInfo>(this.url, info => {
                    this.loadFromInfo(info);
                    callback(false);
                }, error => {
                    callback(false);
                });
            }
        }
    }
}