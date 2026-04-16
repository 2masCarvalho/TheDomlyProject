
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://igfjgzaxbmdspcpjatug.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnZmpnemF4Ym1kc3BjcGphdHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNDczNTIsImV4cCI6MjA3ODYyMzM1Mn0.xqYt0IDUNytB5kWLwVO1OvE45hBCA6-oUMvn9TWh2iQ');
async function run() {
  const { data, error } = await supabase.from('condominios').insert([{ nome: 'Test', morada: 'Test', nif: 123456789, num_fracoes: 10 }]);
  console.log(error);
}
run();
