function filterNav(nav,nodes){
    return nav.filter((item) => nodes.includes(item.name)).map((item) => {return {
        ...item, 
        children:item.children? filterNav(item.children,nodes) : []
    }})
}

module.exports = filterNav