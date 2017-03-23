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

            static decompress(compressed: ICompressedMeshData): IMeshData {
                const attribs: VertexAttribute[] = [];

                for (let i = 0, iEnd = compressed.attributes.length; i < iEnd; ++i) {
                    const attrib = compressed.attributes[i];
                    attribs.push(typeof attrib === "string" ? VertexAttribute[attrib] : attrib);
                }

                return {
                    attributes: attribs,
                    elements: compressed.elements,
                    vertices: Utils.decompress(compressed.vertices),
                    indices: Utils.decompress(compressed.indices)
                };
            }

            static clone(data: IMeshData): IMeshData {
                return {
                    attributes: data.attributes,
                    elements: data.elements,
                    vertices: data.vertices.slice(),
                    indices: data.indices
                };
            }

            static getAttributeOffset(attribs: VertexAttribute[], attrib: VertexAttribute): number {
                let length = 0;
                for (let i = 0, iEnd = attribs.length; i < iEnd; ++i) {
                    if (attrib.id === attribs[i].id) return length;
                    length += attribs[i].size;
                }
                return undefined;
            }

            static getVertexLength(attribs: VertexAttribute[]): number {
                let length = 0;
                for (let i = 0, iEnd = attribs.length; i < iEnd; ++i) {
                    length += attribs[i].size;
                }
                return length;
            }

            static transform4F(data: IMeshData, attrib: VertexAttribute, action: (vec: Vector4) => void, defaultW: number = 1): void {
                if (attrib.size !== 3 && attrib.size !== 4) throw new Error("Expected the given attribute to be of size 3 or 4.");

                const attribOffset = MeshManager.getAttributeOffset(data.attributes, attrib);
                if (attribOffset === undefined) return;

                const verts = data.vertices;
                const length = data.vertices.length;
                const vertLength = MeshManager.getVertexLength(data.attributes);
                const normalized = attrib.normalized;

                const vec = new Vector4();
                if (attrib.size === 3) {
                    for (let i = attribOffset; i < length; i += vertLength) {
                        vec.set(verts[i], verts[i + 1], verts[i + 2], defaultW);
                        action(vec);
                        if (normalized) vec.normalizeXyz();
                        verts[i] = vec.x;
                        verts[i + 1] = vec.y;
                        verts[i + 2] = vec.z;
                    }
                } else if (attrib.size === 4) {
                    for (let i = attribOffset; i < length; i += vertLength) {
                        vec.set(verts[i], verts[i + 1], verts[i + 2], verts[i + 3]);
                        action(vec);
                        if (normalized) vec.normalize();
                        verts[i] = vec.x;
                        verts[i + 1] = vec.y;
                        verts[i + 2] = vec.z;
                        verts[i + 3] = vec.w;
                    }
                }
            }

            addMeshData(data: IMeshData, getMaterial?: (materialIndex: number) => Material, target?: MeshHandle[]): MeshHandle[] {
                if (target == null) {
                    target = [];
                }

                for (let i = 0, iEnd = this.groups.length; i < iEnd; ++i) {
                    const group = this.groups[i];
                    if (group.canAddMeshData(data)) {
                        group.addMeshData(data, getMaterial, target);
                        return target;
                    }
                }

                const newGroup = new MeshGroup(this.context, data.attributes);
                this.groups.push(newGroup);

                newGroup.addMeshData(data, getMaterial, target);
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