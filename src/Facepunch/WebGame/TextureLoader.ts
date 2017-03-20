namespace Facepunch {
    export namespace WebGame {
        export class TextureLoader extends Loader<TextureLoadable> {
            private readonly context: WebGLRenderingContext;
            
            constructor(context: WebGLRenderingContext) {
                super();
                this.context = context;
            }
            
            protected onComparePriority(a: TextureLoadable, b: TextureLoadable): number {
                return a.getLoadPriority() - b.getLoadPriority();
            }

            protected onCreateItem(url: string): TextureLoadable {
                return new TextureLoadable(this.context, url);
            }
        }
    }
}
