namespace Facepunch {
    export namespace WebGame {
        export class Fog implements ICommandBufferParameterProvider {
            static readonly fogColorParam = new CommandBufferParameter(UniformType.Float3);
            static readonly fogInfoParam = new CommandBufferParameter(UniformType.Float4);

            private readonly renderContext: RenderContext;

            start = 0;
            end = 8192;
            maxDensity = 0;
            
            readonly color = new Vector3();

            private readonly colorValues = new Float32Array(3);
            private readonly paramsValues = new Float32Array(4);

            constructor(context: RenderContext) {
                this.renderContext = context;
            }

            populateCommandBufferParameters(buf: CommandBuffer): void {
                this.colorValues[0] = this.color.x;
                this.colorValues[1] = this.color.y;
                this.colorValues[2] = this.color.z;

                buf.setParameter(Fog.fogColorParam, this.colorValues);

                const clipParams = buf.getArrayParameter(Camera.clipInfoParam);

                const near = clipParams[0];
                const far = clipParams[1];

                const densMul = this.maxDensity / ((this.end - this.start) * (far - near));
                const densNear = (near - this.start) * densMul;
                const densFar = (far - this.start) * densMul;

                this.paramsValues[0] = densNear;
                this.paramsValues[1] = densFar;
                this.paramsValues[2] = 0;
                this.paramsValues[3] = this.maxDensity;

                buf.setParameter(Fog.fogInfoParam, this.paramsValues);
            }
        }
    }
}