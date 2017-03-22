namespace Facepunch {
    export namespace WebGame {
        export class DrawList {
            private static readonly identityMatrix = new Matrix4().setIdentity();

            readonly context: RenderContext;
            readonly game: Game;

            private items: IDrawListItem[] = [];
            private invalid: boolean;
            private opaque: MeshHandle[] = [];
            private translucent: MeshHandle[] = [];

            private lastHandle: MeshHandle;
            private hasRefraction: boolean;

            constructor(context: RenderContext) {
                this.context = context;
                this.game = context.game;
            }

            isInvalid(): boolean {
                return this.invalid;
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

            addItem(item: IDrawListItem): void {
                this.items.push(item);
                this.updateItem(item);
                item.onAddToDrawList(this);
                this.invalid = true;
            }

            private isBuildingList: boolean = false;

            invalidate(): void {
                if (this.isBuildingList) return;
                this.invalid = true;
            }

            updateItem(item: IDrawListItem): void {
                this.invalidate();
            }

            private bufferHandle(buf: CommandBuffer, handle: MeshHandle, context: RenderContext): void {
                let changedMaterial = false;
                let changedProgram = false;
                let changedTransform = false;

                const program = handle.material.program;

                if (this.lastHandle.transform !== handle.transform) {
                    changedTransform = true;
                }

                if (this.lastHandle.material !== handle.material) {
                    changedMaterial = true;
                    changedProgram = this.lastHandle.material === undefined || this.lastHandle.material.program !== program;
                    changedTransform = changedTransform || changedProgram;
                }

                if (changedProgram) {
                    if (this.lastHandle.material !== undefined) {
                        this.lastHandle.material.program.bufferDisableMeshComponents(buf);
                    }

                    program.bufferSetup(buf, context);
                }

                if (changedMaterial) {
                    program.bufferMaterial(buf, handle.material);
                }

                if (changedTransform) {
                    program.bufferModelMatrix(buf, handle.transform == null
                        ? DrawList.identityMatrix.elements : handle.transform.elements );
                }

                if (this.lastHandle.group !== handle.group || changedProgram) {
                    handle.group.bufferBindBuffers(buf, program);
                }

                if (this.lastHandle.vertexOffset !== handle.vertexOffset) {
                    handle.group.bufferAttribPointers(buf, program, handle.vertexOffset);
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
                        if (!handle.material.enabled) continue;
                        if (handle.material.program == null) continue;
                        if (!handle.material.program.isCompiled()) continue;

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
                    this.bufferHandle(buf, this.game.meshes.getComposeFrameMeshHandle(), context);
                }

                for (let i = 0, iEnd = this.translucent.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.translucent[i], context);
                }

                if (this.lastHandle.material !== undefined) {
                    this.lastHandle.material.program.bufferDisableMeshComponents(buf);
                    buf.useProgram(null);
                }
            }
        }
    }
}