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
                        vec4 sample = texture2D(uFrameColor, vScreenPos);
                        float depth = texture2D(uFrameDepth, vScreenPos).r;

                        if (sample.a <= 0.004 || depth >= 1.0) discard;

                        gl_FragColor = sample;
                        gl_FragDepthEXT = depth;
                    }`;

                readonly frameColor: UniformSampler;
                readonly frameDepth: UniformSampler;

                constructor(context: WebGLRenderingContext) {
                    super(context);

                    const gl = context;

                    this.includeShaderSource(gl.VERTEX_SHADER, ComposeFrame.vertSource);
                    this.includeShaderSource(gl.FRAGMENT_SHADER, ComposeFrame.fragSource);

                    this.addAttribute("aScreenPos", VertexAttribute.uv);

                    this.frameColor = this.addUniform("uFrameColor", UniformSampler);
                    this.frameDepth = this.addUniform("uFrameDepth", UniformSampler);

                    this.compile();
                }

                bufferSetup(buf: CommandBuffer): void {
                    super.bufferSetup(buf);

                    this.frameColor.bufferParameter(buf, Camera.opaqueColorParam);
                    this.frameDepth.bufferParameter(buf, Camera.opaqueDepthParam);

                    const gl = this.context;

                    buf.disable(gl.CULL_FACE);
                    buf.depthMask(true);
                }
            }
        }
    }
}