import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import crypto from 'crypto';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const posiblesPaths = [
  path.join(__dirname, './utils/nombre_total_marca.csv'),
  path.join(__dirname, '../utils/nombre_total_marca.csv'),
  path.join(__dirname, './nombre_total_marca.csv'),
  path.join(__dirname, '../data/nombre_total_marca.csv'),
  './data/nombre_total_marca.csv',
  './utils/nombre_total_marca.csv',
  './nombre_total_marca.csv'
];

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

// Función SÚPER ROBUSTA para extraer IDs numéricos
const extraerIDSeguro = (resultado, nombreCampo = 'id') => {
  console.log(`🔍 Procesando resultado de returning:`, JSON.stringify(resultado));
  
  let valor = resultado;
  
  // Si es un array, tomar el primer elemento
  if (Array.isArray(valor)) {
    valor = valor[0];
    console.log(`📋 Primer elemento del array:`, JSON.stringify(valor));
  }
  
  // Si es un objeto, extraer el valor del campo
  if (typeof valor === 'object' && valor !== null) {
    // Buscar por el nombre específico del campo o cualquier campo que termine en 'Id'
    const keys = Object.keys(valor);
    const idKey = keys.find(k => k === nombreCampo || k.toLowerCase().includes('id'));
    
    if (idKey) {
      valor = valor[idKey];
      console.log(`🗝️  Extrayendo campo '${idKey}':`, valor);
    } else {
      // Si no hay clave específica, tomar el primer valor
      valor = Object.values(valor)[0];
      console.log(`🎯 Tomando primer valor:`, valor);
    }
  }
  
  // Si es string, intentar parsear como JSON
  if (typeof valor === 'string') {
    try {
      const parsed = JSON.parse(valor);
      console.log(`📄 String parseado como JSON:`, parsed);
      return extraerIDSeguro(parsed, nombreCampo); // Recursión
    } catch (e) {
      // Si no es JSON válido, intentar convertir a número
      const numero = parseInt(valor);
      if (!isNaN(numero)) {
        console.log(`🔢 String convertido a número:`, numero);
        return numero;
      }
    }
  }
  
  // Convertir a número
  const numeroFinal = parseInt(valor);
  if (isNaN(numeroFinal)) {
    console.error(`❌ No se pudo convertir a número:`, valor);
    throw new Error(`Valor inválido para ID: ${JSON.stringify(resultado)} -> ${valor}`);
  }
  
  console.log(`✅ ID final extraído:`, numeroFinal);
  return numeroFinal;
};

// Función alternativa: usar SELECT después de INSERT
const insertarYObtenerID = async (tabla, datos, campoId) => {
  try {
    console.log(`📝 Insertando en ${tabla}:`, JSON.stringify(datos));
    
    // Opción 1: Intentar con returning
    try {
      const resultado = await db(tabla).insert(datos).returning(campoId);
      console.log(`📥 Resultado returning de ${tabla}:`, JSON.stringify(resultado));
      return extraerIDSeguro(resultado, campoId);
    } catch (returningError) {
      console.warn(`⚠️  Returning falló en ${tabla}, intentando con SELECT...`);
    }
    
    // Opción 2: INSERT sin returning y luego SELECT del último
    await db(tabla).insert(datos);
    
    // Buscar el último registro insertado
    const ultimoRegistro = await db(tabla)
      .select(campoId)
      .orderBy(campoId, 'desc')
      .limit(1);
    
    if (ultimoRegistro.length === 0) {
      throw new Error(`No se encontró el registro insertado en ${tabla}`);
    }
    
    const id = ultimoRegistro[0][campoId];
    console.log(`🔍 ID obtenido via SELECT en ${tabla}:`, id);
    return parseInt(id);
    
  } catch (error) {
    console.error(`❌ Error insertando en ${tabla}:`, error.message);
    throw error;
  }
};

// Función para generar SOLO el código de barras
const generarCodigoBarras = (nombre, marca) => {
  const nombreLimpio = nombre.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const marcaLimpia = marca.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const baseString = `${nombreLimpio}_${marcaLimpia}`;
  const hash = crypto.createHash('md5').update(baseString).digest('hex');
  const codigo = hash.substring(0, 12).replace(/[a-f]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 87 + 48);
  }).replace(/[^0-9]/g, '').padEnd(12, '0').substring(0, 12);
  return codigo;
};

