
namespace Facepunch {
    export namespace WebGame {
        export class StaticProp extends Entity implements IDrawListItem {
            private readonly drawable = new DrawListItem();

            private model: Model;

            constructor() {
                super();

                this.drawable.entity = this;
                this.drawable.isStatic = true;
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

                const meshData = MeshManager.clone(model.getMeshData());
                const transform = this.getMatrix();

                MeshManager.transform4F(meshData, VertexAttribute.position, pos => pos.applyMatrix4(transform), 1);
                MeshManager.transform4F(meshData, VertexAttribute.normal, norm => norm.applyMatrix4(transform), 0);

                this.drawable.addMeshHandles(model.meshManager.addMeshData(meshData, index => model.getMaterial(index)));
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