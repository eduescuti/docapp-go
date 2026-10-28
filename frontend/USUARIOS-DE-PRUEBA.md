# Usuarios de prueba

Cuentas y datos para probar la app contra el backend (`DocApp Go (backend)/backend`). Las cuentas, el padrón y
los datos de ejemplo los carga el **seed** del backend: `npm run db:seed` borra la base y la vuelve a dejar como
está descripto acá (útil si una prueba la desordenó).

Las rutas de este documento son **relativas a la carpeta `frontend/`**, salvo que digan `backend/`.

> **Todo se guarda en la base** (desde el 28/10/2026). Lo único que queda en el teléfono es el aviso "Nuevo" de
> los resultados, el tema claro / oscuro y la huella. Para volver a los datos de este documento, corré el seed.

---

## 1. Inicio de sesión

Se ingresa con **DNI + contraseña**. El rol lo define la cuenta, no se elige en pantalla.

| Rol | DNI | Contraseña | Entra como |
|---|---|---|---|
| Administrador | `admin` | `Admin123$` | Panel de administración (única cuenta admin) |
| Paciente | `12345678` | `Paciente123$` | Sofía Martínez (OSDE 210) |
| Paciente | `38456123` | `Paciente123$` | Lucas Gómez (Swiss Medical SMG20) |
| Paciente | `41789654` | `Paciente123$` | Martina López (OSDE 210) |
| Paciente | `29654987` | `Paciente123$` | Diego Herrera (Galeno Oro) |
| Paciente | `33123456` | `Paciente123$` | Ana Benítez (Medifé Plan 3000) |
| Paciente | `44987321` | `Paciente123$` | Tomás Romero (OSDE 210) |
| Profesional | `42300300` | `Medico123$` | Valeria Sosa (Enfermero, Mat. 132043) |
| Profesional | `30000001` … `30000009` | `Medico123$` | Méndez, Ruiz, Castro, Fernández, López, Giménez, Paz, Vega y Herrera, en ese orden (DNI ficticios) |

- El DNI acepta puntos o espacios (`42.300.300` funciona igual).
- Si el DNI o la contraseña no coinciden, el mensaje es siempre "DNI o contraseña incorrectos." (no revela cuál
  de los dos falló). Con 5 fallos seguidos del mismo DNI en 15 minutos se bloquea un rato.
- **La sesión queda iniciada** en el celular hasta que se cierra sesión o pasan 90 días sin usar la app. En web
  (navegador) dura mientras no se recargue la página.
- Las cuentas están en `backend/prisma/datos/demo.json` (contraseñas en `backend/src/seed.ts`); en la base solo
  queda el hash de la contraseña.

### Qué ve cada uno según su cobertura (reglas 15 y 18)

Un paciente ve los establecimientos **públicos** y los privados que aceptan **su obra social y plan**, y los
turnos de profesionales que atienden su cobertura en esos lugares. Con el seed de coberturas, además de los
públicos:

| Plan | Ve | No ve |
|---|---|---|
| OSDE 210 (Sofía) | Británico, Güemes, Otamendi, Finochietto, Anchorena, Los Arcos, Suizo Argentina | Alemán (solo OSDE Binario), Italiano (OSDE 310 en adelante) |
| Swiss Medical SMG20 | Alemán, Británico, Finochietto, Anchorena, Los Arcos, Suizo Argentina | Italiano y Otamendi (planes altos) |
| Galeno Oro | Alemán, Británico, Güemes, Finochietto, Anchorena, Los Arcos, Suizo Argentina | Italiano, Otamendi |
| Medifé Plan 3000 | Alemán | Italiano (Plata 460 en adelante) y el resto |

Para ver el caso "sin hospitales privados", cambiá la obra social en Menú → Mi perfil por una sin coberturas
cargadas (p. ej. OSECAC).

Valeria Sosa atiende OSDE, Swiss Medical, Galeno y Medifé, en el Hospital Italiano (lunes y miércoles) y el
CESAC Nº 33 (martes a viernes). Con Sofía (OSDE 210) sus turnos del Italiano no aparecen: el Italiano no acepta
ese plan.

---

## 2. Verificación del DNI (los dos registros)

