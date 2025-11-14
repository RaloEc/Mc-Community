/**
 * Script para migrar todos los avatares de Google a Supabase Storage
 * Uso: node scripts/migrate-google-avatars.js
 */

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function migrateGoogleAvatars() {
  console.log('🔄 Iniciando migración de avatares de Google...\n');

  try {
    // 1. Obtener todos los usuarios con avatares de Google
    console.log('📋 Obteniendo usuarios con avatares de Google...');
    
    const response = await fetch(`${API_URL}/api/perfil/check-google-avatars`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo usuarios: ${response.status}`);
    }

    const { users } = await response.json();
    console.log(`✅ Se encontraron ${users.length} usuarios con avatares de Google\n`);

    if (users.length === 0) {
      console.log('✨ No hay avatares de Google para migrar');
      return;
    }

    // 2. Migrar cada avatar
    let successful = 0;
    let failed = 0;

    for (const user of users) {
      console.log(`🔄 Migrando avatar de ${user.username} (${user.id})...`);

      try {
        const migrateResponse = await fetch(`${API_URL}/api/perfil/migrate-google-avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            googleAvatarUrl: user.avatar_url
          })
        });

        if (!migrateResponse.ok) {
          const error = await migrateResponse.json();
          throw new Error(error.error || 'Error desconocido');
        }

        const result = await migrateResponse.json();
        console.log(`   ✅ Avatar migrado: ${result.fileName}\n`);
        successful++;
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        failed++;
      }
    }

    // 3. Resumen
    console.log('\n📊 Resumen de migración:');
    console.log(`   ✅ Exitosos: ${successful}`);
    console.log(`   ❌ Fallidos: ${failed}`);
    console.log(`   📈 Total: ${users.length}`);

    if (failed === 0) {
      console.log('\n🎉 ¡Migración completada exitosamente!');
    } else {
      console.log(`\n⚠️  Se completó con ${failed} error(es)`);
    }
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    process.exit(1);
  }
}

migrateGoogleAvatars();
