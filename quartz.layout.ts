import * as Component from "./quartz/components"
import { PageLayout, SharedLayout } from "./quartz/cfg"

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/cupcake777",
    },
  }),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [
    Component.PageTitle(),
    Component.Search(),
    Component.Darkmode(),
    Component.Explorer({
      folderDefaultState: "open",
      folderClickBehavior: "collapse",
    }),
  ],
  right: [
    Component.TableOfContents(),
    Component.DesktopOnly(Component.RecentNotes({ limit: 5 })),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.Search(),
    Component.Darkmode(),
    Component.Explorer({
      folderDefaultState: "open",
      folderClickBehavior: "collapse",
    }),
  ],
  right: [Component.DesktopOnly(Component.RecentNotes({ limit: 5 }))],
}