Desde el 28/10/2026 los dos registros empiezan escaneando con la cámara el **código de barras (PDF417) del frente
del DNI**. Para probar sin un DNI real, abrí **[`dni-de-prueba.html`](dni-de-prueba.html)** en la computadora (doble
clic, se abre en el navegador) y escaneá el código con la app en el celular. Son datos **ficticios** con el mismo
formato que el DNI:

| Código | DNI | Para |
|---|---|---|
| Lucía García | `40111222` | Registro de paciente |
| Nicolás Romero | `40111333` | Registro de paciente |
| Juan Fernández · Martín Acosta · Paula Ríos · Federico Luna | `40123456` · `30111222` · `35222333` · `36555777` | Registro de profesional (coinciden con las fichas de la tabla de abajo) |

- Cada DNI abre **una sola cuenta**: para volver a usarlo, corré el seed.
- En web también anda con la cámara de la computadora (el navegador pide permiso), aunque leer un PDF417 con una
  webcam cuesta más: el celular es más cómodo.
- Lo que se guarda y lo que no: `DocApp Go (backend)/docs/06-reglas-de-negocio.md#verificación-de-identidad-del-registro`.

## 3. Registro de profesional

El registro busca la terna **DNI + matrícula + profesión** primero en la copia del padrón que tiene la base y,
si no está, en el buscador nacional REFEPS en línea. Si la matrícula está habilitada y el DNI no tiene cuenta, el
flujo pasa por los 3 pasos: escanear el DNI + datos (más género y especialidad) → "¿Esta es tu información?" →
"Crear cuenta". El DNI no se escribe: sale del código escaneado, y tiene que ser de la misma persona que la ficha. La
especialidad se elige entre las de su profesión (médicas: Res. 1814/2015; enfermería: Res. 199/2011), con
buscador. Al
crearla entra directo; después carga en su Perfil **dónde atiende** y **qué coberturas acepta**, y en Agenda →
Mis horarios **sus horarios**.

Usá cualquier contraseña que cumpla los requisitos, por ejemplo `Segura#2026`.

| DNI | Matrícula | Profesión | Profesional | Resultado esperado |
|---|---|---|---|---|
| **`40123456`** | **`154321`** | **Kinesiólogo** | Juan Fernández | **Ficha de demo** (son los placeholders del formulario): crea la cuenta |
| `30111222` | `145872` | Médico | Martín Acosta | Crea la cuenta |
| `35222333` | `128904` | Enfermero | Paula Ríos | Crea la cuenta |
| `36555777` | `117650` | Kinesiólogo | Federico Luna | Crea la cuenta |
| `28444555` | `109331` | Médico | Jorge Pereyra | ❌ Rechazado: matrícula suspendida |
| `42300300` | `132043` | Enfermero | Valeria Sosa | ❌ Rechazado: ya tiene cuenta |

> Las matrículas de las fichas de prueba son ficticias, pero en el REFES real pertenecen a otras personas: por
> eso el backend mira primero su copia del padrón. Un profesional real que no esté en la copia se verifica en
> línea.

Para repetir una prueba con la misma ficha, volvé a correr el seed (la cuenta creada se borra).

Las fichas del padrón están en `backend/prisma/datos/demo.json` (`padron`).

---

## 4. Registro de paciente

Primero escanea el DNI (sección 2): nombre, apellido y DNI salen de ahí y no se escriben. Después pide obra social,
plan (solo si la obra social tiene más de uno) y contraseña. Crea la cuenta y entra directo.

| Campo | Ejemplo válido |
|---|---|
| DNI | Lucía García o Nicolás Romero de `dni-de-prueba.html` |
| Obra social y plan | cualquiera de la lista (26 obras sociales) |
| Contraseña | ej. `Segura#2026` |

Los DNI de la tabla de la sección 1 ya están en uso.

---

## 5. Reglas de contraseña (registro y cambio de contraseña)

- Al menos **8 caracteres**
- Al menos **una mayúscula**
- Al menos **un número**
- Al menos **un carácter especial** (`!@#$%...`)

Las valida la app al escribir ([`src/utils/validation.ts`](src/utils/validation.ts)) y **también el backend**
(`backend/src/validacion.ts`): lo que valida la app se puede saltear llamando a la API directo.
