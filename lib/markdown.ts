export function parseMarkdown(input: string) {
    // Undertitle: # Text #
    input = input.replace(/#\s*(.*?)\s*#/g, "<h4>$1</h4>")

    // Cross Reference & Notes: *{text}* | *{[reference](id) text}*
    input = parseCrossReferences()

    // Jesus Red Words: !{text}!
    input = input.replace(/!\{(.*?)\}!/g, '<span style="color:red;">$1</span>')

    // Uncertain: [text]
    input = input.replace(/\[(.*?)\]/g, '<span class="uncertain">[$1]</span>')

    ///// https://www.markdownguide.org/basic-syntax/

    // Bold: **text** or __text__
    input = input.replace(/(\*\*|__)(.*?)\1/g, "<strong>$2</strong>")

    // Italic: *text* or _text_
    input = input.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>")

    // Underline: ++text++
    input = input.replace(/\+\+(.*?)\+\+/g, "<u>$1</u>")

    // Strikethrough: ~~text~~
    input = input.replace(/~~(.*?)~~/g, "<del>$1</del>")

    /////

    // Quote: "text"
    input = input.replace(/(?<!<[^>]*?)"([^"]*?)"(?![^<]*?>)/g, "<q>$1</q>")

    // Line Break: \n
    input = input.replace(/\n/g, "<br>")

    // Paragraph: ¶
    input = input.replace(/¶/g, "<br><br>")

    return input

    function parseCrossReferences() {
        return input.replace(/\*\{(.*?)\}\*/g, (_, content) => {
            const transformedContent = content.replace(/\[(.*?)\]\((.*?)\)/g, '<span id="$2" class="cross-ref-id">$1</span>')
            return `<span class="cross-ref"><span class="content">${transformedContent}</span></span>`
        })
    }
}

export function stripMarkdown(input: string) {
    input = input.replace(/#\s*(.*?)\s*#/g, "")
    input = input.replace(/\*\{(.*?)\}\*/g, "$1")
    input = input.replace(/!\{(.*?)\}!/g, "$1")
    // input = input.replace(/\[(.*?)\]/g, "[$1]")
    input = input.replace(/(\*\*|__)(.*?)\1/g, "$2")
    input = input.replace(/(\*|_)(.*?)\1/g, "$2")
    input = input.replace(/\+\+(.*?)\+\+/g, "$1")
    input = input.replace(/~~(.*?)~~/g, "$1")
    input = input.replace(/"([^"]*?)"/g, "$1")
    input = input.replace(/\n/g, "")
    input = input.replace(/¶/g, "")

    return input
}
