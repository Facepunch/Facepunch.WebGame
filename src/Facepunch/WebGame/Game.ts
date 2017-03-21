/// <reference path="Input.ts"/>

namespace Facepunch {
    export namespace WebGame {
        export class Game implements ICommandBufferParameterProvider {
            canLockPointer = false;

            readonly shaders: ShaderManager;
            readonly meshes: MeshManager;

            readonly materialLoader: MaterialLoader;
            readonly textureLoader: TextureLoader;
            readonly modelLoader: ModelLoader;

            private loaders: ILoader[] = [];

            private animateCallback: (time: number) => void;
            private lastAnimateCallback = 0;

            readonly container: HTMLElement;
            readonly canvas: HTMLCanvasElement;
            readonly context: WebGLRenderingContext;

            private readonly drawListInvalidationHandlers: ((geom: boolean) => void)[] = [];
            
            private heldKeys: boolean[] = new Array(128);
            private heldMouseButtons: boolean[] = new Array(8);
            
            private mouseScreenPos = new Vector2();

            constructor(container: HTMLElement) {
                this.container = container;
                this.canvas = document.createElement("canvas");
                this.container.appendChild(this.canvas);
                this.context = this.canvas.getContext("webgl");

                this.shaders = new ShaderManager(this.context);
                this.meshes = new MeshManager(this);

                this.materialLoader = this.addLoader(new MaterialLoader(this));
                this.textureLoader = this.addLoader(new TextureLoader(this.context));
                this.modelLoader = this.addLoader(new ModelLoader(this));

                window.addEventListener("mousedown", evnt => {
                    this.heldMouseButtons[evnt.which] = true;
                    this.onMouseDown(evnt.which as MouseButton,
                        this.getScreenPos(evnt.pageX, evnt.pageY, this.mouseScreenPos));
                    if (this.canLockPointer) this.container[0].requestPointerLock();
                    return false;
                });

                window.addEventListener("keydown", evnt => {
                    if (evnt.which < 0 || evnt.which >= 128) return true;
                    this.heldKeys[evnt.which] = true;
                    this.onKeyDown(evnt.which as Key);
                    if (this.isPointerLocked() && evnt.which as Key === Key.Escape) {
                        document.exitPointerLock();
                    }
                    return evnt.which !== Key.Tab;
                });

                window.addEventListener("keyup", evnt => {
                    if (evnt.which < 0 || evnt.which >= 128) return true;
                    this.heldKeys[evnt.which] = false;
                    this.onKeyUp(evnt.which as Key);
                });
                
                this.animateCallback = (time: number) => {
                    const deltaTime = time - this.lastAnimateCallback;
                    this.lastAnimateCallback = time;
                    this.animate(deltaTime * 0.001);
                };

                this.onInitialize();
                this.onResize();
            }

            getLastUpdateTime(): number {
                return this.lastAnimateCallback;
            }

            getWidth(): number {
                return this.container.clientWidth;
            }

            getHeight(): number {
                return this.container.clientHeight;
            }

            getMouseScreenPos(out?: Vector2): Vector2 {
                if (out == null) out = new Vector2();
                out.copy(this.mouseScreenPos);
                return out;
            }

            getMouseViewPos(out?: Vector2): Vector2 {
                if (out == null) out = new Vector2();
                this.getMouseScreenPos(out);
                out.x = out.x / this.getWidth() - 0.5;
                out.y = out.y / this.getHeight() - 0.5;
                return out;
            }

            private getScreenPos(pageX: number, pageY: number, out?: Vector2): Vector2 {
                if (out == null) out = new Vector2();

                out.x = pageX - this.container.offsetLeft;
                out.y = pageY - this.container.offsetTop;

                return out;
            }
            
            isPointerLocked(): boolean {
                return document.pointerLockElement === this.container;
            }

            populateDrawList(drawList: DrawList, camera: Camera): void {}

            addDrawListInvalidationHandler(action: (geom: boolean) => void): void {
                this.drawListInvalidationHandlers.push(action);
            }

            forceDrawListInvalidation(geom: boolean): void {
                for (let i = 0; i < this.drawListInvalidationHandlers.length; ++i) {
                    this.drawListInvalidationHandlers[i](geom);
                }
            }

            animate(dt?: number): void {
                dt = dt || 0.01666667;

                for (let i = 0, iEnd = this.loaders.length; i < iEnd; ++i) {
                    this.loaders[i].update(4);
                }

                this.onUpdateFrame(dt);
                this.onRenderFrame(dt);

                requestAnimationFrame(this.animateCallback);
            }
            
            isKeyDown(key: Key): boolean {
                return key >= 0 && key < 128 && this.heldKeys[key];
            }

            isMouseButtonDown(button: MouseButton): boolean {
                return button >= 0 && button < this.heldMouseButtons.length && this.heldMouseButtons[button];
            }

            protected onInitialize(): void {}

            protected onResize(): void {
                this.canvas.width = this.container.clientWidth;
                this.canvas.height = this.container.clientHeight;

                this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
            
            protected addLoader<TLoader extends ILoader>(loader: TLoader): TLoader {
                this.loaders.push(loader);
                return loader;
            }
            
            protected onMouseDown(button: MouseButton, screenPos: Vector2): void {}
            protected onMouseUp(button: MouseButton, screenPos: Vector2): void {}
            
            protected onKeyDown(key: Key): void {}
            protected onKeyUp(key: Key): void {}

            protected onUpdateFrame(dt: number): void {}
            protected onRenderFrame(dt: number): void {}
            
            private readonly timeParams = new Float32Array(4);
            private readonly screenParams = new Float32Array(4);

            populateCommandBufferParameters(buf: CommandBuffer): void {
                this.timeParams[0] = this.getLastUpdateTime();

                this.screenParams[0] = this.getWidth();
                this.screenParams[1] = this.getHeight();
                this.screenParams[2] = 1 / this.getWidth();
                this.screenParams[3] = 1 / this.getHeight();

                buf.setParameter(CommandBufferParameter.TimeParams, this.timeParams);
                buf.setParameter(CommandBufferParameter.ScreenParams, this.screenParams);
            }
        }
    }
}