// 需要改造
function filterNav(nav,nodes){
    const result = []
    
    for(const node of nav){
        if(nodes.includes(node.name)){
            // 遍历子节点
            const filteredChildren = node.children && node.children.length > 0 ? filterNav(node.children,nodes) : []
            if(filteredChildren.length > 0){
                result.push({...node, children:filteredChildren})
            }else{
                result.push(node)
            }
        }else{
            // 当前节点不含但是子节点中有符合条件的
            const filteredChildren = node.children && node.children.length > 0 ? filterNav(node.children,nodes) : []
            if(filteredChildren.length > 0){
                result.push({...node, children:filteredChildren})
            }
        }
    }
    return result
    // return nav.filter((item) => nodes.includes(item.name)).map((item) => {return {
    //     ...item, 
    //     children:item.children? filterNav(item.children,nodes) : []
    // }})
}


module.exports = filterNav