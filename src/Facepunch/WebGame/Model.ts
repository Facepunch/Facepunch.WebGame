namespace Facepunch {
    export namespace WebGame {
        export interface IModelInfo {
            materials: string[];
            meshData: ICompressedMeshData;
        }

        export abstract class Model {
            private readonly onLoadCallbacks: ((model: Model) => void)[] = [];

            abstract isLoaded(): boolean;
            abstract getMeshHandles(): MeshHandle[];

            addOnLoadCallback(callback: (model: Model) => void): void {
                if (this.isLoaded()) {
                    callback(this);
                } else {
                    this.onLoadCallbacks.push(callback);
                }
            }

            protected dispatchOnLoadCallbacks(): void {
                if (!this.isLoaded()) {
                    throw new Error("Model attempted to dispatch onLoad callbacks without any mesh data.");
                }

                for (let i = 0, iEnd = this.onLoadCallbacks.length; i < iEnd; ++i) {
                    this.onLoadCallbacks[i](this);
                }

                this.onLoadCallbacks.splice(0, this.onLoadCallbacks.length);
            }
        }

        export class ModelLoadable extends Model implements ILoadable {
            private readonly game: Game;
            private readonly url: string;

            private handles: MeshHandle[];

            constructor(game: Game, url: string) {
                super();

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
                    this.dispatchOnLoadCallbacks();

                    callback(false);
                }, error => {
                    console.error(`Failed to load material ${this.url}: ${error}`);
                    callback(false);
                });
            }
        }
    }
}