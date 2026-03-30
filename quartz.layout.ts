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
    Component.Explorer({
      title: "站点导航",
      folderDefaultState: "open",
      folderClickBehavior: "collapse",
    }),
    Component.DesktopOnly(Component.Search()),
    Component.DesktopOnly(Component.Darkmode()),
  ],
  right: [
    Component.TableOfContents(),
    Component.DesktopOnly(
      Component.RecentNotes({
        title: "最近笔记",
        limit: 4,
        linkToMore: "notes",
        filter: (file) =>
          !!file.slug &&
          file.slug.startsWith("notes/") &&
          !file.slug.endsWith("/index") &&
          !file.slug.includes("tags/"),
      }),
    ),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.Explorer({
      title: "站点导航",
      folderDefaultState: "open",
      folderClickBehavior: "collapse",
    }),
    Component.DesktopOnly(Component.Search()),
    Component.DesktopOnly(Component.Darkmode()),
  ],
  right: [
    Component.TableOfContents(),
    Component.DesktopOnly(
      Component.RecentNotes({
        title: "最近笔记",
        limit: 4,
        linkToMore: "notes",
        filter: (file) =>
          !!file.slug &&
          file.slug.startsWith("notes/") &&
          !file.slug.endsWith("/index") &&
          !file.slug.includes("tags/"),
      }),
    ),
  ],
}
