namespace Facepunch {
    export namespace WebGame {
        export enum AttributeType {
            Float = WebGLRenderingContext.FLOAT
        }
        
        export class VertexAttribute {
            private static nextId = 1;

            static readonly position = new VertexAttribute(3, AttributeType.Float, false);
            static readonly normal = new VertexAttribute(3, AttributeType.Float, true);
            static readonly uv = new VertexAttribute(2, AttributeType.Float, false);
            static readonly uv2 = new VertexAttribute(2, AttributeType.Float, false);
            static readonly rgb = new VertexAttribute(3, AttributeType.Float, false);
            static readonly rgba = new VertexAttribute(4, AttributeType.Float, false);

            static compare(a: VertexAttribute, b: VertexAttribute): number {
                return a.id - b.id;
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