import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Keyboard, LayoutChangeEvent, PanResponder, Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { withLayoutContext } from "expo-router";
import { createNavigatorFactory, TabRouter, useNavigationBuilder } from "expo-router/react-navigation";

/**
 * Navegador de pestañas que se recorren deslizando (con la pantalla siguiendo al dedo) o tocando la
 * barra. Es propio, en vez del pager nativo de `react-native-pager-view`, por una razón: el pager
 * nativo de Android toma el gesto en cuanto el dedo se corre unos píxeles hacia el costado, sin fijarse
 * si el movimiento es mayormente vertical, así que un scroll hacia arriba o abajo con un poco de deriva
 * lateral cambiaba de pestaña. Acá el gesto solo cuenta como "deslizar de pestaña" si es claramente
 * horizontal (ver las constantes de abajo), y cualquier scroll vertical queda para la pantalla.
 *
 * Los scrolls horizontales de adentro (carrusel del Inicio, tira de días, chips) siguen funcionando:
 * el sistema los toma antes de que el movimiento llegue al mínimo que pide el pager.
 */

/**
 * Las animaciones corren en el hilo nativo (UI): mientras el dedo arrastra, JS solo le pasa la posición,
 * y el movimiento de la pantalla y de la barra (indicador, íconos, etiquetas) lo calcula el sistema.
 * Si corrieran en JS, cada cuadro necesitaría varias actualizaciones desde el hilo de JS y se entrecortarían
 * en cuanto ese hilo se ocupa (por ejemplo, al cargar los datos de la pestaña nueva). Web no tiene driver nativo.
 */
const NATIVO = Platform.OS !== "web";

/** Cuánto tiene que moverse el dedo en horizontal (px) antes de que el pager reclame el gesto. */
const MOVIMIENTO_MINIMO = 14;
/** El movimiento horizontal tiene que ser al menos esta cantidad de veces el vertical (≈ 22° de inclinación como máximo). */
const RAZON_HORIZONTAL = 2.5;
/** Fracción del ancho que hay que arrastrar para pasar de pestaña al soltar. */
const UMBRAL_DISTANCIA = 0.3;
/** Velocidad (px/ms) a partir de la cual un gesto corto también pasa de pestaña (un "latigazo"). */
const UMBRAL_VELOCIDAD = 0.45;
/** Cuánto del arrastre se transmite al intentar pasar del borde (primera/última pestaña). */
const RESISTENCIA_BORDE = 0.25;

interface RutaPestana {
  key: string;
  name: string;
}

/** Opciones de cada pestaña (se pasan en `<PestanasDeslizables.Screen options={...} />`). */
export interface OpcionesPestana {
  title?: string;
  tabBarAccessibilityLabel?: string;
  tabBarIcon?: (props: { focused: boolean; color: string }) => React.ReactNode;
  sceneStyle?: StyleProp<ViewStyle>;
}

interface DescriptorPestana {
  options: OpcionesPestana;
  render: () => React.ReactNode;
}

/** Lo que recibe la barra de abajo (mismo contrato que `BarraPestanas`). */
export interface PropsBarraPestanas {
  state: { index: number; routes: RutaPestana[] };
  descriptors: Record<string, DescriptorPestana>;
  position: Animated.AnimatedInterpolation<number>;
  layout: { width: number };
  jumpTo: (key: string) => void;
}

interface NavegadorProps {
  id?: string;
  initialRouteName?: string;
  backBehavior?: "firstRoute" | "initialRoute" | "order" | "history" | "fullHistory" | "none";
  children?: React.ReactNode;
  screenOptions?: OpcionesPestana;
  screenListeners?: unknown;
  /** Barra de pestañas, abajo. */
  tabBar: (props: PropsBarraPestanas) => React.ReactNode;
  /** false: no se puede pasar de pestaña deslizando (solo tocando la barra). */
  swipeEnabled?: boolean;
}

const limitar = (valor: number, min: number, max: number) => Math.min(Math.max(valor, min), max);

