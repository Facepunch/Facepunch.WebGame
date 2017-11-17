namespace Facepunch {
    export namespace WebGame {
        export class TextureLoader extends Loader<TextureLoadable> {
            private readonly context: IWebGLContext;
            
            constructor(context: IWebGLContext) {
                super();
                this.context = context;
            }

            protected onCreateItem(url: string): TextureLoadable {
                return new TextureLoadable(this.context, url);
            }
        }
    }
}