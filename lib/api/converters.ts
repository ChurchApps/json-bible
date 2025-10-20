import type { Verse } from "../Bible"
import type { BibleBookContent, BibleChapterContent, BibleListContent, BibleVerseContent, BibleVerseListContent, CustomBibleBookContent, CustomBibleListContent, CustomChapterContent, CustomVerseContent, CustomVerseListContent } from "./ApiBible"

export function getCustomBibleListContent(data: (BibleListContent | CustomBibleListContent)[]): CustomBibleListContent[] {
    if (!data?.length) return []
    if ((data[0] as CustomBibleListContent).sourceKey) return data as CustomBibleListContent[]

    return (data as BibleListContent[]).map((item) => {
        return {
            id: item.id,
            abbreviation: item.abbreviation,
            name: item.name,
            nameLocal: item.nameLocal,
            description: item.description,
            source: "api.bible",
            sourceKey: item.id,
            language: item.language.id,
            copyright: "",
            attributionRequired: false,
            attributionString: "",
            countryList: item.countries.map((country) => country.id.toLowerCase())
        } as CustomBibleListContent
    })
}

export function getCustomBookContent(data: (BibleBookContent | CustomBibleBookContent)[]): CustomBibleBookContent[] {
    if (!data?.length) return []
    if ((data[0] as CustomBibleBookContent).keyName) return data as CustomBibleBookContent[]

    return (data as BibleBookContent[]).map((book, i) => {
        return {
            id: book.id,
            translationKey: book.bibleId,
            keyName: book.id,
            abbreviation: book.abbreviation,
            name: book.name,
            sort: i
        } as CustomBibleBookContent
    })
}

export function getCustomChapterContent(data: (BibleChapterContent | CustomChapterContent)[]): CustomChapterContent[] {
    if (!data?.length) return []
    if ((data[0] as CustomChapterContent).keyName) return data as CustomChapterContent[]

    return (data as BibleChapterContent[]).map((chapter) => {
        return {
            id: chapter.id,
            translationKey: chapter.bibleId,
            bookKey: chapter.bookId,
            keyName: chapter.id,
            number: parseInt(chapter.number)
        } as CustomChapterContent
    })
}

export function getCustomVerseContent(data: (BibleVerseListContent | CustomVerseListContent)[]): CustomVerseListContent[] {
    if (!data?.length) return []
    if ((data as CustomVerseListContent[])[0]?.keyName) return data as CustomVerseListContent[]

    return (data as BibleVerseListContent[]).map((verse) => {
        return {
            keyName: verse.id,
            number: parseInt(verse.id.split(".")[2]),
            id: verse.id,
            translationKey: verse.bibleId,
            chapterKey: verse.chapterId
        } as CustomVerseListContent
    })
}

export function convertVerseTextToJson(verses: BibleVerseContent | CustomVerseContent[]) {
    // custom data format
    if (Array.isArray(verses)) {
        return verses.map((verse) => {
            const verseNumber = verse.verseNumber
            const plainText = verse.content || ""
            return { number: verseNumber, text: plainText } as Verse
        })
    }

    // Parse HTML content to extract verses with their numbers
    const text = verses.content || ""
    const verseRegex = /<span data-number="(\d+)"[^>]*class="v"[^>]*>\d+<\/span>/g
    const versesArray: Verse[] = []

    let match: RegExpExecArray | null
    while ((match = verseRegex.exec(text)) !== null) {
        const verseNumber = parseInt(match[1])
        const startIndex = match.index + match[0].length

        // Find the next verse or end of text
        const nextMatch = verseRegex.exec(text)
        const endIndex = nextMatch ? nextMatch.index : text.length

        // Reset regex position to continue from where we left off
        verseRegex.lastIndex = startIndex

        // Extract text between current verse and next verse (or end)
        let verseText = text.substring(startIndex, endIndex)

        // Clean up HTML tags and normalize whitespace
        verseText = verseText
            .replace(/<\/p>/g, " ") // Replace closing p tags with space
            .replace(/<[^>]*>/g, " ") // Remove all other HTML tags
            .replace(/\s+/g, " ") // Normalize whitespace
            .trim()

        if (verseText) {
            versesArray.push({ number: verseNumber, text: verseText } as Verse)
        }

        // If we found a next match, we need to process it in the next iteration
        if (nextMatch) {
            verseRegex.lastIndex = nextMatch.index
        }
    }

    return versesArray
}
