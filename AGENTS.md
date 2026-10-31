# CarRequest - memoria del proyecto

Lee esto primero. Actualiza la sección "Estado" (y lo que haya cambiado) al terminar cada sesión.

## Qué es
Tablero semanal para organizar los pedidos de vehículos de subastas japonesas que un superior le pasa a Dan (dev). Reemplaza el desorden de WhatsApp. El superior usa sobre todo el móvil; Dan usa PC. Mobile-first.

## Decisiones tomadas (no reabrir sin que Dan lo pida)
- Nombre: **CarRequest**.
- Días **lunes a sábado, sin fechas**. Semana tipo que se repite: lo que se busca el lunes se busca todos los lunes.
- **No hay entrada de "pegar mensajes de WhatsApp"**: Dan quiere obligar al superior a mandar la información ordenada.
- Formulario: un campo por dato, **todos opcionales**: Modelo, Subasta, Chasis, Año, Grado, Km, Color, Puntaje, Precio, Nota.
- **No se guarda un pedido vacío**: el botón queda desactivado ("Llena al menos un dato") mientras ningún campo tenga texto.
- **Varios modelos en un pedido**: junto al campo Modelo hay un botón "+" (solo al **crear**, máx. 10) que agrega otra caja de modelo debajo (cada una con × para quitarla). Se guarda **una fila por modelo** con los mismos datos del resto del formulario, para que cada modelo sea una tarjeta independiente (se busca por separado). Rangos de años: se escriben en el campo Año como texto, p. ej. `2018-2022`. Con varios modelos se usa la acción `crearVarios` de Code.gs (una sola petición, filas = modelos x días); con un solo modelo se siguen usando `crear` / `crearEnTodos`.
- **Formatos de los campos** (todo es texto libre; la hoja no los convierte porque las columnas son texto): varios valores separados por **coma y espacio** (`3, 3.5, 4`, varios chasis, varias subastas, varios grados como `G, X, S`) y rangos como `80000 - 90000` (Km), `3 - 5` (Puntaje), `68 - 70.5` (Precio), `2018-2022` (Año). Decimales con **punto** (la coma es separador de lista). La app solo recorta espacios sobrantes al guardar; no reescribe comas ni guiones (el puntaje puede ser `4 C-C`). Para parsearlos después (fase 3 / análisis) hay que partir por `, ` y por ` - `.
- **Subasta**: tiene su propio botón "+" (también al editar) para varias casas (p. ej. TAA Chubu, TAA Kinki); se guardan **en una sola celda** separadas por `, ` (no crea filas aparte, a diferencia de Modelo). También se puede escribir con comas en una sola caja. Chasis es un solo campo de texto con comas.
- Selector "Para el día" del formulario: Lunes a Sábado y, **solo al crear**, la opción **"Todos los días"** (primera de la lista). En edición no aparece.
- **Sin estado** en las tarjetas por ahora (Pendiente/En proceso/Hecho ocultos; quizá vuelva como columna `estado`).
- Iconos bajo cada tarjeta, separados por línea fina: editar, copiar a otro día, copiar a toda la semana, eliminar (rojo, al final). Copiar a la semana y eliminar piden confirmación (`window.confirm`).
- Cabecera: **icono animado `Rueda`** (anillos y arcos concéntricos que giran; adaptado de un loader de Uiverse.io de Nawsome; `Rueda.tsx` + `Rueda.css`, sin styled-components; azul `#1F5A9E` y carbón `#23262B`; 48 px; las capas se separan al pasar el ratón; se detiene con `prefers-reduced-motion`) a la izquierda del título, en la misma fila que "CarRequest" (el título lleva degradado de texto, gris carbón `#23262B` a azul `#1F5A9E`, mitad y mitad con mezcla en el centro, con `bg-clip-text`); subtítulo debajo (solo PC) alineado con el título; relojes de **Japón** (`Asia/Tokyo`) y **Bolivia** (`America/La_Paz`); botón Actualizar con icono de dos flechas circulares (estilo refresh-cw) que gira mientras carga.
- Solo lo usan dos personas.
- **Sin backend propio ni Supabase/BD**: datos en **Google Sheets + Apps Script**.
- **Sin servicios de terceros por ahora** (nada de ntfy, Firebase, etc.) hasta explorar todas las opciones. Fuentes autoalojadas con `@fontsource/dm-sans`.
- **Sin refrescos automáticos**: actualización **manual**. La app lee la hoja al abrirse y al pulsar "Actualizar"; cada escritura devuelve el tablero completo y refresca la pantalla de quien la hizo. Nada de polling ni de lectura al volver a la pestaña. (El API admite `GET ?since=`, hoy sin usar.)
- Hosting estático gratuito (Vercel; Cloudflare Pages o GitHub Pages también valen).
- Fase 3 (traer datos de la página de subastas) la automatiza Dan por su cuenta con agentes. **Fuera de este proyecto.**

