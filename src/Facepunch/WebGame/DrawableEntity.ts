/// <reference path="Entity.ts"/>

namespace Facepunch {
    export namespace WebGame {
        export class DrawableEntity extends Entity implements IDrawListItem {
            protected readonly drawable = new DrawListItem();

            constructor(isStatic: boolean = false) {
                super();

                this.drawable.entity = this;
                this.drawable.isStatic = isStatic;
            }

            invalidateDrawLists(): void {
                this.drawable.invalidateDrawLists();
            }

            getIsVisible(): boolean {
                return this.drawable.getIsVisible();
            }

            getIsInDrawList(drawList: DrawList): boolean {
                return this.drawable.getIsInDrawList(drawList);
            }

            onAddToDrawList(list: DrawList): void {
                this.drawable.onAddToDrawList(list);
            }

            onRemoveFromDrawList(list: DrawList): void {
                this.drawable.onRemoveFromDrawList(list);
            }

            getMeshHandles(): MeshHandle[] {
                return this.drawable.getMeshHandles();
            }
        }
    }
}