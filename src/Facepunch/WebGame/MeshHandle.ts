namespace Facepunch {
    export namespace WebGame {
        export enum DrawMode {
            Triangles = WebGLRenderingContext.TRIANGLES,
            TriangleStrip = WebGLRenderingContext.TRIANGLE_STRIP,
            TriangleFan = WebGLRenderingContext.TRIANGLE_FAN
        }

        export class MeshHandle {
            static readonly undefinedHandle = new MeshHandle(undefined, undefined, undefined, undefined, undefined, undefined, undefined);

            readonly transform: Matrix4;
            readonly material: Material;
            readonly group: MeshGroup;
            readonly vertexOffset: number;
            readonly drawMode: DrawMode;
            readonly indexOffset: number;
            readonly indexCount: number;

            constructor(group: MeshGroup, vertexOffset: number, drawMode: DrawMode,
                indexOffset: number, indexCount: number, material: Material,
                transform?: Matrix4) {
                this.group = group;
                this.vertexOffset = vertexOffset;
                this.indexOffset = indexOffset;
                this.indexCount = indexCount;
                this.material = material;
                this.transform = transform;
            }

            clone(newTransform: Matrix4, newMaterial?: Material): MeshHandle {
                return new MeshHandle(this.group, this.vertexOffset, this.drawMode,
                    this.indexOffset, this.indexCount, newMaterial || this.material, newTransform);
            }

            compareTo(other: MeshHandle): number {
                const thisProg = this.material.program;
                const otherProg = other.material.program;

                const progComp = thisProg.compareTo(otherProg);
                if (progComp !== 0) return progComp;

                if (this.transform !== other.transform) {
                    if (this.transform == null) return -1;
                    if (other.transform == null) return 1;
                    return this.transform.id - other.transform.id;
                }

                const matComp = thisProg.compareMaterials(this.material, other.material);
                if (matComp !== 0) return matComp;

                const groupComp = this.group.compareTo(other.group);
                if (groupComp !== 0) return groupComp;

                return this.indexOffset - other.indexOffset;
            }
        }
    }
}