declare namespace Facepunch {
    interface ILoadable {
        loadNext(callback: (requeue: boolean) => void): void;
    }
    interface ILoader {
        update(requestQuota: number): number;
    }
    abstract class Loader<TLoadable extends ILoadable> implements ILoader {
        private queue;
        private loaded;
        private active;
        private completed;
        load(url: string): TLoadable;
        getQueueCount(): number;
        getActiveCount(): number;
        getCompletedCount(): number;
        getTotalCount(): number;
        protected enqueueItem(item: TLoadable): void;
        protected abstract onCreateItem(url: string): TLoadable;
        protected onComparePriority(a: TLoadable, b: TLoadable): number;
        protected onFinishedLoadStep(item: TLoadable): void;
        private getNextToLoad();
        update(requestQuota: number): number;
    }
}
declare namespace Facepunch {
    class LZString {
        static readonly compressToBase64: (input: any) => string;
        static readonly decompressFromBase64: (input: any) => string;
        static readonly compressToUTF16: (input: any) => string;
        static readonly decompressFromUTF16: (compressed: any) => string;
        static readonly compressToUint8Array: (uncompressed: any) => Uint8Array;
        static readonly decompressFromUint8Array: (compressed: any) => string;
        static readonly compressToEncodedURIComponent: (input: any) => string;
        static readonly decompressFromEncodedURIComponent: (input: any) => string;
        static readonly compress: (uncompressed: any) => string;
        static readonly decompress: (compressed: any) => string;
    }
}
declare namespace Facepunch {
    interface IVector2 {
        x: number;
        y: number;
    }
    class Vector2 implements IVector2 {
        x: number;
        y: number;
        constructor(x?: number, y?: number);
        set(x: number, y: number): this;
        sub(vec: IVector2): this;
        multiplyScalar(val: number): this;
        copy(vec: IVector2): this;
    }
    interface IVector3 {
        x: number;
        y: number;
        z: number;
    }
    class Vector3 implements IVector3 {
        static readonly zero: Vector3;
        static readonly one: Vector3;
        static readonly unitX: Vector3;
        static readonly unitY: Vector3;
        static readonly unitZ: Vector3;
        x: number;
        y: number;
        z: number;
        constructor(x?: number, y?: number, z?: number);
        length(): number;
        lengthSq(): number;
        set(x: number, y: number, z: number): this;
        add(vec: IVector3): this;
        multiplyScalar(val: number): this;
        dot(vec: IVector3): number;
        copy(vec: IVector3): this;
        applyQuaternion(quat: Quaternion): this;
        setNormal(vec: IVector3): this;
    }
    class Vector4 {
        x: number;
        y: number;
        z: number;
        w: number;
        constructor(x?: number, y?: number, z?: number, w?: number);
        applyMatrix4(mat: Matrix4): this;
    }
    class Quaternion {
        x: number;
        y: number;
        z: number;
        w: number;
        constructor(x?: number, y?: number, z?: number, w?: number);
        copy(quat: Quaternion): this;
        setIdentity(): this;
        setAxisAngle(axis: Vector3, angle: number): this;
        multiply(quat: Quaternion): this;
        setEuler(euler: Euler): this;
    }
    enum AxisOrder {
        Xyz = 5,
        Xzy = 12,
        Yxz = 9,
        Yzx = 3,
        Zxy = 6,
        Zyx = 10,
    }
    class Euler {
        x: number;
        y: number;
        z: number;
        order: AxisOrder;
        constructor(x?: number, y?: number, z?: number, order?: AxisOrder);
    }
    class Plane {
        normal: Vector3;
        distance: number;
        constructor(normal: Vector3, distance: number);
    }
    class Box3 {
        min: Vector3;
        max: Vector3;
        constructor(min?: Vector3, max?: Vector3);
        copy(box: Box3): this;
        distanceToPoint(vec: Vector3): number;
    }
    class Matrix4 {
        private static nextId;
        readonly id: number;
        elements: Float32Array;
        setIdentity(): this;
        compareTo(other: Matrix4): number;
        copy(mat: Matrix4): this;
        setRotation(rotation: Quaternion): this;
        scale(vec: Vector3): this;
        translate(vec: Vector3): this;
        setPerspective(fov: number, aspect: number, near: number, far: number): this;
        setInverse(from: Matrix4): this;
    }
}
declare namespace Facepunch {
    class Http {
        static readonly cancelled: any;
        static getString(url: string, success: (response: string) => void, failure?: (error: any) => void): void;
        static getJson<TResponse>(url: string, success: (response: TResponse) => void, failure?: (error: any) => void): void;
        static getImage(url: string, success: (response: HTMLImageElement) => void, failure?: (error: any) => void): void;
        static isAbsUrl(url: string): boolean;
        static getAbsUrl(url: string, relativeTo: string): string;
    }
    class Utils {
        static decompress<T>(value: string | T): T;
        static decompressOrClone<T>(value: string | T[]): T[];
    }
    class WebGl {
        static decodeConst<TEnum extends number>(valueOrIdent: TEnum | string, defaultValue?: TEnum): TEnum;
        private static constDict;
        static encodeConst(value: number): string;
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class Entity {
            private static nextId;
            readonly id: number;
            private position;
            private rotation;
            private scale;
            private matrix;
            private matrixInvalid;
            private inverseMatrix;
            private inverseMatrixInvalid;
            compareTo(other: Entity): number;
            private invalidateMatrices();
            getMatrix(target?: Matrix4): Matrix4;
            getInverseMatrix(target?: Matrix4): Matrix4;
            setPosition(value: IVector3): void;
            setPosition(x: number, y: number, z: number): void;
            getPosition(target: IVector3): IVector3;
            getPositionValues(target: Float32Array): Float32Array;
            getDistanceToBounds(bounds: Box3): number;
            translate(value: IVector3): void;
            translate(x: number, y: number, z: number): void;
            setRotation(value: Quaternion): void;
            private static tempEuler;
            setAngles(value: IVector3): void;
            setAngles(pitch: number, yaw: number, roll: number): void;
            copyRotation(other: Entity): void;
            applyRotationTo(vector: Vector3): void;
            setScale(value: IVector3 | number): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        type CommandBufferAction = (gl: WebGLRenderingContext, args: ICommandBufferItem) => void;
        interface ICommandBufferItem {
            action?: CommandBufferAction;
            parameters?: {
                [param: number]: Float32Array | Texture;
            };
            parameter?: CommandBufferParameter;
            program?: ShaderProgram;
            uniform?: Uniform;
            target?: number;
            unit?: number;
            texture?: Texture;
            transpose?: boolean;
            values?: Float32Array;
            context?: RenderContext;
            cap?: number;
            enabled?: boolean;
            buffer?: WebGLBuffer;
            framebuffer?: FrameBuffer;
            fitView?: boolean;
            index?: number;
            mode?: number;
            type?: number;
            offset?: number;
            count?: number;
            size?: number;
            normalized?: boolean;
            stride?: number;
            game?: Game;
            mask?: number;
            x?: number;
            y?: number;
            z?: number;
            w?: number;
        }
        enum UniformType {
            Float = 0,
            Float2 = 1,
            Float3 = 2,
            Float4 = 3,
            Matrix4 = 4,
            Texture = 5,
        }
        class CommandBufferParameter {
            private static nextId;
            readonly id: number;
            readonly type: UniformType;
            constructor(type: UniformType);
        }
        interface ICommandBufferParameterProvider {
            populateCommandBufferParameters(buf: CommandBuffer): void;
        }
        class CommandBuffer {
            private context;
            private commands;
            private boundTextures;
            private boundBuffers;
            private capStates;
            private parameters;
            private lastCommand;
            constructor(context: WebGLRenderingContext);
            private getCommandName(action);
            logCommands(): void;
            clearCommands(): void;
            setParameter(param: CommandBufferParameter, value: Float32Array | Texture): void;
            getArrayParameter(param: CommandBufferParameter): Float32Array;
            getTextureParameter(param: CommandBufferParameter): Texture;
            run(): void;
            private push(action, args);
            clear(mask: number): void;
            private onClear(gl, args);
            private setCap(cap, enabled);
            enable(cap: number): void;
            private onEnable(gl, args);
            disable(cap: number): void;
            private onDisable(gl, args);
            depthMask(flag: boolean): void;
            private onDepthMask(gl, args);
            blendFuncSeparate(srcRgb: number, dstRgb: number, srcAlpha: number, dstAlpha: number): void;
            private onBlendFuncSeparate(gl, args);
            useProgram(program: ShaderProgram): void;
            private onUseProgram(gl, args);
            setUniformParameter(uniform: Uniform, parameter: CommandBufferParameter): void;
            private onSetUniformParameter(gl, args);
            setUniform1F(uniform: Uniform, x: number): void;
            private onSetUniform1F(gl, args);
            setUniform1I(uniform: Uniform, x: number): void;
            private onSetUniform1I(gl, args);
            setUniform2F(uniform: Uniform, x: number, y: number): void;
            private onSetUniform2F(gl, args);
            setUniform3F(uniform: Uniform, x: number, y: number, z: number): void;
            private onSetUniform3F(gl, args);
            setUniform4F(uniform: Uniform, x: number, y: number, z: number, w: number): void;
            private onSetUniform4F(gl, args);
            setUniformMatrix4(uniform: Uniform, transpose: boolean, values: Float32Array): void;
            private onSetUniformMatrix4(gl, args);
            bindTexture(unit: number, value: Texture): void;
            private onBindTexture(gl, args);
            bindBuffer(target: number, buffer: WebGLBuffer): void;
            private onBindBuffer(gl, args);
            enableVertexAttribArray(index: number): void;
            private onEnableVertexAttribArray(gl, args);
            disableVertexAttribArray(index: number): void;
            private onDisableVertexAttribArray(gl, args);
            vertexAttribPointer(index: number, size: number, type: number, normalized: boolean, stride: number, offset: number): void;
            private onVertexAttribPointer(gl, args);
            drawElements(mode: number, count: number, type: number, offset: number, elemSize: number): void;
            private onDrawElements(gl, args);
            bindFramebuffer(buffer: FrameBuffer, fitView?: boolean): void;
            private onBindFramebuffer(gl, args);
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        abstract class Camera extends Entity implements ICommandBufferParameterProvider {
            static readonly cameraPosParam: CommandBufferParameter;
            static readonly clipInfoParam: CommandBufferParameter;
            static readonly projectionMatrixParam: CommandBufferParameter;
            static readonly inverseProjectionMatrixParam: CommandBufferParameter;
            static readonly viewMatrixParam: CommandBufferParameter;
            static readonly inverseViewMatrixParam: CommandBufferParameter;
            private projectionInvalid;
            private projectionMatrix;
            private inverseProjectionInvalid;
            private inverseProjectionMatrix;
            abstract getNear(): number;
            abstract getFar(): number;
            getProjectionMatrix(target?: Matrix4): Matrix4;
            getInverseProjectionMatrix(target?: Matrix4): Matrix4;
            protected invalidateProjectionMatrix(): void;
            protected abstract onUpdateProjectionMatrix(matrix: Matrix4): void;
            private cameraPosParams;
            private clipParams;
            populateCommandBufferParameters(buf: CommandBuffer): void;
        }
        class PerspectiveCamera extends Camera {
            private fov;
            private aspect;
            private near;
            private far;
            constructor(fov: number, aspect: number, near: number, far: number);
            setFov(value: number): void;
            getFov(): number;
            setAspect(value: number): void;
            getAspect(): number;
            setNear(value: number): void;
            getNear(): number;
            setFar(value: number): void;
            getFar(): number;
            protected onUpdateProjectionMatrix(matrix: Matrix4): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class DrawList {
            private static readonly identityMatrix;
            readonly context: RenderContext;
            readonly game: Game;
            private items;
            private invalid;
            private opaque;
            private translucent;
            private lastHandle;
            private hasRefraction;
            constructor(context: RenderContext);
            isInvalid(): boolean;
            clear(): void;
            getDrawCalls(): number;
            addItem(item: IDrawListItem): void;
            addItems<TItem extends IDrawListItem>(items: TItem[]): void;
            private isBuildingList;
            invalidate(): void;
            private bufferHandle(buf, handle, context);
            private static compareHandles(a, b);
            private buildHandleList();
            appendToBuffer(buf: CommandBuffer, context: RenderContext): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IDrawListItem {
            getIsVisible(): boolean;
            getIsInDrawList(drawList: DrawList): boolean;
            onAddToDrawList(list: DrawList): void;
            onRemoveFromDrawList(list: DrawList): void;
            getMeshHandles(): MeshHandle[];
        }
        class DrawListItem implements IDrawListItem {
            isStatic: boolean;
            entity: Entity;
            private meshHandles;
            private readonly drawLists;
            clearMeshHandles(): void;
            addMeshHandles(handles: MeshHandle[]): void;
            private invalidateDrawLists();
            getIsVisible(): boolean;
            getIsInDrawList(drawList: DrawList): boolean;
            onAddToDrawList(list: DrawList): void;
            onRemoveFromDrawList(list: DrawList): void;
            getMeshHandles(): MeshHandle[];
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class Fog implements ICommandBufferParameterProvider {
            static readonly fogColorParam: CommandBufferParameter;
            static readonly fogInfoParam: CommandBufferParameter;
            private readonly renderContext;
            start: number;
            end: number;
            maxDensity: number;
            readonly color: Vector3;
            private readonly colorValues;
            private readonly paramsValues;
            constructor(context: RenderContext);
            populateCommandBufferParameters(buf: CommandBuffer): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class FrameBuffer {
            private context;
            private frameBuffer;
            private width;
            private height;
            private frameTexture;
            private depthTexture;
            constructor(gl: WebGLRenderingContext, width: number, height: number);
            private unbindAndCheckState();
            addDepthAttachment(existing?: RenderTexture): void;
            getColorTexture(): RenderTexture;
            getDepthTexture(): RenderTexture;
            dispose(): void;
            resize(width: number, height: number): void;
            getHandle(): WebGLFramebuffer;
            begin(): void;
            end(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        enum MouseButton {
            Left = 1,
            Middle = 2,
            Right = 3,
        }
        enum Key {
            Backspace = 8,
            Tab = 9,
            Enter = 13,
            Shift = 16,
            Ctrl = 17,
            Alt = 18,
            PauseBreak = 19,
            CapsLock = 20,
            Escape = 27,
            PageUp = 33,
            PageDown = 34,
            End = 35,
            Home = 36,
            LeftArrow = 37,
            UpArrow = 38,
            RightArrow = 39,
            DownArrow = 40,
            Insert = 45,
            Delete = 46,
            D0 = 48,
            D1 = 49,
            D2 = 50,
            D3 = 51,
            D4 = 52,
            D5 = 53,
            D6 = 54,
            D7 = 55,
            D8 = 56,
            D9 = 57,
            A = 65,
            B = 66,
            C = 67,
            D = 68,
            E = 69,
            F = 70,
            G = 71,
            H = 72,
            I = 73,
            J = 74,
            K = 75,
            L = 76,
            M = 77,
            N = 78,
            O = 79,
            P = 80,
            Q = 81,
            R = 82,
            S = 83,
            T = 84,
            U = 85,
            V = 86,
            W = 87,
            X = 88,
            Y = 89,
            Z = 90,
            LeftWindowKey = 91,
            RightWindowKey = 92,
            Select = 93,
            Numpad0 = 96,
            Numpad1 = 97,
            Numpad2 = 98,
            Numpad3 = 99,
            Numpad4 = 100,
            Numpad5 = 101,
            Numpad6 = 102,
            Numpad7 = 103,
            Numpad8 = 104,
            Numpad9 = 105,
            Multiply = 106,
            Add = 107,
            Subtract = 109,
            DecimalPoint = 110,
            Divide = 111,
            F1 = 112,
            F2 = 113,
            F3 = 114,
            F4 = 115,
            F5 = 116,
            F6 = 117,
            F7 = 118,
            F8 = 119,
            F9 = 120,
            F10 = 121,
            F11 = 122,
            F12 = 123,
            NumLock = 144,
            ScrollLock = 145,
            SemiColon = 186,
            EqualSign = 187,
            Comma = 188,
            Dash = 189,
            Period = 190,
            ForwardSlash = 191,
            GraveAccent = 192,
            OpenBracket = 219,
            BackSlash = 220,
            CloseBraket = 221,
            SingleQuote = 222,
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class Game implements ICommandBufferParameterProvider {
            static readonly timeInfoParam: CommandBufferParameter;
            static readonly screenInfoParam: CommandBufferParameter;
            canLockPointer: boolean;
            readonly shaders: ShaderManager;
            readonly meshes: MeshManager;
            readonly materialLoader: MaterialLoader;
            readonly textureLoader: TextureLoader;
            readonly modelLoader: ModelLoader;
            private loaders;
            private animateCallback;
            private lastAnimateCallback;
            readonly container: HTMLElement;
            readonly canvas: HTMLCanvasElement;
            readonly context: WebGLRenderingContext;
            private readonly drawListInvalidationHandlers;
            private heldKeys;
            private heldMouseButtons;
            private mouseScreenPos;
            private mouseLookDelta;
            constructor(container: HTMLElement);
            getLastUpdateTime(): number;
            getWidth(): number;
            getHeight(): number;
            getMouseScreenPos(out?: Vector2): Vector2;
            getMouseViewPos(out?: Vector2): Vector2;
            private getScreenPos(pageX, pageY, out?);
            isPointerLocked(): boolean;
            populateDrawList(drawList: DrawList, camera: Camera): void;
            addDrawListInvalidationHandler(action: (geom: boolean) => void): void;
            forceDrawListInvalidation(geom: boolean): void;
            animate(dt?: number): void;
            isKeyDown(key: Key): boolean;
            isMouseButtonDown(button: MouseButton): boolean;
            protected onInitialize(): void;
            protected onResize(): void;
            protected addLoader<TLoader extends ILoader>(loader: TLoader): TLoader;
            protected onMouseDown(button: MouseButton, screenPos: Vector2): void;
            protected onMouseUp(button: MouseButton, screenPos: Vector2): void;
            protected onMouseMove(screenPos: Vector2): void;
            protected onMouseLook(delta: Vector2): void;
            protected onKeyDown(key: Key): void;
            protected onKeyUp(key: Key): void;
            protected onUpdateFrame(dt: number): void;
            protected onRenderFrame(dt: number): void;
            private readonly timeParams;
            private readonly screenParams;
            populateCommandBufferParameters(buf: CommandBuffer): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        enum MaterialPropertyType {
            Boolean = 1,
            Number = 2,
            TextureUrl = 3,
        }
        interface IMaterialProperty {
            type: MaterialPropertyType;
            name: string;
            value: boolean | number | string;
        }
        interface IMaterialInfo {
            shader: string;
            properties: IMaterialProperty[];
        }
        class Material {
            private static nextId;
            readonly id: number;
            properties: any;
            program: ShaderProgram;
            enabled: boolean;
            constructor();
            constructor(program: ShaderProgram);
        }
        class MaterialLoadable extends Material implements ILoadable {
            private readonly game;
            private readonly url;
            constructor(game: Game, url: string);
            private addPropertyFromInfo(info);
            loadNext(callback: (requeue: boolean) => void): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class MaterialLoader extends Loader<MaterialLoadable> {
            private readonly game;
            constructor(game: Game);
            protected onCreateItem(url: string): MaterialLoadable;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IMeshElement {
            mode: DrawMode;
            material: number | Material;
            indexOffset: number;
            indexCount: number;
            vertexOffset?: number;
            vertexCount?: number;
        }
        interface IMeshData {
            attributes: VertexAttribute[];
            elements: IMeshElement[];
            vertices: number[];
            indices: number[];
        }
        interface ICompressedMeshData {
            attributes: (VertexAttribute | string)[];
            elements: IMeshElement[];
            vertices: number[] | string;
            indices: number[] | string;
        }
        class MeshGroup {
            private static readonly maxIndexDataLength;
            private static readonly vertexComponentSize;
            private static nextId;
            readonly id: number;
            private readonly context;
            private readonly attribs;
            private readonly attribOffsets;
            private readonly vertexLength;
            private readonly indexSize;
            private readonly maxVertexDataLength;
            private readonly maxSubBufferLength;
            private vertexBuffer;
            private indexBuffer;
            private vertexData;
            private indexData;
            private vertexDataLength;
            private indexDataLength;
            private subBufferOffset;
            constructor(context: WebGLRenderingContext, attribs: VertexAttribute[]);
            compareTo(other: MeshGroup): number;
            canAddMeshData(data: IMeshData): boolean;
            private ensureCapacity<TArray>(array, length, ctor);
            private updateBuffer<TArray>(target, buffer, data, newData, oldData, offset);
            addMeshData(data: IMeshData, getMaterial: (materialIndex: number) => Material, target: MeshHandle[]): void;
            bufferBindBuffers(buf: CommandBuffer, program: ShaderProgram): void;
            bufferAttribPointers(buf: CommandBuffer, program: ShaderProgram, vertexOffset: number): void;
            bufferRenderElements(buf: CommandBuffer, mode: number, offset: number, count: number): void;
            dispose(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        enum DrawMode {
            Triangles,
            TriangleStrip,
            TriangleFan,
        }
        class MeshHandle {
            static readonly undefinedHandle: MeshHandle;
            readonly transform: Matrix4;
            readonly material: Material;
            readonly group: MeshGroup;
            readonly vertexOffset: number;
            readonly drawMode: DrawMode;
            readonly indexOffset: number;
            readonly indexCount: number;
            constructor(group: MeshGroup, vertexOffset: number, drawMode: DrawMode, indexOffset: number, indexCount: number, material: Material, transform?: Matrix4);
            clone(newTransform: Matrix4, newMaterial?: Material): MeshHandle;
            compareTo(other: MeshHandle): number;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class MeshManager {
            private readonly context;
            private readonly game;
            private readonly groups;
            constructor(game: Game);
            addMeshData(data: ICompressedMeshData | IMeshData, getMaterial?: (materialIndex: number) => Material, target?: MeshHandle[]): MeshHandle[];
            private composeFrameHandle;
            getComposeFrameMeshHandle(): MeshHandle;
            dispose(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IModelInfo {
            materials: string[];
            meshData: ICompressedMeshData;
        }
        abstract class Model {
            private readonly onLoadCallbacks;
            abstract isLoaded(): boolean;
            abstract getMeshHandles(): MeshHandle[];
            addOnLoadCallback(callback: (model: Model) => void): void;
            protected dispatchOnLoadCallbacks(): void;
        }
        class ModelLoadable extends Model implements ILoadable {
            private readonly game;
            private readonly url;
            private handles;
            constructor(game: Game, url: string);
            isLoaded(): boolean;
            getMeshHandles(): MeshHandle[];
            loadNext(callback: (requeue: boolean) => void): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class ModelLoader extends Loader<ModelLoadable> {
            private readonly game;
            constructor(game: Game);
            protected onCreateItem(url: string): ModelLoadable;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class RenderContext implements ICommandBufferParameterProvider {
            static readonly opaqueColorParam: CommandBufferParameter;
            static readonly opaqueDepthParam: CommandBufferParameter;
            readonly game: Game;
            readonly fog: Fog;
            private drawList;
            private commandBuffer;
            private drawListInvalid;
            private commandBufferInvalid;
            private opaqueFrameBuffer;
            constructor(game: Game);
            getOpaqueColorTexture(): RenderTexture;
            getOpaqueDepthTexture(): RenderTexture;
            invalidate(): void;
            render(camera: Camera): void;
            populateCommandBufferParameters(buf: CommandBuffer): void;
            private setupFrameBuffers();
            bufferOpaqueTargetBegin(buf: CommandBuffer): void;
            bufferRenderTargetEnd(buf: CommandBuffer): void;
            getDrawCallCount(): number;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class ShaderManager {
            private namedPrograms;
            private ctorPrograms;
            readonly context: WebGLRenderingContext;
            constructor(context: WebGLRenderingContext);
            resetUniformCache(): void;
            private getFromName(name);
            private getFromCtor(ctor);
            get(name: string): ShaderProgram;
            get(ctor: IProgramCtor): ShaderProgram;
            createMaterial(ctor: IProgramCtor): Material;
            dispose(): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IProgramCtor {
            new (context: WebGLRenderingContext): ShaderProgram;
        }
        abstract class ShaderProgram {
            private static nextId;
            readonly id: number;
            readonly context: WebGLRenderingContext;
            private program;
            private compiled;
            private readonly vertIncludes;
            private readonly fragIncludes;
            private nextTextureUnit;
            private attribNames;
            private attribIds;
            private attribLocations;
            private attribStates;
            private uniforms;
            sortOrder: number;
            constructor(context: WebGLRenderingContext);
            createMaterialProperties(): any;
            reserveNextTextureUnit(): number;
            resetUniformCache(): void;
            dispose(): void;
            compareTo(other: ShaderProgram): number;
            compareMaterials(a: Material, b: Material): number;
            getProgram(): WebGLProgram;
            bufferAttribPointer(buf: CommandBuffer, attrib: VertexAttribute, stride: number, offset: number): void;
            isCompiled(): boolean;
            protected addAttribute(name: string, attrib: VertexAttribute): void;
            protected addUniform<TUniform extends Uniform>(name: string, ctor: IUniformCtor<TUniform>): TUniform;
            private static formatSource(source);
            protected includeShaderSource(type: number, source: string): void;
            private compileShader(type, source);
            private findAttribLocation(name, attrib);
            protected compile(): void;
            bufferEnableAttributes(buf: CommandBuffer, attribs?: VertexAttribute[]): void;
            bufferDisableAttributes(buf: CommandBuffer): void;
            bufferSetup(buf: CommandBuffer, context: RenderContext): void;
            bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void;
            bufferMaterial(buf: CommandBuffer, material: Material): void;
        }
        class BaseMaterialProps {
            noCull: boolean;
        }
        abstract class BaseShaderProgram<TMaterialProps extends BaseMaterialProps> extends ShaderProgram {
            private readonly materialPropsCtor;
            constructor(context: WebGLRenderingContext, ctor: {
                new (): TMaterialProps;
            });
            createMaterialProperties(): any;
            bufferMaterial(buf: CommandBuffer, material: Material): void;
            bufferMaterialProps(buf: CommandBuffer, props: TMaterialProps): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        namespace Shaders {
            class ComposeFrame extends ShaderProgram {
                static readonly vertSource: string;
                static readonly fragSource: string;
                readonly frameColor: UniformSampler;
                readonly frameDepth: UniformSampler;
                constructor(context: WebGLRenderingContext);
                bufferSetup(buf: CommandBuffer, context: RenderContext): void;
            }
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        namespace Shaders {
            class ModelBaseMaterialProps extends BaseMaterialProps {
                baseTexture: Texture;
                noFog: boolean;
                translucent: boolean;
            }
            abstract class ModelBase<TMaterialProps extends ModelBaseMaterialProps> extends BaseShaderProgram<TMaterialProps> {
                static readonly vertSource: string;
                static readonly fragSource: string;
                readonly projectionMatrix: UniformMatrix4;
                readonly viewMatrix: UniformMatrix4;
                readonly modelMatrix: UniformMatrix4;
                readonly baseTexture: UniformSampler;
                readonly time: Uniform4F;
                readonly fogParams: Uniform4F;
                readonly fogColor: Uniform3F;
                readonly noFog: Uniform1F;
                constructor(context: WebGLRenderingContext, ctor: {
                    new (): TMaterialProps;
                });
                bufferSetup(buf: CommandBuffer, context: RenderContext): void;
                bufferModelMatrix(buf: CommandBuffer, value: Float32Array): void;
                bufferMaterialProps(buf: CommandBuffer, props: TMaterialProps): void;
            }
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        namespace Shaders {
            class VertexLitGenericMaterialProps extends ModelBaseMaterialProps {
                alpha: number;
                alphaTest: boolean;
            }
            class VertexLitGeneric extends ModelBase<VertexLitGenericMaterialProps> {
                static readonly vertSource: string;
                static readonly fragSource: string;
                readonly alpha: Uniform1F;
                readonly alphaTest: Uniform1F;
                readonly translucent: Uniform1F;
                constructor(context: WebGLRenderingContext);
                bufferMaterialProps(buf: CommandBuffer, props: VertexLitGenericMaterialProps): void;
            }
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class StaticProp extends Entity implements IDrawListItem {
            private readonly drawable;
            private model;
            constructor();
            setModel(model: Model): void;
            private onModelLoaded(model);
            getModel(): Model;
            getIsVisible(): boolean;
            getIsInDrawList(drawList: DrawList): boolean;
            onAddToDrawList(list: DrawList): void;
            onRemoveFromDrawList(list: DrawList): void;
            getMeshHandles(): MeshHandle[];
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        abstract class Texture {
            private static nextId;
            readonly id: number;
            constructor();
            isLoaded(): boolean;
            abstract getTarget(): TextureTarget;
            abstract getHandle(): WebGLTexture;
            dispose(): void;
        }
        enum TextureFormat {
            Rgb,
            Rgba,
            DepthComponent,
        }
        enum TextureDataType {
            Uint8,
            Uint16,
            Uint32,
            Float,
        }
        enum TextureTarget {
            Texture2D,
            TextureCubeMap,
        }
        enum TextureWrapMode {
            ClampToEdge,
            Repeat,
            MirroredRepeat,
        }
        enum TextureMinFilter {
            Nearest,
            Linear,
            NearestMipmapNearest,
            LinearMipmapNearest,
            NearestMipmapLinear,
            LinearMipmapLinear,
        }
        enum TextureMagFilter {
            Nearest,
            Linear,
        }
        enum TextureParameterType {
            Integer,
            Float,
        }
        enum TextureParameter {
            WrapS,
            WrapT,
            MinFilter,
            MagFilter,
        }
        class RenderTexture extends Texture {
            readonly context: WebGLRenderingContext;
            readonly target: TextureTarget;
            readonly format: TextureFormat;
            readonly type: TextureDataType;
            private width;
            private height;
            private handle;
            constructor(context: WebGLRenderingContext, target: TextureTarget, format: TextureFormat, type: TextureDataType, width: number, height: number);
            setWrapMode(mode: TextureWrapMode): void;
            setWrapMode(wrapS: TextureWrapMode, wrapT: TextureWrapMode): void;
            setFilter(minFilter: TextureMinFilter, magFilter: TextureMagFilter): void;
            getTarget(): TextureTarget;
            getHandle(): WebGLTexture;
            resize(width: number, height: number): void;
            protected onResize(width: number, height: number): void;
            dispose(): void;
        }
        interface IPixelData {
            readonly channels: number;
            readonly width: number;
            readonly height: number;
            readonly values: ArrayBufferView;
        }
        class Uint8PixelData implements IPixelData {
            readonly channels: number;
            readonly width: number;
            readonly height: number;
            readonly values: Uint8Array;
            constructor(format: TextureFormat, width: number, height: number);
        }
        class ProceduralTexture2D extends RenderTexture {
            private pixels;
            private static readonly channelBuffer;
            constructor(context: WebGLRenderingContext, width: number, height: number);
            setPixelRgb(x: number, y: number, rgb: number): void;
            setPixelRgba(x: number, y: number, rgba: number): void;
            setPixelColor(x: number, y: number, color: IColor): void;
            setPixel(x: number, y: number, channels: number[]): void;
            getPixelColor(x: number, y: number, target?: IColor): IColor;
            getPixel(x: number, y: number, target?: number[], dstIndex?: number): number[];
            setPixels(x: number, y: number, width: number, height: number, values: number[]): void;
            apply(): void;
            applyRegion(x: number, y: number, width: number, height: number): void;
            protected onResize(width: number, height: number): void;
        }
        class TextureUtils {
            private static whiteTexture;
            static getWhiteTexture(context: WebGLRenderingContext): Texture;
            private static blackTexture;
            static getBlackTexture(context: WebGLRenderingContext): Texture;
            private static translucentTexture;
            static getTranslucentTexture(context: WebGLRenderingContext): Texture;
            private static errorTexture;
            static getErrorTexture(context: WebGLRenderingContext): Texture;
        }
        enum TextureFilter {
            Nearest,
            Linear,
        }
        interface ITextureParameters {
            wrapS: TextureWrapMode | "CLAMP_TO_EDGE" | "REPEAT" | "MIRRORED_REPEAT";
            wrapT: TextureWrapMode | "CLAMP_TO_EDGE" | "REPEAT" | "MIRRORED_REPEAT";
            filter: TextureFilter | "NEAREST" | "LINEAR";
            mipmap: boolean;
        }
        interface IColor {
            r: number;
            g: number;
            b: number;
            a?: number;
        }
        interface ITextureElement {
            level: number;
            target?: TextureTarget | string;
            url?: string;
            color?: IColor;
        }
        interface ITextureInfo {
            target: TextureTarget | string;
            width: number;
            height: number;
            params: ITextureParameters;
            elements: ITextureElement[];
        }
        class TextureLoadable extends Texture implements ILoadable {
            private readonly context;
            private readonly url;
            private info;
            private nextElement;
            private handle;
            private target;
            private filter;
            private mipmap;
            constructor(context: WebGLRenderingContext, url: string);
            getTarget(): TextureTarget;
            getHandle(): WebGLTexture;
            getLoadPriority(): number;
            private canLoadImmediately(index);
            private applyTexParameters();
            private getOrCreateHandle();
            private static pixelBuffer;
            private loadColorElement(target, level, color);
            private loadImageElement(target, level, image);
            private loadElement(element, value?);
            loadNext(callback: (requeue: boolean) => void): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        class TextureLoader extends Loader<TextureLoadable> {
            private readonly context;
            constructor(context: WebGLRenderingContext);
            protected onComparePriority(a: TextureLoadable, b: TextureLoadable): number;
            protected onCreateItem(url: string): TextureLoadable;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        interface IUniformCtor<TUniform extends Uniform> {
            new (program: ShaderProgram, name: string): TUniform;
        }
        abstract class Uniform {
            protected readonly context: WebGLRenderingContext;
            private program;
            private name;
            private location;
            private parameter;
            isSampler: boolean;
            constructor(program: ShaderProgram, name: string);
            getLocation(): WebGLUniformLocation;
            reset(): void;
            bufferParameter(buf: CommandBuffer, param: CommandBufferParameter): void;
        }
        class Uniform1F extends Uniform {
            private x;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number): void;
            set(x: number): void;
        }
        class Uniform1I extends Uniform {
            private x;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number): void;
            set(x: number): void;
        }
        class Uniform2F extends Uniform {
            private x;
            private y;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number, y: number): void;
            set(x: number, y: number): void;
        }
        class Uniform3F extends Uniform {
            private x;
            private y;
            private z;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number, y: number, z: number): void;
            set(x: number, y: number, z: number): void;
        }
        class Uniform4F extends Uniform {
            private x;
            private y;
            private z;
            private w;
            reset(): void;
            bufferValue(buf: CommandBuffer, x: number, y: number, z: number, w: number): void;
            set(x: number, y: number, z: number, w: number): void;
        }
        class UniformSampler extends Uniform {
            private value;
            private default;
            private texUnit;
            constructor(program: ShaderProgram, name: string);
            getTexUnit(): number;
            setDefault(tex: Texture): void;
            reset(): void;
            bufferValue(buf: CommandBuffer, tex: Texture): void;
            set(tex: Texture): void;
        }
        class UniformMatrix4 extends Uniform {
            private transpose;
            private values;
            reset(): void;
            bufferValue(buf: CommandBuffer, transpose: boolean, values: Float32Array): void;
            set(transpose: boolean, values: Float32Array): void;
        }
    }
}
declare namespace Facepunch {
    namespace WebGame {
        enum AttributeType {
            Float,
        }
        class VertexAttribute {
            private static nextId;
            static readonly position: VertexAttribute;
            static readonly normal: VertexAttribute;
            static readonly uv: VertexAttribute;
            static readonly uv2: VertexAttribute;
            static readonly rgb: VertexAttribute;
            static readonly rgba: VertexAttribute;
            static compare(a: VertexAttribute, b: VertexAttribute): number;
            readonly id: number;
            readonly size: number;
            readonly type: AttributeType;
            readonly normalized: boolean;
            constructor(size: number, type: AttributeType | string, normalized?: boolean);
        }
    }
}
