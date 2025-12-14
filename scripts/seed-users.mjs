import { createClient } from '@supabase/supabase-js';

// Hardcoded for simplicity in this script, matching .env
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedUsers() {
  const users = [
    {
      email: 'medico@clinica.cl',
      password: 'password123',
      data: { nombre: 'Dr. Juan Pérez', rol: 'MEDICO', especialidad: 'General' }
    },
    {
      email: 'secretaria@clinica.cl',
      password: 'password123',
      data: { nombre: 'Ana García', rol: 'SECRETARIA' }
    },
    {
      email: 'gerente@clinica.cl',
      password: 'password123',
      data: { nombre: 'Carlos Jefe', rol: 'GERENTE' }
    }
  ];

  for (const u of users) {
    console.log(`Creating ${u.email}...`);
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: u.data }
    });

    if (error) console.error(`Error creating ${u.email}:`, error.message);
    else console.log(`Created ${u.email} (ID: ${data.user?.id})`);
  }
}

seedUsers();
