

// ECMA forEach

Array.prototype.myforEach = function(callback, thisArg){
    //获取调用这个方法的数组本身
    let O = this
    let len = O.length
    for(let k = 0; k< len; k++){
        // ECMA规范 检查
        if(k in O){
            console.log(`${k} is in O`)
        }
    }
}


let a = [1,2,3]

a.myforEach(()=>{console.log("1")})