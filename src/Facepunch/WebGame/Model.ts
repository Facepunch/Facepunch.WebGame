/// <reference path="RenderResource.ts"/>

namespace Facepunch {
    export namespace WebGame {
        export interface IModelInfo {
            materials: string[];
            meshData: ICompressedMeshData;
        }

        export abstract class Model extends RenderResource<Model> {
            readonly meshManager: MeshManager;
            readonly materialLoader: MaterialLoader;

            constructor(meshManager: MeshManager, materialLoader: MaterialLoader) {
                super();

                this.meshManager = meshManager;
                this.materialLoader = materialLoader;
            }

            abstract getMeshData(): IMeshData;
            abstract getMaterial(index: number): Material;
            abstract getMeshHandles(): MeshHandle[];
        }

        export class ModelLoadable extends Model implements ILoadable {
            private readonly url: string;

            private materials: Material[];
            private meshData: IMeshData;
            private handles: MeshHandle[];

            constructor(game: Game, url: string) {
                super(game.meshes, game.materialLoader);

                this.url = url;
            }

            isLoaded(): boolean {
                return this.meshData != null;
            }

            getMaterial(index: number): Material {
                return this.materials[index];
            }

            getMeshData(): IMeshData {
                return this.meshData;
            }

            getMeshHandles(): MeshHandle[] {
                if (this.handles != null) return this.handles;
                return this.handles = this.meshManager.addMeshData(this.meshData, i => this.getMaterial(i));
            }
            
            loadNext(callback: (requeue: boolean) => void): void {
                if (this.isLoaded()) {
                    callback(false);
                    return;
                }

                Http.getJson<IModelInfo>(this.url, info => {
                    const materials: Material[] = [];

                    for (let i = 0, iEnd = info.materials.length; i < iEnd; ++i) {
                        const matUrl = Http.getAbsUrl(info.materials[i], this.url);
                        materials[i] = this.materialLoader.load(matUrl);
                    }

                    this.materials = materials;
                    this.meshData = MeshManager.decompress(info.meshData);
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