function NavegadorPestanas({ id, initialRouteName, backBehavior, children, screenOptions, screenListeners, tabBar, swipeEnabled = true }: NavegadorProps) {
  // Los tipos de `useNavigationBuilder` son muy genéricos: se usan los de este archivo.
  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder(TabRouter, {
    id,
    initialRouteName,
    backBehavior,
    children,
    screenOptions,
    screenListeners,
  } as never) as unknown as {
    state: { index: number; routes: RutaPestana[] };
    descriptors: Record<string, DescriptorPestana>;
    navigation: { navigate: (name: string) => void };
    NavigationContent: React.ComponentType<{ children: React.ReactNode }>;
  };

  const { index, routes } = state;
  const [ancho, setAncho] = useState(0);

  // Posición del pager en px: 0 = primera pestaña, -ancho = segunda, etc.
  const panX = useRef(new Animated.Value(0)).current;
  const valorX = useRef(0);
  const indiceRef = useRef(index);
  const anchoRef = useRef(0);
  const cantidadRef = useRef(routes.length);
  const origenArrastre = useRef(0);
  const destinoAnimado = useRef<number | null>(null);
  // Hay un resorte en marcha: mientras dura (unos 200 ms) no se toma otro gesto, así no hay saltos.
  const animando = useRef(false);
  const contadorAnimaciones = useRef(0);
  const swipeRef = useRef(swipeEnabled);
  const rutasRef = useRef(routes);
  const navegarRef = useRef(navigation.navigate);

  indiceRef.current = index;
  anchoRef.current = ancho;
  cantidadRef.current = routes.length;
  swipeRef.current = swipeEnabled;
  rutasRef.current = routes;
  navegarRef.current = navigation.navigate;

  // Las pantallas que ya se visitaron se quedan armadas; las de al lado se preparan para que no aparezcan vacías al deslizar.
  const visitadas = useRef(new Set<string>());
  visitadas.current.add(routes[index].key);

  const irA = useCallback(
    (indiceDestino: number, velocidadPxPorMs = 0) => {
      if (!anchoRef.current) return;
      const objetivo = -indiceDestino * anchoRef.current;
      destinoAnimado.current = indiceDestino;
      animando.current = true;
      // El resorte espera px/s; un valor no numérico (o absurdo) lo dejaría sin terminar nunca.
      const velocidad = Number.isFinite(velocidadPxPorMs) ? limitar(velocidadPxPorMs * 1000, -4000, 4000) : 0;
      // Seguro: aunque el resorte no avise que terminó, el pager vuelve a tomar gestos en poco tiempo.
      const idAnimacion = ++contadorAnimaciones.current;
      setTimeout(() => {
        if (contadorAnimaciones.current === idAnimacion) animando.current = false;
      }, 600);
      // Se asume que termina en el destino: es lo que se usa como punto de partida del próximo gesto.
      valorX.current = objetivo;
      Animated.spring(panX, {
        toValue: objetivo,
        velocity: velocidad,
        stiffness: 520,
        damping: 46,
        mass: 1,
        overshootClamping: true,
        useNativeDriver: NATIVO,
      }).start(() => {
        animando.current = false;
        if (destinoAnimado.current === indiceDestino) destinoAnimado.current = null;
      });
    },
    [panX],
  );

  // Cuando cambia la pestaña por cualquier motivo (la barra, un link, "volver") el pager se acomoda con animación.
  useEffect(() => {
    if (ancho > 0 && destinoAnimado.current !== index) irA(index);
  }, [index, ancho, irA]);

  const alMedir = (e: LayoutChangeEvent) => {
    const nuevo = e.nativeEvent.layout.width;
    if (nuevo === anchoRef.current) return;
    // Si cambia el ancho (rotación) la pestaña actual se vuelve a encuadrar sin animar.
    const encuadre = -indiceRef.current * nuevo;
    panX.setValue(encuadre);
    valorX.current = encuadre;
    // Una animación nativa instantánea pasa todo lo que depende de `panX` (la pantalla y la barra) al hilo nativo.
    if (NATIVO) Animated.timing(panX, { toValue: encuadre, duration: 0, useNativeDriver: true }).start();
    setAncho(nuevo);
  };

  const gesto = useMemo(
    () =>
      PanResponder.create({
        // Solo se reclama un gesto claramente horizontal y que tenga adónde ir. El resto (scroll vertical, taps) no se toca.
        onMoveShouldSetPanResponder: (_, g) => {
          if (!swipeRef.current || animando.current) return false;
          if (Math.abs(g.dx) < MOVIMIENTO_MINIMO) return false;
          if (Math.abs(g.dx) < Math.abs(g.dy) * RAZON_HORIZONTAL) return false;
          if (g.dx > 0 && indiceRef.current <= 0) return false;
          if (g.dx < 0 && indiceRef.current >= cantidadRef.current - 1) return false;
          return true;
        },
        onPanResponderGrant: () => {
          Keyboard.dismiss();
          destinoAnimado.current = null;
          // La pestaña está quieta (no se toman gestos mientras hay un resorte): el punto de partida es su posición.
          origenArrastre.current = -indiceRef.current * anchoRef.current;
        },
        onPanResponderMove: (_, g) => {
          const ultimo = -(cantidadRef.current - 1) * anchoRef.current;
          const crudo = origenArrastre.current + g.dx;
          // Más allá de los bordes el pager se resiste, como un elástico.
          const valor = crudo > 0 ? crudo * RESISTENCIA_BORDE : crudo < ultimo ? ultimo + (crudo - ultimo) * RESISTENCIA_BORDE : crudo;
          valorX.current = valor;
          panX.setValue(valor);
        },
        onPanResponderRelease: (_, g) => {
          const ancho = anchoRef.current;
          const actual = indiceRef.current;
          let destino = actual;
          if (ancho > 0 && (Math.abs(g.dx) > ancho * UMBRAL_DISTANCIA || Math.abs(g.vx) > UMBRAL_VELOCIDAD)) {
            destino = limitar(actual + (g.dx < 0 ? 1 : -1), 0, cantidadRef.current - 1);
          }
          irA(destino, g.vx);
          if (destino !== actual) navegarRef.current(rutasRef.current[destino].name);
        },
        // Si otro componente se queda con el gesto, el pager vuelve a la pestaña más cercana.
        onPanResponderTerminate: () => {
          const cercano = limitar(Math.round(-valorX.current / (anchoRef.current || 1)), 0, cantidadRef.current - 1);
          irA(cercano);
          if (cercano !== indiceRef.current) navegarRef.current(rutasRef.current[cercano].name);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [panX, irA],
  );

  const position = useMemo(() => (ancho > 0 ? Animated.divide(panX, -ancho) : new Animated.Value(index)), [ancho, panX, index]);
  const jumpTo = useCallback((key: string) => {
    const ruta = rutasRef.current.find((r) => r.key === key);
    if (ruta) navegarRef.current(ruta.name);
  }, []);

  return (
    <NavigationContent>
      <View style={styles.raiz}>
        <View style={styles.zonaPaginas} onLayout={alMedir}>
          <Animated.View
            style={[styles.fila, ancho > 0 ? { width: routes.length * ancho, transform: [{ translateX: panX }] } : null]}
            {...gesto.panHandlers}
          >
            {routes.map((ruta, i) => {
              const enfocada = i === index;
              const armada = enfocada || Math.abs(i - index) <= 1 || visitadas.current.has(ruta.key);
              return (
                <View
                  key={ruta.key}
                  // Mientras no se mide, solo se ve la pestaña actual, ocupando todo.
                  style={[ancho > 0 ? { width: ancho } : enfocada ? StyleSheet.absoluteFill : styles.oculta, descriptors[ruta.key].options.sceneStyle]}
                  aria-hidden={!enfocada}
                  importantForAccessibility={enfocada ? "auto" : "no-hide-descendants"}
                  accessibilityElementsHidden={!enfocada}
                >
                  {armada ? descriptors[ruta.key].render() : null}
                </View>
              );
            })}
          </Animated.View>
        </View>
        {tabBar({ state, descriptors, position, layout: { width: ancho }, jumpTo })}
      </View>
    </NavigationContent>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  zonaPaginas: { flex: 1, overflow: "hidden" },
  fila: { flex: 1, flexDirection: "row", alignItems: "stretch" },
  oculta: { width: 0, overflow: "hidden" },
});

const { Navigator } = createNavigatorFactory(NavegadorPestanas as never)();

/** Pestañas deslizables integradas con las rutas de Expo Router (`<PestanasDeslizables.Screen name="..." />`). */
export const PestanasDeslizables = withLayoutContext(Navigator as never) as unknown as React.ForwardRefExoticComponent<
  Omit<NavegadorProps, "children"> & { children?: React.ReactNode }
> & { Screen: React.ComponentType<{ name: string; options?: OpcionesPestana }> };
