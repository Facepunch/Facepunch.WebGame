namespace Facepunch {
    export namespace WebGame {
        export class MeshManager {
            private readonly context: WebGLRenderingContext;
            private readonly groups: MeshGroup[] = [];

            constructor(context: WebGLRenderingContext) {
                this.context = context;
            }

            addMeshData(data: ICompressedMeshData | IMeshData, getMaterial: (materialIndex: number) => Material, target?: MeshHandle[]): MeshHandle[] {
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

            dispose(): void {
                for (let i = 0; i < this.groups.length; ++i) {
                    this.groups[i].dispose();
                }

                this.groups.splice(0, this.groups.length);
            }
        }
    }
}