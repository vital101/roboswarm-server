import SiteMapper, { SitemapperResponse } from "sitemapper";

export interface SitemapRoute {
    path: string;
    method: string;
}

export async function getSitesFromSitemap(url: string): Promise<SitemapRoute[]> {
    const sm = new SiteMapper({ url: `${url}/sitemap.xml` });
    const sites: SitemapperResponse = await sm.fetch();
    return sites.sites.map(site => {
        return {
            path: site.replace(url, ""),
            method: "GET"
        };
    });
}