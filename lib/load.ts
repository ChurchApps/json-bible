import { Bible } from "./Bible"
import { getDefaultBooks } from "./defaults"
import { getBookName, getBookNumber } from "./get"

export async function bibleFromFile(filePath: string) {
    let content = ""

    if (filePath.match(/^https?:\/\//)) {
        content = await fetchFile(filePath)
    } else {
        try {
            content = await loadFileNode(filePath)
        } catch (_) {
            // not node environment
            content = await fetchFile(filePath)
        }
    }

    if (!content) throw new Error("No file content!")

    let bible: Bible
    try {
        bible = JSON.parse(content)
    } catch (err) {
        throw new Error("Error parsing JSON: " + err)
    }

    return bible
}

async function loadFileNode(filePath: string) {
    const fs = require("fs")
    try {
        return await fs.readFile(filePath, "utf8")
    } catch (err) {
        throw new Error("Error getting file: " + err)
    }
}

async function fetchFile(filePath: string) {
    try {
        const response = await fetch(filePath)
        return await response.text()
    } catch (err) {
        throw new Error("Error getting file: " + err)
    }
}

export function validateBible(bible: Bible) {
    if (!bible.name) incomplete("Missing name!")
    if (!bible.books?.length) incomplete("No books!")

    // this only checks first
    if (!bible.books[0]?.chapters?.length) incomplete("No initial chapters!")
    if (!bible.books[0]?.chapters[0]?.verses?.length) incomplete("No initial verses!")
    if (!bible.books[0]?.chapters[0]?.verses[0]?.text?.length) incomplete("No initial text!")

    // set book names/id if missing
    bible.books = bible.books.map((book, i) => {
        if (!book.name) book.name = getBookName(book.id || book.number)
        if (!book.number) book.number = getBookNumber(book.name, bible, i)
        if (!book.id) book.id = getDefaultBooks().ids[book.number - 1]

        return book
    })

    function incomplete(message: string) {
        throw new Error("Incorrect Bible format: " + message)
    }
}
