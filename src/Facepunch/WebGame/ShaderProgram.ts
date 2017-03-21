namespace Facepunch {
    export namespace WebGame {
        export interface IProgramCtor {
            new (context: WebGLRenderingContext): ShaderProgram;
        }

        export abstract class ShaderProgram {
            private static nextId = 0;

            readonly id = ShaderProgram.nextId++;
            readonly context: WebGLRenderingContext;

            private program: WebGLProgram;
            private compiled = false;

            private readonly vertIncludes: string[] = [];
            private readonly fragIncludes: string[] = [];

            private fullVertSource = false;
            private fullFragSource = false;

            private nextTextureUnit = 0;

            private attribNames: { [name: string]: VertexAttribute } = {};
            private attribIds: number[] = [];
            private attribLocations: { [id: number]: number } = {};
            private attribStates: { [id: number]: boolean } = {};
            private uniforms: Uniform[] = [];

            sortOrder = 0;

            constructor(context: WebGLRenderingContext) {
                this.context = context;
            }

            createMaterialProperties(): any {
                return {};
            }

            reserveNextTextureUnit(): number {
                return this.nextTextureUnit++;
            }

            resetUniformCache(): void {
                for (let i = 0; i < this.uniforms.length; ++i) {
                    this.uniforms[i].reset();
                }
            }

            dispose(): void {
                if (this.program !== undefined) {
                    this.context.deleteProgram(this.program);
                    this.program = undefined;
                }
            }

            compareTo(other: ShaderProgram): number {
                if (other === this) return 0;
                const orderCompare = this.sortOrder - other.sortOrder;
                if (orderCompare !== 0) return orderCompare;
                return this.id - other.id;
            }

            compareMaterials(a: Material, b: Material): number {
                return a.id - b.id;
            }

            getProgram(): WebGLProgram {
                if (this.program === undefined) {
                    return this.program = this.context.createProgram();
                }
                return this.program;
            }

            bufferAttribPointer(buf: CommandBuffer, attrib: VertexAttribute,
                stride: number,
                offset: number) {
                const loc = this.attribLocations[attrib.id];
                if (loc === undefined) return;

                buf.vertexAttribPointer(loc, attrib.size, attrib.type, attrib.normalized, stride, offset);
            }

            isCompiled(): boolean {
                return this.compiled;
            }

            protected addAttribute(name: string, attrib: VertexAttribute): void {
                this.attribNames[name] = attrib;
            }

            protected addUniform<TUniform extends Uniform>(name: string, ctor: IUniformCtor<TUniform>): TUniform {
                const uniform = new ctor(this, name);
                this.uniforms.push(uniform);
                return uniform;
            }

            private hasAllSources(): boolean {
                return this.fullFragSource && this.fullVertSource;
            }

            private static formatSource(source: string): string {
                const lines = source.replace(/\r\n/g, "\n").split("\n");

                while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
                    lines.splice(lines.length - 1, 1);
                }

                while (lines.length > 0 && lines[0].trim().length === 0) {
                    lines.splice(0, 1);
                }

                if (lines.length === 0) return "";

                let indentLength = 0;
                const firstLine = lines[0];
                for (let i = 0, iEnd = firstLine.length; i < iEnd; ++i) {
                    if (firstLine.charAt(i) === " ") {
                        ++indentLength;
                    } else break;
                }

                for (let i = 0, iEnd = lines.length; i < iEnd; ++i) {
                    const line = lines[i];
                    if (line.substr(0, indentLength).trim().length === 0) {
                        lines[i] = line.substr(indentLength);
                    }
                }

                return lines.join("\r\n");
            }

            protected includeShaderSource(type: number, source: string): void {
                source = ShaderProgram.formatSource(source);

                switch (type) {
                case WebGLRenderingContext.VERTEX_SHADER:
                    this.vertIncludes.push(source);
                    break;
                case WebGLRenderingContext.FRAGMENT_SHADER:
                    this.fragIncludes.push(source);
                    break;
                }
            }

            protected setShaderSource(type: number, source: string): void {
                this.includeShaderSource(type, source);

                switch(type) {
                case WebGLRenderingContext.VERTEX_SHADER:
                    this.fullVertSource = true;
                    break;
                case WebGLRenderingContext.FRAGMENT_SHADER:
                    this.fullFragSource = true;
                    break;
                }

                if (this.hasAllSources()) {
                    this.compile();
                }
            }

            private compileShader(type: number, source: string): WebGLShader {
                const gl = this.context;

                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    const error = `Shader compilation error:\n${gl.getShaderInfoLog(shader)}`;
                    gl.deleteShader(shader);
                    console.log(source);
                    throw error;
                }

                return shader;
            }

            private findAttribLocation(name: string, attrib: VertexAttribute): void {
                const gl = this.context;
                const loc = gl.getAttribLocation(this.program, name);

                if (loc === -1) throw `Unable to find attribute with name '${name}'.`;

                this.attribIds.push(attrib.id);
                this.attribLocations[attrib.id] = loc;
                this.attribStates[attrib.id] = false;
            }

            private compile(): void {
                const gl = this.context;

                const vertSource = this.vertIncludes.join("\r\n\r\n");
                const fragSource = this.fragIncludes.join("\r\n\r\n");

                const vert = this.compileShader(gl.VERTEX_SHADER, vertSource);
                const frag = this.compileShader(gl.FRAGMENT_SHADER, fragSource);

                const prog = this.getProgram();

                gl.attachShader(prog, vert);
                gl.attachShader(prog, frag);

                gl.linkProgram(prog);

                gl.deleteShader(vert);
                gl.deleteShader(frag);

                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                    throw `Program linking error: ${gl.getProgramInfoLog(prog)}`;
                }

                for (let name in this.attribNames) {
                    if (this.attribNames.hasOwnProperty(name)) {
                        this.findAttribLocation(name, this.attribNames[name]);
                    }
                }

                this.compiled = true;
            }

            bufferEnableAttributes(buf: CommandBuffer, attribs?: VertexAttribute[]) {
                for (let i = 0; i < this.attribIds.length; ++i) {
                    const id = this.attribIds[i];
                    if (!this.attribStates[id]) continue;

                    let found = false;

                    if (attribs != null) {
                        for (let j = 0; j < attribs.length; ++j) {
                            if (attribs[j].id == id) {
                                found = true;
                                break;
                            }
                        }
                    }

                    if (!found) buf.disableVertexAttribArray(this.attribLocations[id]);
                }

                if (attribs == null) return;

                for (let i = 0; i < attribs.length; ++i) {
                    const attrib = attribs[i];
                    if (this.attribStates[attrib.id] === false) {
                        this.attribStates[attrib.id] = true;
                        buf.enableVertexAttribArray(this.attribLocations[attrib.id]);
                    }
                }
            }

            bufferDisableMeshComponents(buf: CommandBuffer) {
                this.bufferEnableAttributes(buf, null);
            }

            bufferSetup(buf: CommandBuffer, context: RenderContext): void {
                buf.useProgram(this);
            }

            bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void { }

            bufferMaterial(buf: CommandBuffer, material: Material): void { }
        }

        export class BaseMaterialProps {
            noCull = false;
        }

        export abstract class BaseShaderProgram<TMaterialProps extends BaseMaterialProps> extends ShaderProgram {
            private readonly materialPropsCtor: {new():TMaterialProps};
            
            constructor(context: WebGLRenderingContext, ctor: {new():TMaterialProps}) {
                super(context);

                this.materialPropsCtor = ctor;
            }
            
            createMaterialProperties(): any {
                return new this.materialPropsCtor();
            }
            
            bufferMaterial(buf: CommandBuffer, material: Material): void {
                this.bufferMaterialProps(buf, material.properties as TMaterialProps);
            }
            
            bufferMaterialProps(buf: CommandBuffer, props: TMaterialProps): void {
                const gl = this.context;

                if (props.noCull) {
                    buf.disable(gl.CULL_FACE);
                } else {
                    buf.enable(gl.CULL_FACE);
                }
            }
        }
    }
}