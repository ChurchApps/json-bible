// ELEMENTS //

const nameElem = document.querySelector("#name")

const bookSearch = document.querySelector("#bookSearch")
const textSearch = document.querySelector("#textSearch")
const searchResultsElem = document.querySelector(".searchResults")

const bibleElem = document.querySelector(".bible")
const booksElem = document.querySelector(".books")
const chaptersElem = document.querySelector(".chapters")
const versesElem = document.querySelector(".verses")
const headerElem = document.querySelector(".header")
const footerElem = document.querySelector(".footer")

const previousElem = document.querySelector("#previous")
const nextElem = document.querySelector("#next")

// HTML UPDATE //

function setHTML(parentElem, content, text, { type }, click, style) {
    parentElem.innerHTML = ""
    content.forEach((a) => {
        const id = a.number ?? a.id
        const elem = createElement(parentElem, text(a), { type, id })
        if (style) elem.style = style(a)

        elem.addEventListener("click", () => {
            click(id)
            setActive(parentElem, elem)
        })
    })
}

function createElement(parentElem, html, { type, id }) {
    const elem = document.createElement("div")

    if (type) elem.classList.add(type)
    if (id) elem.id = "_" + id
    elem.innerHTML = html

    parentElem.appendChild(elem)
    return elem
}

function setActive(parentElem, idOrElem) {
    parentElem.querySelector(".active")?.classList.remove("active")
    if (idOrElem === undefined) parentElem.children[0]?.classList.add("active")
    else if (typeof idOrElem === "number" || typeof idOrElem === "string") parentElem.querySelector("#_" + idOrElem)?.classList.add("active")
    else idOrElem?.classList.add("active")
}

function hideElem(elem, revealElem) {
    elem?.classList.add("hidden")
    revealElem?.classList.remove("hidden")
}

function getActiveId(parentElem) {
    return parentElem.querySelector(".active")?.id.slice(1)
}