## Stack
Vite 5 + React 18 + TypeScript (strict) + Tailwind 3 + PWA (`vite-plugin-pwa`). Sin librería de estado ni de rutas.

## Estructura
- `src/App.tsx`: `App` resuelve token/URL; `Aplicacion` es la pantalla principal (estado, acciones, modales, avisos).
- `src/storage.ts`: **único acceso a datos** (token, caché local, API de Apps Script). Funciones internas `leer`/`enviar`/`escribir`; `crearApi(token)` expone `listar`, `crear`, `crearEnTodos`, `editar`, `eliminar`, `copiar`, `copiarSemana`. Si cambia el almacenamiento, solo se toca este archivo.
- `src/types.ts`: `DIAS`, `CAMPOS`, `Pedido`, `DatosPedido`. `src/util.ts`: día de hoy, relojes, resumen de tarjeta, TSV, portapapeles, `useMediaQuery`.
- `src/components/`: `Cabecera`, `Rueda` (+ `Rueda.css`), `Relojes`, `VistaDia` (móvil), `Tablero` (PC, >= 768 px), `Tarjeta`, `Formulario` (exporta `DiaOTodos = Dia | 'todos'`), `SelectorDias`, `Hoja` (modal), `PantallaToken`, `Iconos`.
- `.env.local` (no se sube a git): `VITE_API_URL` = URL `/exec` de Apps Script. `.env.example` es la plantilla.

## Datos (hoja "Pedidos")
`id | dia | modelo | subasta | chasis | anio | grado | km | color | puntaje | precio | nota | orden | actualizado`
- `dia`: `lunes|martes|miercoles|jueves|viernes|sabado` (sin tildes). Todo se guarda como texto.
- API (ver cabecera de `Code.gs`): `GET ?token=T` lista; `POST` con cuerpo JSON y `Content-Type: text/plain` para `crear`, `editar`, `eliminar`, `copiar` (`dias:[...]`), `copiarSemana`, `crearVarios` (`items:[...]`, `dias:[...]`; máx. 20 items). Toda escritura responde `{ ok, version, resultado, items }`; `crear` devuelve `resultado.id`.
- **"Todos los días"** = `crearEnTodos`: `crear` en lunes y luego `copiarSemana` con el id devuelto (2 peticiones, sin cambiar Apps Script). Si falla la segunda, queda solo en lunes y se muestra un error explicándolo.
- El **token** no va en el código ni en este archivo: se guarda en localStorage. Primera vez: abrir la app con `?token=...` en la URL (se guarda y se quita de la barra) o pegarlo en la pantalla de token. Si el servidor responde "No autorizado", se borra y se pide de nuevo.
- `Code.gs` vive en el proyecto de Apps Script de la hoja. Conviene copiarlo a `apps-script/Code.gs` en esta carpeta como respaldo. Si se cambia, hay que crear una **versión nueva** de la implementación (la URL se mantiene).

## Cómo correr
1. `npm install`
2. `npm run dev` y abrir `http://localhost:5173/?token=EL_TOKEN` (solo la primera vez).
3. Compilar: `npm run build` (ejecuta `tsc` antes de Vite).

