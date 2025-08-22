import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
);

export default function SessionManager({ userId }) {
  const [sessions, setSessions] = useState([]);

  // Guardar nueva sesión
  const saveSession = async (sessionData) => {
    const { error } = await supabase.from("sessions").insert([
      {
        user_id: userId,
        therapy_type: sessionData.therapy_type,
        start_time: sessionData.start_time,
        duration: sessionData.duration,
        state: sessionData.state,
        score: sessionData.score,
        orange_used: sessionData.orange_used,
        juice_used: sessionData.juice_used,
        stats: sessionData.stats,     // JSON
        details: sessionData.details, // JSON
        extra_date: sessionData.extra_date,
      },
    ]);

    if (error) {
      console.error("Error al guardar la sesión:", error);
    } else {
      console.log("Sesión guardada correctamente ✅");
      fetchSessions(); // recargar historial
    }
  };

  // Consultar últimas 6 sesiones
  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: false })
      .limit(6);

    if (error) {
      console.error("Error al cargar sesiones:", error);
    } else {
      setSessions(data);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Historial de Sesiones</h2>
      <ul>
        {sessions.map((s) => (
          <li key={s.id} className="border-b py-2">
            <strong>{s.therapy_type}</strong> - {s.duration} min - Score: {s.score}
          </li>
        ))}
      </ul>

      {/* Ejemplo para guardar una sesión */}
      <button
        className="bg-green-500 text-white px-4 py-2 mt-4 rounded"
        onClick={() =>
          saveSession({
            therapy_type: "OrangeSqueeze",
            start_time: new Date().toISOString(),
            duration: 15,
            state: "completed",
            score: 120,
            orange_used: 5,
            juice_used: 3,
            stats: { presses: 50, accuracy: 92 }, // JSON
            details: { notes: "Sesión de prueba" }, // JSON
            extra_date: new Date().toISOString(),
          })
        }
      >
        Guardar Sesión de Prueba
      </button>
    </div>
  );
}
