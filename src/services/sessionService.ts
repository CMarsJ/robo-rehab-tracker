import { supabase } from '@/integrations/supabase/client';
import { Session} from '@/types/database';

async function testInsertSessionRealUser() {
  try {
    // Obtener usuario autenticado
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) {
      console.error('No hay usuario autenticado:', authError);
      return;
    }

    const userId = userData.user.id;

    // Datos mínimos de prueba
    const sessionData: Partial<Session> = {
      user_id: userId,
      tipo_actividad: 'test_game',
      mode: 'game',
      duracion_minutos: 5,
      estado: 'completed',
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Insertar en la tabla sessions
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error insertando sesión:', error);
    } else {
      console.log('Sesión insertada correctamente:', data);
    }
  } catch (err) {
    console.error('Error en testInsertSessionRealUser:', err);
  }
}

// Ejecutar la prueba
testInsertSessionRealUser();