// Función mejorada para obtener o crear proveedor
const obtenerProveedorId = async (marca) => {
  try {
    console.log(`🔍 Buscando proveedor para marca: "${marca}"`);
    
    // Buscar proveedor existente
    const proveedores = await db('proveedor')
      .select('proveedorId', 'empresa')
      .whereRaw('LOWER(empresa) = LOWER(?)', [marca])
      .limit(1);
    
    if (proveedores.length > 0) {
      const id = parseInt(proveedores[0].proveedorId);
      console.log(`✅ Proveedor encontrado: ID ${id} - ${proveedores[0].empresa}`);
      return id;
    }
    
    // Crear nuevo proveedor
    console.log(`🏭 Creando nuevo proveedor para marca: "${marca}"`);
    const nuevoProveedor = {
      nombre: `Proveedor ${marca}`,
      empresa: marca,
      fono: '123456789',
      coordenadas: '-23.6597071,-70.3903201',
      tipoProducto: 'Productos Varios',
      correo: `contacto@${marca.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`
    };
    
    const proveedorId = await insertarYObtenerID('proveedor', nuevoProveedor, 'proveedorId');
    console.log(`✅ Nuevo proveedor creado: ID ${proveedorId} - ${marca}`);
    return proveedorId;
    
  } catch (error) {
    console.error(`❌ Error con proveedor "${marca}":`, error.message);
    
    // Fallback: buscar cualquier proveedor
    try {
      const cualquierProveedor = await db('proveedor').select('proveedorId').limit(1);
      if (cualquierProveedor.length > 0) {
        const id = parseInt(cualquierProveedor[0].proveedorId);
        console.log(`⚠️  Usando proveedor fallback: ID ${id}`);
        return id;
      }
    } catch (fallbackError) {
      console.error('❌ Error en fallback:', fallbackError.message);
    }
    
    throw new Error(`No se pudo obtener proveedor para marca: ${marca}`);
  }
};

