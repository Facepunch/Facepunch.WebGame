namespace Facepunch {
    export namespace WebGame {
        export namespace Shaders {
            export class ComposeFrame extends ShaderProgram {
                static readonly vertSource = `
                    attribute vec2 aScreenPos;

                    varying vec2 vScreenPos;

                    void main()
                    {
                        vScreenPos = aScreenPos * 0.5 + vec2(0.5, 0.5);
                        gl_Position = vec4(aScreenPos, 0, 1);
                    }`;

                static readonly fragSource = `
                    #extension GL_EXT_frag_depth : enable

                    precision mediump float;

                    varying vec2 vScreenPos;

                    uniform sampler2D uFrameColor;
                    uniform sampler2D uFrameDepth;

                    void main()
                    {
                        gl_FragColor = texture2D(uFrameColor, vScreenPos);
                        gl_FragDepthEXT = texture2D(uFrameDepth, vScreenPos).r;
                    }`;

                frameColor: UniformSampler;
                frameDepth: UniformSampler;

                constructor(manager: ShaderManager) {
                    super(manager);

                    const gl = this.getContext();

                    this.loadShaderSource(gl.VERTEX_SHADER, ComposeFrame.vertSource);
                    this.loadShaderSource(gl.FRAGMENT_SHADER, ComposeFrame.fragSource);

                    this.addAttribute("aScreenPos", VertexAttribute.uv);

                    this.frameColor = this.addUniform("uFrameColor", UniformSampler);
                    this.frameDepth = this.addUniform("uFrameDepth", UniformSampler);
                }

                bufferSetup(buf: CommandBuffer, context: RenderContext): void {
                    super.bufferSetup(buf, context);

                    this.frameColor.bufferValue(buf, context.getOpaqueColorTexture());
                    this.frameDepth.bufferValue(buf, context.getOpaqueDepthTexture());
                }
            }
        }
    }
}