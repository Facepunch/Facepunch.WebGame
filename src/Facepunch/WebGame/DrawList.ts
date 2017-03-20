namespace Facepunch {
    export namespace WebGame {
        export class DrawList {
            readonly context: RenderContext;
            readonly game: Game;

            private items: DrawListItem[] = [];
            private invalid: boolean;
            private opaque: MeshHandle[] = [];
            private translucent: MeshHandle[] = [];

            private lastHandle: MeshHandle;
            private canRender: boolean;

            private hasRefraction: boolean;

            constructor(context: RenderContext) {
                this.context = context;
                this.game = context.game;
            }

            clear(): void {
                for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                    this.items[i].onRemoveFromDrawList(this);
                }

                this.items = [];
                this.opaque = [];
                this.translucent = [];
            }

            getDrawCalls(): number {
                return this.opaque.length + this.translucent.length;
            }

            addItem(item: DrawListItem): void {
                this.items.push(item);
                this.updateItem(item);
                item.onAddToDrawList(this);
            }

            private isBuildingList: boolean = false;

            invalidate(geom: boolean): void {
                if (this.isBuildingList) return;
                if (geom) this.invalid = true;
                this.context.invalidate();
            }

            updateItem(item: DrawListItem): void {
                this.invalidate(true);
            }

            private bufferHandle(buf: CommandBuffer, handle: MeshHandle, context: RenderContext): void {
                let changedMaterial = false;
                let changedProgram = false;
                let changedTransform = false;

                if (this.lastHandle.entity !== handle.entity) {
                    this.lastParent = handle.parent;
                    context.setModelTransform(this.lastParent);
                    changedTransform = true;
                }

                if (this.lastMaterial !== handle.material) {
                    changedMaterial = true;
                    this.lastMaterial = handle.material;
                }

                if (changedMaterial) {
                    if (this.lastMaterial == null) {
                        this.canRender = false;
                        return;
                    }

                    if (this.lastProgram !== this.lastMaterial.getProgram())
                    {
                        if (this.lastProgram !== undefined) {
                            this.lastProgram.bufferDisableMeshComponents(buf);
                        }

                        this.lastProgram = this.lastMaterial.getProgram();

                        changedProgram = true;
                        changedTransform = true;
                    }

                    this.canRender = this.lastProgram.isCompiled() && this.lastMaterial.enabled;
                }

                if (!this.canRender) return;

                if (changedProgram) {
                    this.lastProgram.bufferSetup(buf, context);
                }

                if (changedMaterial) {
                    this.lastProgram.bufferMaterial(buf, this.lastMaterial);
                }

                if (changedTransform) {
                    this.lastProgram.bufferModelMatrix(buf, context.getModelMatrixElements());
                }

                if (this.lastGroup !== handle.group || changedProgram) {
                    this.lastGroup = handle.group;
                    this.lastVertexOffset = undefined;
                    this.lastGroup.bufferBindBuffers(buf, this.lastProgram);
                }

                if (this.lastVertexOffset !== handle.vertexOffset) {
                    this.lastVertexOffset = handle.vertexOffset;
                    this.lastGroup.bufferAttribPointers(buf, this.lastProgram, this.lastVertexOffset);
                }

                handle.group.bufferRenderElements(buf, handle.drawMode, handle.indexOffset, handle.indexCount);

                this.lastHandle = handle;
            }

            private static compareHandles(a: MeshHandle, b: MeshHandle): number {
                return a.compareTo(b);
            }

            private buildHandleList(): void {
                this.opaque = [];
                this.translucent = [];
                this.hasRefraction = false;

                this.isBuildingList = true;

                for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                    const handles = this.items[i].getMeshHandles();
                    if (handles == null) continue;

                    for (let j = 0, jEnd = handles.length; j < jEnd; ++j) {
                        const handle = handles[j];
                        if (handle.indexCount === 0) continue;
                        if (handle.material == null) continue;

                        if (handle.material.properties.translucent || handle.material.properties.refract) {
                            if (handle.material.properties.refract) this.hasRefraction = true;
                            this.translucent.push(handle);
                        } else this.opaque.push(handle);
                    }
                }

                this.isBuildingList = false;

                this.opaque.sort(DrawList.compareHandles);
                this.translucent.sort(DrawList.compareHandles);
            }

            appendToBuffer(buf: CommandBuffer, context: RenderContext): void {
                this.lastHandle = MeshHandle.undefinedHandle;

                if (this.invalid) this.buildHandleList();

                this.game.shaders.resetUniformCache();

                if (this.hasRefraction) context.bufferOpaqueTargetBegin(buf);

                for (let i = 0, iEnd = this.opaque.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.opaque[i], context);
                }

                if (this.hasRefraction) {
                    context.bufferRenderTargetEnd(buf);
                    this.bufferHandle(buf, this.game.getComposeFrameMeshHandle(), context);
                }

                for (let i = 0, iEnd = this.translucent.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.translucent[i], context);
                }

                if (this.lastHandle.material !== undefined) {
                    this.lastHandle.material.program.bufferDisableMeshComponents(buf);
                }
            }
        }
    }
}