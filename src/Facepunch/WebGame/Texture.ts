namespace Facepunch {
    export namespace WebGame {
        export abstract class Texture {
            private static nextId = 1;

            readonly id: number;

            constructor() {
                this.id = Texture.nextId++;
            }

            isLoaded(): boolean {
                return this.getHandle() !== undefined;
            }

            abstract getTarget(): TextureTarget;
            abstract getHandle(): WebGLTexture;

            dispose(): void {}
        }

        export enum TextureFormat {
            Rgb = WebGLRenderingContext.RGB,
            Rgba = WebGLRenderingContext.RGBA
        }

        export enum TextureDataType {
            Uint8 = WebGLRenderingContext.UNSIGNED_BYTE,
            Uint16 = WebGLRenderingContext.UNSIGNED_SHORT,
            Uint32 = WebGLRenderingContext.UNSIGNED_INT,
            Float = WebGLRenderingContext.FLOAT
        }

        export class RenderTexture extends Texture {
            private readonly gl: WebGLRenderingContext;
            private readonly target: TextureTarget;
            private readonly format: TextureFormat;
            private readonly type: TextureDataType;

            private width: number;
            private height: number;

            private handle: WebGLTexture;

            constructor(gl: WebGLRenderingContext, format: TextureFormat, type: TextureDataType,
                width: number, height: number) {
                super();

                this.gl = gl;
                this.target = TextureTarget.Texture2D;
                this.format = format;
                this.type = type;
                this.handle = gl.createTexture();

                this.setWrapMode(TextureWrapMode.ClampToEdge);
                this.setFilter(TextureMinFilter.Linear, TextureMagFilter.Nearest);

                this.resize(width, height);
            }

            setWrapMode(mode: TextureWrapMode): void;
            setWrapMode(wrapS: TextureWrapMode, wrapT: TextureWrapMode): void;
            setWrapMode(wrapS: TextureWrapMode, wrapT?: TextureWrapMode): void {
                if (wrapT === undefined) wrapT = wrapS;

                const gl = this.gl;
                gl.bindTexture(this.target, this.handle);

                gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrapS);
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrapT);
                
                gl.bindTexture(this.target, null);
            }

            setFilter(minFilter: TextureMinFilter, magFilter: TextureMagFilter): void {
                const gl = this.gl;
                gl.bindTexture(this.target, this.handle);

                gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
                gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, magFilter);
                
                gl.bindTexture(this.target, null);
            }
            
            getTarget(): TextureTarget {
                return this.gl.TEXTURE_2D;
            }

            getHandle(): WebGLTexture {
                return this.handle;
            }

            resize(width: number, height: number): void {
                if (this.width === width && this.height === height) return;

                const gl = this.gl;

                this.width = width;
                this.height = height;

                gl.bindTexture(this.target, this.handle);
                gl.texImage2D(this.target, 0, this.format, width, height, 0, this.format, this.type, null);
                gl.bindTexture(this.target, null);
            }

            dispose(): void {
                if (this.handle === undefined) return;
                this.gl.deleteTexture(this.handle);
                this.handle = undefined;
            }
        }

        export enum TextureTarget {
            Texture2D = WebGLRenderingContext.TEXTURE_2D,
            TextureCubeMap = WebGLRenderingContext.TEXTURE_CUBE_MAP
        }

        export enum TextureWrapMode {
            ClampToEdge = WebGLRenderingContext.CLAMP_TO_EDGE,
            Repeat = WebGLRenderingContext.REPEAT,
            MirroredRepeat = WebGLRenderingContext.MIRRORED_REPEAT
        }

        export enum TextureMinFilter {
            Nearest = WebGLRenderingContext.NEAREST,
            Linear = WebGLRenderingContext.LINEAR,
            NearestMipmapNearest = WebGLRenderingContext.NEAREST_MIPMAP_NEAREST,
            LinearMipmapNearest = WebGLRenderingContext.LINEAR_MIPMAP_NEAREST,
            NearestMipmapLinear = WebGLRenderingContext.NEAREST_MIPMAP_LINEAR,
            LinearMipmapLinear = WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
        }

        export enum TextureMagFilter {
            Nearest = TextureMinFilter.Nearest as number,
            Linear = TextureMinFilter.Linear as number
        }

        export enum TextureParameterType {
            Integer = WebGLRenderingContext.INT,
            Float = WebGLRenderingContext.FLOAT
        }

        export enum TextureParameter {
            WrapS = WebGLRenderingContext.TEXTURE_WRAP_S,
            WrapT = WebGLRenderingContext.TEXTURE_WRAP_T,
            MinFilter = WebGLRenderingContext.TEXTURE_MIN_FILTER,
            MagFilter = WebGLRenderingContext.TEXTURE_MAG_FILTER
        }

        export interface ITextureParameter {
            type: TextureParameterType | string;
            name: TextureParameter | string;
            value: TextureWrapMode | TextureMinFilter | TextureMagFilter | string;
        }

        export interface IColor {
            r: number;
            g: number;
            b: number;
            a?: number;
        }

        export interface ITextureElement {
            level: number;
            target?: TextureTarget | string;
            url?: string;
            color?: IColor;
        }

        export interface ITextureInfo {
            target: TextureTarget | string,
            width: number;
            height: number;
            params: ITextureParameter[],
            elements: ITextureElement[]
        }

        export class TextureLoadable extends Texture implements ILoadable<TextureLoadable> {
            private readonly gl: WebGLRenderingContext;
            private readonly url: string;            

            private info: ITextureInfo;
            private nextElement = 0;

            private handle: WebGLTexture;
            private target: TextureTarget;

            constructor(gl: WebGLRenderingContext, url: string) {
                super();

                this.gl = gl;
                this.url = url;
            }

            getTarget(): TextureTarget {
                if (this.info == null) throw new Error("Attempted to get target of an unloaded texture.");
                return this.target;
            }

            getHandle(): WebGLTexture {
                return this.handle;
            }

            getLoadPriority(): number {
                if (this.info == null || this.nextElement >= this.info.elements.length) return 0;
                return 16 - this.info.elements[this.nextElement].level;
            }

            private canLoadImmediately(index: number): boolean {
                return this.info.elements != null && index < this.info.elements.length && this.info.elements[index].url == null;
            }

            private applyTexParameters(): void {
                const gl = this.gl;

                for (let i = 0; i < this.info.params.length; ++i) {
                    const param = this.info.params[i];
                    switch (WebGl.decodeConst(param.type)) {
                        case gl.INT:
                            gl.texParameteri(this.target, WebGl.decodeConst(param.name), WebGl.decodeConst(param.value));
                            break;
                        case gl.FLOAT:
                            gl.texParameteri(this.target, WebGl.decodeConst(param.name), WebGl.decodeConst(param.value));
                            break;
                        default:
                            console.warn(`Unknown texture parameter type '${param.type}'.`);
                            break;
                    }
                }
            }

            private getOrCreateHandle(): WebGLTexture {
                if (this.handle !== undefined) return this.handle;

                const gl = this.gl;

                this.handle = gl.createTexture();

                if (this.info.params != null) {
                    gl.bindTexture(this.target, this.handle);
                    this.applyTexParameters();
                    gl.bindTexture(this.target, null);
                }

                return this.handle;
            }

            private static pixelBuffer: Uint8Array;

            private loadColorElement(target: TextureTarget, level: number, color: IColor): boolean {
                const width = this.info.width >> level;
                const height = this.info.height >> level;

                const pixelCount = width * height;
                const valuesSize = pixelCount * 4;

                let values = TextureLoadable.pixelBuffer;
                if (values == null || values.length < valuesSize) {
                    values = TextureLoadable.pixelBuffer = new Uint8Array(valuesSize);
                }

                const r = color.r;
                const g = color.g;
                const b = color.b;
                const a = color.a == undefined ? 255 : color.a;

                for (let i = 0; i < pixelCount; ++i) {
                    const index = i * 4;
                    values[index + 0] = r;
                    values[index + 1] = g;
                    values[index + 2] = b;
                    values[index + 3] = a;
                }

                const gl = this.gl;
                gl.texImage2D(target, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);

                return true;
            }

            private loadImageElement(target: TextureTarget, level: number, image: HTMLImageElement): boolean {
                const gl = this.gl;
                gl.texImage2D(target, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                return true;
            }

            private loadElement(element: ITextureElement, value?: HTMLImageElement): boolean {
                const target = WebGl.decodeConst(element.target != undefined ? element.target : this.info.target);
                const handle = this.getOrCreateHandle();

                const gl = this.gl;

                gl.bindTexture(this.target, handle);

                let success = false;
                if (element.color != null) {
                    success = this.loadColorElement(target, element.level, element.color);
                } else if (value != null) {
                    success = this.loadImageElement(target, element.level, value);
                } else {
                    console.error("Attempted to load a null texture element.");
                    success = false;
                }

                gl.bindTexture(this.target, null);
                return success;
            }

            loadNext(callback: (requeue: boolean) => void): void {
                if (this.info == null) {
                    Http.getJson<ITextureInfo>(this.url, info => {
                        this.info = info;
                        this.target = WebGl.decodeConst(info.target);

                        const handle = this.getOrCreateHandle();

                        while (this.canLoadImmediately(this.nextElement)) {
                            this.loadElement(info.elements[this.nextElement++]);
                        }

                        callback(info.elements != null && this.nextElement < info.elements.length);
                    }, error => {
                        console.error(`Failed to load texture ${this.url}: ${error}`);
                        callback(false);
                    });
                    return;
                }

                if (this.info.elements == null || this.nextElement >= this.info.elements.length) {
                    callback(false);
                    return;
                }

                const info = this.info;
                const element = info.elements[this.nextElement++];

                Http.getImage(element.url, image => {
                    this.loadElement(element, image);

                    while (this.canLoadImmediately(this.nextElement)) {
                        this.loadElement(info.elements[this.nextElement++]);
                    }

                    callback(info.elements != null && this.nextElement < info.elements.length);
                }, error => {
                    callback(false);
                });
            }
        }
    }
}