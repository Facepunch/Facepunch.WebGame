namespace Facepunch {
    export namespace WebGame {
        export namespace Shaders {
            export class VertexLitGenericMaterialProps extends ModelBaseMaterialProps {
                alpha = 1.0;
                alphaTest = false;
            }

            export class VertexLitGeneric extends ModelBase<VertexLitGenericMaterialProps> {
                static readonly vertSource = `
                    attribute vec3 aColor;

                    varying vec3 vColor;

                    void main()
                    {
                        Base_main();
                        vColor = vec3(1.0, 1.0, 1.0);
                        //vColor = aColor * (1.0 / 255.0);
                    }`;
                    
                static readonly fragSource = `
                    varying vec3 vColor;

                    uniform float uAlpha;

                    uniform float uAlphaTest;
                    uniform float uTranslucent;

                    void main()
                    {
                        vec4 texSample = texture2D(uBaseTexture, vTextureCoord);
                        if (texSample.a < uAlphaTest - 0.5) discard;

                        vec3 color = ApplyFog(texSample.rgb * vColor);

                        gl_FragColor = vec4(color, mix(1.0, texSample.a, uTranslucent) * uAlpha);
                    }`;

                readonly alpha: Uniform1F;
                readonly alphaTest: Uniform1F;
                readonly translucent: Uniform1F;

                constructor(context: WebGLRenderingContext) {
                    super(context, VertexLitGenericMaterialProps);

                    const gl = context;

                    this.addAttribute("aColor", VertexAttribute.rgb);

                    this.includeShaderSource(gl.VERTEX_SHADER, VertexLitGeneric.vertSource);
                    this.includeShaderSource(gl.FRAGMENT_SHADER, VertexLitGeneric.fragSource);
                    
                    this.alpha = this.addUniform("uAlpha", Uniform1F);
                    this.alphaTest = this.addUniform("uAlphaTest", Uniform1F);
                    this.translucent = this.addUniform("uTranslucent", Uniform1F);
                
                    this.compile();    
                }

                bufferMaterialProps(buf: CommandBuffer, props: VertexLitGenericMaterialProps): void {
                    super.bufferMaterialProps(buf, props);

                    this.alpha.bufferValue(buf, props.alpha);
                    this.alphaTest.bufferValue(buf, props.alphaTest ? 1 : 0);
                    this.translucent.bufferValue(buf, props.translucent ? 1 : 0);
                }
            }
        }
    }
}