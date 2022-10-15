const vm = new ViewModel({
    root: 'root',
    data: () => {
        return {
            wordList: [],
            wordIndex: 1,
            currentSelect: 0,
            showWordCreate: false,
            showWordList: false,
            createWordValue: '',
            chatInputValue: ''
        }
    },
    local: {
        wordCache: '',
        keyDownTimer: null,
        keyDownTime: null,
        ctrlDown: false,
        chatInputValueCache: '',
        moveWordTimer: null,
        keyMap: null
    },
    mounted: {
        initKeyMap: function() {
            this.local.keyMap = new Map();
        }
    },
    method: {
        createWordInput: function(event) {
            const value = event.target.value;
            this.local.wordCache = value;
        },
        createWord: function(event) {
            if (event.keyCode === 13 && this.wordIndex <= 5) {
                this.wordList[this.wordIndex - 1] = {
                    value: this.wordIndex + ': ' + this.local.wordCache,
                    className: this.wordIndex !== 1 ? 'list-item ' : 'list-item list-item-selected'
                };
                this.wordList = [...this.wordList];
                this.wordIndex++;
                this.createWordValue = '';
            }
        },
        chatInput: function(event) {
            this.chatInputValue = event.target.value;
        },
        bindKeybordEvent: function(event) {
            console.log(event);
        },
        toggleWordCreate: function() {
            this.showWordCreate = this.showWordCreate ? false : true;
        },
        chatInputKeyDown: function(event) {
            // 保存每个按下按钮
            this.local.keyMap.set(event.keyCode, true);

            //长按ctrl展示列表
            if (this.util.isOnlyGivenItemTruthy(this.local.keyMap, [17])) {
                this.showWordCreate = false;
                this.keyDownTime = Date.now();
                this.keyDownTimer = setTimeout(() => {
                    this.showWordList = true;
                    //每当word增加后，对应的弹窗位置需要动态调整
                    setTimeout(() => {
                        const list = document.getElementsByClassName('common-words-list')[0];
                        this.util.popper(list, this.wordList.length);
                    });
                }, 500);
            }
            //同时按下ctrl + number直接输入框中输入热键
            if (this.util.isOnlyGivenItemTruthy(this.local.keyMap, [17, '49-57'])) {
                const index = event.keyCode - 49;
                this.chatInputValue = event.target.value;
                // TODO 实现view->model的绑定，暂时在这里去除value中的序号
                const value = this.wordList[index].value;
                try {
                    this.chatInputValue = this.chatInputValue + value.split(':')[1].trim();
                } catch(e) {
                    console.log(e);
                }
            }
            // 调出面板后可以通过上下选择常用词
            if (this.showWordList && (this.util.isOnlyGivenItemTruthy(this.local.keyMap, [38]) 
            || this.util.isOnlyGivenItemTruthy(this.local.keyMap, [40]))) {
                this.moveWordItem(event.keyCode);
            }
        },
        chatInputKeyUp: function(event) {
            // 取消按钮
            this.local.keyMap.set(event.keyCode, false);

            if (event.keyCode === 17) {
                if (Date.now() - this.keyDownTime < 500) {
                    clearTimeout(this.keyDownTimer);
                }
                this.ctrlDown = false;
            }
            if (this.showWordList && (event.keyCode === 38 || event.keyCode === 40)) {
                if (this.moveWordTimer) {
                    clearTimeout(this.moveWordTimer);
                }
            }
            if (event.keyCode === 13 && this.showWordList) {
                const t = this.chatInputValue.substr(0, this.chatInputValue.length - 1);
                const value = this.wordList[this.currentSelect].value.split(':')[1].trim();
                this.chatInputValue = (t + value).trim();
                this.showWordList = false;
            }
        },
        moveWordItem: function(keyCode) {
            if (keyCode === 38) {
                if (this.currentSelect > 0) {
                    this.currentSelect = this.currentSelect - 1;
                } else {
                    this.currentSelect = this.wordList.length - 1;
                }
            } else {
                if (this.currentSelect === this.wordList.length - 1) {
                    this.currentSelect = 0;
                } else {
                    this.currentSelect = this.currentSelect + 1;
                }
            }

            this.wordList.map(v => {
                v.className = 'list-item';
                return v;
            })
            this.wordList[this.currentSelect].className = 'list-item list-item-selected';
            this.wordList = [...this.wordList];
            // TODO debounce
            this.moveWordTimer = setTimeout(() => {
                this.moveWordItem(keyCode);
            }, 1000);
        }
    }
});