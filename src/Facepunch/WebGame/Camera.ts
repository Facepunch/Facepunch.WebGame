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

            private projectionInvalid = true;
            private projectionMatrix = new Matrix4();
            private inverseProjectionInvalid = true;
            private inverseProjectionMatrix = new Matrix4();

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
            }
        }

        export class PerspectiveCamera extends Camera {
            private fov: number;
            private aspect: number;
            private near: number;
            private far: number;

            constructor(fov: number, aspect: number, near: number, far: number) {
                super();

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