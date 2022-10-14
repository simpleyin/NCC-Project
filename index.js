// 工具类
function Utils() {}

Utils.prototype.getValue = function(object, key) {
    let value;

    if (String.prototype.includes.call(key, '.')) {
        const keyArr = key.split('.');
        for (let key of keyArr) {
            value = object[key];
            object = value;
        }
    } else {
        value = object[key];
    }
    return value;
}

//View Model, 视图模型代码，负责响应式和视图更新
function ViewModel(options) {
    this._data = options.data;
    this._root = options.root;
    this._method = options.method;
    this.observer = new Observer(this);
    this.util = new Utils();
    this.vnode = null;
    this._inited = false;
    this._render = false;

    this._init();
}

ViewModel.prototype._init = function() {
    this._initData();
    this._initMethod();
    this.render();
    this._inited = true;
}

ViewModel.prototype._initData = function() {
    if (Object.prototype.toString.call(this._data) !== '[object Function]' || this._data === null) {
        throw 'data must be a function';
    }

    this._data = this._data();

    this.observer.observe(this._data);

    for (let key of Object.keys(this._data)) {
        Object.defineProperty(this, key, {
            get() {
                return this._data[key];
            },
            set(value) {
                this._data[key] = value;
            }
        })
    }

    console.log('view model data inited');
}

ViewModel.prototype._initMethod = function() {
    for (let funcName of Object.keys(this._method)) {
        this[funcName] = () => {
            this._method[funcName].call(this);
        }
    }
}

ViewModel.prototype._compile = function() {
    const rootNode = document.getElementById(this._root);
    const vnode = new DocumentFragment().appendChild(rootNode);

    if (!rootNode) {
        throw 'root node does not exist';
    }

    walkNode(vnode, this);

    function walkNode(node, _vm) {
        if (node.nodeType === 3) {
            return
        }
        const textObjectKey = node.hasAttribute('data-text-bind') ? node.getAttribute('data-text-bind') : null;
        const valueObjectKey = node.hasAttribute('data-value-bind') ? node.getAttribute('data-value-bind') : null;
        const classNameKey = node.hasAttribute('data-className-bind') ? node.getAttribute('data-className-bind') : null;
        const clickEvent = node.hasAttribute('data-event-click') ? node.getAttribute('data-event-click') : null;
        const inputEvent = node.hasAttribute('data-event-input') ? node.getAttribute('data-event-input') : null;

        let textObjectValue, value, className;

        if (textObjectKey) {
            textObjectValue = _vm.util.getValue(_vm._data, textObjectKey);
            if (textObjectValue) {
                node.innerHTML = textObjectValue;
            }
        }
        if (valueObjectKey) {
            value = _vm.util.getValue(_vm._data, valueObjectKey);
            if (value) {
                node.value = value;
            }
        }
        if (classNameKey) {
            className = _vm.util.getValue(_vm._data, classNameKey);
            if (className) {
                node.className = className;
            }
        }
        if (clickEvent && !this._inited) {
            node.addEventListener('click', function(event) {
                if (this[clickEvent]) {
                    this[clickEvent](event);
                }
            }.bind(_vm));
        }
        if (inputEvent && !this._inited) {
            node.addEventListener('input', function(event) {
                if (this[inputEvent]) {
                    this[inputEvent](event);
                }
            }.bind(_vm));
        }
        if (node.childNodes.length > 0) {
            for (let n of node.childNodes) {
                walkNode(n, _vm);
            }
        }
    }

    this._vnode = vnode;
    console.log('view model compiled');
}

ViewModel.prototype.render = async function() {
    if (!this._render) {
        this._render = true;
        setTimeout(function() {
            this._compile();
            document.getElementsByTagName('body')[0].appendChild(this._vnode);
            console.log('render finished');
            this._render = false;
        }.bind(this), 50);
    }
}

//Observe, 响应式api
function Observer(vm) {
    this._vm = vm;
}

Observer.prototype.observe = function(data) {
    for (let key of Object.keys(data)) {
        if (typeof data[key] !== 'object') {
            this.defineObjectReactive(data, key, data[key]);
        } else {
            this.observe(data[key]);
        }
    }
}

Observer.prototype.defineObjectReactive = function(data, key, value) {
    const dep = new Dependency();
    const _vm = this._vm;
    let oldValue = value;
    Object.defineProperty(data, key, {
        get() {
            dep.add(_vm);
            return oldValue;
        },
        set(newValue) {
            oldValue = newValue;
            dep.notify();
        }
    })
}

//Dependency
function Dependency() {
    this.vm = null;
}

Dependency.prototype.add = function(vm) {
    this.vm = vm;
}

Dependency.prototype.notify = function() {
    this.vm.render();
}
