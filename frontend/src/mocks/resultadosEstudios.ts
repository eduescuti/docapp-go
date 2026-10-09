import type { SeccionPdf } from "@/utils/pdf";

/**
 * Contenido de los resultados de ejemplo, por estudio. Son valores ficticios para la demo: el
 * PDF los muestra con un aviso de que no tienen validez médica. Con backend, el resultado real
 * llega como archivo.
 */
export const resultadosEstudiosMock: Record<string, SeccionPdf[]> = {
  "est-1": [
    {
      titulo: "Resultados",
      tabla: {
        encabezado: ["Determinación", "Resultado", "Valores de referencia"],
        filas: [
          ["Hemoglobina", "13,8 g/dL", "12,0 - 16,0 g/dL"],
          ["Hematocrito", "41 %", "36 - 46 %"],
          ["Glóbulos blancos", "6.800 /mm3", "4.000 - 10.000 /mm3"],
          ["Plaquetas", "250.000 /mm3", "150.000 - 400.000 /mm3"],
          ["Glucemia", "92 mg/dL", "70 - 100 mg/dL"],
          ["Colesterol total", "185 mg/dL", "Menor a 200 mg/dL"],
        ],
      },
    },
    { titulo: "Observaciones", lineas: ["Valores dentro de los rangos de referencia."] },
  ],
  "est-2": [
    {
      titulo: "Informe",
      lineas: [
        "Ritmo sinusal regular.",
        "Frecuencia cardíaca: 72 latidos por minuto.",
        "Eje eléctrico normal.",
        "Sin alteraciones de la repolarización.",
      ],
    },
    { titulo: "Conclusión", lineas: ["Electrocardiograma dentro de parámetros normales."] },
  ],
  "est-3": [
    {
      titulo: "Informe",
      lineas: [
        "Campos pulmonares sin infiltrados ni consolidaciones.",
        "Silueta cardíaca de tamaño normal.",
        "Senos costofrénicos libres.",
      ],
    },
    { titulo: "Conclusión", lineas: ["Sin hallazgos patológicos."] },
  ],
};
