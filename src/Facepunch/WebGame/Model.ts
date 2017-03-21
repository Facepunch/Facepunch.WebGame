namespace Facepunch {
    export namespace WebGame {
        export interface IModelInfo {
            materials: string[];
            meshData: ICompressedMeshData;
        }

        export class ModelLoadable implements ILoadable {
            private readonly game: Game;
            private readonly url: string;

            private handles: MeshHandle[];

            constructor(game: Game, url: string) {
                this.game = game;
                this.url = url;
            }

            isLoaded(): boolean {
                return this.handles != null;
            }

            getMeshHandles(): MeshHandle[] {
                return this.handles;
            }
            
            loadNext(callback: (requeue: boolean) => void): void {
                if (this.isLoaded()) {
                    callback(false);
                    return;
                }

                Http.getJson<IModelInfo>(this.url, info => {
                    const materials: Material[] = [];

                    for (let i = 0, iEnd = info.materials.length; i < iEnd; ++i) {
                        materials[i] = this.game.materialLoader.load(info.materials[i]);
                    }

                    this.handles = this.game.meshes.addMeshData(info.meshData, i => materials[i]);

                    callback(false);
                }, error => {
                    console.error(`Failed to load material ${this.url}: ${error}`);
                    callback(false);
                });
            }
        }
    }
}