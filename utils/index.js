'use-strict';

module.exports.excludeNulls = (obj) => {
    let res = {};
    Object.entries(obj).forEach(([key, value]) => {
        if(obj[key]) res[key] = value;
    });
    return res;
}