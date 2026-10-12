import { createClient } from '@supabase/supabase-js';

// Load .env
process.loadEnvFile('.env');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Import the dataset
import { THAILAND_RESTROOMS_DATASET } from '../src/data/thailandRestroomsDataset.ts';

async function seed() {
  console.log(`Starting nationwide seed: ${THAILAND_RESTROOMS_DATASET.length} places...`);

  // Fetch existing names to avoid duplicates
  const { data: existing, error: fetchErr } = await supabase
    .from('toilets')
    .select('name');

  if (fetchErr) {
    console.error('Error fetching existing toilets:', fetchErr);
    return;
  }

  const existingNames = new Set((existing || []).map(t => t.name.trim()));
  console.log(`Existing toilets in DB: ${existingNames.size}`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const item of THAILAND_RESTROOMS_DATASET) {
    if (existingNames.has(item.name.trim())) {
      skippedCount++;
      continue;
    }

    const payload = {
      name: item.name,
      name_en: item.name_en || null,
      category: item.category,
      address: item.address,
      province: item.province,
      location: `POINT(${item.lng} ${item.lat})`,
      has_bidet: item.has_bidet,
      wheelchair_accessible: item.wheelchair_accessible,
      elderly_support: item.elderly_support,
      baby_station: item.baby_station,
      has_shower: item.has_shower,
      has_prayer_room: item.has_prayer_room,
      open_24h: item.open_24h,
      is_free: item.is_free,
      price_amount: item.price_amount || 0,
      opening_hours: item.opening_hours,
      overall_rating: item.overall_rating,
      review_count: item.review_count,
      photos: item.photos,
      is_verified: true,
      verification_status: 'verified'
    };

    const { error: insertErr } = await supabase
      .from('toilets')
      .insert(payload);

    if (insertErr) {
      console.error(`Failed to insert "${item.name}":`, insertErr.message);
    } else {
      insertedCount++;
      existingNames.add(item.name.trim());
      process.stdout.write(`+ Inserted: ${item.name}\n`);
    }
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`- Inserted: ${insertedCount}`);
  console.log(`- Skipped (already existed): ${skippedCount}`);
  console.log(`- Total in dataset: ${THAILAND_RESTROOMS_DATASET.length}`);

  const { count } = await supabase.from('toilets').select('*', { count: 'exact', head: true });
  console.log(`- Total records now in Supabase public.toilets: ${count}`);
}

seed().catch(console.error);
