var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../build/facepunch.webgame.d.ts"/>
var WebGame = Facepunch.WebGame;
var TestGame = (function (_super) {
    __extends(TestGame, _super);
    function TestGame() {
        _super.apply(this, arguments);
        this.time = 0;
        this.lookAngs = new Facepunch.Vector2();
        this.tempQuat = new Facepunch.Quaternion();
        this.lookQuat = new Facepunch.Quaternion();
        this.move = new Facepunch.Vector3();
    }
    TestGame.prototype.onInitialize = function () {
        _super.prototype.onInitialize.call(this);
        this.canLockPointer = true;
        this.mainCamera = new WebGame.PerspectiveCamera(75, this.getWidth() / this.getHeight(), 1, 8192);
        this.mainRenderContext = new WebGame.RenderContext(this);
        this.mainCamera.setPosition(0, 128, 64);
        this.testObjects = [];
        var model = this.modelLoader.load("/models/military_case_02.model.json");
        for (var x = -5; x < 5; ++x) {
            for (var y = -5; y < 5; ++y) {
                var obj = new WebGame.StaticProp();
                var angle = Math.floor(Math.random() * 4) * Math.PI * 0.5;
                obj.setPosition(x * 128, y * 128, 0);
                obj.setAngles(0, angle + (Math.random() - 0.5) * Math.PI / 16, 0);
                obj.setScale(Math.random() * 0.25 + 1.25);
                obj.setModel(model);
                this.testObjects.push(obj);
            }
        }
        var gl = this.context;
        gl.clearColor(0.675, 0.75, 0.5, 1.0);
    };
    TestGame.prototype.onResize = function () {
        _super.prototype.onResize.call(this);
        this.mainCamera.setAspect(this.getWidth() / this.getHeight());
    };
    TestGame.prototype.updateCameraAngles = function () {
        if (this.lookAngs.y < -Math.PI * 0.5)
            this.lookAngs.y = -Math.PI * 0.5;
        if (this.lookAngs.y > Math.PI * 0.5)
            this.lookAngs.y = Math.PI * 0.5;
        this.lookQuat.setAxisAngle(Facepunch.Vector3.unitZ, this.lookAngs.x);
        this.tempQuat.setAxisAngle(Facepunch.Vector3.unitX, this.lookAngs.y + Math.PI * 0.5);
        this.lookQuat.multiply(this.tempQuat);
        this.mainCamera.setRotation(this.lookQuat);
    };
    TestGame.prototype.onMouseLook = function (delta) {
        _super.prototype.onMouseLook.call(this, delta);
        this.lookAngs.sub(delta.multiplyScalar(1 / 800));
        this.updateCameraAngles();
    };
    TestGame.prototype.onUpdateFrame = function (dt) {
        _super.prototype.onUpdateFrame.call(this, dt);
        if (this.isPointerLocked()) {
            this.move.set(0, 0, 0);
            var moveSpeed = 512 * dt;
            if (this.isKeyDown(WebGame.Key.W))
                this.move.z -= moveSpeed;
            if (this.isKeyDown(WebGame.Key.S))
                this.move.z += moveSpeed;
            if (this.isKeyDown(WebGame.Key.A))
                this.move.x -= moveSpeed;
            if (this.isKeyDown(WebGame.Key.D))
                this.move.x += moveSpeed;
            if (this.move.lengthSq() > 0) {
                this.mainCamera.applyRotationTo(this.move);
                this.mainCamera.translate(this.move);
            }
        }
        else {
            this.time += dt;
            var ang = this.time * Math.PI / 15;
            var height = Math.sin(this.time * Math.PI / 4) * 96 + 256;
            var radius = 512;
            this.lookAngs.set(ang, Math.atan2(128 - height, radius));
            this.updateCameraAngles();
            this.mainCamera.setPosition(Math.sin(-ang) * -radius, Math.cos(-ang) * -radius, height);
        }
    };
    TestGame.prototype.onRenderFrame = function (dt) {
        _super.prototype.onRenderFrame.call(this, dt);
        var gl = this.context;
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.cullFace(gl.FRONT);
        this.mainRenderContext.render(this.mainCamera);
    };
    TestGame.prototype.populateDrawList = function (drawList, camera) {
        drawList.addItems(this.testObjects);
    };
    return TestGame;
}(WebGame.Game));
