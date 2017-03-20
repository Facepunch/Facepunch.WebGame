namespace Facepunch {
    export namespace WebGame {
        export class DrawListItem {
            isStatic = false;
            entity: Entity = null;
            
            private meshHandles: MeshHandle[] = [];

            private readonly drawLists: DrawList[] = [];

            addMeshHandles(handles: MeshHandle[]) {
                if (this.meshHandles == null) this.meshHandles = [];

                for (let i = 0, iEnd = handles.length; i < iEnd; ++i) {
                    this.meshHandles.push(handles[i].clone(!this.isStatic && this.entity != null ? this.entity.getMatrix() : null));
                }

                this.invalidateDrawLists();
            }

            invalidateDrawLists(): void {
                if (!this.getIsVisible()) return;
                for (let i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    this.drawLists[i].updateItem(this);
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

            onAddToDrawList(list: DrawList) {
                if (this.getIsInDrawList(list)) throw "Item added to a draw list twice.";
                this.drawLists.push(list);
            }

            onRemoveFromDrawList(list: DrawList) {
                for (let i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    if (this.drawLists[i] === list) {
                        this.drawLists.splice(i, 1);
                        return;
                    }
                }

                throw "Item removed from a draw list it isn't a member of.";
            }

            protected onRequestMeshHandles(): void {}

            getMeshHandles(): MeshHandle[] {
                if (this.meshHandles == null) {
                    this.onRequestMeshHandles();
                }

                return this.meshHandles;
            }
        }
    }
}