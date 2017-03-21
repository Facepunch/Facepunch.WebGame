namespace Facepunch {
    export namespace WebGame {
        export namespace Shaders {
            export abstract class ModelBase extends ShaderProgram {
                static readonly vertSource = `
                    attribute vec3 aPosition;
                    attribute vec2 aTextureCoord;

                    varying float vDepth;
                    varying vec2 vTextureCoord;

                    uniform mat4 uProjection;
                    uniform mat4 uView;
                    uniform mat4 uModel;

                    void Base_main()
                    {
                        vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);

                        gl_Position = uProjection * viewPos;
                        
                        vDepth = -viewPos.z;
                        vTextureCoord = aTextureCoord;
                    }`;

                static readonly fragSource = `
                    precision mediump float;

                    varying float vDepth;
                    varying vec2 vTextureCoord;

                    uniform sampler2D uBaseTexture;

                    // x: time in seconds, y, z, w: unused
                    uniform vec4 uTime;

                    // x: near fog density, y: far plane fog density, z: min density, w: max density
                    uniform vec4 uFogParams;
                    uniform vec3 uFogColor;
                    uniform float uNoFog;

                    vec3 ApplyFog(vec3 inColor)
                    {
                        if (uNoFog > 0.5) return inColor;

                        float fogDensity = uFogParams.x + uFogParams.y * vDepth;

                        fogDensity = min(max(fogDensity, uFogParams.z), uFogParams.w);

                        return mix(inColor, uFogColor, fogDensity);
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