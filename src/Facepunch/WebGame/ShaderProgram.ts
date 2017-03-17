namespace Facepunch {
    export namespace WebGame {
        export class ShaderProgram {
            private static nextSortIndex = 0;

            private sortIndex: number;

            private manager: ShaderManager;
            private program: WebGLProgram;
            private compiled = false;

            private vertSource: string;
            private fragSource: string;

            private nextTextureUnit = 0;

            private attribNames: { [name: string]: VertexAttribute } = {};
            private attribIds: number[] = [];
            private attribLocations: { [id: number]: number } = {};
            private attribStates: { [id: number]: boolean } = {};
            private uniforms: Uniform[] = [];

            sortOrder = 0;

            constructor(manager: ShaderManager) {
                this.manager = manager;

                this.sortIndex = ShaderProgram.nextSortIndex++;
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
                    this.getContext().deleteProgram(this.program);
                    this.program = undefined;
                }
            }

            compareTo(other: ShaderProgram): number {
                if (other === this) return 0;
                const orderCompare = this.sortOrder - other.sortOrder;
                if (orderCompare !== 0) return orderCompare;
                return this.sortIndex - other.sortIndex;
            }

            getProgram(): WebGLProgram {
                if (this.program === undefined) {
                    return this.program = this.getContext().createProgram();
                }
                return this.program;
            }

            bufferAttribPointer(buf: CommandBuffer, attrib: VertexAttribute,
                size: number,
                type: number,
                normalized: boolean,
                stride: number,
                offset: number) {
                const loc = this.attribLocations[attrib.id];
                if (loc === undefined) return;

                buf.vertexAttribPointer(loc, size, type, normalized, stride, offset);
            }

            isCompiled(): boolean {
                return this.compiled;
            }

            protected addAttribute(name: string, attrib: VertexAttribute): void {
                this.attribNames[name] = attrib;
            }

            protected addUniform<TUniform extends Uniform>(ctor: IUniformCtor<TUniform>, name: string): TUniform {
                const uniform = new ctor(this, name);
                this.uniforms.push(uniform);
                return uniform;
            }

            getContext(): WebGLRenderingContext {
                return this.manager.getContext();
            }

            private static includeRegex = /^\s*#include\s+\"([^"]+)\"\s*$/m;

            private getShaderSource(url: string, action: (source: string) => void): void {
                Http.getString(`${url}?v=${Math.random()}`,
                    (source: string) => {
                        const match = source.match(ShaderProgram.includeRegex);

                        if (match == null) {
                            action(source);
                            return;
                        }

                        const fileName = match[1];
                        const dirName = url.substr(0, url.lastIndexOf("/") + 1);

                        this.getShaderSource(`${dirName}${fileName}`,
                            include => action(source.replace(match[0], include)));
                    });
            }

            protected loadShaderSource(type: number, url: string): void {
                this.getShaderSource(url, source => this.onLoadShaderSource(type, source));
            }

            private hasAllSources(): boolean {
                return this.vertSource !== undefined && this.fragSource !== undefined;
            }

            private onLoadShaderSource(type: number, source: string): void {
                switch (type) {
                case WebGLRenderingContext.VERTEX_SHADER:
                    this.vertSource = source;
                    break;
                case WebGLRenderingContext.FRAGMENT_SHADER:
                    this.fragSource = source;
                    break;
                default:
                    return;
                }

                if (this.hasAllSources()) {
                    this.compile();
                }
            }

            private compileShader(type: number, source: string): WebGLShader {
                const gl = this.getContext();

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
                const gl = this.getContext();
                const loc = gl.getAttribLocation(this.program, name);

                if (loc === -1) throw `Unable to find attribute with name '${name}'.`;

                this.attribIds.push(attrib.id);
                this.attribLocations[attrib.id] = loc;
                this.attribStates[attrib.id] = false;
            }

            private compile(): void {
                const gl = this.getContext();

                const vert = this.compileShader(gl.VERTEX_SHADER, this.vertSource);
                const frag = this.compileShader(gl.FRAGMENT_SHADER, this.fragSource);

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

            bufferMaterial(buf: CommandBuffer, material: Material): void {
                const gl = this.getContext();

                if (material.properties.noCull) {
                    buf.disable(gl.CULL_FACE);
                } else {
                    buf.enable(gl.CULL_FACE);
                }
            }
        }
    }
}