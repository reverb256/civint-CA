/**
 * Government API ingestion module — StatCan WDS, CKAN portals, Katzilla bridge
 */
export interface GovRelease {
  source: string;
  title: string;
  description?: string;
  release_date?: string;
  data_url?: string;
  jurisdiction: string;
  category?: string;
}

/** CKAN portal configuration */
const CKAN_PORTALS: Record<string, string> = {
  federal: 'https://open.canada.ca/data/en/api/3/action',
  ontario: 'https://data.ontario.ca/api/3/action',
  bc: 'https://catalogue.data.gov.bc.ca/api/3/action',
  alberta: 'https://open.alberta.ca/api/3/action',
  quebec: 'https://donneesquebec.ca/api/3/action',
};

/**
 * Fetch packages from a CKAN portal
 */
export async function fetchCKANPackages(
  jurisdiction: string,
  rows: number = 50,
  offset: number = 0
): Promise<any[]> {
  const baseUrl = CKAN_PORTALS[jurisdiction];
  if (!baseUrl) throw new Error(`Unknown jurisdiction: ${jurisdiction}`);

  const url = `${baseUrl}/package_search?rows=${rows}&start=${offset}&sort=metadata_modified+desc`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`CKAN error ${response.status} for ${jurisdiction}`);

  const data: any = await response.json();
  return data.result?.results || [];
}

/**
 * Fetch releases from Statistics Canada WDS
 */
export async function fetchStatCanReleases(): Promise<GovRelease[]> {
  const response = await fetch('https://www150.statcan.gc.ca/t1/wds/rest/getLatestDataUpdates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productType: 10, count: 50 }),
  });

  if (!response.ok) throw new Error(`StatCan WDS error: ${response.status}`);

  const data: any = await response.json();
  return (data.object || []).map((item: any) => ({
    source: 'statcan',
    title: item.productName || 'StatCan Data Update',
    description: `Cube ID: ${item.productId}, Release: ${item.releaseDate}`,
    release_date: item.releaseDate,
    data_url: `https://www150.statcan.gc.ca/t1/wds/rest/getFullTableDownload/${item.productId}`,
    jurisdiction: 'federal',
    category: 'data',
  }));
}

/**
 * Normalize CKAN results into GovRelease format
 */
export function normalizeCKANRelease(pkg: any, jurisdiction: string): GovRelease {
  return {
    source: `ckan-${jurisdiction}`,
    title: pkg.title || 'Untitled Dataset',
    description: pkg.notes || '',
    release_date: pkg.metadata_modified?.split('T')[0] || null,
    data_url: pkg.resources?.[0]?.url || null,
    jurisdiction,
    category: pkg.organization?.name || 'government',
  };
}
