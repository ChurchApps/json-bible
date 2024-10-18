export interface Bible {
    name: string // e.g. "King James Version"
    abbreviation?: string // e.g. "KJV"
    metadata: Metadata

    books: Book[]
}

export type Book = {
    number: number // starting from 1
    name: string // e.g. "Genesis"
    id?: string // e.g. "GEN"

    chapters: Chapter[]
}

export type Chapter = {
    number: number // starting from 1
    header?: string // e.g. "Book I" / "A Psalm by David"

    verses: Verse[]
}

export type Verse = {
    number: number // starting from 1
    endNumber?: number // if multiple verses are combined (end verse is different than start "number") enter value here

    text: string // verse text with markdown supported formatting!
}

export type Metadata = {
    title?: string // e.g. "King James Version"
    identifier?: string // e.g. "KJV"
    description?: string // e.g. "In 1604, King James I of England authorized that a new translation of the Bible into English be started. It was finished in 1611..."
    language?: string // e.g. "en"

    publisher?: string // e.g. "FREE BIBLE SOFTWARE GROUP"
    publishDate?: string // e.g. "2009-01-23"
    contributors?: string[]

    copyright?: string

    // custom keys allowed
    [key: string]: any
}
