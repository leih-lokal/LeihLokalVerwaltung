const fs = require('fs')
const path = require('path')

const indexHtmlPath = path.join(__dirname, '../public/index.html')
const baseUrl = process.env.BASE_URL

if (baseUrl) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8')
    html = html.replace(/<base href="\/">/, `<base href="${baseUrl}/">`)
    fs.writeFileSync(indexHtmlPath, html)
    console.log(`Updated <base href="${baseUrl}/"> in index.html`)
}
