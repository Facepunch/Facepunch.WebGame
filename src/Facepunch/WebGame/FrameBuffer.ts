namespace Facepunch {
    export namespace WebGame {
        export class FrameBuffer {
            private context: IWebGLContext;
            private frameBuffer: WebGLFramebuffer;

            private ownsFrameTexture: boolean;
            private ownsDepthTexture: boolean;

            private frameTexture: RenderTexture;
            private depthTexture: RenderTexture;

            constructor(tex: RenderTexture);
            constructor(gl: IWebGLContext, width: number, height: number);
            constructor(glOrTex: IWebGLContext | RenderTexture, width?: number, height?: number) {
                
                let gl: IWebGLContext;

                if (width !== undefined) {
                    this.ownsFrameTexture = true;
                    this.context = gl = glOrTex as IWebGLContext;

                    this.frameTexture = new RenderTexture(gl,
                        TextureTarget.Texture2D, TextureFormat.Rgba,
                        TextureDataType.Uint8, width, height);
                } else {
                    this.ownsFrameTexture = false;
                    this.frameTexture = glOrTex as RenderTexture;
                    this.context = gl = this.frameTexture.context;
                }

                this.frameBuffer = gl.createFramebuffer();

                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D,
                    this.frameTexture.getHandle(),
                    0);

                this.unbindAndCheckState();
            }

            private unbindAndCheckState(): void {
                const gl = this.context;

                const state = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                if (state !== gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error(`Unexpected framebuffer state: ${state}.`);
                }
            }

            addDepthAttachment(existing?: RenderTexture): void {
                const gl = this.context;

                if (existing == null) {
                    let format = gl.webgl2
                        ? TextureFormat.DepthComponent24
                        : TextureFormat.DepthComponent;

                    this.ownsDepthTexture = true;
                    this.depthTexture = new RenderTexture(gl, TextureTarget.Texture2D,
                        format, TextureDataType.Uint32,
                        this.frameTexture.getWidth(0), this.frameTexture.getHeight(0));
                } else {
                    this.ownsDepthTexture = false;
                    this.depthTexture = existing;
                }

                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER,
                    gl.DEPTH_ATTACHMENT,
                    gl.TEXTURE_2D,
                    this.depthTexture.getHandle(),
                    0);

                this.unbindAndCheckState();
            }

            getColorTexture(): RenderTexture { return this.frameTexture; }
            getDepthTexture(): RenderTexture { return this.depthTexture; }

            dispose(): void {
                if (this.frameBuffer !== undefined) {
                    this.context.deleteFramebuffer(this.frameBuffer);
                    this.frameBuffer = undefined;
                }

                if (this.frameTexture !== undefined && this.ownsFrameTexture) {
                    this.frameTexture.dispose();
                    this.frameTexture = undefined;
                    this.ownsFrameTexture = undefined;
                }

                if (this.depthTexture !== undefined && this.ownsDepthTexture) {
                    this.depthTexture.dispose();
                    this.depthTexture = undefined;
                    this.ownsDepthTexture = undefined;
                }
            }

            resize(width: number, height: number): void {
                if (this.ownsFrameTexture) this.frameTexture.resize(width, height);

                if (this.depthTexture !== undefined && this.ownsDepthTexture) {
                    this.depthTexture.resize(width, height);
                }
            }

            getHandle(): WebGLFramebuffer {
                return this.frameBuffer;
            }

            begin(): void {
                const gl = this.context;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            }

            end(): void {
                const gl = this.context;
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
        }
    }
}