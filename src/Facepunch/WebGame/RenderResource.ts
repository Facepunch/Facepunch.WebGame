namespace Facepunch {
    export namespace WebGame {
        export interface IRenderResource {
            getVisibleUsageCount(): number;
            onDependencyLoaded(dependency: IRenderResource): void;
        }

        export abstract class RenderResource<TResource extends RenderResource<TResource>> implements IRenderResource {
            private readonly onLoadCallbacks: ((model: TResource) => void)[] = [];
            private readonly usages: IDrawListItem[] = [];
            private readonly dependents: IRenderResource[] = [];

            abstract isLoaded(): boolean;

            getLoadPriority(): number {
                return this.getVisibleUsageCount();
            }

            addDependent(dependent: IRenderResource): void {
                const index = this.dependents.indexOf(dependent);
                if (index !== -1) return;
                this.dependents.push(dependent);
                this.addOnLoadCallback(res => dependent.onDependencyLoaded(res));
            }

            addUsage(drawable: IDrawListItem): void {
                const index = this.usages.indexOf(drawable);
                if (index !== -1) return;
                this.usages.push(drawable);
            }

            removeUsage(drawable: IDrawListItem): void {
                const index = this.usages.indexOf(drawable);
                if (index !== -1) this.usages.splice(index, 1);
            }

            onDependencyLoaded(dependency: IRenderResource): void {
                if (this.isLoaded()) this.dispatchOnLoadCallbacks();
            }

            getVisibleUsageCount(): number {
                let count = 0;
                for (let i = 0, iEnd = this.usages.length; i < iEnd; ++i) {
                    count += this.usages[i].getIsVisible() ? 1 : 0;
                }
                for (let i = 0, iEnd = this.dependents.length; i < iEnd; ++i) {
                    count += this.dependents[i].getVisibleUsageCount();
                }
                return count;
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