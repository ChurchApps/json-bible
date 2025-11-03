import { Bible, Book, Chapter, Metadata, Verse } from "./Bible"
import { getDefault, getDefaultBooks, getDefaultMetadata } from "./defaults"
import { bibleFromFile, validateBible } from "./load"
import { parseMarkdown, stripMarkdown } from "./markdown"
import { getVerseReferences } from "./reference"
import { isNumber, stripText } from "./util"

// BIBLE //

export async function _getBible(bibleOrPath: Bible | string) {
    let bible: Bible
    if (typeof bibleOrPath === "string") bible = await bibleFromFile(bibleOrPath)
    else bible = bibleOrPath

    validateBible(bible)

    return bible
}

export function _getShortName(bible: Bible) {
    if (bible.abbreviation) return bible.abbreviation
    if (bible.metadata.identifier) return bible.metadata.identifier
    if (bible.name.length < 5) return bible.name.toUpperCase()

    return bible.name
        .trim()
        .split(" ")
        .filter((word) => isNaN(Number(word))) // filter out numbers
        .map((word) => word[0]) // get the first letter of each word
        .join("")
        .toUpperCase()
}

// MAIN //

export function getBookIndex(bible: Bible, numberOrName: string | number) {
    if (isNumber(numberOrName)) return bible.books.findIndex((a) => Number(a.number) === Number(numberOrName))
    return bible.books.findIndex((a) => a.name === numberOrName || a.id === numberOrName)
}

export function _getBook(bible: Bible, index: number) {
    return bible.books[index] || bible.books[0] || getDefault().book
}

export function getChapterIndex(book: Book, number: number) {
    return book.chapters.findIndex((a) => Number(a.number) === Number(number))
}

export function _getChapter(book: Book, index: number) {
    return book.chapters[index] || book.chapters[0] || getDefault().chapter
}

export function getVerseIndex(chapter: Chapter, number: number) {
    return chapter.verses.findIndex((a) => Number(a.number) === Number(number) || (a.endNumber && Number(number) > Number(a.number) && Number(number) <= Number(a.endNumber)))
}

export function _getVerse(chapter: Chapter, index: number) {
    return chapter.verses[index] || chapter.verses[0] || getDefault().verse
}

// BOOK //

export function getBookNumber(numberOrNameOrId: number | string, bible?: Bible, bookIndexFallback?: number) {
    if (isNumber(numberOrNameOrId)) return Number(numberOrNameOrId)

    if (bible?.books) {
        const bookIndex = bible.books.findIndex((a) => a.name === numberOrNameOrId || a.id === numberOrNameOrId)
        if (bookIndex > -1) return bookIndex + 1
    }

    const abbrIndex = Object.entries(getDefaultBooks().data).findIndex(([id, name]) => name === numberOrNameOrId || id === numberOrNameOrId)
    if (abbrIndex > -1) return abbrIndex + 1

    if (bookIndexFallback) return bookIndexFallback + 1
    return 0
}

export function getBookName(numberOrId: number | string, bible?: Bible) {
    let bibleName = bible?.books.find((a) => Number(a.number) === numberOrId || a.number === numberOrId || a.id === numberOrId)
    if (bibleName?.name) return bibleName.name

    if (isNumber(numberOrId)) return getDefaultBooks().byNumber(Number(numberOrId))
    return getDefaultBooks().byId(numberOrId.toString())
}

export function getBookAbbreviation(bible: Bible, bookIndex: number) {
    const currentBook = bible.books[bookIndex]
    if (!currentBook) return ""

    if (currentBook.abbreviation) return currentBook.abbreviation

    const abbr = currentBook.id || ""
    const name = currentBook.name
    const defaultBookName = (getDefaultBooks().data as any)[abbr]

    if (name === defaultBookName) return abbr[0] + abbr.slice(1).toLowerCase()

    const hasNumber = isNaN(parseInt(name[0]))
    let shortName = hasNumber ? name.slice(0, 3) : name.replace(/[^\w]/g, "").slice(0, 4)

    // use four characters if same short name ("Jud"ges="Jud"e)
    if (shortName.length === 3 && bible.books.some((a) => a.abbreviation === shortName)) {
        shortName = name.slice(0, 4)
    }

    currentBook.abbreviation = shortName
    return shortName
}

// CHAPTER //

export function _getCloseChapter(bible: Bible, currentBookNumberOrName: number | string, currentChapterNumber: number, next: boolean) {
    let bookIndex = getBookIndex(bible, currentBookNumberOrName)
    let book = _getBook(bible, bookIndex)
    let chapterIndex = getChapterIndex(book, Number(currentChapterNumber))
    let chapter = book.chapters[chapterIndex + (next ? 1 : -1)]

    if (!chapter) {
        book = _getBook(bible, bookIndex + (next ? 1 : -1))
        chapter = book.chapters[next ? 0 : book.chapters.length - 1]
    }
    if (!chapter) return null

    return getVerseReferences(bible, { book: book.number, chapter: chapter.number, verses: [] })[0]
}

// VERSE //

export function _getText(verse: Verse, includeNumber: boolean = false) {
    let text = stripMarkdown(stripText(verse.text))
    if (includeNumber) text = `${getVerseNumber(verse)} ${text.trim()}`
    return text
}

export function _getHTML(verse: Verse, includeNumber: boolean = false, bigNumber: boolean = false) {
    let html = parseMarkdown(verse.text || "")
    if (includeNumber) html = `<span class="number${bigNumber ? " big" : ""}">${getVerseNumber(verse)}</span> ${html.trim()}`
    return html
}

export function formatText(value: string, html: boolean = false) {
    value = stripText(value)
    if (html) value = parseMarkdown(value)
    return value
}

function getVerseNumber(verse: Verse) {
    let number = verse.number.toString()
    if (verse.endNumber) number += `-${verse.endNumber}`
    return number
}

export function _getRandomVerse(bible: Bible) {
    let bookIndex = randomNum(bible.books.length)
    const book = bible.books[bookIndex]
    let chapterIndex = randomNum(book.chapters.length)
    const chapter = book.chapters[chapterIndex]
    let verseIndex = randomNum(chapter.verses.length)
    const verse = chapter.verses[verseIndex]

    return getVerseReferences(bible, { book: book.number, chapter: chapter.number, verses: [verse.number] })[0]

    function randomNum(end: number) {
        return Math.floor(Math.random() * end)
    }
}

// METADATA //

export function _getMetadata(bible: Bible) {
    if (typeof bible.metadata !== "object") throw new Error("Missing metadata!")

    // trim metadata values
    let metadata: Metadata = {}
    Object.keys(bible.metadata).forEach((key) => {
        let value = trim(bible.metadata[key])
        if (value.length) metadata[key] = value
    })

    // add all default values
    const defaultMetadata = getDefaultMetadata()
    Object.keys(defaultMetadata).forEach((key) => {
        if (!metadata[key]) metadata[key] = defaultMetadata[key]
    })

    // add known values
    if (!metadata.title) metadata.title = bible.name
    if (!metadata.identifier) metadata.identifier = _getShortName(bible)

    return metadata

    function trim(value: string) {
        return stripText(value).trim()
    }
}
