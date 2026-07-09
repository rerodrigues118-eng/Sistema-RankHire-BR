#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment or .env file');
  process.exit(1);
}

const argv = process.argv.slice(2);
const parseArg = (name, def) => {
  const idx = argv.findIndex(a => a === `--${name}`);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  const kv = argv.find(a => a.startsWith(`--${name}=`));
  if (kv) return kv.split('=')[1];
  return def;
};

const nome = parseArg('name', 'Super Admin');
const email = parseArg('email', 'admin@example.com');
const password = parseArg('password');

if (!password) {
  console.error('Usage: node scripts/seed-superadmin.js --password "<PASSWORD>" [--name "Super Admin"] [--email admin@example.com]');
  process.exit(1);
}

(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const hash = await bcrypt.hash(password, 12);
    const { data, error } = await supabase.from('admin_usuarios').insert([{ nome, email, senha_hash: hash, role: 'superadmin', totp_enabled: false, ativo: true }]);
    if (error) {
      console.error('Insert error:', error);
      process.exit(1);
    }
    console.log('Inserted admin:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
