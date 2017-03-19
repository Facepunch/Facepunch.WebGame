namespace Facepunch {
    export namespace WebGame {
        export class RenderContext {
            private static readonly identityMatrix = new Matrix4().setIdentity();

            readonly game: Game;
            readonly camera: Camera;

            readonly projectionMatrix = new Matrix4();
            readonly inverseProjectionMatrix = new Matrix4();
            readonly viewMatrix = new Matrix4();
            readonly inverseViewMatrix = new Matrix4();

            private modelMatrix = new Matrix4();
            
            private drawList: DrawList;
            private geometryInvalid = true;
            private commandBuffer: CommandBuffer;
            private commandBufferInvalid = true;

            private opaqueFrameBuffer: FrameBuffer;

            constructor(game: Game, camera: Camera) {
                this.game = game;
                this.camera = camera;
                this.drawList = new DrawList(this);
                this.commandBuffer = new CommandBuffer(game.context);

                this.game.addDrawListInvalidationHandler((geom: boolean) => this.drawList.invalidate(geom));
            }

            getOpaqueColorTexture(): RenderTexture {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getColorTexture();
            }

            getOpaqueDepthTexture(): RenderTexture {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getDepthTexture();
            }

            invalidate(drawList: boolean = true): void {
                this.commandBufferInvalid = true;
                if (drawList) this.drawList.invalidate(true);
            }

            setModelTransform(model: Entity): void {
                if (model == null) {
                    this.modelMatrix = RenderContext.identityMatrix;
                } else {
                    this.modelMatrix = model.getMatrix();
                }
            }

            render(): void {
                this.camera.getProjectionMatrix(this.projectionMatrix);
                this.inverseProjectionMatrix.setInverse(this.projectionMatrix);
                this.camera.getMatrix(this.inverseViewMatrix);
                this.camera.getInverseMatrix(this.viewMatrix);

                if (this.geometryInvalid) {
                    this.geometryInvalid = false;
                    this.commandBufferInvalid = true;

                    this.drawList.clear();
                    this.game.populateDrawList(this.drawList, this.camera);
                }

                if (this.commandBufferInvalid) {
                    this.commandBufferInvalid = false;

                    this.commandBuffer.clearCommands();
                    this.drawList.appendToBuffer(this.commandBuffer, this);
                }

                this.commandBuffer.run(this);
            }

            private setupFrameBuffers(): void {
                if (this.opaqueFrameBuffer !== undefined) return;

                const gl = this.game.getContext();

                const width = this.game.getWidth();
                const height = this.game.getHeight();

                this.opaqueFrameBuffer = new FrameBuffer(gl, width, height);
                this.opaqueFrameBuffer.addDepthAttachment();
            }

            bufferOpaqueTargetBegin(buf: CommandBuffer): void {
                this.setupFrameBuffers();

                const gl = WebGLRenderingContext;

                buf.bindFramebuffer(this.opaqueFrameBuffer, true);
                buf.depthMask(true);
                buf.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            }

            bufferRenderTargetEnd(buf: CommandBuffer): void {
                buf.bindFramebuffer(null);
            }

            getDrawCallCount(): number {
                return this.drawList.getDrawCalls();
            }
        }
    }
}