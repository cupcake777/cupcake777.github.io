import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "cc",
    pageTitleSuffix: " · cupcake",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "zh-CN",
    baseUrl: "cupcake777.github.io",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Schibsted Grotesk",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#fffdfa",
          lightgray: "#edf3ef",
          gray: "#b7c7be",
          darkgray: "#567064",
          dark: "#12231b",
          secondary: "#2c8c72",
          tertiary: "#1f6b56",
          highlight: "rgba(44, 140, 114, 0.10)",
          textHighlight: "rgba(44, 140, 114, 0.18)",
        },
        darkMode: {
          light: "#0f1614",
          lightgray: "#182522",
          gray: "#2d4b42",
          darkgray: "#86ab9c",
          dark: "#e3f0ea",
          secondary: "#77d1b3",
          tertiary: "#54b091",
          highlight: "rgba(119, 209, 179, 0.10)",
          textHighlight: "rgba(119, 209, 179, 0.18)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({ priority: ["frontmatter", "filesystem"] }),
      Plugin.SyntaxHighlighting(),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({ enableSiteMap: true, enableRSS: true }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
