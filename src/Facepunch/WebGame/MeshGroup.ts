namespace Facepunch {
    export namespace WebGame {
        export class AttributeInfo {
            readonly attribute: VertexAttribute;
            readonly offset: number;

            constructor(attribute: VertexAttribute, offset: number) {
                this.attribute = attribute;
                this.offset = offset;
            }
        }

        export interface IMeshElement {
            mode: DrawMode,
            material: number;
            indexOffset: number;
            indexCount: number;
            vertexOffset?: number;
            vertexCount?: number;
        }

        export interface IMeshData {
            attributes: IVertexAttribute[];
            elements: IMeshElement[];
            vertices: number[];
            indices: number[];
        }

        export interface ICompressedMeshData {
            attributes: IVertexAttribute[];
            elements: IMeshElement[];
            vertices: number[] | string;
            indices: number[] | string;
        }

        export class MeshGroup {
            private static readonly maxIndexDataLength = 2147483648;
            private static readonly vertexComponentSize = 4;

            private static nextId = 1;

            readonly id = MeshGroup.nextId++;

            private readonly context: WebGLRenderingContext;
            private readonly attribs: AttributeInfo[];

            private readonly vertexLength: number;
            private readonly indexSize: number;

            private readonly maxVertexDataLength: number;
            private readonly maxSubBufferLength: number;

            private vertexBuffer: WebGLBuffer;
            private indexBuffer: WebGLBuffer;

            private vertexData: Float32Array;
            private indexData: Uint16Array | Uint32Array;

            private vertexDataLength = 0;
            private indexDataLength = 0;

            constructor(context: WebGLRenderingContext, attribs: VertexAttribute[]) {
                this.context = context;

                this.indexSize = context.getExtension("OES_element_index_uint") != null ? 4 : 2;
                this.vertexLength = 0;

                this.attribs = [];
                for (let i = 0; i < attribs.length; ++i) {
                    const info = new AttributeInfo(attribs[i], this.vertexLength * MeshGroup.vertexComponentSize);
                    this.attribs.push(info);

                    this.vertexLength += info.attribute.size;
                }

                const maxVertsPerSubBuffer = this.indexSize === 4 ? 2147483648 : 65536;
                
                this.maxVertexDataLength = MeshGroup.maxIndexDataLength;
                this.maxSubBufferLength = this.vertexLength * maxVertsPerSubBuffer;

                this.vertexBuffer = context.createBuffer();
                this.indexBuffer = context.createBuffer();
            }

            compareTo(other: MeshGroup): number {
                return this.id - other.id;
            }

            canAddMeshData(data: IMeshData): boolean {
                if (this.attribs.length !== data.attributes.length) return false;

                for (let i = 0; i < this.attribs.length; ++i) {
                    if (VertexAttribute.compare(this.attribs[i].attribute, data.attributes[i]) !== 0) return false;
                }

                return this.vertexDataLength + data.vertices.length <= this.maxVertexDataLength
                    && this.indexDataLength + data.indices.length <= MeshGroup.maxIndexDataLength;
            }

            private ensureCapacity<TArray extends Float32Array | Uint16Array | Uint32Array>
                (array: TArray, length: number, ctor: (size: number) => TArray): TArray
            {
                if (array != null && array.length >= length) return array;

                let newLength = 2048;
                while (newLength < length) newLength *= 2;

                const newArray = ctor(newLength);
                if (array != null) newArray.set(array, 0);

                return newArray;
            }

            private updateBuffer<TArray extends Float32Array | Uint16Array | Uint32Array>
                (target: number, buffer: WebGLBuffer, data: TArray, newData: TArray, oldData: TArray, offset: number) {
                const gl = this.context;

                gl.bindBuffer(target, buffer);

                if (data !== oldData) {
                    gl.bufferData(target, data.byteLength, gl.STATIC_DRAW);
                    gl.bufferSubData(target, 0, data);
                } else {
                    gl.bufferSubData(target, offset * data.BYTES_PER_ELEMENT, newData);
                }
            }

            addMeshData(data: IMeshData): MeshHandle[] {
                if (!this.canAddMeshData(data)) {
                    throw new Error("Target MeshGroup is incompatible with the given IMeshData.");
                }

                const gl = this.context;

                // TODO
            }
        }
    }
}