namespace Facepunch {
    export namespace WebGame {
        export enum AttributeType {
            Float = WebGLRenderingContext.FLOAT
        }

        export interface IVertexAttribute {
            readonly size: number;
            readonly type: AttributeType | string;
            readonly normalized?: boolean;
        }
        
        export class VertexAttribute implements IVertexAttribute {
            private static nextId = 1;

            static readonly position = new VertexAttribute(3, AttributeType.Float, false);
            static readonly normal = new VertexAttribute(3, AttributeType.Float, true);
            static readonly uv = new VertexAttribute(2, AttributeType.Float, false);
            static readonly uv2 = new VertexAttribute(2, AttributeType.Float, false);
            static readonly rgb = new VertexAttribute(3, AttributeType.Float, false);
            static readonly rgba = new VertexAttribute(4, AttributeType.Float, false);

            static compare(a: IVertexAttribute, b: IVertexAttribute): number {
                const sizeComp = a.size - b.size;
                if (sizeComp !== 0) return sizeComp;
                const typeComp = WebGl.decodeConst(a.type) - WebGl.decodeConst(b.type);
                if (typeComp !== 0) return typeComp;
                return (a.normalized ? 1 : 0) - (b.normalized ? 1 : 0);
            }

            readonly id = VertexAttribute.nextId++;

            readonly size: number;
            readonly type: AttributeType;
            readonly normalized: boolean;

            constructor(size: number, type: AttributeType | string, normalized?: boolean) {
                this.size = size;
                this.type = WebGl.decodeConst(type);
                this.normalized = normalized === true;
            }
        }
    }
}