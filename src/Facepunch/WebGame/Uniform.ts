namespace Facepunch {
    export namespace WebGame {
        export interface IUniformCtor<TUniform extends Uniform> {
            new (program: ShaderProgram, name: string): TUniform;
        }

        export abstract class Uniform {
            protected readonly context: WebGLRenderingContext;

            private program: ShaderProgram;
            private name: string;
            private location: WebGLUniformLocation;

            private parameter: CommandBufferParameter;

            isSampler = false;

            constructor(program: ShaderProgram, name: string) {
                this.program = program;
                this.name = name;
                this.context = program.context;
            }

            toString(): string {
                return this.name;
            }

            getLocation(): WebGLUniformLocation {
                if (this.location !== undefined) return this.location;
                if (!this.program.isCompiled()) return undefined;
                return this.location = this.context.getUniformLocation(this.program.getProgram(), this.name);
            }

            reset(): void {
                this.parameter = undefined;
            }

            bufferParameter(buf: CommandBuffer, param: CommandBufferParameter) {
                if (this.parameter === param) return;
                this.parameter = param;
                buf.setUniformParameter(this, param);
            }
        }

        export class Uniform1F extends Uniform {
            private x: number;

            reset(): void {
                super.reset();
                this.x = undefined;
            }

            bufferValue(buf: CommandBuffer, x: number): void {
                if (this.x === x) return;
                this.x = x;
                buf.setUniform1F(this, x);
            }

            set(x: number): void {
                this.context.uniform1f(this.getLocation(), x);
            }
        }

        export class Uniform1I extends Uniform {
            private x: number;

            reset(): void {
                super.reset();
                this.x = undefined;
            }

            bufferValue(buf: CommandBuffer, x: number): void {
                if (this.x === x) return;
                this.x = x;
                buf.setUniform1I(this, x);
            }

            set(x: number): void {
                this.context.uniform1i(this.getLocation(), x);
            }
        }

        export class Uniform2F extends Uniform {
            private x: number;
            private y: number;

            reset(): void {
                super.reset();
                this.x = undefined;
                this.y = undefined;
            }

            bufferValue(buf: CommandBuffer, x: number, y: number): void {
                if (this.x === x && this.y === y) return;
                this.x = x;
                this.y = y;
                buf.setUniform2F(this, x, y);
            }

            set(x: number, y: number): void {
                this.context.uniform2f(this.getLocation(), x, y);
            }
        }

        export class Uniform3F extends Uniform {
            private x: number;
            private y: number;
            private z: number;

            reset(): void {
                super.reset();
                this.x = undefined;
                this.y = undefined;
                this.z = undefined;
            }

            bufferValue(buf: CommandBuffer, x: number, y: number, z: number): void {
                if (this.x === x && this.y === y && this.z === z) return;
                this.x = x;
                this.y = y;
                this.z = z;
                buf.setUniform3F(this, x, y, z);
            }

            set(x: number, y: number, z: number): void {
                this.context.uniform3f(this.getLocation(), x, y, z);
            }
        }

        export class Uniform4F extends Uniform {
            private x: number;
            private y: number;
            private z: number;
            private w: number;

            reset(): void {
                super.reset();
                this.x = undefined;
                this.y = undefined;
                this.z = undefined;
                this.w = undefined;
            }

            bufferValue(buf: CommandBuffer, x: number, y: number, z: number, w: number): void {
                if (this.x === x && this.y === y && this.z === z && this.w === w) return;
                this.x = x;
                this.y = y;
                this.z = z;
                this.w = w;
                buf.setUniform4F(this, x, y, z, w);
            }

            set(x: number, y: number, z: number, w: number): void {
                this.context.uniform4f(this.getLocation(), x, y, z, w);
            }
        }

        export class UniformSampler extends Uniform {
            private value: number;
            private default: Texture;

            private texUnit: number;

            constructor(program: ShaderProgram, name: string) {
                super(program, name);

                this.isSampler = true;

                this.texUnit = program.reserveNextTextureUnit();
            }

            getTexUnit(): number {
                return this.texUnit;
            }

            setDefault(tex: Texture): void {
                this.default = tex;
            }

            reset(): void {
                super.reset();
                this.value = undefined;
            }

            bufferValue(buf: CommandBuffer, tex: Texture): void {
                if (tex == null || !tex.isLoaded()) {
                    tex = this.default;
                }

                buf.bindTexture(this.texUnit, tex);

                if (this.value !== this.texUnit) {
                    this.value = this.texUnit;
                    buf.setUniform1I(this, this.texUnit);
                }
            }

            set(tex: Texture): void {
                if (tex == null || !tex.isLoaded()) {
                    tex = this.default;
                }

                this.context.activeTexture(this.context.TEXTURE0 + this.texUnit);
                this.context.bindTexture(tex.getTarget(), tex.getHandle());
                this.context.uniform1i(this.getLocation(), this.texUnit);
            }
        }

        export class UniformMatrix4 extends Uniform {
            private transpose: boolean;
            private values: Float32Array;

            reset(): void {
                super.reset();
                this.transpose = undefined;
                this.values = undefined;
            }

            bufferValue(buf: CommandBuffer, transpose: boolean, values: Float32Array): void {
                if (this.transpose === transpose && this.values === values) return;
                this.transpose = transpose;
                this.values = values;

                buf.setUniformMatrix4(this, transpose, values);
            }

            set(transpose: boolean, values: Float32Array): void {
                this.context.uniformMatrix4fv(this.getLocation(), transpose, values);
            }
        }
    }
}