export function clone<T>(object: T): T {
    if (typeof object !== "object") return object
    return JSON.parse(JSON.stringify(object))
}

export function isNumber(value: any) {
    return typeof value === "number" || !isNaN(Number(value))
}

export function stripText(value: string) {
    if (!value) return ""

    // remove any HTML tags
    value = value.replace(/<[^>]*>/g, "")
    // value = value.replace(/(<([^>]+)>)/g, "")

    // remove [1], not [text]
    value = value.replace(/ *\[[0-9\]]*]/g, "")

    return value
}
