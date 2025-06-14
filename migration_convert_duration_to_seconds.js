// migration_convert_duration_to_seconds.js
// Script para convertir la duración de las actividades de minutos a segundos

const mongoose = require('mongoose');

// Configuración de la base de datos
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ProyectoEA_bd';

// Schema básico para la migración (sin importar los modelos completos)
const activitySchema = new mongoose.Schema({
  duration: Number
}, { collection: 'activities' });

const userSchema = new mongoose.Schema({
  totalTime: Number
}, { collection: 'users' });

const Activity = mongoose.model('Activity', activitySchema);
const User = mongoose.model('User', userSchema);

const runMigration = async () => {
  try {
    console.log('🚀 Iniciando migración de duración de actividades...');
    
    // Conectar a la base de datos
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 1. MIGRAR ACTIVIDADES: Convertir duración de minutos a segundos
    console.log('\n📊 Migrando actividades...');
    
    // Obtener todas las actividades
    const activities = await Activity.find({});
    console.log(`📋 Encontradas ${activities.length} actividades para revisar`);

    let migratedActivities = 0;
    let skippedActivities = 0;
    let errors = 0;

    for (const activity of activities) {
      try {
        // Verificar si la duración parece estar en minutos (< 1000 para la mayoría de actividades)
        // La mayoría de actividades deportivas no duran más de 16 horas (1000 minutos)
        if (activity.duration && activity.duration < 1000 && activity.duration > 0) {
          const oldDuration = activity.duration;
          const newDuration = Math.round(activity.duration * 60); // Convertir minutos a segundos
          
          await Activity.findByIdAndUpdate(activity._id, {
            duration: newDuration
          });
          
          console.log(`✅ Actividad ${activity._id}: ${oldDuration} min → ${newDuration} seg`);
          migratedActivities++;
        } else if (activity.duration >= 1000) {
          console.log(`⚠️  Actividad ${activity._id}: Duración ${activity.duration} parece estar ya en segundos, omitiendo...`);
          skippedActivities++;
        } else {
          console.log(`⚠️  Actividad ${activity._id}: Duración ${activity.duration} no válida, omitiendo...`);
          skippedActivities++;
        }
      } catch (error) {
        console.error(`❌ Error migrando actividad ${activity._id}:`, error.message);
        errors++;
      }
    }

    // 2. MIGRAR USUARIOS: Convertir totalTime de minutos a segundos
    console.log('\n👥 Migrando usuarios...');
    
    // Obtener todos los usuarios que tienen totalTime
    const users = await User.find({ totalTime: { $exists: true, $gt: 0 } });
    console.log(`👤 Encontrados ${users.length} usuarios con totalTime para revisar`);

    let migratedUsers = 0;
    let skippedUsers = 0;

    for (const user of users) {
      try {
        // Similar lógica: si es < 10000, probablemente está en minutos
        // 10000 minutos = 166 horas, es un límite razonable
        if (user.totalTime < 10000) {
          const oldTotalTime = user.totalTime;
          const newTotalTime = Math.round(user.totalTime * 60); // Convertir minutos a segundos
          
          await User.findByIdAndUpdate(user._id, {
            totalTime: newTotalTime
          });
          
          console.log(`✅ Usuario ${user._id}: ${oldTotalTime} min → ${newTotalTime} seg`);
          migratedUsers++;
        } else {
          console.log(`⚠️  Usuario ${user._id}: totalTime ${user.totalTime} parece estar ya en segundos, omitiendo...`);
          skippedUsers++;
        }
      } catch (error) {
        console.error(`❌ Error migrando usuario ${user._id}:`, error.message);
        errors++;
      }
    }

    // Resumen final
    console.log('\n📊 RESUMEN DE LA MIGRACIÓN:');
    console.log(`✅ Actividades migradas: ${migratedActivities}`);
    console.log(`⏭️  Actividades omitidas: ${skippedActivities}`);
    console.log(`✅ Usuarios migrados: ${migratedUsers}`);
    console.log(`⏭️  Usuarios omitidos: ${skippedUsers}`);
    console.log(`❌ Errores: ${errors}`);
    
    console.log('\n📝 RECORDATORIOS:');
    console.log('   - Actualizar comentarios en src/models/activity.ts: cambiar "minutos" por "segundos"');
    console.log('   - Verificar que el backend guarde en segundos (activityTrackingController.ts)');
    console.log('   - Verificar que el frontend muestre correctamente (formatDuration en activity.dart)');
    
    if (errors === 0) {
      console.log('\n🎉 ¡Migración completada exitosamente!');
    } else {
      console.log('\n⚠️  Migración completada con algunos errores. Revisa los logs anteriores.');
    }

  } catch (error) {
    console.error('💥 Error fatal en la migración:', error);
  } finally {
    // Cerrar conexión
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Función de rollback en caso de problemas
const rollbackMigration = async () => {
  console.log('🔄 Iniciando rollback de migración...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Rollback actividades: convertir de segundos a minutos
    const activities = await Activity.find({});
    let rolledBackActivities = 0;
    
    for (const activity of activities) {
      if (activity.duration && activity.duration > 1000) { // Probablemente en segundos
        const newDuration = Math.round(activity.duration / 60);
        await Activity.findByIdAndUpdate(activity._id, {
          duration: newDuration
        });
        console.log(`🔄 Rollback actividad ${activity._id}: ${activity.duration} seg → ${newDuration} min`);
        rolledBackActivities++;
      }
    }

    // Rollback usuarios
    const users = await User.find({ totalTime: { $exists: true, $gt: 0 } });
    let rolledBackUsers = 0;
    
    for (const user of users) {
      if (user.totalTime > 10000) { // Probablemente en segundos
        const newTotalTime = Math.round(user.totalTime / 60);
        await User.findByIdAndUpdate(user._id, {
          totalTime: newTotalTime
        });
        console.log(`🔄 Rollback usuario ${user._id}: ${user.totalTime} seg → ${newTotalTime} min`);
        rolledBackUsers++;
      }
    }

    console.log(`✅ Rollback completado: ${rolledBackActivities} actividades, ${rolledBackUsers} usuarios`);

  } catch (error) {
    console.error('❌ Error en rollback:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--rollback')) {
  rollbackMigration();
} else if (args.includes('--help')) {
  console.log(`
🛠️  Script de Migración de Duración de Actividades

USO:
  node migration_convert_duration_to_seconds.js           # Ejecutar migración
  node migration_convert_duration_to_seconds.js --rollback # Revertir migración
  node migration_convert_duration_to_seconds.js --help    # Mostrar esta ayuda

DESCRIPCIÓN:
  Este script convierte la duración de las actividades de minutos a segundos
  para permitir mayor precisión en el formato de tiempo (mm:ss).

ANTES DE EJECUTAR:
  1. Haz backup de tu base de datos
  2. Configura MONGODB_URI en las variables de entorno
  3. Asegúrate de estar en la raíz del proyecto backend

CONFIGURACIÓN:
  export MONGODB_URI="mongodb://localhost:27017/tu-base-de-datos"
  # O tu connection string de MongoDB Atlas

DESPUÉS DE EJECUTAR:
  1. Verifica que las actividades muestren el tiempo correcto
  2. Si algo sale mal, ejecuta: node migration_convert_duration_to_seconds.js --rollback
  `);
  process.exit(0);
} else {
  runMigration();
}