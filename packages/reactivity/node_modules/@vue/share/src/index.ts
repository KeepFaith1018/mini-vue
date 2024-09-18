export function isObject(object:any){
    return Object.prototype.toString.call(object) === '[object Object]'
}
