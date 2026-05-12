/**
 * Government API ingestion — StatCan, open.canada.ca CKAN, etc.
 */

/** A government data release */
export interface GovRelease {
  source: string;
  title: string;
  description: string | null;
  releaseDate: string | null;
  dataUrl: string | null;
  jurisdiction: string;
  category: string | null;
}

/** Default CKAN portals by jurisdiction */
export const CKAN_PORTALS: Record<string, string> = {
  federal: 'https://open.canada.ca/data/api/3/action',
  ontario: 'https://data.ontario.ca/api/3/action',
  bc: 'https://catalogue.data.gov.bc.ca/api/3/action',
  alberta: 'https://open.alberta.ca/api/3/action',
  quebec: 'https://donneesquebec.ca/api/3/action',
};

/**
 * Fetch recent packages from a CKAN portal
 */
export async function fetchCKANPackages(
  jurisdiction: string = 'federal',
  limit: number = 10
): Promise<GovRelease[]> {
  const baseUrl = CKAN_PORTALS[jurisdiction];
  if (!baseUrl) throw new Error(`Unknown jurisdiction: ${jurisdiction}`);

  const url = `${baseUrl}/package_search?rows=${limit}&sort=metadata_modified+desc`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'civint-CA/0.1.0' },
  });

  if (!response.ok) {
    throw new Error(`CKAN fetch failed: ${response.status}`);
  }

  const data: any = await response.json();

  if (!data.success || !data.result?.results) {
    return [];
  }

  return data.result.results.map((pkg: any) => ({
    source: `open.canada.ca (${jurisdiction})`,
    title: pkg.title || pkg.name || 'Untitled',
    description: pkg.notes || pkg.title || null,
    releaseDate: pkg.metadata_modified || null,
    dataUrl: `https://open.canada.ca/data/dataset/${pkg.name}`,
    jurisdiction,
    category: (pkg.groups || []).map((g: any) => g.display_name).join(', ') || null,
  }));
}
