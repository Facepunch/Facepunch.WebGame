/// <reference path="Entity.ts"/>
/// <reference path="CommandBuffer.ts"/>

namespace Facepunch {
    export namespace WebGame {
        export abstract class Camera extends Entity implements ICommandBufferParameterProvider {
            static readonly cameraPosParam = new CommandBufferParameter(UniformType.Float3);
            static readonly clipInfoParam = new CommandBufferParameter(UniformType.Float4);
            static readonly projectionMatrixParam = new CommandBufferParameter(UniformType.Matrix4);
            static readonly inverseProjectionMatrixParam = new CommandBufferParameter(UniformType.Matrix4);
            static readonly viewMatrixParam = new CommandBufferParameter(UniformType.Matrix4);
            static readonly inverseViewMatrixParam = new CommandBufferParameter(UniformType.Matrix4);
            static readonly opaqueColorParam = new CommandBufferParameter(UniformType.Texture);
            static readonly opaqueDepthParam = new CommandBufferParameter(UniformType.Texture);

            private readonly drawList = new DrawList();
            private readonly commandBuffer: CommandBuffer;
            private opaqueFrameBuffer: FrameBuffer;
            
            private geometryInvalid = true;
            
            readonly game: Game;
            readonly fog = new Fog();

            private projectionInvalid = true;
            private projectionMatrix = new Matrix4();
            private inverseProjectionInvalid = true;
            private inverseProjectionMatrix = new Matrix4();

            constructor(game: Game) {
                super();

                this.game = game;
                this.commandBuffer = new CommandBuffer(game.context);
            
                game.addDrawListInvalidationHandler((geom: boolean) => {
                    if (geom) this.invalidateGeometry();
                    this.drawList.invalidate();
                });
            }

            getOpaqueColorTexture(): RenderTexture {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getColorTexture();
            }

            getOpaqueDepthTexture(): RenderTexture {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getDepthTexture();
            }

            invalidateGeometry(): void {
                this.geometryInvalid = true;
            }

            render(): void {
                if (this.geometryInvalid) {
                    this.drawList.clear();
                    this.game.populateDrawList(this.drawList, this);
                }

                if (this.geometryInvalid || this.drawList.isInvalid()) {
                    this.commandBuffer.clearCommands();
                    this.drawList.appendToBuffer(this.commandBuffer, this);
                }
                
                this.geometryInvalid = false;

                this.populateCommandBufferParameters(this.commandBuffer);

                this.commandBuffer.run();
            }
            
            private setupFrameBuffers(): void {
                if (this.opaqueFrameBuffer !== undefined) return;

                const gl = this.game.context;

                const width = this.game.getWidth();
                const height = this.game.getHeight();

                this.opaqueFrameBuffer = new FrameBuffer(gl, width, height);
                this.opaqueFrameBuffer.addDepthAttachment();
            }

            bufferOpaqueTargetBegin(buf: CommandBuffer): void {
                this.setupFrameBuffers();

                const gl = WebGLRenderingContext;

                buf.bindFramebuffer(this.opaqueFrameBuffer, true);
                buf.depthMask(true);
                buf.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            }

            bufferRenderTargetEnd(buf: CommandBuffer): void {
                buf.bindFramebuffer(null);
            }

            getDrawCalls(): number {
                return this.commandBuffer.getDrawCalls();
            }

            abstract getNear(): number;
            abstract getFar(): number;

            getProjectionMatrix(target?: Matrix4): Matrix4 {
                if (this.projectionInvalid) {
                    this.projectionInvalid = false;
                    this.onUpdateProjectionMatrix(this.projectionMatrix);
                }

                if (target != null) {
                    target.copy(this.projectionMatrix);
                    return target;
                }

                return this.projectionMatrix;
            }

            getInverseProjectionMatrix(target?: Matrix4): Matrix4 {
                if (this.inverseProjectionInvalid) {
                    this.inverseProjectionInvalid = false;
                    this.inverseProjectionMatrix.setInverse(this.getProjectionMatrix());
                }

                if (target != null) {
                    target.copy(this.inverseProjectionMatrix);
                    return target;
                }

                return this.inverseProjectionMatrix;
            }

            protected invalidateProjectionMatrix(): void {
                this.projectionInvalid = true;
                this.inverseProjectionInvalid = true;
            }

            protected abstract onUpdateProjectionMatrix(matrix: Matrix4): void;
            
            private cameraPosParams = new Float32Array(3);
            private clipParams = new Float32Array(4);

            populateCommandBufferParameters(buf: CommandBuffer): void {
                this.getPositionValues(this.cameraPosParams);

                this.clipParams[0] = this.getNear();
                this.clipParams[1] = this.getFar();
                this.clipParams[2] = 1 / (this.clipParams[1] - this.clipParams[0]);

                buf.setParameter(Camera.cameraPosParam, this.cameraPosParams);
                buf.setParameter(Camera.clipInfoParam, this.clipParams);

                buf.setParameter(Camera.projectionMatrixParam, this.getProjectionMatrix().elements);
                buf.setParameter(Camera.inverseProjectionMatrixParam, this.getInverseProjectionMatrix().elements);
                buf.setParameter(Camera.viewMatrixParam, this.getInverseMatrix().elements);
                buf.setParameter(Camera.inverseViewMatrixParam, this.getMatrix().elements);
                
                buf.setParameter(Camera.opaqueColorParam, this.getOpaqueColorTexture());
                buf.setParameter(Camera.opaqueDepthParam, this.getOpaqueDepthTexture());
                
                this.game.populateCommandBufferParameters(buf);
                this.fog.populateCommandBufferParameters(buf);
            }
        }

        export class PerspectiveCamera extends Camera {
            private fov: number;
            private aspect: number;
            private near: number;
            private far: number;

            constructor(game: Game, fov: number, aspect: number, near: number, far: number) {
                super(game);

                this.fov = fov;
                this.aspect = aspect;
                this.near = near;
                this.far = far;
            }

            setFov(value: number): void { this.fov = value; this.invalidateProjectionMatrix(); }
            getFov(): number { return this.fov; }

            setAspect(value: number): void { this.aspect = value; this.invalidateProjectionMatrix(); }
            getAspect(): number { return this.aspect; }

            setNear(value: number): void { this.near = value; this.invalidateProjectionMatrix(); }
            getNear(): number { return this.near; }

            setFar(value: number): void { this.far = value; this.invalidateProjectionMatrix(); }
            getFar(): number { return this.far; }

            protected onUpdateProjectionMatrix(matrix: Matrix4): void {
                const deg2Rad = Math.PI / 180;
                matrix.setPerspective(deg2Rad * this.fov, this.aspect, this.near, this.far);
            }
        }
    }
}