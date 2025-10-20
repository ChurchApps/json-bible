import type { Bible, Book, Chapter } from "../Bible"
import type { BibleContentSearchResult, BibleVerseContent, CustomVerseContent } from "./ApiBible"
import { convertVerseTextToJson, getCustomBibleListContent, getCustomBookContent, getCustomChapterContent, getCustomVerseContent } from "./converters"

const APIBIBLE_URL = "https://api.scripture.api.bible/v1/bibles"

export default function ApiBibleHelper(key: string, customApiUrl?: string) {
    if (!key) throw new Error("No API key!")

    let apiUrl = customApiUrl || APIBIBLE_URL
    if (apiUrl.endsWith("/")) apiUrl = apiUrl.slice(0, -1)

    const headers: { [key: string]: string } = { "api-key": key }

    return { getBibles, bible, clearCache }

    async function getBibles() {
        return getCustomBibleListContent(await fetchWrapper(apiUrl, headers, 3))
    }

    async function bible(bibleId: string) {
        const bibleUrl = `${apiUrl}/${bibleId}`

        // BOOKS

        const booksData = await getApiBooks()

        const json: Bible = {
            name: "",
            abbreviation: "",
            metadata: {},
            books: booksData.map((book, i) => {
                return { number: i + 1, name: book.name, id: book.keyName, chapters: [] } as Book
            })
        }

        return { json, booksData, getChapters, getVerses, contentSearch }

        async function getApiBooks() {
            const booksUrl = `${bibleUrl}/books`
            return getCustomBookContent(await fetchWrapper(booksUrl, headers, 60))
        }

        // CHAPTERS

        // GEN
        async function getChapters(bookId: string) {
            const chaptersData = await getApiChapters(bookId)

            const json = chaptersData.map((chapter) => {
                return { number: chapter.number, verses: [] } as Chapter
            })

            return { json, chaptersData }
        }

        async function getApiChapters(bookId: string) {
            const chaptersUrl = customApiUrl ? `${bibleUrl}/${bookId}/chapters` : `${bibleUrl}/books/${bookId}/chapters`
            return getCustomChapterContent(await fetchWrapper(chaptersUrl, headers, 60)).filter((a) => !a.keyName.includes("intro"))
        }

        // VERSES

        // GEN.1
        async function getVerses(chapterId: string) {
            const versesData = await getApiVerses(chapterId)
            const reference = versesData[0].keyName + "-" + versesData[versesData.length - 1].keyName
            const versesContent = await getApiVersesContent(reference)

            const json = convertVerseTextToJson(versesContent)

            return { json, versesData }
        }

        async function getApiVerses(chapterId: string) {
            const versesUrl = `${bibleUrl}/chapters/${chapterId}/verses`
            return getCustomVerseContent(await fetchWrapper(versesUrl, headers, 60))
        }

        // GEN.1.1-GEN.1.10
        async function getApiVersesContent(reference: string) {
            const versesReferenceUrl = `${bibleUrl}/verses/${reference}`
            return (await fetchWrapper(versesReferenceUrl, headers, 60)) as BibleVerseContent | CustomVerseContent[]
        }

        // SEARCH

        // no api key needed, just the bible id
        async function contentSearch(query: string, { limit } = { limit: 20 }) {
            const url = `${bibleUrl}/search?query=${query}&limit=${limit}`
            return ((await fetchWrapper(url, headers, 14)) as BibleContentSearchResult).verses
        }
    }

    function clearCache(key: string) {
        clearCachedContent(key)
    }
}

// HTTP

export function fetchWrapper(url: string, headers: any, cacheTimeDays: number) {
    if (getCachedContent(url)) return Promise.resolve(getCachedContent(url, cacheTimeDays))

    // console.info("Fetching:", url)
    return fetch(url, { headers })
        .then((response) => {
            if (response.status !== 200) {
                throw new Error("Bad response from server: " + response.status)
            }

            return response.json()
        })
        .then((data) => {
            if (!Array.isArray(data) && data?.data) data = data.data
            if (!data) throw new Error("No data found")

            cacheContent(url, data)
            return data
        })
        .catch((e) => {
            throw new Error(e)
        })
}

// CACHE

export function cacheContent(key: string, data: any) {
    if (typeof localStorage === "undefined") return

    const cacheEntry = { data, timestamp: Date.now() }
    localStorage.setItem(key, JSON.stringify(cacheEntry))
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000
export function getCachedContent(key: string, maxAgeDays: number = 7) {
    if (typeof localStorage === "undefined") return null

    const cached = localStorage.getItem(key)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    const age = Date.now() - timestamp

    if (age > maxAgeDays * ONE_DAY_MS) {
        clearCachedContent(key)
        return null
    }

    return data
}

export function clearCachedContent(key: string) {
    if (typeof localStorage === "undefined") return
    localStorage.removeItem(key)
}
