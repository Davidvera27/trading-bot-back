#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando el proyecto de Trading Bot...\n');

// Función para ejecutar comandos
function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completado\n`);
  } catch (error) {
    console.error(`❌ Error en ${description}:`, error.message);
    process.exit(1);
  }
}

// Función para crear directorios si no existen
function createDirectories() {
  console.log('📁 Creando estructura de directorios...');
  
  const dirs = [
    'src/models',
    'src/controllers',
    'src/routes',
    'src/services',
    'src/services/binance',
    'src/services/strategies',
    'src/services/indicators',
    'src/utils',
    'src/middleware',
    'src/config',
    'tests',
    'logs'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Creado: ${dir}`);
    }
  });
  
  console.log('✅ Estructura de directorios completada\n');
}

// Función para crear archivo .env
function createEnvFile() {
  console.log('🔧 Creando archivo .env...');
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Archivo .env creado desde env.example');
    console.log('⚠️  Recuerda configurar las variables de entorno en .env\n');
  } else if (fs.existsSync(envPath)) {
    console.log('✅ Archivo .env ya existe\n');
  } else {
    console.log('⚠️  No se encontró env.example, crea manualmente el archivo .env\n');
  }
}

// Función para verificar PostgreSQL
function checkPostgreSQL() {
  console.log('🐘 Verificando PostgreSQL...');
  
  try {
    execSync('psql --version', { stdio: 'pipe' });
    console.log('✅ PostgreSQL está instalado');
  } catch (error) {
    console.log('❌ PostgreSQL no está instalado o no está en el PATH');
    console.log('📥 Instala PostgreSQL desde: https://www.postgresql.org/download/');
    console.log('💡 En Windows, asegúrate de que PostgreSQL esté en el PATH del sistema\n');
  }
}

// Función para crear la base de datos
function createDatabase() {
  console.log('🗄️  Creando base de datos...');
  
  try {
    // Intentar crear la base de datos
    runCommand('npm run db:create', 'Creando base de datos');
  } catch (error) {
    console.log('⚠️  No se pudo crear la base de datos automáticamente');
    console.log('💡 Crea manualmente la base de datos:');
    console.log('   - Usuario: postgres (o el configurado en .env)');
    console.log('   - Contraseña: (la configurada en .env)');
    console.log('   - Base de datos: trading_bot_dev\n');
  }
}

// Función principal
async function main() {
  try {
    // 1. Crear estructura de directorios
    createDirectories();
    
    // 2. Verificar PostgreSQL
    checkPostgreSQL();
    
    // 3. Instalar dependencias
    runCommand('npm install', 'Instalando dependencias');
    
    // 4. Crear archivo .env
    createEnvFile();
    
    // 5. Crear base de datos
    createDatabase();
    
    // 6. Ejecutar migraciones
    console.log('🔄 Ejecutando migraciones...');
    try {
      runCommand('npm run migrate', 'Ejecutando migraciones');
    } catch (error) {
      console.log('⚠️  No se pudieron ejecutar las migraciones');
      console.log('💡 Asegúrate de que:');
      console.log('   - PostgreSQL esté ejecutándose');
      console.log('   - Las credenciales en .env sean correctas');
      console.log('   - La base de datos exista\n');
    }
    
    console.log('🎉 ¡Configuración completada!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Configura las variables de entorno en .env');
    console.log('2. Ejecuta: npm run migrate');
    console.log('3. Ejecuta: npm run seed (opcional)');
    console.log('4. Ejecuta: npm run dev');
    console.log('\n🔗 Documentación: README.md');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main();
}

module.exports = { main };
