import { Bible } from "./Bible"
import { getDefaultBooks } from "./defaults"
import { getBookIndex } from "./get"
import { getReferenceFromSearchString, getReferenceString, getVerseReferences, SearchReference, VerseReference } from "./reference"

// BOOK SEARCH //

let previousSearch: string = ""
export function _bookSearch(bible: Bible, searchValue: string) {
    const returnValue: SearchReference = { autocompleted: searchValue, book: 0, chapter: 0, verses: [], versesContent: [] }
    if (!searchValue.length) return finish()

    const { name, reference } = getReferenceFromSearchString(searchValue)
    if (!reference || !name) return finish()

    let books = findBooks(name)
    if (books.length !== 1) return finish()

    const book = books[0]
    returnValue.book = book.number

    // autocomplete book name
    // this will also "disallow" more text input after full book name
    if (!reference.chapter && previousSearch.length <= searchValue.length) {
        reference.book = book.number
        returnValue.autocompleted = getReferenceString(reference, bible) + " "
        searchValue = returnValue.autocompleted
    }

    const chapter = findChapter(reference.chapter)
    if (!chapter) return finish()
    returnValue.chapter = chapter.number

    const verses = findVerses(reference.verses)
    if (!verses.length) {
        // add divider (:) automatically if space at end
        if (searchValue.endsWith(" ") && !searchValue.trim().includes(":")) returnValue.autocompleted = returnValue.autocompleted.trim() + ":"
        else returnValue.autocompleted = returnValue.autocompleted.trim()

        return finish()
    }
    returnValue.verses = verses.map(({ number }) => number)
    returnValue.versesContent = verses

    // add divider (+/-) automatically if space at end
    if (searchValue.endsWith(" ") && !searchValue.trim().endsWith("-") && !searchValue.trim().endsWith("+")) {
        const minus = (searchValue.match(/-/g) || []).length
        const plus = (searchValue.match(/\+/g) || []).length
        returnValue.autocompleted = returnValue.autocompleted.trim() + (minus === plus ? "-" : "+")
    } else {
        returnValue.autocompleted = returnValue.autocompleted.trim()
    }

    return finish()

    /////

    function finish() {
        previousSearch = searchValue
        return returnValue
    }

    function findBooks(name: string) {
        name = removeSpaces(formatText(name))

        let matches = []
        for (let book of bible.books) {
            const bookName = removeSpaces(formatText(book.name))
            if (bookName === name) return [book]
            if (bookName.includes(name)) matches.push(book)
        }

        // remove any books that starts with the full name of another book (e.g. Johannes vs Johannes' Åpenbaring)
        if (matches.length > 1) {
            const shortestMatchName = matches.reduce((shortest, book) => (book.name.length < shortest.length ? book.name : shortest), matches[0].name)
            matches = matches.filter((a) => a.name === shortestMatchName || !a.name.startsWith(shortestMatchName))
        }

        const booksStartingWithSearch = bible.books.filter((a) => removeSpaces(formatText(a.name)).startsWith(name))

        // find any abbreviation matches
        if (booksStartingWithSearch.length < 2) {
            for (let book of bible.books) {
                if (book.abbreviation?.toLowerCase() === name) return [book]
                // only match by index if books count are 66
                if (bible.books.length === 66) {
                    let abbr = getDefaultBooks().ids[book.number - 1] || ""
                    if (abbr.toLowerCase() === name) return [book]
                }
            }
        }

        // remove books with numbers if no number at search start (John) - when there are matches
        const hasNum = (str: string) => /\d/.test(str)
        if (!hasNum(name[0]) && name.length > 1) {
            const noNumberMatches = matches.filter((book) => !hasNum(book.name))
            if (noNumberMatches.length) matches = noNumberMatches
        }

        return matches
    }

    function findChapter(number: number) {
        return book.chapters.find((a) => Number(a.number) === number)
    }

    function findVerses(verses: number[]) {
        return chapter?.verses.filter((a) => verses.includes(Number(a.number))) || []
    }
}

// TEXT SEARCH //

const formattedTextCache = new Map<string, string>()
function getFormattedVerse(text: string) {
    const cached = formattedTextCache.get(text)
    if (cached !== undefined) return cached

    const formatted = formatText(text)
    formattedTextCache.set(text, formatted)

    return formatted
}

const textSearchCache = new Map<string, VerseReference[]>()
export function _textSearch(bible: Bible, searchValue: string, limit: number, bookNumber?: number) {
    searchValue = formatText(searchValue).trim()
    if (!searchValue) return []

    // cache results for identical searches
    const cacheId = `${bible.name}|${searchValue}|${limit}|${bookNumber ?? ""}`
    const cached = textSearchCache.get(cacheId)
    if (cached) return cached

    // split into individual words so we can match verses containing all words even if the exact phrase is absent
    const searchWords = searchValue.split(/\s+/)

    // search in a specific book or all books
    const books = bookNumber === undefined ? bible.books : [bible.books[getBookIndex(bible, bookNumber)]]

    const matches: VerseReference[] = []
    for (const book of books) {
        for (const chapter of book.chapters) {
            const verses: number[] = []

            for (const verse of chapter.verses) {
                const verseValue = getFormattedVerse(verse.text ?? "")

                // check if the full phrase exists in the verse
                let isMatch = verseValue.includes(searchValue)

                // or check whether every search word exists somewhere in the verse
                if (!isMatch) {
                    isMatch = true

                    for (const word of searchWords) {
                        if (!verseValue.includes(word)) {
                            isMatch = false
                            break
                        }
                    }
                }

                if (isMatch) verses.push(verse.number)
            }

            if (verses.length) {
                const reference = getVerseReferences(bible, { book: book.number, chapter: chapter.number, verses })
                matches.push(...reference)

                // return early once we have enough results
                if (matches.length >= limit) {
                    const result = matches.slice(0, limit)
                    textSearchCache.set(cacheId, result)
                    return result
                }
            }
        }
    }

    textSearchCache.set(cacheId, matches)
    return matches
}

// HELPERS //

function formatText(text: string) {
    return (
        text
            // replace diacritic values like á -> a & ö -> o
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            // remove special characters
            .replace(/[`!*()\-?;:'",.\p{Pd}]/gu, "")
            .toLowerCase()
    )
}
function removeSpaces(text: string) {
    return text.replace(/\s/g, "")
}
