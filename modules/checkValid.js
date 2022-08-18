const textInArray = (text, array)=> {
    if (!Array.isArray(array) || !text) {
        return false;
    }
    for (let i = 0; i < array.length; i++) {
        if (text == array[i]) {
            return true;
        }
    }
    return false;
}

module.exports = {textInArray};