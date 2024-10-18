import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

function addJsExtension(dir) {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file)

        if (fs.lstatSync(fullPath).isDirectory()) {
            if (file.includes("node_modules")) return
            addJsExtension(fullPath)
            return
        }

        if (file.endsWith(".js") && !file.includes("add-js-extension")) {
            let content = fs.readFileSync(fullPath, "utf-8")

            // update require statements
            content = content.replace(/(require\(["'])([^'"]+?)(["']\))/g, (match, p1, p2, p3) => {
                if (!p2.endsWith(".js") && !p2.startsWith(".") && !p2.startsWith("/")) {
                    return match
                }
                return `${p1}${p2}.js${p3}`
            })

            // update import statements
            content = content.replace(/(import\s.*?from\s["'])([^'"]+?)(["'];?)/g, (match, p1, p2, p3) => {
                if (!p2.endsWith(".js") && (p2.startsWith(".") || p2.startsWith("/"))) {
                    return `${p1}${p2}.js${p3}`
                }
                return match
            })

            fs.writeFileSync(fullPath, content, "utf-8")
        }
    })
}

const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
const __dirname = path.dirname(__filename) // get the name of the directory
const directoryPath = path.join(__dirname)
addJsExtension(directoryPath)
