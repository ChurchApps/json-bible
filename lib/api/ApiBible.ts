// BIBLES

// Bible.API format
export interface BibleListContent {
    id: string
    dblId: string // id without "-01"
    relatedDbl: string | null
    name: string
    nameLocal: string // usually same as name
    abbreviation: string
    abbreviationLocal: string // usually same as abbreviation
    description: string
    descriptionLocal: string // usually same as description
    language: {
        id: string // e.g., "eng"
        name: string // English name
        nameLocal: string // native name
        script: string // e.g., Latin
        scriptDirection: string // e.g., LTR
    }
    countries: { id: string; name: string; nameLocal: string }[]
    type: string // "text" or "audio"
    updatedAt: string // ISO date string
    audioBibles: any[]
}

// contentapi.churchapps.org/bibles format
export interface CustomBibleListContent {
    id: string // custom id
    abbreviation: string
    name: string
    nameLocal: string
    description: string
    source: string // "api.bible"
    sourceKey: string // api.bible id
    language: string // language.id
    copyright: string // custom deals with copyright info
    attributionRequired: boolean // custom deal that needs to show attribution string
    attributionString: string // custom attribution string
    countryList: string[] // countries.id (lowercase)
}

// BOOK

export interface BibleBookContent {
    id: string
    bibleId: string
    abbreviation: string
    name: string
    nameLong: string
}

// contentapi.churchapps.org format
export interface CustomBibleBookContent {
    id: string // custom id
    translationKey: string // bibleId
    keyName: string // id
    abbreviation: string
    name: string
    sort: number // book index
}

// CHAPTER

export interface BibleChapterContent {
    id: string // e.g., GEN.1
    bibleId: string
    bookId: string // e.g., GEN
    number: string // can be "intro"
    reference: string
}

// contentapi.churchapps.org format
export interface CustomChapterContent {
    id: string // custom id
    translationKey: string // bibleId
    bookKey: string // bookId
    keyName: string // id
    number: number // chapter number
}

// VERSE

export interface BibleVerseListContent {
    id: string // e.g., GEN.1.1
    orgId: string
    bookId: string // e.g., GEN
    chapterId: string // e.g., GEN.1
    bibleId: string
    reference: string
}

// contentapi.churchapps.org format
export interface CustomVerseListContent {
    id: string // custom id
    translationKey: string // bibleId
    chapterKey: string // chapterId
    keyName: string // id
    number: number // verse number
}

export interface BibleVerseContent {
    id: string // e.g., GEN.1.1
    orgId: string
    bookId: string // e.g., GEN
    chapterId: string // e.g., GEN.1
    bibleId: string
    reference: string
    content: string // HTML content
    verseCount: number
    copyright: string
    next: { id: string; number: string } | null
    previous: { id: string; number: string } | null
}

// contentapi.churchapps.org format
export interface CustomVerseContent {
    id: string // custom id
    translationKey: string // bibleId
    verseKey: string // id
    bookKey: string // bookId
    chapterNumber: number // chapter number
    verseNumber: number // verse number
    content: string // plain text content
    newParagraph: boolean // if new paragraph starts here
}

// SEARCH

export interface BibleContentSearchResult {
    query: string
    limit: number
    offset: number
    total: number
    verseCount: number
    verses: BibleVerseSearchContent[]
}

export interface BibleVerseSearchContent {
    id: string // e.g., GEN.1.1
    orgId: string // usually same as id
    bookId: string // e.g., GEN
    bibleId: string // api bible id
    chapterId: string // e.g., GEN.1
    reference: string // e.g., Genesis 1:1
    text: string // plain text content
}
