function observe(obj){
    
    for(const key in obj){
        let internalValue = obj[key]  
        const funcs = []
        Object.defineProperty(obj,key,{
            get(){

                // 依赖收集
                if(window.__func){
                funcs.push(window.__func)
                console.log("get方法正在被调用" + internalValue)
                }
                return internalValue
            },
            set(val){
                internalValue = val  //接受新值 在下次触发get方法时返回新值
                // 派发更新
                for(let i = 0; i< funcs.length; i++){
                    funcs[i]()
                }
                console.log("派发更新队列",funcs)
                console.log("set方法正在被调用" + val)
            }
        })
    }
}