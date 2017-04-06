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
            private lastProgram: ShaderProgram;
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
                item.onAddToDrawList(this);
                this.invalidate();
            }

            addItems<TItem extends IDrawListItem>(items: TItem[]): void {
                if (items.length === 0) return;

                for (let i = 0, iEnd = items.length; i < iEnd; ++i) {
                    this.items.push(items[i]);
                    items[i].onAddToDrawList(this);
                }
                
                this.invalidate();
            }

            private isBuildingList: boolean = false;

            invalidate(): void {
                if (this.isBuildingList) return;
                this.invalid = true;
            }

            private bufferHandle(buf: CommandBuffer, handle: MeshHandle): void {
                let changedMaterial = false;
                let changedProgram = false;
                let changedTransform = false;
                let changedBuffer = false;
                let changedAttributes = false;

                let program = handle.program;

                if (this.lastHandle.transform !== handle.transform) {
                    changedTransform = true;
                }

                if (this.lastHandle.group !== handle.group) {
                    changedBuffer = true;
                }

                if (this.lastHandle.vertexOffset !== handle.vertexOffset) {
                    changedAttributes = true;
                }

                if (this.lastHandle.material !== handle.material) {
                    changedMaterial = true;
                    changedProgram = this.lastProgram !== program;
                    changedTransform = changedTransform || changedProgram;
                }

                if (changedProgram) {
                    changedBuffer = true;

                    if (this.lastProgram !== undefined) {
                        this.lastProgram.bufferDisableAttributes(buf);
                    }

                    program.bufferSetup(buf);
                }

                if (changedMaterial) {
                    program.bufferMaterial(buf, handle.material);
                }

                if (changedTransform) {
                    program.bufferModelMatrix(buf, handle.transform == null
                        ? DrawList.identityMatrix.elements : handle.transform.elements );
                }

                if (changedBuffer) {
                    changedAttributes = true;
                    handle.group.bufferBindBuffers(buf, program);
                }

                if (changedAttributes) {
                    handle.group.bufferAttribPointers(buf, program, handle.vertexOffset);
                }

                handle.group.bufferRenderElements(buf, handle.drawMode, handle.indexOffset, handle.indexCount);

                this.lastHandle = handle;
                this.lastProgram = program;
            }

            private static compareHandles(a: MeshHandle, b: MeshHandle): number {
                return a.compareTo(b);
            }

            private buildHandleList(): void {
                this.opaque = [];
                this.translucent = [];
                this.hasRefraction = false;

                const errorProgram = this.game.shaders.get(Shaders.Error);

                this.isBuildingList = true;

                for (let i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                    const handles = this.items[i].getMeshHandles();
                    if (handles == null) continue;

                    for (let j = 0, jEnd = handles.length; j < jEnd; ++j) {
                        const handle = handles[j];
                        if (handle.indexCount === 0) continue;
                        if (handle.material == null) continue;
                        if (!handle.material.enabled) continue;

                        handle.program = handle.material.program;

                        if (handle.program == null || !handle.program.isCompiled()) {
                            handle.program = errorProgram;
                        }

                        if (handle.material.properties.translucent || handle.material.properties.refract) {
                            if (handle.material.properties.refract) this.hasRefraction = true;
                            this.translucent.push(handle);
                        } else this.opaque.push(handle);
                    }
                }

                this.isBuildingList = false;

                this.opaque.sort(DrawList.compareHandles);
                this.translucent.sort(DrawList.compareHandles);
                
                this.invalid = false;
            }

            appendToBuffer(buf: CommandBuffer, context: RenderContext): void {
                this.lastHandle = MeshHandle.undefinedHandle;
                this.lastProgram = undefined;

                if (this.invalid) this.buildHandleList();

                this.game.shaders.resetUniformCache();

                if (this.hasRefraction) context.bufferOpaqueTargetBegin(buf);

                for (let i = 0, iEnd = this.opaque.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.opaque[i]);
                }

                if (this.hasRefraction) {
                    context.bufferRenderTargetEnd(buf);
                    this.bufferHandle(buf, this.game.meshes.getComposeFrameMeshHandle());
                }

                for (let i = 0, iEnd = this.translucent.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.translucent[i]);
                }

                if (this.lastProgram !== undefined) {
                    this.lastProgram.bufferDisableAttributes(buf);
                    this.lastProgram = undefined;
                    buf.useProgram(null);
                }
            }
        }
    }
}