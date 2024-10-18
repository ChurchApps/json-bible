<img align="right" width="150" height="150" src="JSON_bible_icon.png">

# JSON Bible Format

> A universal digital Bible format in JSON that can be used with any language.

## Format

```json
{
    "name": "Bible Name",
    "metadata": { "publisher": "" },
    "books": [
        {
            "number": 1,
            "name": "Genesis",
            "chapters": [
                {
                    "number": 1,
                    "verses": [
                        {
                            "number": 1,
                            "text": "In the beginning God created..."
                        },
                        ...
                    ]
                },
                ...
            ]
        },
        ...
    ]
}
```

### Types

This is a selection of the [types found here](./lib/Bible.ts).

```js
type Bible = {
    name: string
    metadata: Metadata
    books: Book[]
}

type Book = {
    number: number
    name: string
    chapters: Chapter[]
}

type Chapter = {
    number: number
    header?: string // chapter header
    verses: Verse[]
}

type Verse = {
    number: number
    endNumber?: number // multiple combined verses
    text: string
}
```

### Markdown:

> Markdown formatting should be used instead of HTML as it is more universal!

Check out the [MD regex parsing here](./lib/markdown.ts).

-   Undertitle: # Text #
-   Cross Reference & Notes: \*{text}\* | \*{\[reference](id) text}\*
-   Jesus Red Words: !{text}!
-   Uncertain: \[text]
-   Bold: \*\*text\*\* or \_\_text\_\_
-   Italic: \*text\* or \_text\_
-   Underline: ++text++
-   Strikethrough: \~~text~~
-   Quote: "text"
-   Line Break: \n
-   Paragraph: ¶

## Module

Use this NPM module to simplify the use/rendering of the JSON Bible Format! It has a Markdown to HTML parser, search & lots of more helpful utility features!

```js
import Bible from "json-bible"

const bible = Bible("file-path") // path/url/object

bible.data // JSON data

const book = bible.getBook("Romans")
const chapter = book.getChapter(5)
const verse = chapter.getVerse() // get first verse
const verses = chapter.getVerses([1, 15]).getReference() // "Romans 5:1+15"

verse.getText() // verse text
verse.getHTML() // HTML formatted verse text

bible.bookSearch("John 3:16-20+22") // book search with auto complete
bible.textSearch("Jesus") // text search in entire Bible, or one book

// and lots more...
```

See also [bible.html](./preview/bible.html) as a preview and use example!

## Converter

Use [this converter](https://github.com/vassbo/bible-converter) to convert from other formats like XML Zefania, OSIS, OpenSong, etc.

---

Currently used by [FreeShow Presentation Software](https://freeshow.app).

You are granted the permission to use this in any project!
