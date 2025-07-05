import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Varias rutas posibles para el CSV
const posiblesPaths = [
  path.join(__dirname, './utils/marcas_final.csv'),
  path.join(__dirname, '../utils/marcas_final.csv'),
  path.join(__dirname, './marcas_final.csv'),
  path.join(__dirname, '../data/marcas_final.csv'),
  './data/marcas_final.csv',
  './utils/marcas_final.csv',
  './marcas_final.csv'
];

// Buscar el archivo CSV
const encontrarCSV = () => {
  console.log('🔍 Buscando archivo CSV...');
  console.log('📂 Directorio actual del seeder:', __dirname);
  
  for (const csvPath of posiblesPaths) {
    console.log(`⏳ Verificando: ${csvPath}`);
    if (fs.existsSync(csvPath)) {
      console.log(`✅ ¡Archivo encontrado en: ${csvPath}`);
      return csvPath;
    }
  }
  
  return null;
};

const csvPath = encontrarCSV();

const capitalizar = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const seedProveedor = async () => {
  try {
    console.log('🌱 Iniciando seeder de proveedores...');

    // Verificar que encontramos el archivo CSV
    if (!csvPath) {
      console.log('\n❌ No se encontró el archivo proveedor.csv en ninguna de estas ubicaciones:');
      posiblesPaths.forEach(p => console.log(`   - ${p}`));
      console.log('\n💡 Coloca tu archivo proveedor.csv en una de estas rutas o ajusta la ruta en el código.\n');
      throw new Error('Archivo CSV no encontrado');
    }

    console.log(`📁 Usando archivo: ${csvPath}`);

    const proveedores = []; // Array para los proveedores

    // Leer CSV con Promise
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          console.log('📄 Fila leída:', row); // Debug: mostrar primera fila
          
          // Crear objeto individual (nombre diferente al array)
          const nuevoProveedor = {
            nombre: null,
            empresa: capitalizar(row.Marca || row.marca || ''),
            fono: null,
            coordenadas: `${row.Latitud || row.latitud || ''},${row.Longitud || row.longitud || ''}`,
            tipoProducto: capitalizar(row.area || row.Area || ''),
            correo: null
          };

          proveedores.push(nuevoProveedor); // Agregar al array
        })
        .on('end', () => {
          console.log(`📊 ${proveedores.length} proveedores procesados`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ Error leyendo CSV:', error.message);
          reject(error);
        });
    });

    if (proveedores.length === 0) {
      console.log('⚠️  No hay datos para insertar');
      console.log('💡 Verifica que tu CSV tenga las columnas: Marca, Latitud, Longitud, area');
      return;
    }

    console.log('📋 Muestra de datos a insertar:');
    console.log(proveedores[0]); // Mostrar primer registro

    // Verificar qué tablas existen realmente
    console.log('🔍 Verificando tabla proveedor...');
    
    try {
      // Verificar específicamente la tabla proveedor
      const tablaExiste = await db.schema.hasTable('proveedor');
      
      if (!tablaExiste) {
        // Obtener lista de todas las tablas para debug
        const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'knex%' AND name NOT LIKE 'sqlite_%'");
        
        console.log('❌ La tabla "proveedor" no existe.');
        console.log('📋 Tablas encontradas en la base de datos:');
        if (tables.length > 0) {
          tables.forEach(table => {
            console.log(`   - ${table.name}`);
          });
        } else {
          console.log('   ❌ No se encontraron tablas');
        }
        
        console.log('\n💡 Opciones:');
        console.log('   1. Ejecuta: npx knex migrate:latest');
        console.log('   2. Verifica que tu migración se ejecutó correctamente');
        throw new Error('Tabla "proveedor" no existe. Ejecuta las migraciones primero.');
      }
      
      console.log('✅ Tabla "proveedor" encontrada');
      
      // Mostrar estructura de la tabla
      console.log('\n📋 Verificando estructura de la tabla proveedor...');
      const columnInfo = await db('proveedor').columnInfo();
      console.log('🔧 Columnas disponibles en la tabla proveedor:');
      Object.keys(columnInfo).forEach(col => {
        console.log(`   - ${col} (${columnInfo[col].type})`);
      });

      console.log('\n📋 Muestra de datos a insertar:');
      console.log(proveedores[0]); // Mostrar primer registro

      // Limpiar tabla e insertar datos
      console.log('\n🧹 Limpiando tabla proveedor...');
      await db('proveedor').del();

      console.log('💾 Insertando proveedores...');
      await db('proveedor').insert(proveedores);
      
      console.log(`✅ ${proveedores.length} proveedores insertados exitosamente en tabla proveedor`);
      
    } catch (error) {
      console.error('❌ Error con tabla proveedor:', error.message);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error en seeder:', error.message);
    throw error;
  } finally {
    // Cerrar conexión a la base de datos
    await db.destroy();
    console.log('🔒 Conexión a la base de datos cerrada');
  }
};

// Ejecutar seeder
const ejecutarSeeder = async () => {
  try {
    await seedProveedor();
    console.log('🎉 Seeder completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error ejecutando seeder:', error.message);
    process.exit(1);
  }
};

// Función para ayudar a debug la estructura de carpetas
const mostrarEstructura = () => {
  console.log('\n📁 Estructura de carpetas actual:');
  console.log('   📂 Directorio del seeder:', __dirname);
  
  try {
    const contenido = fs.readdirSync(__dirname);
    console.log('   📂 Contenido del directorio actual:');
    contenido.forEach(item => {
      const itemPath = path.join(__dirname, item);
      const esDirectorio = fs.statSync(itemPath).isDirectory();
      console.log(`      ${esDirectorio ? '📁' : '📄'} ${item}`);
    });
  } catch (error) {
    console.log('   ❌ No se pudo leer el directorio');
  }
  console.log('\n');
};

// Mostrar estructura para debug
mostrarEstructura();

// Ejecutar automáticamente
ejecutarSeeder();   