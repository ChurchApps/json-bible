import { Bible, Book, Chapter, Metadata, Verse } from "./Bible"
import { clone } from "./util"

export const BIBLE_SIZE = 66
export const OT_SIZE = 39
export const NT_SIZE = 27

export function getDefault() {
    const bible: Bible = { name: "", metadata: {}, books: [] }
    const book: Book = { number: 0, name: "", chapters: [] }
    const chapter: Chapter = { number: 0, verses: [] }
    const verse: Verse = { number: 0, text: "" }

    return { bible, book, chapter, verse }
}

export function getDefaultMetadata() {
    const metadata: Metadata = {
        title: "",
        identifier: "",
        description: "",
        language: "",
        publisher: "",
        contributors: [],
        date: 0,
        copyright: ""
    }

    return metadata
}

// BOOKS

const BOOKS = {
    GEN: "Genesis",
    EXO: "Exodus",
    LEV: "Leviticus",
    NUM: "Numbers",
    DEU: "Deuteronomy",
    JOS: "Joshua",
    JDG: "Judges",
    RUT: "Ruth",
    "1SA": "1 Samuel",
    "2SA": "2 Samuel",
    "1KI": "1 Kings",
    "2KI": "2 Kings",
    "1CH": "1 Chronicles",
    "2CH": "2 Chronicles",
    EZR: "Ezra",
    NEH: "Nehemiah",
    EST: "Esther",
    JOB: "Job",
    PSA: "Psalms",
    PRO: "Proverbs",
    ECC: "Ecclesiastes",
    SNG: "Song of Solomon",
    ISA: "Isaiah",
    JER: "Jeremiah",
    LAM: "Lamentations",
    EZE: "Ezekiel",
    DAN: "Daniel",
    HOS: "Hosea",
    JOE: "Joel",
    AMO: "Amos",
    OBA: "Obadiah",
    JON: "Jonah",
    MIC: "Micah",
    NAH: "Nahum",
    HAB: "Habakkuk",
    ZEP: "Zephaniah",
    HAG: "Haggai",
    ZEC: "Zechariah",
    MAL: "Malachi",

    MAT: "Matthew",
    MRK: "Mark",
    LUK: "Luke",
    JHN: "John",
    ACT: "Acts",
    ROM: "Romans",
    "1CO": "1 Corinthians",
    "2CO": "2 Corinthians",
    GAL: "Galatians",
    EPH: "Ephesians",
    PHP: "Philippians",
    COL: "Colossians",
    "1TH": "1 Thessalonians",
    "2TH": "2 Thessalonians",
    "1TI": "1 Timothy",
    "2TI": "2 Timothy",
    TIT: "Titus",
    PHM: "Philemon",
    HEB: "Hebrews",
    JAS: "James",
    "1PE": "1 Peter",
    "2PE": "2 Peter",
    "1JN": "1 John",
    "2JN": "2 John",
    "3JN": "3 John",
    JUD: "Jude",
    REV: "Revelation"
}
type BookId = keyof typeof BOOKS

const categories = [
    { id: "law", start: "GEN", name: "The Law", color: "#e84242" },
    { id: "history", start: "JOS", name: "History", color: "#e89d42" },
    { id: "poetry", start: "JOB", name: "Poetry & Wisdom", color: "#b542e8" }, // #e8de42
    { id: "prophets", start: "ISA", name: "Prophets", color: "#42e84d" },
    { id: "gospels", start: "MAT", name: "The Gospels & Acts", color: "#42c4e8" },
    { id: "letters", start: "ROM", name: "Letters", color: "#e8de42" }, // #b542e8
    { id: "prophecy", start: "REV", name: "Apocalyptic", color: "#e842e5" }
]

export function getDefaultBooks() {
    const ids = Object.keys(BOOKS) as BookId[]
    const names = Object.values(BOOKS)

    return { data: clone(BOOKS), ids, names, byId, byNumber }

    function byId(id: string) {
        return BOOKS[id as BookId] || ""
    }

    function byNumber(number: number) {
        return names[number - 1] || ""
    }
}

export function getBookCategory(book: Book) {
    return categories.find((a, i) => {
        const startNumber = Object.keys(BOOKS).indexOf(a.start) + 1
        const endNumber = Object.keys(BOOKS).indexOf(categories[i + 1]?.start) + 1 || startNumber + 1
        return book.number >= startNumber && book.number < endNumber
    })
}
