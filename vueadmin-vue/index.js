let user = {
    name:'czl',
    age:'18'
}
observe(user)

function showName(){
    const NameSpan = document.getElementsByClassName("name")
    NameSpan[0].innerHTML = user.name
}

function showAge(){
    const AgeSpan = document.getElementsByClassName("age")
    AgeSpan[0].innerHTML = user.age
}

window.__func = showName
showName()
window.__func = null

window.__func = showAge
showAge()
window.__func = null