function Utils() {}

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

const m = new Map();
m.set(1, false);
m.set(17, true);
m.set(48, true);

console.log(Utils.prototype.isOnlyGivenItemTruthy(m, [17, '49-50']));