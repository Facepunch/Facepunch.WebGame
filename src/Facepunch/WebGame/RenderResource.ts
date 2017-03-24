namespace Facepunch {
    export namespace WebGame {
        export abstract class RenderResource<TResource extends RenderResource<TResource>> {
            private readonly onLoadCallbacks: ((model: TResource) => void)[] = [];
            private readonly usages: IDrawListItem[] = [];

            abstract isLoaded(): boolean;

            addUsage(drawable: IDrawListItem): void {
                this.usages.push(drawable);
            }

            removeUsage(drawable: IDrawListItem): void {
                const index = this.usages.indexOf(drawable);
                if (index !== -1) this.usages.splice(index, 1);
            }

            addOnLoadCallback(callback: (resource: TResource) => void): void {
                if (this.isLoaded()) {
                    callback(this as any as TResource);
                } else {
                    this.onLoadCallbacks.push(callback);
                }
            }

            protected dispatchOnLoadCallbacks(): void {
                if (!this.isLoaded()) {
                    throw new Error("Resource attempted to dispatch onLoad callbacks without being loaded.");
                }

                for (let i = 0, iEnd = this.usages.length; i < iEnd; ++i) {
                    this.usages[i].invalidateDrawLists();
                }

                for (let i = 0, iEnd = this.onLoadCallbacks.length; i < iEnd; ++i) {
                    this.onLoadCallbacks[i](this as any as TResource);
                }

                this.onLoadCallbacks.splice(0, this.onLoadCallbacks.length);
            }
        }
    }
}