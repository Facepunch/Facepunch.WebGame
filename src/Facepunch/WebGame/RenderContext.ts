namespace Facepunch {
    export namespace WebGame {
        export class RenderContext implements ICommandBufferParameterProvider {
            readonly game: Game;
            readonly camera: Camera;
            readonly fog: Fog;
            
            private drawList: DrawList;
            private geometryInvalid = true;
            private commandBuffer: CommandBuffer;
            private commandBufferInvalid = true;

            private opaqueFrameBuffer: FrameBuffer;

            constructor(game: Game, camera: Camera) {
                this.game = game;
                this.camera = camera;
                this.fog = new Fog(this);
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

            render(): void {
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

            populateCommandBufferParameters(buf: CommandBuffer): void {
                this.game.populateCommandBufferParameters(buf);
                this.camera.populateCommandBufferParameters(buf);
                this.fog.populateCommandBufferParameters(buf);

                buf.setParameter(CommandBufferParameter.RefractColorMap, this.getOpaqueColorTexture());
                buf.setParameter(CommandBufferParameter.RefractDepthMap, this.getOpaqueDepthTexture());
            }

            private setupFrameBuffers(): void {
                if (this.opaqueFrameBuffer !== undefined) return;

                const gl = this.game.context;

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