## Diseño
- Mockups: https://claude.ai/artifact/N3zKxorL3g3QYq65RyiPmk
- Colores (en `tailwind.config.js`): `fondo #F3F5F7`, `tinta #14202B`, `suave #566371`, `acento #1F5A9E` (azul, antes verde azulado `#0B5C63`), `acento-claro #E5EDF6`, `borde #E1E5E9`, `borde2 #D9DEE3`, `peligro #9A2C20`. Fuente DM Sans.
- Móvil: pestañas Lun-Sáb con conteo, lista del día, botón flotante "+". PC: 6 columnas, botones Nuevo pedido, Copiar TSV (semana) y Actualizar.
- Tablero (PC): **todas las columnas llevan el mismo relleno** (`p-2`); "hoy" solo cambia el fondo (`acento-claro`), así nada se desalinea. Cada cabecera de día tiene altura fija y una línea fina debajo; botón "+" para agregar a ese día.
- Zonas táctiles >= 44 px en móvil. Textos en español.
- Botones: clases `fx-btn fx-btn--primary|secondary fx-btn--shine` (definidas en `src/index.css`): al pasar el ratón se elevan 1 px y un brillo cruza el botón; el primario oscurece y gana sombra, el secundario se tiñe de azul claro. Solo con ratón (`hover: hover`), se anulan con `prefers-reduced-motion`. Los iconos de la tarjeta tienen fondo azul claro al pasar el ratón (rojo claro el de eliminar). Si Dan pasa su propio CSS de `fx-btn`, reemplazar ese bloque conservando los nombres de clase.
- Formulario de pedido: **pantalla completa en móvil** (no se cierra pulsando fuera); en PC es un diálogo centrado que sí se cierra al pulsar fuera. "Cancelar" es un botón con borde. `Hoja` acepta `completa`; "Copiar a otro día" sigue siendo hoja inferior.
- TSV sin fila de cabecera (la semana lleva columna Día; el día suelto no).

## Cómo prefiere trabajar Dan
- Responder en español. Pide cambios pequeños y concretos, a menudo con capturas de pantalla.
- Quiere este archivo al día por si se le acaban los tokens: actualizarlo tras cada cambio relevante.
- No usar servicios de terceros ni refrescos automáticos sin que él lo pida.

## Estado
- [x] Mockups.
- [x] Apps Script desplegado y token generado (Dan probó lectura y escritura: OK).
- [x] Proyecto creado y funcionando en `npm run dev` (Dan ya lo vio en el navegador): lectura, crear, editar, eliminar, copiar a otros días, copiar a la semana, relojes, actualizar manual, Copiar TSV, PWA básica.
- [x] Ajustes visuales: tablero alineado con línea bajo cada cabecera de día, rueda animada, nuevo icono de actualizar.
- [x] Opción "Todos los días" al crear un pedido (escrita; **sin confirmar aún que funcione de punta a punta**).
- [ ] Confirmar que `npm run build` (`tsc`) compila sin errores.
- [ ] Probar flujo completo en móvil real (PWA instalada) y en PC, incluido "Todos los días".
- [ ] Iconos PNG 192/512 para la PWA (hoy solo `public/icon.svg`).
- [ ] Respaldo de `Code.gs` en `apps-script/`.
- [ ] Despliegue en Vercel (variable `VITE_API_URL`).
- [x] `Code.gs` actualizado por Dan en Apps Script con la acción `crearVarios` (confirmado; falta probar guardar varios modelos). Si da "Falta actualizar Code.gs", comprobar que creó una versión nueva de la implementación.
- [ ] Autocompletar (propuesto, **pendiente de que Dan elija**): lista guardada en una pestaña "Opciones" de la hoja (`campo | valor`, una fila por valor) para Modelo, Subasta, Color, Grado y Puntaje, más los valores ya usados en los pedidos; los valores nuevos se agregan solos al guardar; en el formulario con `<datalist>` (o botones rápidos para Subasta). Requiere cambiar `Code.gs` y crear versión nueva. Alternativa mínima: solo sugerir valores ya usados en los pedidos (sin tocar `Code.gs`).
- [ ] Ideas futuras (solo si Dan las pide): estado de pedidos con reinicio semanal, arrastrar tarjetas entre días en PC, aviso en tiempo real (hoy descartado).
