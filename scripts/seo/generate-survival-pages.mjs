import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderSurvivalArticle, renderSurvivalHub, renderSurvivalTheme } from './templates/survival-page.mjs'

const ROOT = process.cwd()
const SURVIVAL_PATH = join(ROOT, 'content', 'survival', 'guides.json')
const ARTICLE_BODY_PATH = join(ROOT, 'content', 'survival', 'articles.json')
const OUTPUT_DIR = join(ROOT, 'public', 'survival')

function loadArticleBodies() {
  try {
    return JSON.parse(readFileSync(ARTICLE_BODY_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function loadThemes() {
  const data = JSON.parse(readFileSync(SURVIVAL_PATH, 'utf8'))
  const bodies = loadArticleBodies()
  return data.themes.map((theme) => ({
    ...theme,
    articles: theme.articles.map((article) => {
      const base = Array.isArray(article)
        ? {
            slug: article[0],
            title: article[1],
            keyword: article[2],
            tier: article[3],
            metaDescription: article[4],
          }
        : article
      const body = bodies[`${theme.slug}/${base.slug}`] || bodies[base.slug]
      return body ? { ...base, body } : base
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
