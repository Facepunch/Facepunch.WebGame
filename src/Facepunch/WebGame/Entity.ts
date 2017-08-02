/// <reference path="../Math.ts"/>

namespace Facepunch {
    export namespace WebGame {
        export class Entity {
            private static nextId = 0;

            readonly id = Entity.nextId++;

            private position = new Vector3();
            private rotation = new Quaternion().setIdentity();
            private scale = new Vector3(1, 1, 1);

            private matrix = new Matrix4();
            private matrixInvalid = true;

            private inverseMatrix = new Matrix4();
            private inverseMatrixInvalid = true;

            compareTo(other: Entity): number {
                if (other == null) return 1;
                return this.id - other.id;
            }

            invalidateMatrices(): void {
                this.matrixInvalid = true;
                this.inverseMatrixInvalid = true;
            }

            protected onChangePosition(): void {
                this.invalidateMatrices();
            }

            protected onChangeRotation(): void {
                this.invalidateMatrices();
            }

            protected onChangeScale(): void {
                this.invalidateMatrices();
            }

            getMatrix(target?: Matrix4): Matrix4 {
                if (this.matrixInvalid) {
                    this.matrixInvalid = false;
                    this.matrix.setRotation(this.rotation);
                    this.matrix.scale(this.scale);
                    this.matrix.translate(this.position);
                }

                if (target != null) {
                    return target.copy(this.matrix);
                }

                return this.matrix;
            }

            getInverseMatrix(target?: Matrix4): Matrix4 {
                if (this.inverseMatrixInvalid) {
                    this.inverseMatrixInvalid = false;
                    this.getMatrix();
                    this.inverseMatrix.setInverse(this.matrix);
                }

                if (target != null) {
                    return target.copy(this.inverseMatrix);
                }
                
                return this.inverseMatrix;
            }

            setPosition(value: IVector3): void;
            setPosition(x: number, y: number, z: number): void;
            setPosition(valueOrX: IVector3 | number, y?: number, z?: number): void
            {
                if (y !== undefined) {
                    const x = valueOrX as number;
                    this.position.set(x, y, z);
                } else {
                    const value = valueOrX as IVector3;
                    this.position.set(value.x, value.y, value.z);
                }
                this.onChangePosition();
            }

            getPosition(target: IVector3): IVector3 {
                target.x = this.position.x;
                target.y = this.position.y;
                target.z = this.position.z;
                return target;
            }

            getPositionValues(target: Float32Array): Float32Array {
                target[0] = this.position.x;
                target[1] = this.position.y;
                target[2] = this.position.z;
                return target;
            }

            getDistanceToBounds(bounds: Box3): number {
                return bounds.distanceToPoint(this.position);
            }

            translate(value: IVector3): void;
            translate(x: number, y: number, z: number): void;
            translate(valueOrX: IVector3 | number, y?: number, z?: number): void {
                if (typeof valueOrX === "number") {
                    this.position.x += valueOrX;
                    this.position.y += y;
                    this.position.z += z;
                } else {
                    this.position.add(valueOrX);
                }
                this.onChangePosition();
            }

            easeTo(goal: IVector3, delta: number): void {
                this.position.x += (goal.x - this.position.x) * delta;
                this.position.y += (goal.y - this.position.y) * delta;
                this.position.z += (goal.z - this.position.z) * delta;
            }

            setRotation(value: Quaternion): void {
                this.rotation.copy(value);
                this.onChangeRotation();
            }

            private static tempEuler = new Euler(0, 0, 0, AxisOrder.Zyx);

            setAngles(value: IVector3): void;
            setAngles(pitch: number, yaw: number, roll: number): void;
            setAngles(valueOrPitch: IVector3 | number, yaw?: number, roll?: number): void {
                let pitch: number;
                if (typeof valueOrPitch === "number") {
                    pitch = valueOrPitch;
                } else {
                    pitch = valueOrPitch.x;
                    yaw = valueOrPitch.y;
                    roll = valueOrPitch.z;
                }

                Entity.tempEuler.x = roll;
                Entity.tempEuler.y = pitch;
                Entity.tempEuler.z = yaw;

                this.rotation.setEuler(Entity.tempEuler);
            }

            copyRotation(other: Entity): void {
                this.setRotation(other.rotation);
            }

            applyRotationTo(vector: Vector3 | Vector4): void {
                vector.applyQuaternion(this.rotation);
            }

            setScale(value: IVector3 | number): void
            {
                if (typeof value === "number") {
                    this.scale.set(value, value, value);
                } else {
                    this.scale.set(value.x, value.y, value.z);
                }
                this.onChangeScale();
            }
        }
    }
}