# Usuarios de prueba

Datos para probar el **inicio de sesión (SignIn)** y el **registro (SignUp)** mientras la app
funciona con el "backend de ejemplo" en memoria (todavía no hay base de datos).

Todas las rutas de este documento son **relativas a la carpeta `frontend/`**.

> **Todo vive en memoria.** Lo que se cambia durante la prueba dura hasta que se recarga la
> app: contraseñas, obra social del perfil, feedback, notificaciones leídas, favoritos
> quitados, preferencia de tema, notas del profesional y las obras sociales o instituciones
> que cargue el admin. Al recargar vuelven los valores de estos archivos.

---

## 1. Inicio de sesión (SignIn)

Se ingresa con **DNI + contraseña**. El rol lo define la cuenta, no se elige en pantalla.

| Rol | DNI | Contraseña | Entra como |
|---|---|---|---|
| Administrador | `admin` | `Admin123$` | Panel de administración |
| Paciente | `12345678` | `Paciente123$` | Sofía Martínez (OSDE 210) |
| Profesional | `42300300` | `Medico123$` | Valeria Sosa (Enfermero, Mat. 132043) |

- El DNI acepta puntos o espacios (`42.300.300` funciona igual).
- Solo la cuenta `admin` / `Admin123$` abre el modo administrador.
- Si el DNI o la contraseña no coinciden, el mensaje es siempre "DNI o contraseña incorrectos."
  (no revela cuál de los dos falló).

### Dónde se modifican

| Qué | Archivo |
|---|---|
| Cuentas (DNI, contraseña, rol) | [`src/mocks/usuarios.ts`](src/mocks/usuarios.ts) → `usuariosMock` |
| Datos del paciente vinculado (`pacienteId`) | [`src/mocks/pacientes.ts`](src/mocks/pacientes.ts) → `pacientesMock` |
| Datos del profesional vinculado (`medicoId`) | [`src/mocks/medicos.ts`](src/mocks/medicos.ts) → `medicosMock` |
| Lógica de validación del login | [`src/services/authService.ts`](src/services/authService.ts) → `iniciarSesion()` |

**Para agregar una cuenta nueva:** sumá una entrada en `usuariosMock`.
- Si es `rol: "paciente"`, su `pacienteId` tiene que existir en `pacientesMock`.
- Si es `rol: "doctor"`, su `medicoId` tiene que existir en `medicosMock`.
- Si el id no existe, el login la rechaza.

Las contraseñas de estas cuentas no pasan por las reglas de seguridad del registro (el login
solo compara). Igual conviene que las cumplan, como las de la tabla.

---

## 2. Registro de profesional (SignUp)

El registro busca la combinación **DNI + matrícula + profesión** en el padrón mockeado (simula
el Buscador Nacional de Profesionales de la Salud). Si existe, la matrícula está habilitada y
el DNI todavía no tiene cuenta, el flujo pasa por los 3 pasos: datos → "¿Esta es tu
información?" → "Crear cuenta".

Usá cualquier contraseña que cumpla los requisitos, por ejemplo `Segura#2026`.

| DNI | Matrícula | Profesión | Profesional | Resultado esperado |
|---|---|---|---|---|
| **`40123456`** | **`154321`** | **Kinesiólogo** | Juan Fernández | **Ficha de demo** (son los placeholders del formulario): llega al último paso |
| `30111222` | `145872` | Médico | Martín Acosta | Llega al último paso |
| `35222333` | `128904` | Enfermero | Paula Ríos | Llega al último paso |
| `36555777` | `117650` | Kinesiólogo | Federico Luna | Llega al último paso |
| `28444555` | `109331` | Médico | Jorge Pereyra | ❌ Rechazado: matrícula suspendida |
| `42300300` | `132043` | Enfermero | Valeria Sosa | ❌ Rechazado: ya tiene cuenta |

Otros casos de error para probar:
- Una profesión que no coincide con la del padrón (ej. `30111222` + `145872` + Enfermero).
- Una contraseña débil (ej. `kine123`): no deja avanzar.

En el último paso, el botón **"Crear cuenta" está deshabilitado** hasta que exista la base de
datos.

### Dónde se modifican

| Qué | Archivo |
|---|---|
| Fichas del padrón | [`src/mocks/padronProfesionales.ts`](src/mocks/padronProfesionales.ts) → `padronProfesionalesMock` |
| Ficha de demo (placeholders del formulario) | [`src/mocks/padronProfesionales.ts`](src/mocks/padronProfesionales.ts) → `DNI_DEMO_REGISTRO` |
| Habilitar el botón "Crear cuenta" | [`src/services/authService.ts`](src/services/authService.ts) → `REGISTRO_HABILITADO` |
| Lógica de verificación contra el padrón | [`src/services/authService.ts`](src/services/authService.ts) → `verificarProfesional()` |

- Las profesiones del selector salen solas de las fichas del padrón. Si agregás una ficha con
  una profesión nueva, aparece en la lista.
- Para que una ficha **llegue al último paso** necesita `activo: true`, un `estadoMatricula`
  que empiece con "Habilitada" y un DNI que no esté en `usuariosMock`.
- Para cambiar la ficha de demo, cambiá `DNI_DEMO_REGISTRO` por el DNI de otra ficha del padrón.

> El padrón (`padronProfesionales.ts`) y el catálogo de profesionales (`medicos.ts`) son cosas
> distintas. El padrón es contra lo que se **verifica** el registro. `medicos.ts` son los
> profesionales **ya activos** en la app (los que ven los pacientes). El registro nunca lee
> `medicos.ts`.

---

## 3. Registro de paciente (SignUp)

Pide nombre, apellido, DNI, obra social y contraseña. Valida todo y muestra "¡Cuenta creada!",
pero **no guarda la cuenta** (no hay base de datos).

| Campo | Ejemplo válido |
|---|---|
| Nombre / Apellido | cualquiera |
| DNI | 7 u 8 dígitos que no estén en uso, ej. `40111222` |
| Obra social | cualquiera de la lista |
| Contraseña | ej. `Segura#2026` |

DNI que se **rechazan** por estar en uso: los de `usuariosMock` y los de los pacientes ya
cargados (`12345678`, `38456123`, `41789654`, `29654987`, `33123456`, `44987321`).

### Dónde se modifican

| Qué | Archivo |
|---|---|
| Obras sociales del selector | [`src/mocks/planesMedicos.ts`](src/mocks/planesMedicos.ts) → `planesMedicosMock` |
| Pacientes existentes (DNI en uso) | [`src/mocks/pacientes.ts`](src/mocks/pacientes.ts) → `pacientesMock` |
| Lógica del registro | [`src/services/authService.ts`](src/services/authService.ts) → `registrarPaciente()` |

---

## 4. Reglas de contraseña (registro y cambio de contraseña)

- Al menos **8 caracteres**
- Al menos **una mayúscula**
- Al menos **un número**
- Al menos **un carácter especial** (`!@#$%...`)

Se definen en [`src/utils/validation.ts`](src/utils/validation.ts) (`PASSWORD_MIN_LENGTH` y
`evaluarPassword()`).
