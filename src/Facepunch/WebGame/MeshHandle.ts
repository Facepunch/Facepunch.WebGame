namespace Facepunch {
    export namespace WebGame {
        export enum DrawMode {
            Triangles = WebGLRenderingContext.TRIANGLES,
            TriangleStrip = WebGLRenderingContext.TRIANGLE_STRIP,
            TriangleFan = WebGLRenderingContext.TRIANGLE_FAN
        }

        export class MeshHandle {
            static readonly undefinedHandle = new MeshHandle(undefined, undefined, undefined, undefined, undefined, undefined, undefined);

            readonly entity: Entity;
            readonly material: Material;
            readonly group: MeshGroup;
            readonly vertexOffset: number;
            readonly drawMode: DrawMode;
            readonly indexOffset: number;
            readonly indexCount: number;

            constructor(entity: Entity, material: Material, group: MeshGroup,
                vertexOffset: number, drawMode: DrawMode,
                indexOffset: number, indexCount: number) {
                this.entity = entity;
                this.material = material;
                this.group = group;
                this.vertexOffset = vertexOffset;
                this.indexOffset = indexOffset;
                this.indexCount = indexCount;
            }

            clone(newParent: Entity): MeshHandle {
                return new MeshHandle(newParent, this.material, this.group,
                    this.vertexOffset, this.drawMode, this.indexOffset, this.indexCount);
            }

            compareTo(other: MeshHandle): number {
                const progComp = this.material.program.compareTo(other.material.program);
                if (progComp !== 0) return progComp;

                const entityComp = this.entity == other.entity ? 0 : this.entity == null ? -1 : other.entity == null ? 1 : this.entity.compareTo(other.entity);
                if (entityComp !== 0) return entityComp;

                const matComp = this.material.program.compareMaterials(this.material, other.material);
                if (matComp !== 0) return matComp;

                const groupComp = this.group.compareTo(other.group);
                if (groupComp !== 0) return groupComp;

                return this.indexOffset - other.indexOffset;
            }
        }
    }
}