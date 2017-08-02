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

            private near: number;
            private far: number;

            private projectionInvalid = true;
            private projectionMatrix = new Matrix4();
            private inverseProjectionInvalid = true;
            private inverseProjectionMatrix = new Matrix4();

            private shadowCamera: ShadowCamera;
            private shadowCascades: number[];

            constructor(game: Game, near: number, far: number) {
                super();

                this.game = game;
                this.commandBuffer = new CommandBuffer(game.context);

                this.near = near;
                this.far = far;

                game.addDrawListInvalidationHandler((geom: boolean) => {
                    if (geom) this.invalidateGeometry();
                    this.drawList.invalidate();
                });
            }

            setShadowCascades(cascadeFractions: number[]): void {
                if (this.shadowCamera == null) {
                    this.shadowCamera = new ShadowCamera(this.game, this);
                }

                this.shadowCascades = cascadeFractions;
            }

            setNear(value: number): void {
                if (value === this.near) return;
                this.near = value;
                this.invalidateProjectionMatrix();
            }
            getNear(): number { return this.near; }

            setFar(value: number): void {
                if (value === this.far) return;
                this.far = value;
                this.invalidateProjectionMatrix();
            }
            getFar(): number { return this.far; }

            getOpaqueColorTexture(): RenderTexture {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getColorTexture();
            }

            getOpaqueDepthTexture(): RenderTexture {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getDepthTexture();
            }

            invalidateGeometry(): void {
                this.geometryInvalid = true;
            }

            protected onPopulateDrawList(drawList: DrawList) {
                this.game.populateDrawList(this.drawList, this);
            }

            render(): void {
                if (this.geometryInvalid) {
                    this.drawList.clear();
                    this.onPopulateDrawList(this.drawList);
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

            bufferShadowTargetBegin(buf: CommandBuffer): void {

            }

            bufferShadowTargetEnd(buf: CommandBuffer): void {
                
            }

            getDrawCalls(): number {
                return this.commandBuffer.getDrawCalls();
            }

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
            
            protected onUpdateShadowMatrix(matrix: Matrix4, near: number, far: number): void {
                throw "Not yet implemented";
            }

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

            dispose(): void {
                if (this.opaqueFrameBuffer != null) {
                    this.opaqueFrameBuffer.dispose();
                    this.opaqueFrameBuffer = null;
                }
            }
        }

        export class PerspectiveCamera extends Camera {
            private fov: number;
            private aspect: number;

            constructor(game: Game, fov: number, aspect: number, near: number, far: number) {
                super(game, near, far);

                this.fov = fov;
                this.aspect = aspect;
            }

            setFov(value: number): void {
                if (value === this.fov) return;
                this.fov = value;
                this.invalidateProjectionMatrix();
            }
            getFov(): number { return this.fov; }

            setAspect(value: number): void {
                if (value === this.aspect) return;
                this.aspect = value;
                this.invalidateProjectionMatrix();
            }
            getAspect(): number { return this.aspect; }

            protected onUpdateProjectionMatrix(matrix: Matrix4): void {
                const deg2Rad = Math.PI / 180;
                matrix.setPerspective(deg2Rad * this.fov, this.aspect, this.getNear(), this.getFar());
            }
        }

        export class OrthographicCamera extends Camera {
            private size: number;
            private aspect: number;

            constructor(game: Game, size: number, aspect: number, near: number, far: number) {
                super(game, near, far);

                this.size = size;
                this.aspect = aspect;
            }

            setSize(value: number): void {
                if (value === this.size) return;
                this.size = value;
                this.invalidateProjectionMatrix();
            }
            getSize(): number { return this.size; }
            
            setAspect(value: number): void {
                if (value === this.aspect) return;
                this.aspect = value;
                this.invalidateProjectionMatrix();
            }
            getAspect(): number { return this.aspect; }

            protected onUpdateProjectionMatrix(matrix: Matrix4): void {
                matrix.setOrthographic(this.size, this.aspect, this.getNear(), this.getFar());
            }
        }
    }
}