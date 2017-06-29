namespace Facepunch {
    export class Http {
        static readonly cancelled: any = { toString: () => "Request cancelled by user." };

        static getString(url: string, success: (response: string) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number) => void): void {
            var request = new XMLHttpRequest();

            request.addEventListener("load", ev => success(request.responseText));

            if (failure != null) {
                request.addEventListener("error", ev => failure(ev.error));
                request.addEventListener("abort", ev => failure(Http.cancelled));
            }

            if (progress != null) {
                request.addEventListener("progress", ev => ev.lengthComputable
                    ? progress(ev.loaded, ev.total) : progress(0, undefined));
            }

            request.open("get", url, true);
            request.send();
        }

        static getJson<TResponse>(url: string, success: (response: TResponse) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number) => void): void {
            Http.getString(url, text => success(JSON.parse(text)), failure);
        }

        static getImage(url: string, success: (response: HTMLImageElement) => void, failure?: (error: any) => void, progress?: (loaded: number, total: number) => void): void {
            const image = new Image();
            image.src = url;
            image.addEventListener("load", ev => success(image));
            
            if (failure != null) {
                image.addEventListener("error", ev => failure(ev.error));
                image.addEventListener("abort", ev => failure(Http.cancelled));
            }
            
            if (progress != null) {
                image.addEventListener("progress", ev => ev.lengthComputable
                    ? progress(ev.loaded, ev.total) : progress(0, undefined));
            }
        }

        static isAbsUrl(url: string): boolean {
            return url != null && /^(http[s]:\/)?\//i.test(url);
        }

        static getAbsUrl(url: string, relativeTo: string): string {
            if (Http.isAbsUrl(url)) return url;
            if (!Http.isAbsUrl(relativeTo)) {
                relativeTo = window.location.pathname;
            }

            if (relativeTo.charAt(relativeTo.length - 1) === "/") {
                return `${relativeTo}${url}`;
            }

            const lastSep = relativeTo.lastIndexOf("/");
            const prefix = relativeTo.substr(0, lastSep + 1);

            return `${prefix}${url}`;
        }
    }

    export class Utils {
        static decompress<T>(value: string | T): T {
            if (value == null) return null;
            return typeof value === "string"
                ? JSON.parse(LZString.decompressFromBase64(value))
                : value as T;
        }

        static decompressOrClone<T>(value: string | T[]): T[]
        {
            if (value == null) return null;
            return typeof value === "string"
                ? JSON.parse(LZString.decompressFromBase64(value))
                : (value as T[]).slice(0);
        }
    }

    export class WebGl {
        static decodeConst<TEnum extends number>(valueOrIdent: TEnum | string, defaultValue?: TEnum): TEnum {
            if (valueOrIdent === undefined) return defaultValue;
            return (typeof valueOrIdent === "number" ? valueOrIdent : WebGLRenderingContext[valueOrIdent]) as TEnum;
        }

        private static constDict: {[value:number]: string};

        static encodeConst(value: number): string {
            if (WebGl.constDict == null) {
                WebGl.constDict = {};

                for (let name in WebGLRenderingContext) {
                    const val = WebGLRenderingContext[name];
                    if (typeof val !== "number") continue;
                    WebGl.constDict[val] = name;
                }
            }

            return WebGl.constDict[value];
        }
    }
}