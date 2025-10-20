import { BIBLE_SIZE, getBookCategory, getDefault, getDefaultBooks, NT_SIZE, OT_SIZE } from "../defaults"
import { _getBook, _getChapter, _getCloseChapter, _getHTML, _getMetadata, _getShortName, _getText, _getVerse, formatText, getBookAbbreviation, getBookIndex, getChapterIndex, getVerseIndex } from "../get"
import { getReferenceString, getVerseReferences, VerseReference } from "../reference"
import { _bookSearch } from "../search"
import ApiBibleHelper from "./get"

///// API BIBLE (requests one part at a time) /////
// Works with the Bible.API format
// Any custom API URL uses a smaller, but similar format (see ApiBible.ts)
// Used by FreeShow Presentation Software through the ChurchApps ContentAPI

/**
 * API.Bible Bibles List
 * @param apiKey API key from https://api.bible
 * @param apiUrl custom api URL
 * @returns
 */
export function ApiBiblesList(apiKey: string, apiUrl?: string) {
    return ApiBibleHelper(apiKey, apiUrl).getBibles()
}

/**
 * API.Bible Helper
 * @param apiKey API key from https://api.bible
 * @param apiUrl custom api URL
 */
export async function ApiBible(apiKey: string, bibleKey: string, apiUrl?: string) {
    const apiData = await ApiBibleHelper(apiKey, apiUrl)
    const bibleData = await apiData.bible(bibleKey)
    const bible = bibleData.json

    return { data: bible, getBook, getAbbreviation, getMetadata, getBooksData, getDefaultBooks, getDefault, getOT, getNT, getFromReference, bookSearch, textSearch }

    /**
     * Get a specified book or the first one if not provided
     * @param number book number/name/id
     * @return book data
     */
    async function getBook(numberOrId?: string | number) {
        if (numberOrId === undefined) numberOrId = bible.books[0].number
        let bookIndex = getBookIndex(bible, numberOrId)
        const book = _getBook(bible, bookIndex)

        const bookId = bible.books[bookIndex]?.id || ""
        const chapters = await bibleData.getChapters(bookId)
        book.chapters = chapters.json

        return { data: book, index: bookIndex, number: book.number, name: book.name, getChapter, getAbbreviation: getNameShort, getCategory }

        /**
         * Get a specified chapter or the first one if no number provided
         * @param number chapter number
         * @return chapter data
         */
        async function getChapter(number?: number) {
            if (number === undefined) number = book.chapters[0].number
            let chapterIndex = getChapterIndex(book, number)
            const chapter = _getChapter(book, chapterIndex)

            const chapterId = `${bookId}.${number}`
            const verses = await bibleData.getVerses(chapterId)
            chapter.verses = verses.json

            return { data: chapter, index: chapterIndex, number, getVerse, getVerses, getNext, getPrevious, getReference }

            /**
             * Get a specified verse or the first one if no number provided
             * @param number verse number
             * @return verse data
             */
            function getVerse(number?: number) {
                if (number === undefined) number = chapter.verses[0].number
                let verseIndex = getVerseIndex(chapter, number)
                const verse = _getVerse(chapter, verseIndex)

                return { data: verse, index: verseIndex, number, getText, getHTML, getReference }

                /**
                 * A plain text string of the verse
                 * @param includeNumbers should verse numbers be included
                 * @return verse text
                 */
                function getText(includeNumber: boolean = false) {
                    return _getText(verse, includeNumber)
                }

                /**
                 * A HTML string of the verse with parsed markdown
                 * @param includeNumbers should verse numbers be included
                 * @return HTML string value
                 */
                function getHTML(includeNumber: boolean = false) {
                    return _getHTML(verse, includeNumber)
                }

                /**
                 * Get verse reference
                 * @param addBibleVersion add Bible abbreviation at the end of the reference
                 * @return reference string, e.g. "Genesis 1:1"
                 */
                function getReference(addBibleVersion: boolean = false) {
                    return _getReference([verse.number], addBibleVersion)
                }
            }

            /**
             * Get a selection of verses based in an array of numbers
             * @param verseNumbers verse numbers
             * @param html should markdown text be parsed to HTML
             * @return verses data
             */
            function getVerses(verseNumbers: number[] = [], html: boolean = false) {
                let verses = chapter.verses
                if (verseNumbers.length) verses = verses.filter((a) => verseNumbers.includes(a.number))

                const data = verses.reduce((obj, { number, text }) => ({ ...obj, [number]: formatText(text, html) }), {} as { [key: number]: string })
                const numbers = verseNumbers.length ? verseNumbers : verses.map((a) => a.number)

                return { data, numbers, getText, getHTML, getReference }

                /**
                 * A plain text string of the verses
                 * @param includeNumbers should verse numbers be included
                 * @return verse text
                 */
                function getText(includeNumbers: boolean = false) {
                    return verses.map((v) => _getText(v, includeNumbers)).join(" ")
                }

                /**
                 * A HTML string of the verses with parsed markdown
                 * @param includeNumbers should verse numbers be included
                 * @return HTML string value
                 */
                function getHTML(includeNumbers: boolean = false) {
                    return verses.map((v, i) => _getHTML(v, includeNumbers, i === 0)).join(" ")
                }

                /**
                 * Get verses reference
                 * @param addBibleVersion add Bible abbreviation at the end of the reference
                 * @return reference string, e.g. "Genesis 1:1-3"
                 */
                function getReference(addBibleVersion: boolean = false) {
                    return _getReference(numbers, addBibleVersion)
                }
            }

            /**
             * Get next chapter relative to the one currently selected
             * @return a reference to the next chapter, including possibly changed book - null if none available
             */
            function getNext() {
                return _getCloseChapter(bible, book.number, chapter.number, true)
            }

            /**
             * Get previous chapter relative to the one currently selected
             * @return a reference to the previous chapter, including possibly changed book - null if none available
             */
            function getPrevious() {
                return _getCloseChapter(bible, book.number, chapter.number, false)
            }

            /**
             * Get chapter reference
             * @param addBibleVersion add Bible abbreviation at the end of the reference
             * @return reference string, e.g. "Genesis 1"
             */
            function getReference(addBibleVersion: boolean = false) {
                return _getReference([], addBibleVersion)
            }

            // HELPER
            function _getReference(verses: number[], addBibleVersion: boolean = false) {
                return getReferenceString({ book: book.number, chapter: chapter.number, verses }, bible) + (addBibleVersion ? ` ${getAbbreviation()}` : "")
            }
        }

        /**
         * Get three letter book abbreviation/short name
         * @return e.g. "Genesis" = "Gen"
         */
        function getNameShort() {
            return getBookAbbreviation(bible, bookIndex)
        }

        /**
         * Get current book category name/color, all categories are:
         * "The Law", "History", "Poetry & Wisdom", "Prophets", "The Gospels & Acts", "Letters" & "Apocalyptic"
         * @return book category object
         */
        function getCategory() {
            return getBookCategory(book)
        }
    }

    /**
     * @return bible name abbreviation/identifier
     */
    function getAbbreviation() {
        return _getShortName(bible)
    }

    /**
     * @return trimmed metadata object
     */
    function getMetadata() {
        return _getMetadata(bible)
    }

    /**
     * Get books data with category info and calculated abbreviation
     * @return array with book data
     */
    function getBooksData() {
        return bible.books.map((book, bookIndex) => {
            const category = getBookCategory(book)
            return {
                id: book.id,
                name: book.name,
                number: book.number,
                abbreviation: getBookAbbreviation(bible, bookIndex),
                category
            }
        })
    }

    /**
     * Get all books in the Bible from the Old Testament
     * @return list of max 39 books
     */
    function getOT() {
        if (bible.books.length === OT_SIZE) return bible.books
        if (bible.books.length === BIBLE_SIZE) return bible.books.slice(0, OT_SIZE)
        return bible.books.filter((a) => a.number >= 1 && a.number <= OT_SIZE)
    }

    /**
     * Get all books in the Bible from the New Testament
     * @return list of max 27 books
     */
    function getNT() {
        if (bible.books.length === NT_SIZE) return bible.books
        if (bible.books.length === BIBLE_SIZE) return bible.books.slice(OT_SIZE)
        return bible.books.filter((a) => a.number > OT_SIZE && a.number <= BIBLE_SIZE)
    }

    /**
     * Get book/chapter/verses from a string reference
     * @param value e.g. "Genesis 1:1-3" / "GEN.1.2-3" / "1.1.1"
     * @return matching content
     */
    function getFromReference(value: string) {
        return getVerseReferences(bible, value)
    }

    /**
     * Search for book/chapter/verses with autocomplete
     * @param value e.g. "Genesis 1:1-3"
     * @return matching content
     */
    function bookSearch(value: string) {
        return _bookSearch(bible, value)
    }

    /**
     * Search for text content in the entire Bible
     * @param value search string
     * @param limit max results, lower number means quicker search
     * @param bookNumber search only in a specified book
     * @return an array of verses
     */
    async function textSearch(value: string, limit: number = 50) {
        const result = await bibleData.contentSearch(value, { limit })

        // convert result to VerseReference[]
        return result.map((r) => {
            const bookIndex = bible.books.findIndex((b) => b.id === r.bookId)
            const book = bookIndex >= 0 ? bookIndex + 1 : r.bookId
            const chapter = Number(r.id.split(".")[1])
            const verse = Number(r.id.split(".")[2])

            return {
                book,
                chapter,
                verse: { number: verse, text: r.text },
                reference: r.reference,
                id: `${r.bookId}.${chapter}.${verse}`
            } as VerseReference
        })
    }
}
