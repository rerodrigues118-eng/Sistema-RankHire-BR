const vars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GROQ_API_KEY',
  'GROQ_MODEL_SCORING',
  'REDIS_URL',
];

vars.forEach((v) => {
  const val = process.env[v];
  if (!val) {
    console.log(`❌ AUSENTE: ${v}`);
  } else {
    console.log(`✅ OK: ${v} = ${String(val).substring(0, 8)}...`);
  }
});
