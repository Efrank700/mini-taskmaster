export function uniqueInsert<T>(target: T, array: T[]): void{
    const position = array.findIndex((targetItem) => {return targetItem === target});
    if(position === -1) {
        array.push(target);
    }

}