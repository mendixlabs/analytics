export const debounce = (fn: Function, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
};

export const matchesArray = (array1: any[], array2: any[]) => {
    return array1.sort().join(",") === array2.sort().join(",");
};
