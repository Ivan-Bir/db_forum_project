export const validate = (column) => {
    return {
        name: column,
        skip: function() { return !this[column] }
    };
};

export const isId = (value) => {
    if (/^\d+$/.test(value)) {
        return true;
    }

    return false;
};