const seedProductos = async () => {
  try {
    console.log('🌱 Iniciando seeder de productos MEJORADO...');

    if (!csvPath) {
      console.log('\n❌ No se encontró el archivo nombre_total_marca.csv en ninguna ubicación:');
      posiblesPaths.forEach(p => console.log(`   - ${p}`));
      throw new Error('Archivo CSV no encontrado');
    }

    console.log(`📁 Usando archivo: ${csvPath}`);

    const productosData = [];

    // Leer CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          if (productosData.length < 3) {
            console.log('📄 Fila leída:', row);
          }
          
          const nuevoProducto = {
            nombre: capitalizar(row.nombre || row.Nombre || ''),
            categoria: capitalizar(row.area || row.categoria || ''),
            marca: capitalizar(row.Marca || row.marca || 'Sin Marca'),
            imagenUrl: null,
            pais: capitalizar(row.pais || row.Pais || 'Chile'),
            caracteristicas: row.caracteristica || row.caracteristicas || '',
            precio: parseFloat(row.precio) || 0.0,
            stock: parseInt(row.stock) || 5,
            estado: true
          };

          productosData.push(nuevoProducto);
        })
        .on('end', () => {
          console.log(`📊 ${productosData.length} productos procesados del CSV`);
          resolve();
        })
        .on('error', reject);
    });

    if (productosData.length === 0) {
      console.log('⚠️  No hay datos para insertar');
      return;
    }

    // Verificar tablas
    const tablas = ['producto', 'barCode', 'proveedor'];
    for (const tabla of tablas) {
      const existe = await db.schema.hasTable(tabla);
      if (!existe) {
        throw new Error(`Tabla "${tabla}" no existe. Ejecuta las migraciones primero.`);
      }
    }
    console.log('✅ Todas las tablas encontradas');

    // Mostrar proveedores existentes
    console.log('\n📋 Proveedores existentes:');
    const proveedoresExistentes = await db('proveedor').select('proveedorId', 'empresa', 'nombre');
    if (proveedoresExistentes.length > 0) {
      proveedoresExistentes.forEach(p => {
        console.log(`   🏢 ID: ${p.proveedorId} - ${p.empresa}`);
      });
    } else {
      console.log('   ⚠️  No hay proveedores - se crearán nuevos');
    }

    // Limpiar solo productos y códigos de barras
    console.log('\n🧹 Limpiando productos y códigos de barras...');
    await db('producto').del();
    await db('barCode').del();
    console.log('✅ Limpieza completada - Proveedores conservados');

    console.log('\n📦 Procesando productos...');
    
    const cacheProveedores = new Map();
    let productosInsertados = 0;
    let erroresCount = 0;
    
    // Procesar cada producto
    for (let i = 0; i < productosData.length; i++) {
      const producto = productosData[i];
      
      try {
        console.log(`\n--- Procesando producto ${i + 1}/${productosData.length}: "${producto.nombre}" ---`);
        
        // Obtener proveedor
        let proveedorId;
        if (cacheProveedores.has(producto.marca)) {
          proveedorId = cacheProveedores.get(producto.marca);
          console.log(`📋 Proveedor en cache: ${proveedorId}`);
        } else {
          proveedorId = await obtenerProveedorId(producto.marca);
          cacheProveedores.set(producto.marca, proveedorId);
        }

        // Generar código de barras
        const codigoBarras = generarCodigoBarras(producto.nombre, producto.marca);
        const nombreCorto = producto.nombre.substring(0, 20);
        const urlOptimizada = `https://barcode.orcascan.com/?type=code128&data=${codigoBarras}&format=svg&width=300&height=80&layout=landscape&text=${encodeURIComponent(nombreCorto)}`;
        
        // Insertar código de barras
        const barCodeData = {
          codigoGuardad: codigoBarras,
          formato: 'CODE128',
          url: urlOptimizada
        };
        
        const barCodeId = await insertarYObtenerID('barCode', barCodeData, 'barCodeId');

        // Validar que ambos IDs sean números válidos
        if (!Number.isInteger(proveedorId) || proveedorId <= 0) {
          throw new Error(`ProveedorId inválido: ${proveedorId}`);
        }
        if (!Number.isInteger(barCodeId) || barCodeId <= 0) {
          throw new Error(`BarCodeId inválido: ${barCodeId}`);
        }

        console.log(`📦 Insertando producto con proveedorId: ${proveedorId}, barCodeId: ${barCodeId}`);

        // Insertar producto - SIN usar returning para evitar problemas
        const productoData = {
          nombre: producto.nombre,
          categoria: producto.categoria,
          marca: producto.marca,
          imagenUrl: producto.imagenUrl,
          pais: producto.pais,
          caracteristicas: producto.caracteristicas,
          precio: producto.precio,
          stock: producto.stock,
          estado: producto.estado,
          proveedorId: proveedorId,  // Número directo
          barCodeId: barCodeId       // Número directo
        };

        await db('producto').insert(productoData);

        productosInsertados++;
        console.log(`✅ Producto ${productosInsertados} insertado correctamente`);

        if (productosInsertados % 10 === 0) {
          console.log(`🎯 Progreso: ${productosInsertados}/${productosData.length} productos...`);
        }

      } catch (error) {
        erroresCount++;
        console.error(`❌ Error en producto ${i + 1} "${producto.nombre}":`, error.message);
        
        if (erroresCount > 5 && productosInsertados === 0) {
          console.error('💥 Demasiados errores consecutivos. Deteniendo.');
          throw new Error('Proceso detenido por múltiples errores');
        }
        
        continue;
      }
    }

    console.log(`\n🎉 Proceso completado:`);
    console.log(`   ✅ Productos insertados: ${productosInsertados}`);
    console.log(`   ❌ Errores: ${erroresCount}`);
    
    if (productosInsertados === 0) {
      console.log('\n⚠️  No se insertó ningún producto.');
      return;
    }
    
    // Verificar resultados
    console.log('\n🔍 Verificando datos insertados...');
    const ejemplosVerificacion = await db('producto')
      .select('productoId', 'nombre', 'marca', 'proveedorId', 'barCodeId')
      .limit(5);
    
    console.log('\n📋 Verificación de tipos de datos:');
    ejemplosVerificacion.forEach((prod, index) => {
      console.log(`   ${index + 1}. ${prod.nombre}`);
      console.log(`      proveedorId: ${prod.proveedorId} (tipo: ${typeof prod.proveedorId})`);
      console.log(`      barCodeId: ${prod.barCodeId} (tipo: ${typeof prod.barCodeId})`);
    });

    // Estadísticas finales
    console.log('\n📊 Estadísticas finales:');
    const stats = await Promise.all([
      db('producto').count('* as total'),
      db('barCode').count('* as total'),
      db('proveedor').count('* as total')
    ]);
    
    console.log(`   🛍️  Productos: ${stats[0][0].total}`);
    console.log(`   📦 Códigos de barras: ${stats[1][0].total}`);
    console.log(`   🏢 Proveedores: ${stats[2][0].total}`);

    // Verificar joins funcionan correctamente
    console.log('\n🔗 Verificando relaciones (JOINs):');
    try {
      const relacionesTest = await db('producto')
        .join('barCode', 'producto.barCodeId', 'barCode.barCodeId')
        .join('proveedor', 'producto.proveedorId', 'proveedor.proveedorId')
        .select('producto.nombre', 'proveedor.empresa', 'barCode.codigoGuardad')
        .limit(3);
      
      if (relacionesTest.length > 0) {
        console.log('✅ JOINs funcionan correctamente:');
        relacionesTest.forEach((rel, i) => {
          console.log(`   ${i + 1}. ${rel.nombre} → ${rel.empresa} → ${rel.codigoGuardad}`);
        });
      } else {
        console.log('⚠️  No se pudieron ejecutar los JOINs correctamente');
      }
    } catch (joinError) {
      console.error('❌ Error en JOINs:', joinError.message);
    }

  } catch (error) {
    console.error('❌ Error en seeder:', error.message);
    throw error;
  } finally {
    await db.destroy();
    console.log('\n🔒 Conexión cerrada');
  }
};

// Ejecutar seeder
const ejecutarSeeder = async () => {
  try {
    await seedProductos();
    console.log('🎉 Seeder completado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error ejecutando seeder:', error.message);
    console.log('\n💡 Sugerencias:');
    console.log('   1. Verifica las migraciones');
    console.log('   2. Revisa el CSV');
    console.log('   3. Verifica la conexión a BD');
    console.log('   4. Revisa los logs detallados arriba');
    process.exit(1);
  }
};

// Función para debug
const mostrarEstructura = () => {
  console.log('\n📁 Estructura de carpetas:');
  console.log('   📂 Directorio del seeder:', __dirname);
  
  try {
    const contenido = fs.readdirSync(__dirname);
    console.log('   📂 Contenido:');
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

mostrarEstructura();
ejecutarSeeder();