namespace Facepunch {
    export namespace WebGame {
        export class ShadowCamera extends WebGame.OrthographicCamera {
            readonly game: Game;

            private readonly targetCamera: PerspectiveCamera;

            constructor(game: Game, targetCamera: PerspectiveCamera) {
                super(game, 1, 1, 0, 1);

                this.game = game;
                this.targetCamera = targetCamera;
            }

            private addToFrustumBounds(invLight: Facepunch.Quaternion, vec: Facepunch.Vector4, bounds: Facepunch.Box3): void {
                vec.applyMatrix4(this.targetCamera.getMatrix());
                vec.applyQuaternion(invLight);
            }

            private static readonly getFrustumBounds_vec = new Facepunch.Vector4();
            private static readonly getFrustumBounds_invLight = new Facepunch.Quaternion();
            private getFrustumBounds(lightRotation: Facepunch.Quaternion, near: number, far: number, bounds: Facepunch.Box3): void {
                bounds.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
                bounds.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);

                const yScale = Math.tan(this.targetCamera.getFov() * 0.5);
                const xScale = yScale * this.targetCamera.getAspect();

                const xNear = xScale * near;
                const yNear = yScale * near;

                const xFar = xScale * far;
                const yFar = yScale * far;

                const vec = ShadowCamera.getFrustumBounds_vec;
                const invLight = ShadowCamera.getFrustumBounds_invLight;

                invLight.setInverse(lightRotation);

                this.addToFrustumBounds(invLight, vec.set( xNear,  yNear, near, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(-xNear,  yNear, near, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set( xNear, -yNear, near, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(-xNear, -yNear, near, 1), bounds);
                
                this.addToFrustumBounds(invLight, vec.set( xFar,  yFar, far, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(-xFar,  yFar, far, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set( xFar, -yFar, far, 1), bounds);
                this.addToFrustumBounds(invLight, vec.set(-xFar, -yFar, far, 1), bounds);
            }

            private static readonly renderShadows_bounds = new Facepunch.Box3();
            renderShadows(lightRotation: Facepunch.Quaternion, near: number, far: number): void {
                const bounds = ShadowCamera.renderShadows_bounds;

                this.getFrustumBounds(lightRotation, near, far, bounds);
            }
        }
    }
}