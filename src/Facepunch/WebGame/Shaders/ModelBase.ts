namespace Facepunch {
    export namespace WebGame {
        export namespace Shaders {
            export class ModelBaseMaterialProps extends BaseMaterialProps {
                baseTexture: Texture = null;
                noFog = false;
                translucent = false;
            }

            export abstract class ModelBase<TMaterialProps extends ModelBaseMaterialProps>
                extends BaseShaderProgram<TMaterialProps> {

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

                readonly projectionMatrix: UniformMatrix4;
                readonly viewMatrix: UniformMatrix4;
                readonly modelMatrix: UniformMatrix4;

                readonly baseTexture: UniformSampler;
                readonly time: Uniform4F;
                readonly fogParams: Uniform4F;
                readonly fogColor: Uniform3F;
                readonly noFog: Uniform1F;

                constructor(context: WebGLRenderingContext, ctor: {new(): TMaterialProps}) {
                    super(context, ctor);

                    const gl = context;

                    this.includeShaderSource(gl.VERTEX_SHADER, ModelBase.vertSource);
                    this.includeShaderSource(gl.FRAGMENT_SHADER, ModelBase.fragSource);

                    this.addAttribute("aPosition", VertexAttribute.position);
                    this.addAttribute("aTextureCoord", VertexAttribute.uv);

                    this.projectionMatrix = this.addUniform("uProjection", UniformMatrix4);
                    this.viewMatrix = this.addUniform("uView", UniformMatrix4);
                    this.modelMatrix = this.addUniform("uModel", UniformMatrix4);

                    this.baseTexture = this.addUniform("uBaseTexture", UniformSampler);
                    this.baseTexture.setDefault(TextureUtils.getErrorTexture(context));

                    this.time = this.addUniform("uTime", Uniform4F);
                    this.fogParams = this.addUniform("uFogParams", Uniform4F);
                    this.fogColor = this.addUniform("uFogColor", Uniform3F);
                    this.noFog = this.addUniform("uNoFog", Uniform1F);
                }

                bufferSetup(buf: CommandBuffer, context: RenderContext): void {
                    super.bufferSetup(buf, context);

                    this.projectionMatrix.bufferParameter(buf, CommandBufferParameter.ProjectionMatrix);
                    this.viewMatrix.bufferParameter(buf, CommandBufferParameter.ViewMatrix);

                    this.time.bufferParameter(buf, CommandBufferParameter.TimeParams);
                    this.fogParams.bufferParameter(buf, CommandBufferParameter.FogParams);
                    this.fogColor.bufferParameter(buf, CommandBufferParameter.FogColor);
                }
                
                bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void {
                    super.bufferModelMatrix(buf, value);

                    this.modelMatrix.bufferValue(buf, false, value);
                }

                bufferMaterialProps(buf: CommandBuffer, props: TMaterialProps): void {
                    super.bufferMaterialProps(buf, props);

                    this.baseTexture.bufferValue(buf, props.baseTexture);
                    this.noFog.bufferValue(buf, props.noFog ? 1 : 0);

                    const gl = this.context;

                    if (props.translucent) {
                        buf.depthMask(false);
                        buf.enable(gl.BLEND);
                        buf.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                    } else {
                        buf.depthMask(true);
                        buf.disable(gl.BLEND);
                    }
                }
            }
        }
    }
}