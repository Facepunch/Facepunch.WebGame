namespace Facepunch {
    export namespace WebGame {
        export class ShaderManager {
            private namedPrograms: { [name: string]: ShaderProgram } = {};
            private ctorPrograms: {ctor: IProgramCtor, program: ShaderProgram}[] = [];
            private gl: WebGLRenderingContext;

            constructor(gl: WebGLRenderingContext) {
                this.gl = gl;
            }

            resetUniformCache(): void {
                for (let name in this.namedPrograms) {
                    if (this.namedPrograms.hasOwnProperty(name)) {
                        this.namedPrograms[name].resetUniformCache();
                    }
                }
            }

            getContext(): WebGLRenderingContext {
                return this.gl;
            }

            private getFromName(name: string): ShaderProgram {
                const program = this.namedPrograms[name];
                if (program !== undefined) return program;

                const nameParts = name.split(".");
                
                let target: any = window;
                for (let i = 0; i < nameParts.length; ++i) {
                    target = target[nameParts[i]];
                }

                const Type: IProgramCtor = target;
                if (Type === undefined) throw `Unknown shader name '${name}'.`;
                return this.namedPrograms[name] = this.getFromCtor(Type);
            }

            private getFromCtor(ctor: IProgramCtor): ShaderProgram {
                for (let i = 0, iEnd = this.ctorPrograms.length; i < iEnd; ++i) {
                    const ctorProgram = this.ctorPrograms[i];
                    if (ctorProgram.ctor === ctor) return ctorProgram.program;
                }

                const program = new ctor(this);
                this.ctorPrograms.push({ctor: ctor, program: program});
                return program;
            }

            get(name: string): ShaderProgram;
            get(ctor: IProgramCtor): ShaderProgram;
            get(nameOrCtor: string | IProgramCtor): ShaderProgram {
                if (typeof name === "string") {
                    return this.getFromName(nameOrCtor as string);
                } else {
                    return this.getFromCtor(nameOrCtor as IProgramCtor);
                }
            }

            dispose(): void {
                for (let name in this.namedPrograms) {
                    if (this.namedPrograms.hasOwnProperty(name)) {
                        this.namedPrograms[name].dispose();
                    }
                }

                this.namedPrograms = {};
            }
        }
    }
}