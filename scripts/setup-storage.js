const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pplelulfsradhjpnhtxg.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function setup() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Créer le bucket product-images (public)
  const { data, error } = await supabase.storage.createBucket('product-images', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    fileSizeLimit: 5242880,
  });

  if (error && !error.message.includes('already exists')) {
    console.error('Erreur création bucket:', error.message);
    return;
  }
  console.log('✅ Bucket "product-images" créé ou déjà existant');

  // Lire le fichier SQL et exécuter
  const fs = require('fs');
  const sql = fs.readFileSync('../supabase/storage-policies.sql', 'utf8');
  const { error: sqlError } = await supabase.rpc('exec_sql', { query: sql });

  if (sqlError) {
    console.log('ℹ️  Exécute manuellement le contenu de supabase/storage-policies.sql dans le SQL Editor Supabase');
  } else {
    console.log('✅ Politiques Storage configurées');
  }

  console.log('✅ Setup terminé !');
}

setup();
