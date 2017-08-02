namespace Facepunch {
    export namespace WebGame {
        export interface IDrawListItem {
            invalidateDrawLists(): void;
            getIsVisible(): boolean;
            getIsInDrawList(drawList: DrawList): boolean;
            onAddToDrawList(list: DrawList): void;
            onRemoveFromDrawList(list: DrawList): void;
            getMeshHandles(): MeshHandle[];
        }

        export class DrawListItem implements IDrawListItem {
            isStatic = false;
            entity: Entity = null;
            
            private meshHandles: MeshHandle[];

            private readonly drawLists: DrawList[] = [];

            clearMeshHandles(): void {
                if (this.meshHandles != null) {
                    for (let i = 0, iEnd = this.meshHandles.length; i < iEnd; ++i) {
                        const handle = this.meshHandles[i];
                        if (handle.material == null) continue;
                        handle.material.removeUsage(this);
                    }
                }

                this.meshHandles = null;
                this.invalidateDrawLists();
            }

            addMeshHandles(handles: MeshHandle[]): void {
                if (this.meshHandles == null) this.meshHandles = [];

                for (let i = 0, iEnd = handles.length; i < iEnd; ++i) {
                    const handle = handles[i].clone(!this.isStatic && this.entity != null ? this.entity.getMatrix() : null);
                    this.meshHandles.push(handle);

                    if (handle.material != null) {
                        handle.material.addUsage(this);
                    }
                }

                this.invalidateDrawLists();
            }

            invalidateDrawLists(): void {
                if (!this.getIsVisible()) return;
                for (let i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    this.drawLists[i].invalidate();
                }
            }

            getIsVisible(): boolean {
                return this.drawLists.length > 0;
            }

            getIsInDrawList(drawList: DrawList): boolean {
                for (let i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    if (this.drawLists[i] === drawList) {
                        return true;
                    }
                }

                return false;
            }

            onAddToDrawList(list: DrawList): void {
                if (this.getIsInDrawList(list)) throw "Item added to a draw list twice.";
                this.drawLists.push(list);
            }

            onRemoveFromDrawList(list: DrawList): void {
                for (let i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    if (this.drawLists[i] === list) {
                        this.drawLists.splice(i, 1);
                        return;
                    }
                }

                throw "Item removed from a draw list it isn't a member of.";
            }

            getMeshHandles(): MeshHandle[] {
                return this.meshHandles;
            }
        }
    }
}