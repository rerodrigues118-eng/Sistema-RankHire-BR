import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  console.log('Checking bucket "avatars"...');

  try {
    // Try to list files at root of avatars
    const { data, error } = await supabase.storage.from('avatars').list('', { limit: 5 });
    if (error) {
      console.error('Error listing objects in bucket avatars:', error);
      process.exit(2);
    }

    console.log('Bucket "avatars" exists. Sample objects (up to 5):');
    console.log(data);

    // Try to get public URL for a potential file (if any)
    if (data && data.length > 0) {
      const item = data[0];
      const publicRes = supabase.storage.from('avatars').getPublicUrl(item.name);
      console.log('Public URL for first item:', publicRes?.data?.publicUrl || '(none)');
    } else {
      console.log('Bucket is empty or contains only folders.');
    }

    // Check bucket metadata (buckets table)
    const { data: buckets, error: bErr } = await supabase.from('buckets').select('*').eq('name', 'avatars');
    if (bErr) {
      console.warn('Could not query buckets table:', bErr.message || bErr);
    } else {
      console.log('Buckets table query result:', buckets);
    }

    console.log('Done. If you see permission errors, ensure the Service Role Key is correct and the bucket exists.');
  } catch (err) {
    console.error('Unexpected error while checking avatars bucket:', err);
    process.exit(3);
  }
}

main();
