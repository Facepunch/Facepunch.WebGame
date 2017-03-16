/// <reference path="../build/facepunch.webgame.d.ts"/>

class TestGame extends Facepunch.WebGame.Game {
    protected onInitialize(): void {
        super.onInitialize();

        const gl = this.getContext();

        gl.clearColor(0.675, 0.75, 0.5, 1.0);
    }

    protected onRenderFrame(dt: number): void {
        super.onRenderFrame(dt);

        const gl = this.getContext();

        // Testing

        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    }
}