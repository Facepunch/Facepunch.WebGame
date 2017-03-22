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
            Rgba = WebGLRenderingContext.RGBA,
            DepthComponent = WebGLRenderingContext.DEPTH_COMPONENT
        }

        export enum TextureDataType {
            Uint8 = WebGLRenderingContext.UNSIGNED_BYTE,
            Uint16 = WebGLRenderingContext.UNSIGNED_SHORT,
            Uint32 = WebGLRenderingContext.UNSIGNED_INT,
            Float = WebGLRenderingContext.FLOAT
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

        export class RenderTexture extends Texture {
            readonly context: WebGLRenderingContext;

            readonly target: TextureTarget;
            readonly format: TextureFormat;
            readonly type: TextureDataType;

            private width: number;
            private height: number;

            private handle: WebGLTexture;

            constructor(context: WebGLRenderingContext, target: TextureTarget, format: TextureFormat, type: TextureDataType,
                width: number, height: number) {
                super();

                this.context = context;
                this.target = target;
                this.format = format;
                this.type = type;
                this.handle = context.createTexture();

                this.setWrapMode(TextureWrapMode.ClampToEdge);
                this.setFilter(TextureMinFilter.Linear, TextureMagFilter.Nearest);

                this.resize(width, height);
            }

            setWrapMode(mode: TextureWrapMode): void;
            setWrapMode(wrapS: TextureWrapMode, wrapT: TextureWrapMode): void;
            setWrapMode(wrapS: TextureWrapMode, wrapT?: TextureWrapMode): void {
                if (wrapT === undefined) wrapT = wrapS;

                const gl = this.context;
                gl.bindTexture(this.target, this.handle);

                gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrapS);
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrapT);
                
                gl.bindTexture(this.target, null);
            }

            setFilter(minFilter: TextureMinFilter, magFilter: TextureMagFilter): void {
                const gl = this.context;
                gl.bindTexture(this.target, this.handle);

                gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
                gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, magFilter);
                
                gl.bindTexture(this.target, null);
            }
            
            getTarget(): TextureTarget {
                return this.target;
            }

            getHandle(): WebGLTexture {
                return this.handle;
            }

            resize(width: number, height: number): void {
                if (this.width === width && this.height === height) return;

                const gl = this.context;

                this.width = width;
                this.height = height;

                gl.bindTexture(this.target, this.handle);
                gl.texImage2D(this.target, 0, this.format, width, height, 0, this.format, this.type, null);
                gl.bindTexture(this.target, null);

                this.onResize(width, height);
            }

            protected onResize(width: number, height: number) {}

            dispose(): void {
                if (this.handle === undefined) return;
                this.context.deleteTexture(this.handle);
                this.handle = undefined;
            }
        }

        export interface IPixelData {
            readonly channels: number;
            readonly width: number;
            readonly height: number;
            readonly values: ArrayBufferView;
        }

        export class Uint8PixelData implements IPixelData {
            readonly channels: number;
            readonly width: number;
            readonly height: number;
            readonly values: Uint8Array;
            
            constructor(format: TextureFormat, width: number, height: number) {
                this.width = width;
                this.height = height;

                switch (format) {
                    case TextureFormat.DepthComponent:
                        this.channels = 1;
                        break;
                    case TextureFormat.Rgb:
                        this.channels = 3;
                        break;
                    case TextureFormat.Rgba:
                        this.channels = 4;
                        break;
                    default:
                        throw new Error("Texture format not implemented.");
                }

                this.values = new Uint8Array(this.channels * width * height);
            }
        }

        export class ProceduralTexture2D extends RenderTexture {
            private pixels: IPixelData;

            private static readonly channelBuffer: number[] = [0, 0, 0, 0];

            constructor(context: WebGLRenderingContext, width: number, height: number) {
                super(context, TextureTarget.Texture2D, TextureFormat.Rgba,
                    TextureDataType.Uint8, width, height);

                this.setWrapMode(TextureWrapMode.Repeat);
            }

            setPixelRgb(x: number, y: number, rgb: number): void {
                const buffer = ProceduralTexture2D.channelBuffer;

                buffer[0] = (rgb >> 16) & 0xff;
                buffer[1] = (rgb >> 8) & 0xff;
                buffer[2] = rgb & 0xff;
                buffer[3] = 0xff;

                this.setPixel(x, y, buffer);
            }

            setPixelRgba(x: number, y: number, rgba: number): void {
                const buffer = ProceduralTexture2D.channelBuffer;

                buffer[0] = (rgba >> 24) & 0xff;
                buffer[1] = (rgba >> 16) & 0xff;
                buffer[2] = (rgba >> 8) & 0xff;
                buffer[3] = rgba & 0xff;

                this.setPixel(x, y, buffer);
            }

            setPixelColor(x: number, y: number, color: IColor): void {
                const buffer = ProceduralTexture2D.channelBuffer;

                buffer[0] = color.r;
                buffer[1] = color.g;
                buffer[2] = color.b;
                buffer[3] = color.a === undefined ? 0xff : color.a;

                this.setPixel(x, y, buffer);
            }

            setPixel(x: number, y: number, channels: number[]): void {
                const pixels = this.pixels;
                const index = (x + y * pixels.width) * pixels.channels;
                const channelCount = pixels.channels < channels.length
                    ? pixels.channels : channels.length;

                for (let i = 0; i < channelCount; ++i) {
                    pixels.values[index + i] = channels[i];
                }
            }

            getPixelColor(x: number, y: number, target?: IColor): IColor {                
                const buffer = ProceduralTexture2D.channelBuffer;

                buffer[0] = buffer[1] = buffer[2] = 0;
                buffer[3] = 0xff;

                this.getPixel(x, y, buffer, 0);

                if (target == null) return {r: buffer[0], g: buffer[1], b: buffer[2], a: buffer[3]};
                
                target.r = buffer[0];
                target.g = buffer[1];
                target.b = buffer[2];
                target.a = buffer[3];

                return target;
            }

            getPixel(x: number, y: number, target?: number[], dstIndex?: number): number[] {
                const pixels = this.pixels;
                if (target == null) target = new Array<number>(pixels.channels);
                if (dstIndex === undefined) dstIndex = 0;

                const index = (x + y * pixels.width) * pixels.channels;
                const channelCount = pixels.channels < target.length
                    ? pixels.channels : target.length;

                for (let i = 0; i < channelCount; ++i) {
                    target[dstIndex + i] = pixels.values[index + i];
                }

                return target;
            }

            setPixels(x: number, y: number, width: number, height: number, values: number[]): void {
                const pixels = this.pixels;

                if (x < 0 || x + width > pixels.width || y < 0 || y + height > pixels.height) {
                    throw new Error("Image region out of bounds.");
                }

                const imageValues = pixels.values;
                const channels = pixels.channels;

                if (values.length < width * height * channels) {
                    throw new Error(`Expected at least ${width * height * channels} values.`);
                }

                const rowLength = pixels.width * channels;
                const scanLength = width * channels;

                let startIndex = (x + y * pixels.width) * channels;
                let i = 0;

                for (let row = y, rowEnd = y + height; row < rowEnd; ++row, startIndex += rowLength) {
                    for (let index = startIndex, indexEnd = index + scanLength; index < indexEnd; index += channels) {
                        imageValues[index] = values[i];
                    }
                }
            }

            apply(): void {
                const gl = this.context;

                gl.bindTexture(this.target, this.getHandle());
                gl.texImage2D(this.target, 0, this.format,
                    this.pixels.width, this.pixels.height,
                    0, this.format, this.type, this.pixels.values);
                gl.bindTexture(this.target, null);
            }

            applyRegion(x: number, y: number, width: number, height: number): void {
                const gl = this.context;

                gl.bindTexture(this.target, this.getHandle());
                gl.texSubImage2D(this.target, 0, x, y,
                    this.pixels.width, this.pixels.height, this.format,
                    this.type, this.pixels.values);
                gl.bindTexture(this.target, null);
            }

            protected onResize(width: number, height: number) {
                switch (this.type) {
                    case TextureDataType.Uint8:
                        this.pixels = new Uint8PixelData(this.format, width, height);
                        break;
                    default:
                        throw new Error("Texture data type not implemented.");
                }
            }
        }

        export class TextureUtils {
            private static whiteTexture: ProceduralTexture2D;
            static getWhiteTexture(context: WebGLRenderingContext): Texture {
                if (this.whiteTexture != null) return this.whiteTexture;

                this.whiteTexture = new ProceduralTexture2D(context, 1, 1);
                this.whiteTexture.setPixelRgb(0, 0, 0xffffff);
                this.whiteTexture.apply();

                return this.whiteTexture;
            }
            
            private static blackTexture: ProceduralTexture2D;
            static getBlackTexture(context: WebGLRenderingContext): Texture {
                if (this.blackTexture != null) return this.blackTexture;

                this.blackTexture = new ProceduralTexture2D(context, 1, 1);
                this.blackTexture.setPixelRgb(0, 0, 0x000000);
                this.blackTexture.apply();

                return this.blackTexture;
            }
            
            private static translucentTexture: ProceduralTexture2D;
            static getTranslucentTexture(context: WebGLRenderingContext): Texture {
                if (this.translucentTexture != null) return this.translucentTexture;

                this.translucentTexture = new ProceduralTexture2D(context, 1, 1);
                this.translucentTexture.setPixelRgba(0, 0, 0x00000000);
                this.translucentTexture.apply();

                return this.translucentTexture;
            }
            
            private static errorTexture: ProceduralTexture2D;
            static getErrorTexture(context: WebGLRenderingContext): Texture {
                if (this.errorTexture != null) return this.errorTexture;

                const size = 64;

                this.errorTexture = new ProceduralTexture2D(context, size, size);

                for (let y = 0; y < size; ++y) {
                    for (let x = 0; x < size; ++x) {
                        const magenta = ((x >> 4) & 1) === ((y >> 4) & 1);
                        this.errorTexture.setPixelRgb(x, y, magenta ? 0xff00ff : 0x000000);
                    }
                }

                this.errorTexture.apply();

                return this.errorTexture;
            }
        }

        export enum TextureFilter {
            Nearest = WebGLRenderingContext.NEAREST,
            Linear = WebGLRenderingContext.LINEAR
        }

        export interface ITextureParameters {
            wrapS: TextureWrapMode | "CLAMP_TO_EDGE" | "REPEAT" | "MIRRORED_REPEAT";
            wrapT: TextureWrapMode | "CLAMP_TO_EDGE" | "REPEAT" | "MIRRORED_REPEAT";
            filter: TextureFilter | "NEAREST" | "LINEAR";
            mipmap: boolean;
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
            params: ITextureParameters,
            elements: ITextureElement[]
        }

        export class TextureLoadable extends Texture implements ILoadable {
            private readonly context: WebGLRenderingContext;
            private readonly url: string;            

            private info: ITextureInfo;
            private nextElement = 0;

            private handle: WebGLTexture;
            private target: TextureTarget;

            private filter: TextureFilter;
            private mipmap: boolean;

            constructor(context: WebGLRenderingContext, url: string) {
                super();

                this.context = context;
                this.url = url;

                this.toString = () => `url(${url})`;
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
                const gl = this.context;
                const params = this.info.params;

                gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, WebGl.decodeConst(params.wrapS, TextureWrapMode.Repeat));
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, WebGl.decodeConst(params.wrapT, TextureWrapMode.Repeat));

                this.filter = WebGl.decodeConst(params.filter, TextureFilter.Linear);
                this.mipmap = params.mipmap === undefined ? false : params.mipmap;

                gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, this.filter);
                gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, TextureMagFilter.Nearest);
            }

            private getOrCreateHandle(): WebGLTexture {
                if (this.handle !== undefined) return this.handle;

                const gl = this.context;

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

                const gl = this.context;
                gl.texImage2D(target, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);

                if (level > 0) {
                    gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
                }

                return true;
            }

            private loadImageElement(target: TextureTarget, level: number, image: HTMLImageElement): boolean {
                const gl = this.context;
                gl.texImage2D(target, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

                if (level > 0) {
                    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                }

                return true;
            }

            private loadElement(element: ITextureElement, value?: HTMLImageElement): boolean {
                const target = WebGl.decodeConst(element.target != undefined ? element.target : this.info.target);
                const handle = this.getOrCreateHandle();

                const gl = this.context;

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

                if (this.nextElement >= this.info.elements.length && this.mipmap) {
                    const minFilter = this.filter === TextureFilter.Nearest
                        ? TextureMinFilter.NearestMipmapLinear
                        : TextureMinFilter.LinearMipmapLinear;

                    gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
                    gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
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
                const url = Http.getAbsUrl(element.url, this.url);

                Http.getImage(url, image => {
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