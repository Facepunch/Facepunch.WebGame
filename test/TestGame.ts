/// <reference path="../build/facepunch.webgame.d.ts"/>

import WebGame = Facepunch.WebGame;

class TestGame extends WebGame.Game {
    private mainCamera: WebGame.PerspectiveCamera;
    private mainRenderContext: WebGame.RenderContext;

    private testObjects: WebGame.StaticProp[];

    private time = 0;

    protected onInitialize(): void {
        super.onInitialize();

        this.canLockPointer = true;

        this.mainCamera = new WebGame.PerspectiveCamera(75, this.getWidth() / this.getHeight(), 1, 8192);
        this.mainRenderContext = new WebGame.RenderContext(this);
        this.mainRenderContext.fog.maxDensity = 0.825;
        this.mainRenderContext.fog.start = 64;
        this.mainRenderContext.fog.end = 2048;
        this.mainRenderContext.fog.color.set(0.675, 0.75, 0.5);

        this.mainCamera.setPosition(0, 128, 64);

        this.testObjects = [];

        const model = this.modelLoader.load("models/military_case_02.model.json");
        const color = new Facepunch.Vector3(1, 1, 1);

        for (let x = -5; x < 5; ++x) {
            for (let y = -5; y < 5; ++y) {
                const obj = new WebGame.StaticProp();

                const angle = Math.floor(Math.random() * 4) * Math.PI * 0.5;

                color.x = 0.75 + Math.random() * 0.25;
                color.y = 0.75 + Math.random() * 0.25;
                color.z = 0.75 + Math.random() * 0.25;

                obj.setPosition(x * 128, y * 128, 0);
                obj.setAngles(0, angle + (Math.random() - 0.5) * Math.PI / 16, 0);
                obj.setScale(Math.random() * 0.25 + 1.25);
                obj.setColorTint(color);
                obj.setModel(model);

                this.testObjects.push(obj);
            }
        }

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
            const height = Math.sin(this.time * Math.PI / 4) * 96 + 256;
            const radius = 512;

            this.lookAngs.set(ang, Math.atan2(128 - height, radius));
            this.updateCameraAngles();
            
            this.mainCamera.setPosition(Math.sin(-ang) * -radius, Math.cos(-ang) * -radius, height);
        }
    }

    protected onRenderFrame(dt: number): void {
        super.onRenderFrame(dt);

        const gl = this.context;

        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.cullFace(gl.FRONT);

        this.mainRenderContext.render(this.mainCamera);
    }

    populateDrawList(drawList: WebGame.DrawList, camera: WebGame.Camera): void {
        drawList.addItems(this.testObjects);
    }
}