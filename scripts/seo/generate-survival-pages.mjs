import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderSurvivalArticle, renderSurvivalHub, renderSurvivalTheme } from './templates/survival-page.mjs'

const ROOT = process.cwd()
const SURVIVAL_PATH = join(ROOT, 'content', 'survival', 'guides.json')
const OUTPUT_DIR = join(ROOT, 'public', 'survival')

function loadThemes() {
  const data = JSON.parse(readFileSync(SURVIVAL_PATH, 'utf8'))
  return data.themes.map((theme) => ({
    ...theme,
    articles: theme.articles.map((article) => {
      if (!Array.isArray(article)) return article
      const [slug, title, keyword, tier, metaDescription] = article
      return { slug, title, keyword, tier, metaDescription }
    }),
  }))
}

export function generateSurvivalPages() {
  const themes = loadThemes()
  mkdirSync(OUTPUT_DIR, { recursive: true })
  writeFileSync(join(OUTPUT_DIR, 'index.html'), renderSurvivalHub(themes))

  let articleCount = 0
  for (const theme of themes) {
    const themeDir = join(OUTPUT_DIR, theme.slug)
    mkdirSync(themeDir, { recursive: true })
    writeFileSync(join(themeDir, 'index.html'), renderSurvivalTheme(theme))

    for (const article of theme.articles) {
      writeFileSync(join(themeDir, `${article.slug}.html`), renderSurvivalArticle(theme, article))
      articleCount += 1
    }
  }

  console.log(`Generated ${themes.length} survival hubs and ${articleCount} survival articles`)
  return { themes: themes.length, articles: articleCount }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateSurvivalPages()
}
