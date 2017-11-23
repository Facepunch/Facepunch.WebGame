namespace Facepunch {
    export namespace WebGame {
        export namespace Shaders {
            export class DebugLineProps extends BaseMaterialProps {
                noCull = true;
                color0 = new Vector3(1.0, 1.0, 1.0);
                color1 = new Vector3(1.0, 1.0, 1.0);
                phase = 0;
                frequency = 1;
            }

            export class DebugLine extends BaseShaderProgram<DebugLineProps> {
                readonly projectionMatrix: UniformMatrix4;
                readonly viewMatrix: UniformMatrix4;
                readonly modelMatrix: UniformMatrix4;

                readonly time: Uniform4F;
                readonly color0: Uniform3F;
                readonly color1: Uniform3F;
                readonly phase: Uniform1F;
                readonly frequency: Uniform1F;

                constructor(context: WebGLRenderingContext) {
                    super(context, DebugLineProps);

                    const gl = context;

                    this.includeShaderSource(gl.VERTEX_SHADER, `
                        attribute vec3 aPosition;
                        attribute float aProgress;

                        varying float vProgress;

                        uniform mat4 uProjection;
                        uniform mat4 uView;
                        uniform mat4 uModel;

                        void main()
                        {
                            vProgress = aProgress;

                            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
                        }`);

                    this.includeShaderSource(gl.FRAGMENT_SHADER, `
                        precision mediump float;

                        varying float vProgress;

                        uniform vec4 uTime;
                        uniform vec3 uColor0;
                        uniform vec3 uColor1;
                        uniform float uPhase;
                        uniform float uFrequency;

                        void main()
                        {
                            gl_FragColor = vec4(mod(vProgress - uPhase - uTime.x * uFrequency, 2.0) < 1.0 ? uColor0 : uColor1, 1.0);
                        }`);

                    this.addAttribute("aPosition", VertexAttribute.position);
                    this.addAttribute("aProgress", VertexAttribute.alpha);

                    this.projectionMatrix = this.addUniform("uProjection", UniformMatrix4);
                    this.viewMatrix = this.addUniform("uView", UniformMatrix4);
                    this.modelMatrix = this.addUniform("uModel", UniformMatrix4);

                    this.time = this.addUniform("uTime", Uniform4F);
                    this.color0 = this.addUniform("uColor0", Uniform3F);
                    this.color1 = this.addUniform("uColor1", Uniform3F);
                    this.phase = this.addUniform("uPhase", Uniform1F);
                    this.frequency = this.addUniform("uFrequency", Uniform1F);

                    this.compile();
                }

                bufferSetup(buf: CommandBuffer): void {
                    super.bufferSetup(buf);

                    this.projectionMatrix.bufferParameter(buf, Camera.projectionMatrixParam);
                    this.viewMatrix.bufferParameter(buf, Camera.viewMatrixParam);

                    const gl = this.context;

                    buf.enable(gl.DEPTH_TEST);
                    buf.depthMask(true);
                    buf.disable(gl.BLEND);
                }

                bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void {
                    super.bufferModelMatrix(buf, value);

                    this.modelMatrix.bufferValue(buf, false, value);
                }

                bufferMaterialProps(buf: CommandBuffer, props: DebugLineProps): void {
                    super.bufferMaterialProps(buf, props);

                    const gl = this.context;

                    this.time.bufferParameter(buf, Game.timeInfoParam);
                    this.color0.bufferValue(buf, props.color0.x, props.color0.y, props.color0.z);
                    this.color1.bufferValue(buf, props.color1.x, props.color1.y, props.color1.z);
                    this.phase.bufferValue(buf, props.phase);
                    this.frequency.bufferValue(buf, props.frequency);
                }
            }
        }
    }
}