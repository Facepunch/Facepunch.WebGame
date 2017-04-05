namespace Facepunch {
    export namespace WebGame {
        export namespace Shaders {
            export class Error extends ShaderProgram {
                static readonly vertSource = `
                    attribute vec3 aPosition;
                    attribute vec2 aTextureCoord;

                    varying vec2 vTextureCoord;

                    uniform mat4 uProjection;
                    uniform mat4 uView;
                    uniform mat4 uModel;

                    void main()
                    {
                        gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
                        
                        vTextureCoord = aTextureCoord;
                    }`;

                static readonly fragSource = `
                    precision mediump float;

                    varying vec2 vTextureCoord;

                    uniform sampler2D uErrorTexture;

                    void main()
                    {
                        gl_FragColor = vec4(texture2D(uErrorTexture, vTextureCoord).rgb, 1.0);
                    }`;

                readonly projectionMatrix: UniformMatrix4;
                readonly viewMatrix: UniformMatrix4;
                readonly modelMatrix: UniformMatrix4;

                readonly errorTexture: UniformSampler;

                constructor(context: WebGLRenderingContext) {
                    super(context);

                    const gl = context;

                    this.includeShaderSource(gl.VERTEX_SHADER, Error.vertSource);
                    this.includeShaderSource(gl.FRAGMENT_SHADER, Error.fragSource);

                    this.addAttribute("aPosition", VertexAttribute.position);
                    this.addAttribute("aTextureCoord", VertexAttribute.uv);

                    this.projectionMatrix = this.addUniform("uProjection", UniformMatrix4);
                    this.viewMatrix = this.addUniform("uView", UniformMatrix4);
                    this.modelMatrix = this.addUniform("uModel", UniformMatrix4);

                    this.errorTexture = this.addUniform("uErrorTexture", UniformSampler);

                    this.compile();
                }

                bufferSetup(buf: CommandBuffer): void {
                    super.bufferSetup(buf);

                    this.projectionMatrix.bufferParameter(buf, Camera.projectionMatrixParam);
                    this.viewMatrix.bufferParameter(buf, Camera.viewMatrixParam);
                    
                    const gl = this.context;

                    this.errorTexture.bufferValue(buf, TextureUtils.getErrorTexture(gl));

                    buf.enable(gl.CULL_FACE);
                    buf.enable(gl.DEPTH_TEST);
                    buf.depthMask(true);
                    buf.disable(gl.BLEND);
                }
                
                bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void {
                    super.bufferModelMatrix(buf, value);

                    this.modelMatrix.bufferValue(buf, false, value);
                }
            }
        }
    }
}