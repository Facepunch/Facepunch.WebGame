/// <reference path="DrawableEntity.ts"/>

namespace Facepunch {
    export namespace WebGame {
        export class DebugLine extends DrawableEntity {
            private readonly game: Game;

            private readonly attribs = [VertexAttribute.position, VertexAttribute.alpha];
            private readonly material: Material;
            private readonly materialProps: Shaders.DebugLineProps;
            private readonly meshGroup: MeshGroup;
            private readonly meshHandle: MeshHandle;
            private readonly meshHandles: MeshHandle[];

            private readonly vertData = new Float32Array(4);
            private readonly indexData: Uint16Array | Uint32Array;

            private readonly vertBuffer = new Float32Array(6);

            private meshChanged = false;

            progressScale = 1;

            constructor(game: Game) {
                super();

                this.game = game;
                this.material = game.shaders.createMaterial(Shaders.DebugLine, true);
                this.materialProps = this.material.properties as Shaders.DebugLineProps;
                this.meshGroup = new MeshGroup(game.context, this.attribs);
                this.meshHandle = new MeshHandle(this.meshGroup, 0, DrawMode.Lines, 0, 0, this.material);
                this.meshHandles = [this.meshHandle];

                this.vertData = new Float32Array(4);
                this.indexData = this.meshGroup.indexSize === 2 ? new Uint16Array(2) : new Uint32Array(4);
            }

            clear(): void {
                this.meshGroup.clear();
                this.meshHandle.indexCount = 0;

                this.meshChanged = true;
            }

            get phase(): number {
                return this.materialProps.phase;
            }

            set phase(value: number) {
                this.materialProps.phase = value;
            }

            get frequency(): number {
                return this.materialProps.frequency;
            }

            set frequency(value: number) {
                this.materialProps.frequency = value;
            }

            setColor(color: IVector3): void;
            setColor(color0: IVector3, color1: IVector3): void;
            setColor(color0: IVector3, color1?: IVector3): void {
                if (color1 === undefined) color1 = color0;

                this.materialProps.color0.copy(color0);
                this.materialProps.color1.copy(color1);
            }

            private lastPos = new Vector3();
            private progress = 0;

            private addVertex(pos: IVector3, progress: number): number {
                const vertData = this.vertData;

                vertData[0] = pos.x;
                vertData[1] = pos.y;
                vertData[2] = pos.z;
                vertData[3] = this.progress;

                return this.meshGroup.addVertexData(vertData, this.meshHandle) >> 2;
            }

            moveTo(pos: IVector3): void {
                this.lastPos.copy(pos);
                this.progress = 0;

                this.addVertex(pos, this.progress);
            }

            lineTo(pos: IVector3, progress?: number): void {
                const indexData = this.indexData;

                this.meshChanged = true;
                if (progress === undefined) {
                    this.lastPos.sub(pos);
                    this.progress += this.lastPos.length() * this.progressScale;
                } else {
                    this.progress = progress;
                }
                this.lastPos.copy(pos);

                const index = this.addVertex(pos, this.progress);

                indexData[0] = Math.max(0, index - 1);
                indexData[1] = index;

                this.meshGroup.addIndexData(indexData, this.meshHandle);
            }

            update(): void {
                if (this.meshChanged) {
                    this.meshChanged = false;

                    this.drawable.clearMeshHandles();

                    if (this.meshHandle.indexCount > 0) {
                        this.drawable.addMeshHandles(this.meshHandles);
                    }
                }
            }

            dispose(): void {
                this.meshGroup.dispose();
            }
        }
    }
}