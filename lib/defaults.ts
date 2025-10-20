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
    // GT
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
    EZK: "Ezekiel",
    DAN: "Daniel",
    HOS: "Hosea",
    JOL: "Joel",
    AMO: "Amos",
    OBA: "Obadiah",
    JON: "Jonah",
    MIC: "Micah",
    NAM: "Nahum",
    HAB: "Habakkuk",
    ZEP: "Zephaniah",
    HAG: "Haggai",
    ZEC: "Zechariah",
    MAL: "Malachi",

    // NT
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
    REV: "Revelation",

    // APOCRYPHA
    TOB: "Tobit",
    JDT: "Judith",
    ESG: "Esther (Greek)",
    WIS: "Wisdom",
    SIR: "Sirach",
    BAR: "Baruch",
    LJE: "Letter of Jeremiah",
    "1MA": "1 Maccabees",
    "2MA": "2 Maccabees"
}
type BookId = keyof typeof BOOKS

const categories = [
    { id: "law", start: "GEN", name: "The Law", color: "#e84242" },
    { id: "history", start: "JOS", name: "History", color: "#e89d42" },
    { id: "poetry", start: "JOB", name: "Poetry & Wisdom", color: "#b542e8" }, // #e8de42
    { id: "prophets", start: "ISA", name: "Prophets", color: "#42e84d" },
    { id: "gospels", start: "MAT", name: "The Gospels & Acts", color: "#42c4e8" },
    { id: "letters", start: "ROM", name: "Letters", color: "#e8de42" }, // #b542e8
    { id: "prophecy", start: "REV", name: "Apocalyptic", color: "#e842e5" },
    { id: "apocrypha", start: "TOB", name: "Apocrypha", color: "#8269fa" }
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
    const bookId = book.id
    const bookNumber = book.number

    const defaults = getDefaultBooks()

    let currentIndex = defaults.ids.indexOf(bookId as any)
    if (bookId?.length === 3 && currentIndex < 0) return null

    if (currentIndex < 0) currentIndex = bookNumber - 1
    if (currentIndex > defaults.names.length - 1) return null

    // find category based on current index
    let categoryIndex = 0
    for (let i = 0; i < categories.length; i++) {
        const startIndex = defaults.ids.indexOf(categories[i].start as any)
        if (currentIndex >= startIndex) categoryIndex = i
    }

    return categories[categoryIndex]
}
