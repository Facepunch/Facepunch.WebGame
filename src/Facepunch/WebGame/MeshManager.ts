namespace Facepunch {
    export namespace WebGame {
        export class MeshManager {
            private readonly context: WebGLRenderingContext;
            private readonly game: Game;
            private readonly groups: MeshGroup[] = [];

            constructor(game: Game) {
                this.context = game.context;
                this.game = game;
            }

            addMeshData(data: ICompressedMeshData | IMeshData, getMaterial?: (materialIndex: number) => Material, target?: MeshHandle[]): MeshHandle[] {
                if (target == null) {
                    target = [];
                }

                let uncompressed: IMeshData = data as IMeshData;
                if (typeof data.indices === "string" || typeof data.vertices === "string") {
                    uncompressed = {
                        attributes: data.attributes,
                        elements: data.elements,
                        vertices: Utils.decompress(data.vertices),
                        indices: Utils.decompress(data.indices)
                    };
                }

                for (let i = 0, iEnd = this.groups.length; i < iEnd; ++i) {
                    const group = this.groups[i];
                    if (group.canAddMeshData(uncompressed)) {
                        group.addMeshData(uncompressed, getMaterial, target);
                        return target;
                    }
                }

                const attribs: VertexAttribute[] = [];

                for (let i = 0, iEnd = data.attributes.length; i < iEnd; ++i) {
                    const attrib = data.attributes[i];
                    attribs.push(new VertexAttribute(attrib.size, attrib.type, attrib.normalized));
                }

                const newGroup = new MeshGroup(this.context, attribs);
                this.groups.push(newGroup);

                newGroup.addMeshData(uncompressed, getMaterial, target);
                return target;
            }

            private composeFrameHandle: MeshHandle;

            getComposeFrameMeshHandle(): MeshHandle {
                if (this.composeFrameHandle != null) return this.composeFrameHandle;

                const meshData: IMeshData = {
                    attributes: [VertexAttribute.uv],
                    vertices: [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0],
                    indices: [0, 1, 2, 0, 2, 3],
                    elements: [
                        {
                            mode: DrawMode.Triangles,
                            material: this.game.shaders.createMaterial(Facepunch.WebGame.Shaders.ComposeFrame),
                            indexOffset: 0,
                            indexCount: 6
                        }
                    ]
                };

                this.composeFrameHandle = this.addMeshData(meshData)[0];
                return this.composeFrameHandle;
            }

            dispose(): void {
                for (let i = 0; i < this.groups.length; ++i) {
                    this.groups[i].dispose();
                }

                this.groups.splice(0, this.groups.length);
            }
        }
    }
}