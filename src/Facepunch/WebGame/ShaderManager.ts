namespace Facepunch {
    export namespace WebGame {
        export class ShaderManager {

            private programs: { [name: string]: ShaderProgram } = {};
            private gl: WebGLRenderingContext;

            constructor(gl: WebGLRenderingContext) {
                this.gl = gl;
            }

            resetUniformCache(): void {
                for (let name in this.programs) {
                    if (this.programs.hasOwnProperty(name)) {
                        this.programs[name].resetUniformCache();
                    }
                }
            }

            getContext(): WebGLRenderingContext {
                return this.gl;
            }

            get(name: string): ShaderProgram {
                const program = this.programs[name];
                if (program !== undefined) return program;

                const nameParts = name.split(".");
                
                let target: any = window;
                for (let i = 0; i < nameParts.length; ++i) {
                    target = target[nameParts[i]];
                }

                const Type = target;
                if (Type === undefined) throw `Unknown shader name '${name}'.`;
                return this.programs[name] = new Type(this);
            }

            dispose(): void {
                for (let name in this.programs) {
                    if (this.programs.hasOwnProperty(name)) {
                        this.programs[name].dispose();
                    }
                }

                this.programs = {};
            }
        }
    }
}