
namespace Facepunch {
    export namespace WebGame {
        export class StaticProp extends Entity implements IDrawListItem {
            private readonly drawable = new DrawListItem();

            private model: Model;

            constructor() {
                super();

                this.drawable.entity = this;
                this.drawable.isStatic = false;
            }

            setModel(model: Model): void {
                if (this.model === model) return;
                this.model = model;

                if (model == null) {
                    this.drawable.clearMeshHandles();
                    return;
                }

                model.addOnLoadCallback(mdl => this.onModelLoaded(mdl));
            }

            private onModelLoaded(model: Model): void {
                if (model !== this.model) return;

                this.drawable.clearMeshHandles();
                this.drawable.addMeshHandles(model.getMeshHandles());
            }
            
            getModel(): Model {
                return this.model;
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