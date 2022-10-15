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

Utils.prototype.debounce = function(func, _this) {}

Utils.prototype.isOnlyGivenItemTruthy = function(map, keys) {
    let temKeys = [...keys];
    for (let [k, v] of map.entries()) {
        const index = temKeys.findIndex((value, i) => {
            if (typeof value === 'string') {
                const iarr = value.split('-');
                return (k >= Number(iarr[0]) && k <= Number(iarr[1]));
            } else {
                return k === value;
            }
        });
        if (index > -1 && v) {
            temKeys.splice(index, 1);
        }
        if (index < 0 && v) {
            return false;
        }
    }

    if (temKeys.length > 0) {
        return false;
    }

    return true;
}

Utils.prototype.popper = function(element, number) {
    element.style.top = (-80 - (number * (number > 1 ? 28 : 40))) + 'px';
}

//View Model, 视图模型代码，负责响应式和视图更新
function ViewModel(options) {
    this._data = options.data;
    this._root = options.root;
    this._method = options.method;
    this.observer = new Observer(this);
    this.util = new Utils();
    this.vnode = null;
    this.local = options.local || {};
    this._inited = false;
    this._render = false;

    this._init();

    if (options.mounted) {
        for (let func of Object.keys(options.mounted)) {
            options.mounted[func].call(this);
        }
    }
}

ViewModel.prototype._init = function() {
    this._initData();
    this._initMethod();
    this.render().then(() => {
        this._inited = true;
    })
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
}

ViewModel.prototype._initMethod = function() {
    for (let funcName of Object.keys(this._method)) {
        this[funcName] = (...arg) => {
            this._method[funcName].call(this, ...arg);
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

    function walkNode(node, _vm, items) {
        if (node.nodeType === 3) {
            return
        }

        // 绑定data和事件
        const textObjectKey = node.hasAttribute('data-text-bind') ? node.getAttribute('data-text-bind') : null;
        const valueObjectKey = node.hasAttribute('data-value-bind') ? node.getAttribute('data-value-bind') : null;
        const classNameKey = node.hasAttribute('data-className-bind') ? node.getAttribute('data-className-bind') : null;
        const clickEvent = node.hasAttribute('data-event-click') ? node.getAttribute('data-event-click') : null;
        const inputEvent = node.hasAttribute('data-event-input') ? node.getAttribute('data-event-input') : null;
        const keyDownEvent = node.hasAttribute('data-event-keydown') ? node.getAttribute('data-event-keydown') : null;
        const keyUpEvent = node.hasAttribute('data-event-keyup') ? node.getAttribute('data-event-keyup') : null;

        // 解析指令
        const ifDirective = node.hasAttribute('directive-if') ? node.getAttribute('directive-if') : null;
        const forDirective = node.hasAttribute('directive-for') ? node.getAttribute('directive-for') : null;
        let textObjectValue, value, className;

        if (textObjectKey) {
            textObjectValue = _vm.util.getValue(_vm._data, textObjectKey);
            node.innerHTML = textObjectValue;
        }
        if (valueObjectKey) {
            value = _vm.util.getValue(_vm._data, valueObjectKey);
            node.value = value;

        }
        if (classNameKey) {
            className = _vm.util.getValue(_vm._data, classNameKey);
            node.className = className;
        }
        if (clickEvent && !_vm._inited) {
            node.addEventListener('click', function(event) {
                if (this[clickEvent]) {
                    this[clickEvent](event);
                }
            }.bind(_vm));
        }
        if (inputEvent && !_vm._inited) {
            node.addEventListener('input', function(event) {
                if (this[inputEvent]) {
                    this[inputEvent](event);
                }
            }.bind(_vm));
        }
        if (keyDownEvent && !_vm._inited) {
            node.addEventListener('keydown', function(event) {
                if (this[keyDownEvent]) {
                    this[keyDownEvent](event);
                }
            }.bind(_vm));
        }
        if (keyUpEvent && !_vm._inited) {
            node.addEventListener('keyup', function(event) {
                if (this[keyUpEvent]) {
                    this[keyUpEvent](event);
                }
            }.bind(_vm));
        }
        if (ifDirective) {
            const display = _vm.util.getValue(_vm._data, ifDirective);
            node.style.display = display ? '' : 'none';
        }
        if (forDirective) {
            //TODO compile for指令下的子节点，当前只处理直接子节点
            const arr = _vm.util.getValue(_vm._data, forDirective) || [];
            let child = Array.prototype.find.call(node.childNodes, n => n.nodeType !== 3);
            node.childTag = child ? child.tagName : node.childTag;

            while(node.hasChildNodes()) {
                node.removeChild(node.lastChild);
            }

            for (let i = 0; i < arr.length; i++) {
                const n = document.createElement(node.childTag);
                n.innerHTML = arr[i].value;
                n.className = arr[i].className;
                node.appendChild(n);
            }
            return;
        }
        if (node.childNodes.length > 0) {
            for (let n of node.childNodes) {
                walkNode(n, _vm);
            }
        }
    }

    this._vnode = vnode;
}

ViewModel.prototype.render = async function() {
    if (!this._render) {
        this._render = true;
        return new Promise(resolve => {
            setTimeout(function() {
                this._compile();
                document.getElementsByTagName('body')[0].appendChild(this._vnode);
                this._render = false;

                // TODO 由于没有给每个指令设置watcher，也没有组件系统，导致刷新时页面全部刷新textarea失焦
                const node = document.getElementsByClassName('chat-input')[0];
                node.focus();
                resolve();
            }.bind(this));
        })
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
