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

        // remove books with numbers if no number at search start (John)
        // Uses the title portion only — strips any leading code prefix like "47-0412 · "
        // so that books named with a code + title pattern still match by title.
        // Preserves correct exclusion of "1 John", "2 Kings" etc. for standard Bibles.
        const hasNum = (str: string) => /\d/.test(str)
        if (!hasNum(name[0])) {
            matches = matches.filter((book) => {
                const titleForCheck = book.name.replace(/^\d{2}-\d{4}[A-Z]?\s*[\u00b7\u2022\-]\s*/u, '')
                return !hasNum(titleForCheck[0])
            })
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

let textSearchCache: { [key: string]: string } = {}
export function _textSearch(bible: Bible, searchValue: string, limit: number, bookNumber?: number) {
    searchValue = formatText(searchValue).trim()
    if (!searchValue.length) return []

    const cacheId = searchValue + limit + (bookNumber ?? "")
    if (textSearchCache[cacheId]) return JSON.parse(textSearchCache[cacheId]) as VerseReference[]

    const matches = bibleSearch().slice(0, limit)

    textSearchCache[cacheId] = JSON.stringify(matches)
    return matches

    /////

    function bibleSearch() {
        const searchWords = searchValue.split(" ")
        const books = bookNumber === undefined ? bible.books : [bible.books[getBookIndex(bible, bookNumber)]]

        let matches: VerseReference[] = []

        for (let book of books) {
            for (let chapter of book.chapters) {
                let verses: number[] = []

                for (let verse of chapter.verses) {
                    const verseValue = formatText(verse.text || "")

                    // check if the full verse, or one of the words contains the search value
                    if (verseValue.includes(searchValue) || searchWords.every((word) => verseValue.includes(word))) {
                        verses.push(verse.number)
                    }
                }

                if (verses.length) {
                    const reference = getVerseReferences(bible, { book: book.number, chapter: chapter.number, verses })
                    matches.push(...reference)

                    // return early if we have reached the limit
                    if (matches.length >= limit) return matches
                }
            }
        }

        return matches
    }
}

// HELPERS //

function formatText(text: string) {
    return (
        text
            // replace diacritic values like á -> a & ö -> o
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            // remove special characters
            .replace(/[`!*()\-?;:'",.]/gi, "")
            .toLowerCase()
    )
}
function removeSpaces(text: string) {
    return text.replace(/\s/g, "")
}
