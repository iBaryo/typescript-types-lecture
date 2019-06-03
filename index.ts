const greeting: string = 'hello world';
console.log(greeting);

// classes
class A {
    action() {
    }
}

class B extends A {
    coolAction() {
    }
}

const b = new B();
b.action();
b.coolAction();

// enums
enum Color {
    blue = 1,
    red,
    green
}

function draw(color: Color) {
    console.log(color, Color[color]);
}

draw(Color.green);

// mapped types
type MyColors = 'zima-blue' | 'pearly-white';

type ComplexColor = {
    [C in MyColors]?: number;
};

function drawComplex(c: ComplexColor) {
    console.log('zima blue:', c["zima-blue"]);
}

drawComplex({
    // 'moo': 123,
    'zima-blue': 20,
});

// union types & type guards

/* sealed classes from two separate 3rd party */
class Dog {
    name: () => 'dawg';

    woof() {
    }
}

class Cat {
    name: () => 'cawt';

    meow() {
    }
}

function feed(pet: Dog | Cat) {
    console.log(pet.name());
    if (isDog(pet)) {
        pet.woof();
    }
    else if (pet instanceof Cat) {
        pet.meow();
    }
    else {
        // pet of type 'never'
        // pet.meow();
    }
}

function isDog(pet): pet is Dog {
    return pet instanceof Dog || !!(pet as Dog).woof;
}

// obj literals
function setConfig(config: {
    shouldWork: boolean,
    optional?: string,
    complex: {},
    process: () => void
}) {
}

interface IConfig {
    shouldWork: boolean,
    optional?: string,
    complex: {},
    process: (moo: string) => void
}

// keyof
function setConfigVal<T extends keyof IConfig>(key: T, val: IConfig[T]) {
}

setConfigVal('shouldWork', true);
setConfigVal('process', () => console.log('moo'));
// setConfigVal('invalid', true);


type MyPartial<T> = {
    [K in keyof T]?: T[K]
}

const partialConfig: MyPartial<IConfig> = {};

type MyReadonly<T> = {
    readonly [K in keyof T]: T[K]
}

const readOnlyObj: MyReadonly<{ x: number }> = {x: 42};
// readOnlyObj.x = 3; // error

const pickedConfig: Pick<IConfig, 'shouldWork' | 'optional'> = {
    shouldWork: true,
    optional: 'yes'
};

const recordConfig: Record<'global' | 'us1' | 'eu1', Partial<IConfig>> = {
    global: {},
    us1: {},
    eu1: {}
};

interface IDirty {
    readonly isDirty: boolean
}

// intersections
const editableConfig: MyPartial<IConfig> & IDirty = {isDirty: false};

// conditional types
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T];
type FunctionPropsOf<T> = Pick<T, FunctionPropertyNames<T>>;

function updateConfigFuncs(configFns: FunctionPropsOf<IConfig>) {
    configFns.process('');
}

// type inference
type Unpacked<T> =
    T extends (infer U)[] ? U :
        T extends (...args: any[]) => infer U ? U :
            T extends Promise<infer U> ? U :
                T;

function unpack<T>(obj: T): Unpacked<T> {
    return new Proxy({}, {get: target => ({})}) as any;
}

unpack([{x:1}]).x;
unpack(() => ({y:1})).y;
unpack(Promise.resolve({z:1})).z;
unpack({t:1}).t;


// complex example

type FieldProxy<T> = IDirty & {
    get(): T;
    set(value: T): void;
};

type ObjectProxy<T extends object> = IDirty & {
    [P in keyof T]: T[P] extends object ? ObjectProxy<T[P]> : FieldProxy<T[P]>;
};

type DynProxy<T> = T extends object ? ObjectProxy<T> : FieldProxy<T>;

function proxify<T>(obj: T): DynProxy<T> {
    if (typeof obj == 'object') {
        const proxyContainer = {
            get isDirty(this: ObjectProxy<object>) {
                return Object.keys(this)
                    .filter(k => k != 'isDirty')
                    .some(k => this[k].isDirty)
            }
        } as DynProxy<T>;

        const objProxy = Object.keys(obj as Object).reduce((container, curKey) => {
            container[curKey] = proxify(obj[curKey]);
            return container;
        }, proxyContainer);

        return objProxy;
    }
    else {
        const _origin = obj;
        let _data = obj;

        const fieldProxy = {
            get isDirty() {
                return _data != _origin
            },
            get() {
                return _data as T;
            },
            set(value: T) {
                _data = value;
            }
        } as DynProxy<T>;

        return fieldProxy;
    }
}

const proxyProps = proxify({x: {y: {z: 5}}});
console.log(`all dirty:`, proxyProps.isDirty);
console.log(`z:`, proxyProps.x.y.z.get());
proxyProps.x.y.z.set(8);
console.log(`z:`, proxyProps.x.y.z.get());
console.log(`all dirty:`, proxyProps.isDirty);
