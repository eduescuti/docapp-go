import { useEffect, useState } from "react";
import { useNavigation } from "expo-router";

/**
 * Sirve para soltar lo pesado cuando la pantalla queda tapada.
 */
export function useTabsEnFoco(): boolean {
  const padre = useNavigation().getParent();
  const [enFoco, setEnFoco] = useState(() => (padre ? padre.isFocused() : true));

  useEffect(() => {
    if (!padre) return;
    setEnFoco(padre.isFocused());
    const alEnfocar = padre.addListener("focus", () => setEnFoco(true));
    const alDesenfocar = padre.addListener("blur", () => setEnFoco(false));
    return () => {
      alEnfocar();
      alDesenfocar();
    };
  }, [padre]);

  return enFoco;
}
