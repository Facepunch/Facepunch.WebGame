namespace Facepunch {
    export namespace WebGame {
        export namespace Shaders {
            export class ComposeFrame extends ShaderProgram {
                readonly frameColor: UniformSampler;
                readonly frameDepth: UniformSampler;

                constructor(context: IWebGLContext) {
                    super(context);

                    const gl = context;

                    // TODO: won't work in webgl1 anymore (#version)

                    this.includeShaderSource(gl.VERTEX_SHADER, `#version 300 es
                        in vec2 aScreenPos;

                        out vec2 vScreenPos;

                        void main()
                        {
                            vScreenPos = aScreenPos * 0.5 + vec2(0.5, 0.5);
                            gl_Position = vec4(aScreenPos, 0, 1);
                        }`);

                    this.includeShaderSource(gl.FRAGMENT_SHADER, `#version 300 es
                        ${context.webgl2 ? "" : "#extension GL_EXT_frag_depth : enable"}

                        precision mediump float;

                        in vec2 vScreenPos;

                        out vec4 oFragColor;

                        uniform sampler2D uFrameColor;
                        uniform sampler2D uFrameDepth;

                        void main()
                        {
                            vec4 color = texture(uFrameColor, vScreenPos);
                            float depth = texture(uFrameDepth, vScreenPos).r;

                            if (color.a <= 0.004 || depth >= 1.0) discard;

                            oFragColor = color;
                            ${context.webgl2 ? "gl_FragDepth" : "gl_FragDepthEXT"} = depth;
                        }`);

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