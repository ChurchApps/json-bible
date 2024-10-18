import { Bible, Verse } from "./Bible"
import { getBookName, getBookNumber } from "./get"

// TYPES //

type Reference = {
    book: number // 1
    chapter: number // 1
    verses: number[] // 1, 2, 3
}

type UniversalReference = {
    book: number | string // 1 / "GEN" / "Genesis"
    chapter: number // 1
    verse?: number // 1
    verses?: number[] | string // [1, 2, 3] / "1-3"
}

export type VerseReference = {
    book: number // 1
    chapter: number // 1
    verse: Verse // { number: 1, text: "" }
    reference: string // "Genesis 1:1"
    id: string // "1.1.1"
}

export interface SearchReference extends Reference {
    autocompleted: string // "Genesis ..."
    versesContent: Verse[] // [{ text: "", ... }]
}

// MAIN //

// OUTPUT: "1" | "1.1" | "1.1.1"
export function getReferenceId(ref: UniversalReference | Reference) {
    return referenceBuilder(ref as UniversalReference, [".", "."])
}

// OUTPUT: "Genesis" | "Genesis 1" | "Genesis 1:1"
export function getReferenceString(ref: UniversalReference | Reference, bible?: Bible) {
    return referenceBuilder(ref as UniversalReference, [" ", ":"], { bookName: true, bible })
}

export function getVerseReferences(bible: Bible, ref: Reference | string) {
    if (!ref) return []
    if (typeof ref === "string") ref = getReference(ref)
    let verses = getVersesFromReference(bible, ref)
    if (!verses.length) verses.push({ number: 0, text: "" })

    let verseReferences: VerseReference[] = verses.map((a) => ({
        book: ref.book,
        chapter: ref.chapter,
        verse: a,
        reference: getReferenceString({ ...ref, verse: a.number }, bible),
        id: getReferenceId({ ...ref, verse: a.number })
    }))

    return verseReferences
}

// search input
export function getReferenceFromSearchString(searchRef: string, bible?: Bible) {
    let { book, chapter, verses } = splitReferenceString(searchRef)

    const reference: Reference = {
        book: getBookNumber(book, bible),
        chapter: Number(chapter || 0),
        verses: verses ? extractVerseReference(verses) : []
    }

    return { name: book.trim(), reference }
}

// GETTERS //

function getReference(referenceString: string) {
    const referenceId = referenceStringToId(referenceString)
    const split = referenceId.split(".")
    const ref: Reference = { book: Number(split[0]), chapter: Number(split[1]), verses: extractVerseReference(split[2] || "") }
    return ref
}

function referenceBuilder(ref: UniversalReference, [chapterSeperator, verseSeperator]: string[], options: { bookName?: boolean; bible?: Bible } = {}) {
    const { book, chapter, verses } = parseUniversalReference(ref)

    let reference = ""
    if (!book) return reference

    reference += `${options.bookName ? getBookName(book, options.bible) : book}`
    if (!chapter) return reference

    reference += `${chapterSeperator}${chapter}`
    if (!verses.length) return reference

    reference += `${verseSeperator}${getVerseReference(verses)}`
    return reference
}

function parseUniversalReference(ref: UniversalReference) {
    const book = getBookNumber(ref.book)
    const chapter = ref.chapter
    const verses = ref.verse ? [ref.verse] : getVerses(ref.verses || [])
    return { book, chapter, verses } as Reference

    function getVerses(verses: number[] | string) {
        if (Array.isArray(verses)) return verses
        return extractVerseReference(verses)
    }
}

// Genesis 1:1-3 / GEN 1:1-3 / GEN.1.1-3 = 1.1.1-3
function referenceStringToId(ref: string) {
    const regex = /^(?:[A-Z]+|[0-9]+)(?:\.[0-9]+)?(?:\.[0-9+-]+)?$/
    const isId = ref.match(regex) !== null
    if (isId) return parseReferenceId(ref)

    let { book, chapter, verses } = splitReferenceString(ref)
    return `${getBookNumber(book)}.${chapter}.${verses}`

    function parseReferenceId(ref: string) {
        const split = ref.split(".")
        split[0] = getBookNumber(split[0]).toString()
        return split.join(".")
    }
}

// "Genesis 1:1-3" = { book: "Genesis ", chapter: 1, verses: [1, 2, 3] }
function splitReferenceString(ref: string) {
    // (:,.) allowed between chapter/verse - (-+) allowed between verses
    const regex = /(?<book>[1-3]?\s?[A-Za-z]+)(?:\s(?<chapter>\d+))?(?:[:,.](?<verses>[0-9,.\-+]+))?/
    const match = ref.match(regex)

    if (!match) return { book: "", chapter: "", verses: "" }
    const groups = match.groups || {}

    const book = groups.book?.trim() || ""
    const chapter = groups.chapter || ""
    const verses = groups.verses || ""

    return { book, chapter, verses }
}

// VERSE REFERENCE //

// [1, 2, 3] = "1-3" / [4, 2, 7, 1, 9, 10] = "1-2+4+7+9-10"
function getVerseReference(verses: number[]) {
    // sort in ascending order
    verses.sort((a, b) => a - b)

    let verseRef = ""
    let i = 0

    while (i < verses.length) {
        // get consecutive verses
        let start = verses[i]
        while (i < verses.length - 1 && verses[i] + 1 === verses[i + 1]) i++
        let end = verses[i]

        // if start and end are the same add the number, if not add the range
        verseRef += start === end ? `${start}` : `${start}-${end}`

        i++

        // add a '+' if there are more verses
        if (i < verses.length) verseRef += "+"
    }

    return verseRef
}

// "1-3+5" = [1, 2, 3, 5]
function extractVerseReference(verseRef: string) {
    const result: number[] = []

    verseRef.split("+").forEach((part) => {
        if (part.includes("-")) {
            let [start, end] = part.split("-").filter(Boolean).map(Number)

            // ending in + or -
            if (isNaN(end)) result.push(start)
            else {
                // swap inverted numbers
                if (start > end) [start, end] = [end, start]

                for (let i = start; i <= end; i++) {
                    result.push(i)
                }
            }
        } else if (part) {
            result.push(Number(part))
        }
    })

    return result
}

function getVersesFromReference(bible: Bible, ref: Reference | string) {
    if (typeof ref === "string") ref = getReference(ref)

    const bookIndex = bible.books.findIndex((a) => a.number === ref.book)
    const chapterIndex = bible.books[bookIndex]?.chapters.findIndex((a) => a.number === ref.chapter)
    const verses = (bible.books[bookIndex]?.chapters[chapterIndex]?.verses || []).filter((a) => ref.verses.includes(a.number))

    return verses
}
