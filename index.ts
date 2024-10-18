import { Bible } from "./lib/Bible"
import { BIBLE_SIZE, getBookCategory, getDefault, getDefaultBooks, NT_SIZE, OT_SIZE } from "./lib/defaults"
import { _getBible, _getBook, _getChapter, _getCloseChapter, _getHTML, _getMetadata, _getRandomVerse, _getShortName, _getText, _getVerse, formatText, getBookIndex, getChapterIndex, getVerseIndex } from "./lib/get"
import { getReferenceString, getVerseReferences } from "./lib/reference"
import { _bookSearch, _textSearch } from "./lib/search"

/**
 * JSON Bible Helper
 * @param bibleOrPath path to Bible file or a Bible JSON object
 */
export default async function Bible(bibleOrPath: Bible | string) {
    const bible = await _getBible(bibleOrPath)

    return { data: bible, getBook, getAbbreviation, getMetadata, getDefaultBooks, getDefault, getOT, getNT, getRandom, getFromReference, bookSearch, textSearch }

    /**
     * Get a specified book or the first one if not provided
     * @param number book number/name/id
     * @return book data
     */
    function getBook(numberOrName?: string | number) {
        if (numberOrName === undefined) numberOrName = bible.books[0].number
        let bookIndex = getBookIndex(bible, numberOrName)
        const book = _getBook(bible, bookIndex)

        return { data: book, index: bookIndex, number: book.number, name: book.name, getChapter, getAbbreviation: getNameShort, getCategory }

        /**
         * Get a specified chapter or the first one if no number provided
         * @param number chapter number
         * @return chapter data
         */
        function getChapter(number?: number) {
            if (number === undefined) number = book.chapters[0].number
            let chapterIndex = getChapterIndex(book, number)
            const chapter = _getChapter(book, chapterIndex)

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
            const abbr = getDefaultBooks().ids[book.number - 1]
            return abbr[0] + abbr.slice(1).toLowerCase()
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
     * Get a random verse
     * @return random verse
     */
    function getRandom() {
        return _getRandomVerse(bible)
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
    function textSearch(value: string, limit: number = 500, bookNumber?: number) {
        return _textSearch(bible, value, limit, bookNumber)
    }
}
