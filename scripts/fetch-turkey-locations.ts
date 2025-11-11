import fs from 'fs';

interface ApiProvince {
  id: number;
  name: string;
  population: number;
  area: number;
  districts: ApiDistrict[];
}

interface ApiDistrict {
  id: number;
  name: string;
  population: number;
  area: number;
}

interface ApiNeighborhood {
  id: number;
  name: string;
  districtId: number;
  provinceId: number;
}

interface ApiVillage {
  id: number;
  name: string;
  districtId: number;
  provinceId: number;
}

interface Location {
  id: string;
  name: string;
  slug: string;
  type: 'il' | 'ilce' | 'mahalle' | 'koy';
  parentId: string | null;
  population?: number;
  area?: number;
}

const API_BASE = 'https://api.turkiyeapi.dev/v1';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`Retry ${i + 1}/${retries} failed for ${url}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function fetchAllPaginated(endpoint: string, fields: string): Promise<any[]> {
  const allData: any[] = [];
  let offset = 0;
  const limit = 1000;
  
  while (true) {
    const url = `${API_BASE}/${endpoint}?fields=${fields}&offset=${offset}&limit=${limit}`;
    const batch = await fetchWithRetry(url);
    
    if (!batch || batch.length === 0) break;
    
    allData.push(...batch);
    console.log(`  - Fetched ${allData.length.toLocaleString()} items...`);
    
    if (batch.length < limit) break;
    offset += limit;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return allData;
}

async function fetchAllLocations() {
  console.log('Fetching Turkey location data from TurkiyeAPI...\n');
  const locations: Location[] = [];

  console.log('Step 1/4: Fetching provinces (81 il)...');
  const provinces: ApiProvince[] = await fetchWithRetry(`${API_BASE}/provinces?fields=id,name,population,area`);
  console.log(`✓ Fetched ${provinces.length} provinces`);

  for (const province of provinces) {
    const provinceId = `loc-il-${slugify(province.name)}`;
    locations.push({
      id: provinceId,
      name: province.name,
      slug: slugify(province.name),
      type: 'il',
      parentId: null,
      population: province.population,
      area: province.area,
    });
  }

  console.log('\nStep 2/4: Fetching districts (973 ilçe)...');
  const allDistricts: ApiDistrict[] = await fetchAllPaginated('districts', 'id,name,population,area,provinceId');
  console.log(`✓ Completed: ${allDistricts.length} districts`);

  for (const district of allDistricts) {
    const provinceData = provinces.find(p => p.id === (district as any).provinceId);
    if (!provinceData) continue;

    const districtId = `loc-ilce-${slugify(provinceData.name)}-${slugify(district.name)}`;
    const provinceId = `loc-il-${slugify(provinceData.name)}`;

    locations.push({
      id: districtId,
      name: district.name,
      slug: slugify(district.name),
      type: 'ilce',
      parentId: provinceId,
      population: district.population,
      area: district.area,
    });
  }

  console.log('\nStep 3/4: Fetching neighborhoods (32,125 mahalle)...');
  console.log('This may take several minutes...');
  const allNeighborhoods: ApiNeighborhood[] = await fetchAllPaginated('neighborhoods', 'id,name,districtId,provinceId');
  console.log(`✓ Completed: ${allNeighborhoods.length} neighborhoods`);

  for (const neighborhood of allNeighborhoods) {
    const provinceData = provinces.find(p => p.id === neighborhood.provinceId);
    const districtData = allDistricts.find(d => d.id === neighborhood.districtId);
    if (!provinceData || !districtData) continue;

    const neighborhoodId = `loc-mahalle-${neighborhood.id}`;
    const districtId = `loc-ilce-${slugify(provinceData.name)}-${slugify(districtData.name)}`;

    locations.push({
      id: neighborhoodId,
      name: neighborhood.name,
      slug: slugify(neighborhood.name),
      type: 'mahalle',
      parentId: districtId,
    });
  }

  console.log('\nStep 4/4: Fetching villages (18,211 köy)...');
  console.log('This may take several minutes...');
  const allVillages: ApiVillage[] = await fetchAllPaginated('villages', 'id,name,districtId,provinceId');
  console.log(`✓ Completed: ${allVillages.length} villages`);

  for (const village of allVillages) {
    const provinceData = provinces.find(p => p.id === village.provinceId);
    const districtData = allDistricts.find(d => d.id === village.districtId);
    if (!provinceData || !districtData) continue;

    const villageId = `loc-koy-${village.id}`;
    const districtId = `loc-ilce-${slugify(provinceData.name)}-${slugify(districtData.name)}`;

    locations.push({
      id: villageId,
      name: village.name,
      slug: slugify(village.name),
      type: 'koy',
      parentId: districtId,
    });
  }

  console.log('\n=== Summary ===');
  console.log(`Total locations: ${locations.length.toLocaleString()}`);
  console.log(`- Provinces (İl): ${locations.filter(l => l.type === 'il').length}`);
  console.log(`- Districts (İlçe): ${locations.filter(l => l.type === 'ilce').length}`);
  console.log(`- Neighborhoods (Mahalle): ${locations.filter(l => l.type === 'mahalle').length.toLocaleString()}`);
  console.log(`- Villages (Köy): ${locations.filter(l => l.type === 'koy').length.toLocaleString()}`);

  console.log('\nGenerating TypeScript file...');
  const fileContent = `export interface Location {
  id: string;
  name: string;
  slug: string;
  type: 'il' | 'ilce' | 'mahalle' | 'koy';
  parentId: string | null;
  population?: number;
  area?: number;
}

export const turkeyLocations: Location[] = ${JSON.stringify(locations, null, 2)};
`;

  const outputPath = '../server/data/locations-turkey-full.ts';
  fs.writeFileSync(outputPath, fileContent);
  console.log(`✓ Saved to ${outputPath}`);
  
  console.log('\n✅ Complete! Ready to use.');
}

fetchAllLocations().catch(console.error);
