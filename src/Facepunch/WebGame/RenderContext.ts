namespace Facepunch {
    export namespace WebGame {
        export class RenderContext implements ICommandBufferParameterProvider {
            static readonly opaqueColorParam = new CommandBufferParameter(UniformType.Texture);
            static readonly opaqueDepthParam = new CommandBufferParameter(UniformType.Texture);

            readonly game: Game;
            readonly fog: Fog;
            
            private drawList: DrawList;
            private commandBuffer: CommandBuffer;

            private geometryInvalid = true;

            private opaqueFrameBuffer: FrameBuffer;

            constructor(game: Game) {
                this.game = game;
                this.fog = new Fog(this);
                this.drawList = new DrawList(this);
                this.commandBuffer = new CommandBuffer(game.context);

                this.game.addDrawListInvalidationHandler((geom: boolean) => this.invalidate());
            }

            getOpaqueColorTexture(): RenderTexture {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getColorTexture();
            }

            getOpaqueDepthTexture(): RenderTexture {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getDepthTexture();
            }

            invalidate(): void {
                this.geometryInvalid = true;
            }

            render(camera: Camera): void {
                if (this.geometryInvalid) {
                    this.drawList.clear();
                    this.game.populateDrawList(this.drawList, camera);
                }

                if (this.geometryInvalid || this.drawList.isInvalid()) {
                    this.commandBuffer.clearCommands();
                    this.drawList.appendToBuffer(this.commandBuffer, this);
                }
                
                this.geometryInvalid = false;

                camera.populateCommandBufferParameters(this.commandBuffer);
                this.populateCommandBufferParameters(this.commandBuffer);

                this.commandBuffer.run();
            }

            populateCommandBufferParameters(buf: CommandBuffer): void {
                this.game.populateCommandBufferParameters(buf);
                this.fog.populateCommandBufferParameters(buf);

                buf.setParameter(RenderContext.opaqueColorParam, this.getOpaqueColorTexture());
                buf.setParameter(RenderContext.opaqueDepthParam, this.getOpaqueDepthTexture());
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