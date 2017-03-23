/// <reference path="../build/facepunch.webgame.d.ts"/>

import WebGame = Facepunch.WebGame;

class TestGame extends WebGame.Game {
    private mainCamera: WebGame.PerspectiveCamera;
    private mainRenderContext: WebGame.RenderContext;

    private testObject: WebGame.StaticProp;

    private time = 0;

    protected onInitialize(): void {
        super.onInitialize();

        this.canLockPointer = true;

        this.mainCamera = new WebGame.PerspectiveCamera(75, this.getWidth() / this.getHeight(), 1, 8192);
        this.mainRenderContext = new WebGame.RenderContext(this, this.mainCamera);

        this.mainCamera.setPosition(0, 128, 64);

        this.testObject = new WebGame.StaticProp();
        this.testObject.setModel(this.modelLoader.load("/models/military_case_02.model.json"));

        const gl = this.context;

        gl.clearColor(0.675, 0.75, 0.5, 1.0);
    }

    protected onResize(): void {
        super.onResize();

        this.mainCamera.setAspect(this.getWidth() / this.getHeight());
    }

    private readonly lookAngs = new Facepunch.Vector2();
    private readonly tempQuat = new Facepunch.Quaternion();
    private readonly lookQuat = new Facepunch.Quaternion();

    private updateCameraAngles(): void {
        if (this.lookAngs.y < -Math.PI * 0.5) this.lookAngs.y = -Math.PI * 0.5;
        if (this.lookAngs.y > Math.PI * 0.5) this.lookAngs.y = Math.PI * 0.5;

        this.lookQuat.setAxisAngle(Facepunch.Vector3.unitZ, this.lookAngs.x);
        this.tempQuat.setAxisAngle(Facepunch.Vector3.unitX, this.lookAngs.y + Math.PI * 0.5);
        this.lookQuat.multiply(this.tempQuat);

        this.mainCamera.setRotation(this.lookQuat);
    }

    protected onMouseLook(delta: Facepunch.Vector2): void {
        super.onMouseLook(delta);

        this.lookAngs.sub(delta.multiplyScalar(1 / 800));
        this.updateCameraAngles();
    }

    private readonly move = new Facepunch.Vector3();

    protected onUpdateFrame(dt: number): void {
        super.onUpdateFrame(dt);

        if (this.isPointerLocked()) {
            this.move.set(0, 0, 0);
            const moveSpeed = 512 * dt;

            if (this.isKeyDown(WebGame.Key.W)) this.move.z -= moveSpeed;
            if (this.isKeyDown(WebGame.Key.S)) this.move.z += moveSpeed;
            if (this.isKeyDown(WebGame.Key.A)) this.move.x -= moveSpeed;
            if (this.isKeyDown(WebGame.Key.D)) this.move.x += moveSpeed;

            if (this.move.lengthSq() > 0) {
                this.mainCamera.applyRotationTo(this.move);
                this.mainCamera.translate(this.move);
            }
        } else {
            this.time += dt;

            const ang = this.time * Math.PI / 15;
            const height = 128;
            const radius = 256;

            this.lookAngs.set(ang, Math.atan2(64-height, radius));
            this.updateCameraAngles();
            
            this.mainCamera.setPosition(Math.sin(-ang) * -radius, Math.cos(-ang) * -radius, 128);
        }
    }

    protected onRenderFrame(dt: number): void {
        super.onRenderFrame(dt);

        const gl = this.context;

        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.cullFace(gl.FRONT);

        this.mainRenderContext.render();
    }

    populateDrawList(drawList: WebGame.DrawList, camera: WebGame.Camera): void {
        drawList.addItem(this.testObject);
    }
}