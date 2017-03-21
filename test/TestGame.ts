/// <reference path="../build/facepunch.webgame.d.ts"/>

import WebGame = Facepunch.WebGame;

class TestGame extends WebGame.Game {
    private mainCamera: WebGame.PerspectiveCamera;
    private mainRenderContext: WebGame.RenderContext;

    private testObject: WebGame.StaticProp;

    protected onInitialize(): void {
        super.onInitialize();

        this.mainCamera = new WebGame.PerspectiveCamera(75, this.getWidth() / this.getHeight(), 1, 8192);
        this.mainRenderContext = new WebGame.RenderContext(this, this.mainCamera);

        this.testObject = new WebGame.StaticProp();
        this.testObject.setModel(this.modelLoader.load("/models/military_case_02.model.json"));

        const gl = this.context;

        gl.clearColor(0.675, 0.75, 0.5, 1.0);
    }

    protected onRenderFrame(dt: number): void {
        super.onRenderFrame(dt);

        const gl = this.context;

        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

        this.mainRenderContext.render();
    }

    populateDrawList(drawList: WebGame.DrawList, camera: WebGame.Camera): void {
        drawList.addItem(this.testObject);
    }
}