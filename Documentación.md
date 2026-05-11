# Documentación Técnica — PokéVGC Landing Page

## Índice

1. [Instrucciones de inicio/ejecución](#1-instrucciones-de-inicioejecución)
2. [Funcionalidades implementadas](#2-funcionalidades-implementadas)
3. [Funcionalidad 1 — Telón de apertura con scroll](#3-funcionalidad-1--telón-de-apertura-con-scroll)
4. [Funcionalidad 2 — Modo oscuro con persistencia](#4-funcionalidad-2--modo-oscuro-con-persistencia)
5. [Funcionalidad 3 — Navbar con scroll inteligente y sección activa](#5-funcionalidad-3--navbar-con-scroll-inteligente-y-sección-activa)
6. [Funcionalidad 4 — Carrusel de arquetipos con bucle infinito](#6-funcionalidad-4--carrusel-de-arquetipos-con-bucle-infinito)
7. [Funcionalidad 5 — Buscador de Pokémon con backend](#7-funcionalidad-5--buscador-de-pokémon-con-backend)
8. [Funcionalidad Backend — Servidor Node.js con Express](#8-funcionalidad-backend--servidor-nodejs-con-express)
9. [Responsividad](#9-responsividad)

---

## 1. Instrucciones de inicio/ejecución

El proyecto está compuesto por dos partes independientes que deben estar en funcionamiento simultáneamente: el **frontend** (archivos `index.html`, `styles.css` y `script.js` en la raíz del proyecto) y el **backend** (carpeta `backend/` con Node.js y Express). El frontend puede abrirse directamente en el navegador, pero el buscador de Pokémon no funcionará a menos que el servidor backend esté corriendo previamente.

### Requisitos previos

- **Node.js versión 18 o superior.** El backend usa la API `fetch` nativa de Node, que solo está disponible desde la versión 18. Comprueba tu versión con:

```bash
node --version
```

Si la versión es inferior a 18, descarga la versión LTS desde [nodejs.org](https://nodejs.org).

- **Editor de código recomendado:** Visual Studio Code con la extensión **Live Server** instalada.

### Pasos para arrancar el proyecto

**Paso 1.** Abre Visual Studio Code con la carpeta raíz del proyecto (la que contiene `index.html`).

**Paso 2.** Abre una terminal integrada con `Ctrl + ñ` (Windows) o desde el menú `Terminal → Nueva Terminal`.

**Paso 3.** Navega a la carpeta del backend:

```bash
cd backend
```

**Paso 4.** Instala las dependencias del servidor. Este paso solo es necesario la primera vez, o si se borra la carpeta `node_modules/`:

```bash
npm install
```

> **Problema frecuente en Windows (PowerShell):** si aparece el error `npm.ps1 no se puede cargar porque la ejecución de scripts está deshabilitada`, ejecuta este comando en PowerShell como Administrador y acepta con `S`:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Solución alternativa: usa el **Símbolo del sistema (CMD)** en lugar de PowerShell, donde este error no ocurre.

**Paso 5.** Arranca el servidor Node.js:

```bash
node server.js
```

Si todo va bien, verás en la terminal:

```
🟡 Servidor Pokémon corriendo en http://localhost:3000
   GET /api/pokemon/:name   → info completa
   GET /api/pokemon         → lista paginada
   GET /api/type/:type      → pokémon por tipo
   GET /api/search?q=bulba  → búsqueda por nombre
```

**Paso 6.** Con el servidor corriendo en segundo plano, abre `index.html` en el navegador. La forma recomendada es hacer clic derecho sobre `index.html` en VS Code y seleccionar **Open with Live Server**. También puedes arrastrarlo directamente al navegador.

> ⚠️ **Importante:** la terminal donde corre el servidor debe permanecer abierta en todo momento. Si la cierras, el servidor se apaga y el buscador dejará de funcionar, mostrando un error de red (`NetworkError when attempting to fetch resource`).

### Estructura de archivos del proyecto

```
proyecto/
├── index.html              ← Estructura HTML semántica de la página
├── styles.css              ← Todos los estilos, animaciones y media queries
├── script.js               ← Toda la lógica interactiva del frontend
├── Documentacion.md        ← Este documento técnico
├── img/                    ← Imágenes de Pokémon y arquetipos de equipo
└── backend/
    ├── server.js           ← Servidor Express: endpoints, caché y lógica
    └── package.json        ← Dependencias, scripts y configuración Node
```

---

## 2. Funcionalidades implementadas

El proyecto implementa las siguientes cinco funcionalidades principales. Todas están completamente integradas, son funcionales y demuestran comprensión técnica de JavaScript, CSS avanzado, APIs del navegador y arquitectura cliente-servidor:

1. **Telón de apertura con scroll** — Animación de entrada interactiva que bloquea el acceso al contenido hasta que el usuario interactúa. Implementada con una variable de progreso normalizada (`curtainProgress`), `translateX` en CSS y soporte para rueda del ratón, teclado y gestos táctiles.

2. **Modo oscuro con persistencia** — Sistema de temas claro/oscuro implementado mediante variables CSS (`custom properties`) que se sobreescriben al añadir una clase al `body`. Detecta automáticamente la preferencia del sistema operativo con `prefers-color-scheme` y persiste la elección del usuario en `localStorage`.

3. **Navbar con scroll inteligente y sección activa** — Barra de navegación fija que aparece y desaparece con transición suave usando `IntersectionObserver` (sin eventos `scroll`). Resalta automáticamente el enlace de la sección visible y realiza scroll suave compensando la altura de la barra.

4. **Carrusel de arquetipos con bucle infinito** — Carrusel de 6 tarjetas sin librerías externas, con animación de deslizamiento CSS y bucle infinito real implementado mediante clonado de nodos DOM y reposicionamiento invisible sincronizado con el evento `transitionend`.

5. **Buscador de Pokémon con backend** — Formulario de búsqueda que consulta un servidor Node.js propio (no la PokéAPI directamente), que filtra y cachea los datos. El resultado se renderiza dinámicamente con animación escalonada en las barras de estadísticas usando propiedades CSS personalizadas.

---

## 3. Funcionalidad 1 — Telón de apertura con scroll

### 3.1 Descripción del comportamiento (Qué hace)

Al cargar la página, un telón rojo dividido en dos mitades (izquierda y derecha) ocupa toda la pantalla, impidiendo el acceso al contenido. El usuario debe hacer scroll hacia abajo para abrir el telón: a medida que scrollea, las dos mitades se separan progresivamente hacia los laterales, mientras el texto central del telón se desvanece. El proceso es completamente reversible: si el usuario hace scroll hacia arriba estando en la parte superior de la página, el telón vuelve a cerrarse. Cuando las dos mitades han salido completamente de la pantalla, el scroll normal de la página queda desbloqueado y el usuario puede navegar con normalidad.

El efecto responde a tres tipos de input:
- **Rueda del ratón** (`wheel`): el telón se abre proporcional al delta del scroll.
- **Teclado**: `↓`, `Espacio` y `Av Pág` abren el telón; `↑` y `Re Pág` lo cierran.
- **Gestos táctiles**: deslizar el dedo hacia arriba abre el telón en dispositivos móviles.

### 3.2 Explicación del funcionamiento (Cómo lo hace)

El mecanismo central es una variable numérica llamada `curtainProgress` que actúa como estado único del telón, con valores entre `0` (completamente cerrado) y `1` (completamente abierto). Todos los inputs del usuario (scroll, tecla o swipe) incrementan o decrementan esta variable. Una función llamada `syncCurtain()` lee el valor actual de `curtainProgress` y lo traduce a posición visual aplicando `transform: translateX()` a cada mitad del telón.

El scroll de la página se bloquea añadiendo la clase `pre-opening` al `body` mientras `curtainProgress < 1`, usando `overflow: hidden`. Cuando el progreso llega a `1`, la clase se elimina y el usuario puede hacer scroll por el contenido de la página normalmente. El telón usa `position: fixed` para que siempre cubra la pantalla completa, independientemente de la posición de scroll actual.

### 3.3 Fragmentos de código más relevantes

---

**HTML — Estructura del telón** (`index.html`, líneas 14–22)

```html
<div id="curtain-wrapper">
    <div class="curtain left-curtain"></div>
    <div class="curtain right-curtain"></div>
    <div class="curtain-text">
        <h1>ENTRANDO AL ESTADIO</h1>
        <p>Haz scroll para empezar el combate</p>
        <div class="scroll-arrow">&#8595;</div>
    </div>
</div>
```

El telón está formado por tres elementos dentro de un contenedor: la mitad izquierda (`.left-curtain`), la mitad derecha (`.right-curtain`) y el bloque de texto central (`.curtain-text`). Los dos elementos `.curtain` son los que se mueven. El contenedor `curtain-wrapper` es el elemento de referencia que JavaScript busca al inicializarse.

---

**CSS — Bloqueo del scroll** (`styles.css`, líneas 154–157)

```css
body.pre-opening {
    overflow: hidden;
    height: 100vh;
}
```

Esta clase se añade y elimina desde `script.js` según el valor de `curtainProgress`. `overflow: hidden` impide que el usuario haga scroll en el contenido de la página. `height: 100vh` fija la altura del body al tamaño del viewport para reforzar el bloqueo en ciertos navegadores móviles.

---

**CSS — Posicionamiento y optimización del telón** (`styles.css`, líneas 218–228)

```css
.curtain {
    position: fixed;
    top: 0;
    width: 50%;
    height: 100%;
    background: var(--poke-red);
    z-index: 5;
    will-change: transform;
    transition: transform 0.18s linear;
}
```

- `position: fixed`: el elemento se posiciona relativo al viewport, no al documento. Esto garantiza que siempre cubra la pantalla completa aunque el usuario haya hecho scroll.
- `width: 50%`: cada mitad ocupa exactamente la mitad de la pantalla.
- `z-index: 5`: coloca el telón por encima de todo el contenido de la página.
- `will-change: transform`: avisa al navegador de que este elemento va a animarse con `transform`. El navegador lo mueve a su propia capa de composición en la GPU, mejorando el rendimiento de la animación.
- `transition: transform 0.18s linear`: suaviza el movimiento entre frames para que no sea brusco al responder al scroll.

Afecta a: ambas mitades del telón en `index.html` (`.left-curtain` y `.right-curtain`).

---

**JavaScript — Variable de estado** (`script.js`, línea 28)

```javascript
let curtainProgress = 0;
```

Es la única fuente de verdad del estado del telón. Vale `0` cuando está cerrado y `1` cuando está completamente abierto. Todos los demás valores intermedios representan estados parcialmente abiertos. Al ser la única variable de estado, cualquier función que necesite saber el estado del telón simplemente lee esta variable.

---

**JavaScript — `clamp()` — función auxiliar** (`script.js`, línea 38)

```javascript
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
```

Restringe un valor numérico a un rango. Si `value` es menor que `min`, devuelve `min`. Si es mayor que `max`, devuelve `max`. Se usa para garantizar que `curtainProgress` nunca salga del rango `[0, 1]` independientemente de cuánto scrollee el usuario.

---

**JavaScript — `syncCurtain()` — traducción del progreso a movimiento visual** (`script.js`, líneas 40–51)

```javascript
const syncCurtain = () => {
    leftCurtain.style.transform = `translateX(${-100 * curtainProgress}%)`;
    rightCurtain.style.transform = `translateX(${100 * curtainProgress}%)`;
    curtainText.style.opacity = String(1 - curtainProgress * 1.35);
    curtain.style.visibility = 'visible';

    if (curtainProgress < 1) {
        body.classList.add('pre-opening');
    } else {
        body.classList.remove('pre-opening');
    }
};
```

- `` `translateX(${-100 * curtainProgress}%)` ``: template literal de JavaScript que genera la cadena CSS. Cuando `curtainProgress = 0`, el resultado es `translateX(0%)` (sin mover). Cuando `curtainProgress = 1`, el resultado es `translateX(-100%)` (la mitad izquierda ha salido completamente por la izquierda).
- `` `translateX(${100 * curtainProgress}%)` ``: igual pero en dirección positiva para la mitad derecha.
- `1 - curtainProgress * 1.35`: calcula la opacidad del texto. El multiplicador `1.35` hace que el texto llegue a opacidad `0` antes de que el telón se abra del todo (cuando `curtainProgress ≈ 0.74`), lo que da una sensación visual más limpia.
- `body.classList.add/remove('pre-opening')`: gestiona el bloqueo del scroll según el progreso.

Esta función afecta a: `leftCurtain`, `rightCurtain` y `curtainText` (referencias a elementos del `index.html`), y a la clase `pre-opening` de `styles.css`.

---

**JavaScript — `updateCurtainProgress()` — procesamiento del input del usuario** (`script.js`, líneas 53–57)

```javascript
const updateCurtainProgress = (deltaY) => {
    const step = deltaY / 700;
    curtainProgress = clamp(curtainProgress + step, 0, 1);
    syncCurtain();
};
```

Recibe `deltaY` (píxeles de desplazamiento) y lo convierte en un cambio de progreso. El divisor `700` determina cuántos píxeles de scroll se necesitan para abrir el telón completamente (700px de scroll = progreso de 1.0). Un valor más bajo haría el telón más rápido de abrir; más alto, más lento. Tras actualizar `curtainProgress`, llama inmediatamente a `syncCurtain()` para reflejar el cambio visualmente.

---

**JavaScript — Evento de rueda del ratón** (`script.js`, líneas 62–74)

```javascript
window.addEventListener('wheel', (event) => {
    const atTop = window.scrollY <= 0;
    const shouldControlCurtain =
        curtainProgress < 1 ||
        (curtainProgress > 0 && atTop && event.deltaY < 0);

    if (!shouldControlCurtain) return;

    event.preventDefault();
    updateCurtainProgress(event.deltaY);
}, { passive: false });
```

- `window.scrollY <= 0`: comprueba si el usuario está en la parte superior del documento (no ha hecho scroll en el contenido de la página).
- `shouldControlCurtain`: la condición que decide si el evento de scroll debe controlar el telón o dejarse pasar normalmente. Es `true` cuando el telón no está completamente abierto, o cuando el usuario hace scroll hacia arriba desde el tope de la página (para volver a cerrarlo).
- `event.preventDefault()`: cancela el comportamiento normal del scroll para que el navegador no desplace el contenido de la página mientras el telón está activo.
- `{ passive: false }`: por defecto, los listeners de `wheel` son pasivos (no pueden llamar a `preventDefault()`). Este flag cambia ese comportamiento y es **obligatorio** para que `preventDefault()` funcione.
- `event.deltaY`: valor positivo al scrollear hacia abajo (abrir telón) y negativo al scrollear hacia arriba (cerrar telón). Se pasa directamente a `updateCurtainProgress()`.

---

**JavaScript — Soporte táctil** (`script.js`, líneas 76–96)

```javascript
let touchStartY = 0;
let touchLastY = 0;

window.addEventListener('touchstart', (event) => {
    touchStartY = event.touches[0].clientY;
    touchLastY = touchStartY;
}, { passive: true });

window.addEventListener('touchmove', (event) => {
    if (curtainProgress === 1) return;
    event.preventDefault();

    const currentY = event.touches[0].clientY;
    const deltaY = touchLastY - currentY;
    touchLastY = currentY;

    updateCurtainProgress(deltaY * 1.4);
}, { passive: false });
```

- `event.touches[0].clientY`: posición Y del primer dedo en la pantalla en píxeles desde la parte superior del viewport.
- `deltaY = touchLastY - currentY`: delta entre el frame anterior y el actual. Si el dedo sube (`currentY` disminuye), `deltaY` es positivo (abrir telón). Si baja, es negativo (cerrar).
- `touchLastY = currentY`: actualiza la referencia para el siguiente frame.
- `* 1.4`: multiplicador que hace el gesto táctil más sensible que el scroll de ratón, compensando que los gestos táctiles suelen tener deltas más pequeños que la rueda del ratón.

---

## 4. Funcionalidad 2 — Modo oscuro con persistencia

### 4.1 Descripción del comportamiento (Qué hace)

La barra de navegación incluye un botón con el icono 🌙 que al pulsarlo cambia toda la página al modo oscuro: fondos, tarjetas, textos, inputs, la navbar y el footer adoptan una paleta de colores oscuros con transición suave de 0.4 segundos. Al volver a pulsar el botón (que ahora muestra ☀️), la página regresa al modo claro con la misma transición. La preferencia del usuario se guarda automáticamente en `localStorage`, por lo que se mantiene entre sesiones: si el usuario activa el modo oscuro y cierra la pestaña, al volver encontrará la página en modo oscuro. Adicionalmente, si el sistema operativo del usuario tiene el modo oscuro activado y es la primera vez que visita la página (sin preferencia guardada), la página se carga directamente en modo oscuro.

### 4.2 Explicación del funcionamiento (Cómo lo hace)

El sistema se basa en variables CSS (`custom properties`) definidas en el selector `:root` de `styles.css`. Estas variables almacenan todos los colores de la página. El selector `body.dark-mode` sobreescribe esas mismas variables con valores oscuros. Cuando JavaScript añade la clase `dark-mode` al elemento `body`, el navegador recalcula automáticamente todos los elementos que usen esas variables CSS, cambiando sus colores. La transición suave está definida en el `body` y en los selectores individuales de cada componente, lo que hace que el cambio no sea instantáneo.

Al cargar la página, JavaScript determina qué modo aplicar siguiendo un orden de prioridad: primero comprueba `localStorage` (preferencia explícita del usuario), y si no hay nada guardado, comprueba la API `prefers-color-scheme` del navegador (preferencia del sistema operativo).

### 4.3 Fragmentos de código más relevantes

---

**HTML — El botón** (`index.html`, línea 33)

```html
<button class="site-nav-darkmode" id="nav-darkmode" aria-label="Cambiar modo oscuro" title="Modo oscuro">🌙</button>
```

Está dentro del `<nav>` de la navbar. El atributo `aria-label` lo hace accesible para lectores de pantalla (sin él, el lector solo anunciaría el emoji 🌙 sin contexto). El `id="nav-darkmode"` permite que JavaScript lo seleccione directamente con `getElementById`.

---

**CSS — Sistema de variables como mecanismo de temas** (`styles.css`, líneas 1–85)

```css
:root {
    --poke-red: #ee1515;
    --poke-blue: #3b4cca;
    --poke-yellow: #ffcb05;
    --bg-color: #f0f0f0;
    --text-color: #222;
    --card-soft: rgba(255, 244, 214, 0.94);
    --nav-bg: rgba(240, 240, 248, 0.92);
    --nav-logo-color: var(--poke-blue);
    --nav-link-color: rgba(34, 34, 34, 0.75);
    --footer-bg: rgba(232, 238, 255, 0.97);
}

body.dark-mode {
    --bg-color: #131318;
    --text-color: #e8e8f0;
    --card-soft: rgba(30, 30, 42, 0.96);
    --nav-bg: rgba(18, 18, 28, 0.94);
    --nav-logo-color: var(--poke-yellow);
    --nav-link-color: rgba(232, 232, 240, 0.7);
    --footer-bg: rgba(14, 14, 26, 0.98);
    --poke-blue: #7b8fff;
    --poke-red: #ff5f5f;
}
```

- `:root` es el selector del elemento raíz del documento (equivalente a `html`). Las variables definidas aquí están disponibles en todo el CSS.
- `var(--nombre-variable)`: sintaxis para usar una variable CSS en cualquier propiedad. Cuando `body.dark-mode` sobreescribe `--nav-bg`, todos los elementos que usen `var(--nav-bg)` actualizan su color automáticamente sin necesidad de cambiar nada más.
- Al añadir la clase `dark-mode` al `body`, el selector `body.dark-mode` tiene mayor especificidad que `:root` y sus variables sobreescriben a las de `:root`.

Este bloque afecta a todos los archivos: cualquier elemento de `index.html` que use estas variables en `styles.css` cambiará de color automáticamente.

---

**CSS — Transición suave** (`styles.css`, línea 147)

```css
body {
    transition: background-color 0.4s ease, color 0.4s ease;
}
```

Hace que el cambio de color del fondo del body y del texto base sea gradual (0.4 segundos con curva `ease`). Los componentes individuales (navbar, cards, inputs) tienen sus propias transiciones definidas en sus selectores respectivos con `transition: background 0.4s ease` para que también cambien suavemente.

---

**JavaScript — Lógica completa del modo oscuro** (`script.js`, líneas 476–492)

```javascript
const darkBtn = document.getElementById('nav-darkmode');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');
const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

const applyTheme = (dark) => {
    body.classList.toggle('dark-mode', dark);
    if (darkBtn) darkBtn.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
};

applyTheme(isDark);

darkBtn?.addEventListener('click', () => {
    applyTheme(!body.classList.contains('dark-mode'));
});
```

- `window.matchMedia('(prefers-color-scheme: dark)').matches`: llama a la API `matchMedia` del navegador, que evalúa una media query CSS y devuelve un objeto. `.matches` es `true` si el sistema operativo tiene el modo oscuro activado.
- `localStorage.getItem('theme')`: recupera el string guardado previamente (`'dark'`, `'light'` o `null` si no hay nada guardado).
- `isDark = savedTheme === 'dark' || (!savedTheme && prefersDark)`: lógica de prioridad. Si `savedTheme` es `'dark'`, activa modo oscuro. Si no hay `savedTheme` guardado (`!savedTheme` es `true` cuando es `null`) pero el sistema prefiere oscuro, también lo activa.
- `body.classList.toggle('dark-mode', dark)`: el segundo argumento es una condición booleana. Si `dark` es `true`, añade la clase; si es `false`, la elimina. Equivale a un `if/else` de `classList.add/remove` en una sola línea.
- `darkBtn.textContent = dark ? '☀️' : '🌙'`: operador ternario que cambia el emoji del botón según el modo activo.
- `localStorage.setItem('theme', dark ? 'dark' : 'light')`: guarda la preferencia como string en el almacenamiento local del navegador. Persiste entre sesiones hasta que el usuario la borre manualmente o borre los datos del navegador.
- `darkBtn?.addEventListener(...)`: el operador `?.` (optional chaining) evita un error si `darkBtn` es `null` (en caso de que el elemento no exista en el DOM).
- `!body.classList.contains('dark-mode')`: al hacer clic, invierte el estado actual. Si está en modo oscuro, pasa a claro; si está en claro, pasa a oscuro.

---

## 5. Funcionalidad 3 — Navbar con scroll inteligente y sección activa

### 5.1 Descripción del comportamiento (Qué hace)

La barra de navegación está completamente oculta cuando el usuario se encuentra en la primera sección de la página (la sección de conceptos básicos). En el momento en que esa sección sale del viewport al hacer scroll hacia abajo, la navbar aparece deslizándose desde arriba con una transición suave. Si el usuario sube de nuevo hasta la primera sección, la navbar vuelve a ocultarse. Mientras el usuario navega por la página, el enlace de la navbar correspondiente a la sección actualmente visible se resalta automáticamente con color azul (o amarillo en modo oscuro), indicando en todo momento en qué punto de la página se encuentra. Al hacer clic en cualquier enlace de la navbar, el desplazamiento hasta la sección es suave y tiene en cuenta la altura de la propia navbar para que el título de la sección no quede tapado. En pantallas pequeñas (móvil), los enlaces de la navbar se colapsan en un menú hamburguesa que se despliega al pulsarlo.

### 5.2 Explicación del funcionamiento (Cómo lo hace)

En lugar de usar el evento `scroll` del navegador (que se dispara decenas de veces por segundo y puede causar problemas de rendimiento), el sistema usa `IntersectionObserver`, una API moderna del navegador que notifica solo cuando un elemento entra o sale del viewport. Se crean dos observadores independientes: el primero vigila únicamente la primera sección y gestiona la visibilidad de la navbar; el segundo vigila todas las secciones simultáneamente y actualiza el enlace activo. La navbar empieza oculta mediante `transform: translateY(-110%)` y `opacity: 0`, y aparece añadiendo la clase CSS `is-visible`. El botón hamburguesa para móvil se crea dinámicamente en JavaScript para mantener el HTML limpio.

### 5.3 Fragmentos de código más relevantes

---

**HTML — Estructura de la navbar** (`index.html`, líneas 24–35)

```html
<nav class="site-nav" id="site-nav" aria-label="Navegación principal">
    <div class="site-nav-inner">
        <span class="site-nav-logo">◆ PokéVGC</span>
        <ul class="site-nav-links" role="list">
            <li><a href="#section-basics" class="site-nav-link" data-nav-target="section-basics">Conceptos</a></li>
            <li><a href="#section-roles" class="site-nav-link" data-nav-target="section-roles">Roles</a></li>
            <li><a href="#section-archetypes" class="site-nav-link" data-nav-target="section-archetypes">Arquetipos</a></li>
            <li><a href="#section-search" class="site-nav-link" data-nav-target="section-search">Buscador</a></li>
        </ul>
        <button class="site-nav-darkmode" id="nav-darkmode">🌙</button>
    </div>
</nav>
```

Cada enlace tiene el atributo personalizado `data-nav-target` con el valor del `id` de su sección correspondiente (por ejemplo, `data-nav-target="section-roles"` apunta a `<section id="section-roles">`). JavaScript usa este atributo para saber qué sección corresponde a cada enlace sin depender del `href`.

---

**CSS — Navbar oculta por defecto y transición de aparición** (`styles.css`, líneas 889–914)

```css
.site-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: var(--nav-bg);
    backdrop-filter: blur(14px);
    transform: translateY(-110%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
                opacity 0.32s ease;
}

.site-nav.is-visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
}
```

- `position: fixed`: la navbar permanece visible en la parte superior de la pantalla independientemente del scroll.
- `transform: translateY(-110%)`: mueve la navbar 110% de su propia altura hacia arriba, ocultándola completamente fuera de la pantalla. Se usa 110% en lugar de 100% para asegurar que la sombra también desaparezca.
- `opacity: 0`: la hace completamente transparente como capa adicional de ocultamiento.
- `pointer-events: none`: desactiva todos los clics e interacciones mientras está oculta, evitando que el usuario interactúe accidentalmente con ella.
- `backdrop-filter: blur(14px)`: efecto de cristal esmerilado sobre el contenido que hay detrás de la navbar.
- `cubic-bezier(0.22, 1, 0.36, 1)`: curva de animación personalizada. Los cuatro valores controlan las "asas" de la curva de Bézier. Esta combinación produce un movimiento que empieza a velocidad media y termina con un ligero rebote suave, dando sensación de que la navbar "cae" desde arriba.
- Al añadir `is-visible`, `translateY` vuelve a `0` y `pointer-events` se reactiva.

---

**JavaScript — Observer para mostrar/ocultar la navbar** (`script.js`, líneas 495–510)

```javascript
const navObserver = new IntersectionObserver(
    ([entry]) => {
        if (!entry.isIntersecting) {
            siteNav.classList.add('is-visible');
        } else {
            siteNav.classList.remove('is-visible');
            navLinksList?.classList.remove('is-open');
            navToggle.classList.remove('is-open');
        }
    },
    { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
);
navObserver.observe(heroSection);
```

- `new IntersectionObserver(callback, options)`: crea un observador que llama al `callback` cada vez que el elemento observado cambia su estado de intersección con el viewport.
- `([entry])`: desestructuración del array de entradas. Como solo se observa un elemento, siempre habrá exactamente una entrada en el array.
- `entry.isIntersecting`: booleano que es `true` cuando el elemento está visible en el viewport y `false` cuando ha salido.
- `{ threshold: 0 }`: el callback se dispara en cuanto aunque sea un píxel del elemento sale del viewport.
- `rootMargin: '-60px 0px 0px 0px'`: reduce el área efectiva del viewport en 60px desde arriba. Esto hace que el observador considere que la sección ha "salido" 60px antes de que realmente lo haga, lo que da tiempo a la navbar para aparecer con su transición antes de que el usuario pierda completamente de vista la primera sección.
- Al volver a la primera sección, también se cierran el menú hamburguesa y la clase `is-open` de los toggles, para que no queden abiertos.

---

**JavaScript — Observer para el enlace activo** (`script.js`, líneas 513–531)

```javascript
const activeLinkObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                navLinks.forEach((link) => {
                    link.classList.toggle(
                        'is-active',
                        link.dataset.navTarget === entry.target.id
                    );
                });
            }
        });
    },
    { threshold: 0.3 }
);
allSections.forEach((section) => activeLinkObserver.observe(section));
```

- `entries`: array con todas las secciones que han cambiado su estado de intersección desde la última llamada al callback.
- `entry.target`: el elemento DOM concreto que ha cambiado (la sección que acaba de entrar o salir del viewport).
- `entry.target.id`: el `id` de esa sección (por ejemplo `'section-roles'`).
- `link.dataset.navTarget`: accede al atributo `data-nav-target` del enlace. `dataset` convierte automáticamente los atributos `data-*` en propiedades del objeto `dataset`.
- `link.classList.toggle('is-active', condición)`: la condición compara el `data-nav-target` del enlace con el `id` de la sección visible. Solo el enlace cuyo target coincide con la sección visible recibe la clase `is-active`; el resto la pierden.
- `{ threshold: 0.3 }`: la sección debe estar al menos un 30% visible para activar su enlace. Esto evita que el enlace activo cambie cuando una sección apenas asoma por el borde de la pantalla.
- `allSections.forEach((section) => activeLinkObserver.observe(section))`: registra todas las secciones con `id` en el mismo observador. Un solo `IntersectionObserver` puede observar múltiples elementos simultáneamente.

---

**JavaScript — Scroll suave con offset de la navbar** (`script.js`, líneas 533–549)

```javascript
navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = link.dataset.navTarget || link.getAttribute('href')?.replace('#', '');
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        navLinksList?.classList.remove('is-open');
        navToggle.classList.remove('is-open');

        const navHeight = siteNav?.offsetHeight ?? 0;
        const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - 12;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
});
```

- `event.preventDefault()`: cancela el comportamiento por defecto del enlace (saltar directamente a la sección sin animación).
- `targetEl.getBoundingClientRect().top`: distancia entre el borde superior del elemento y el borde superior del viewport en el momento del clic.
- `+ window.scrollY`: convierte esa posición relativa al viewport en posición absoluta dentro del documento (distancia desde el tope de la página).
- `- navHeight - 12`: descuenta la altura de la navbar (`offsetHeight`) y 12px de margen extra, para que el título de la sección no quede tapado por la barra fija.
- `window.scrollTo({ top: targetTop, behavior: 'smooth' })`: desplaza la página a la posición calculada con animación suave nativa del navegador.

---

## 6. Funcionalidad 4 — Carrusel de arquetipos con bucle infinito

### 6.1 Descripción del comportamiento (Qué hace)

La sección de arquetipos muestra 6 tarjetas de equipos competitivos en un carrusel horizontal. El usuario puede navegar entre ellas usando los botones `‹` (anterior) y `›` (siguiente) situados a cada lado. Al pulsar un botón, la tarjeta actual sale por un lado y la siguiente entra por el contrario, con una animación de deslizamiento suave. El carrusel tiene bucle infinito: si el usuario está en la última tarjeta y pulsa `›`, el carrusel vuelve a la primera sin ningún salto, parpadeo ni interrupción visual. Lo mismo ocurre al ir hacia atrás desde la primera tarjeta. Mientras una transición está en curso, los botones se desactivan momentáneamente para evitar clics múltiples.

### 6.2 Explicación del funcionamiento (Cómo lo hace)

El carrusel usa un contenedor flexible (`archetypes-track`) con todas las tarjetas en fila. Solo una tarjeta es visible a la vez porque el contenedor padre (`archetypes-viewport`) tiene `overflow: hidden`. Para navegar, se aplica `transform: translateX()` al track, desplazándolo la anchura exacta de una tarjeta (100% del viewport).

El bucle infinito se implementa con una técnica de clonado: al inicializarse, JavaScript copia la primera y la última tarjeta y las inserta en los extremos opuestos del track. Así, cuando el usuario llega al final y ve el clon de la primera tarjeta, la animación es idéntica a una transición normal. Cuando termina esa animación, JavaScript desactiva la transición CSS, salta instantáneamente a la tarjeta real equivalente (invisible para el usuario porque no hay animación) y reactiva la transición. El resultado es un bucle completamente fluido.

### 6.3 Fragmentos de código más relevantes

---

**HTML — Estructura del carrusel** (`index.html`, líneas 125–130)

```html
<div class="archetypes-carousel">
    <button class="carousel-button carousel-button-prev" id="archetypes-prev">‹</button>
    <div class="archetypes-viewport">
        <div class="archetypes-track" id="archetypes-track">
            <article class="archetype-card"><!-- contenido carta 1 --></article>
            <article class="archetype-card"><!-- contenido carta 2 --></article>
            <!-- ... 6 cartas en total -->
        </div>
    </div>
    <button class="carousel-button carousel-button-next" id="archetypes-next">›</button>
</div>
```

`.archetypes-viewport` actúa como la "ventana" del carrusel con `overflow: hidden`. `.archetypes-track` es el contenedor que se desplaza con `translateX`. Los botones prev/next están fuera del viewport para que siempre sean visibles.

---

**CSS — Disposición y animación del track** (`styles.css`, línea 401)

```css
.archetypes-viewport {
    overflow: hidden;
    width: 100%;
}

.archetypes-track {
    display: flex;
    transition: transform 0.48s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
}

.archetype-card {
    min-width: 100%;
    flex-shrink: 0;
}
```

- `overflow: hidden` en el viewport: oculta todas las tarjetas salvo la que está alineada con la ventana.
- `display: flex` en el track: coloca todas las tarjetas en fila horizontal.
- `min-width: 100%` y `flex-shrink: 0` en cada tarjeta: cada tarjeta ocupa exactamente el 100% del ancho del viewport y no se encoge. Esto garantiza que `translateX(-100%)` desplace exactamente una tarjeta.
- `cubic-bezier(0.25, 0.46, 0.45, 0.94)`: curva ease-out personalizada. El movimiento empieza rápido y desacelera al llegar al destino, simulando inercia física.

---

**JavaScript — Clonado de nodos para el bucle infinito** (`script.js`, líneas 202–216)

```javascript
const originalArchetypeCards = Array.from(archetypesTrack.querySelectorAll('.archetype-card'));
const archetypesCount = originalArchetypeCards.length; // 6

let currentArchetypeIndex = archetypesCount > 1 ? 1 : 0;

if (archetypesCount > 1) {
    const firstClone = originalArchetypeCards[0].cloneNode(true);
    const lastClone = originalArchetypeCards[archetypesCount - 1].cloneNode(true);

    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');

    archetypesTrack.insertBefore(lastClone, originalArchetypeCards[0]);
    archetypesTrack.appendChild(firstClone);
}
```

- `querySelectorAll('.archetype-card')`: selecciona todas las tarjetas originales. Se convierte a `Array` con `Array.from()` para poder usar métodos de array como `.length`.
- `cloneNode(true)`: crea una copia profunda del nodo, incluyendo todos sus elementos hijos y atributos.
- `aria-hidden="true"`: los clones son duplicados técnicos, no contenido real. Este atributo los oculta de los lectores de pantalla para no confundir a usuarios con discapacidad visual.
- `insertBefore(lastClone, originalArchetypeCards[0])`: inserta el clon de la última carta antes de la primera carta original.
- `appendChild(firstClone)`: añade el clon de la primera carta al final.
- `currentArchetypeIndex = 1`: el índice inicial apunta a la primera carta real (índice 0 es el clon de la última).

**Estado del DOM después del clonado:**

```
Índice: [  0  ] [  1  ] [  2  ] [  3  ] [  4  ] [  5  ] [  6  ] [  7  ]
Carta:  [clÚlt] [cart1] [cart2] [cart3] [cart4] [cart5] [cart6] [clPri]
```

---

**JavaScript — `syncArchetypesCarousel()` — movimiento del track** (`script.js`, líneas 218–222)

```javascript
const syncArchetypesCarousel = (withTransition = true) => {
    archetypesTrack.style.transform = `translateX(-${currentArchetypeIndex * 100}%)`;
    archetypesPrev.disabled = archetypesCount <= 1;
    archetypesNext.disabled = archetypesCount <= 1;
};
```

`` `translateX(-${currentArchetypeIndex * 100}%)` ``: mueve el track a la izquierda en múltiplos del 100% del ancho del viewport. Si `currentArchetypeIndex = 2`, el track se desplaza `-200%`, mostrando la carta en la posición 2.

---

**JavaScript — Reposicionamiento invisible con `transitionend`** (`script.js`, líneas 242–271)

```javascript
archetypesTrack.addEventListener('transitionend', () => {
    if (isAdjustingCarousel) return;

    if (currentArchetypeIndex === 0) {
        isAdjustingCarousel = true;
        archetypesTrack.style.transition = 'none';
        currentArchetypeIndex = archetypesCount;        // saltar a carta 6 real
        syncArchetypesCarousel();

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                archetypesTrack.style.transition = '';
                isAdjustingCarousel = false;
            });
        });

    } else if (currentArchetypeIndex === archetypesCount + 1) {
        isAdjustingCarousel = true;
        archetypesTrack.style.transition = 'none';
        currentArchetypeIndex = 1;                      // saltar a carta 1 real
        syncArchetypesCarousel();

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                archetypesTrack.style.transition = '';
                isAdjustingCarousel = false;
            });
        });
    }
});
```

- `transitionend`: evento nativo del DOM que se dispara cuando la transición CSS de `transform` termina completamente.
- `currentArchetypeIndex === 0`: el usuario ha llegado al clon de la última carta (al ir hacia atrás desde la carta 1).
- `currentArchetypeIndex === archetypesCount + 1`: el usuario ha llegado al clon de la primera carta (al ir hacia adelante desde la carta 6).
- `archetypesTrack.style.transition = 'none'`: desactiva la transición CSS temporalmente. El siguiente cambio de `transform` será instantáneo e invisible.
- `currentArchetypeIndex = archetypesCount` (o `= 1`): salta al índice de la carta real equivalente.
- `syncArchetypesCarousel()`: aplica el nuevo `translateX` sin animación (porque la transición está desactivada).
- `window.requestAnimationFrame(() => window.requestAnimationFrame(...))`: se necesitan **dos frames** para reactivar la transición de forma segura. El motor de renderizado del navegador agrupa los cambios de estilo dentro del mismo frame. Si se reactivara la transición en el mismo frame que el cambio de posición, el navegador los procesaría juntos y volvería a animar el salto. El primer `requestAnimationFrame` espera a que el frame actual (con el salto) se pinte. El segundo espera al siguiente frame antes de reactivar la transición, garantizando que el salto ya está renderizado.
- `isAdjustingCarousel`: variable booleana que bloquea los eventos de clic en los botones durante el reposicionamiento, evitando comportamientos inesperados si el usuario pulsa rápidamente.

---

## 7. Funcionalidad 5 — Buscador de Pokémon con backend

### 7.1 Descripción del comportamiento (Qué hace)

La última sección de la página contiene un formulario con un campo de texto y un botón "Buscar". El usuario puede introducir el nombre en inglés (por ejemplo, `pikachu`, `charizard`) o el número de la Pokédex (por ejemplo, `25`) de cualquier Pokémon. Al buscar, aparece una tarjeta con la información completa del Pokémon: su artwork oficial, nombre, número de la Pokédex, tipos, habilidades (indicando cuáles son ocultas) y las seis estadísticas base (PS, Ataque, Defensa, Ataque Especial, Defensa Especial y Velocidad). Las estadísticas se presentan con barras de progreso que crecen con animación escalonada al aparecer. El color de cada barra varía del rojo al cian según si el valor es bajo o alto. Si el Pokémon no existe, se muestra un mensaje de error claro.

### 7.2 Explicación del funcionamiento (Cómo lo hace)

Al enviar el formulario, JavaScript hace una petición `fetch` al servidor Node.js del propio proyecto (en `localhost:3000`), no directamente a la PokéAPI. El servidor procesa la petición, consulta la PokéAPI si los datos no están en caché, filtra los campos necesarios y devuelve una respuesta JSON limpia. JavaScript recibe ese JSON, genera dinámicamente el HTML de la tarjeta de resultado usando literales de plantilla y lo inserta en el DOM. Las barras de estadísticas reciben sus valores de anchura, color y retraso de animación como propiedades CSS personalizadas en línea (`--stat-width`, `--stat-color`, `--stat-delay`), que las reglas de animación de `styles.css` recogen para ejecutar la animación escalonada.

### 7.3 Fragmentos de código más relevantes

---

**HTML — Formulario de búsqueda** (`index.html`, líneas 256–273)

```html
<form class="pokemon-search-form" id="pokemon-search-form">
    <div class="pokemon-search-controls">
        <input
            type="text"
            id="pokemon-name"
            class="pokemon-search-input"
            placeholder="Ejemplo: pikachu, garchomp, 25"
            autocomplete="off"
            required>
        <button type="submit" class="pokemon-search-button">Buscar</button>
    </div>
</form>
```

- `type="submit"`: el botón envía el formulario tanto al hacer clic como al pulsar `Enter` en el campo de texto.
- `required`: el navegador valida que el campo no esté vacío antes de enviar el formulario.
- `autocomplete="off"`: desactiva el autocompletado del navegador, que no es útil para nombres de Pokémon.

---

**JavaScript — Captura del formulario y petición al backend** (`script.js`, líneas 428–460)

```javascript
pokemonSearchForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const searchValue = pokemonNameInput.value.trim().toLowerCase();
    if (!searchValue) return;

    try {
        pokemonSearchForm.querySelector('button[type="submit"]').disabled = true;
        setFeedback('Buscando...', 'loading');

        const response = await fetch(
            `http://localhost:3000/api/pokemon/${encodeURIComponent(searchValue)}`
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error ${response.status}`);
        }

        const data = await response.json();
        renderPokemon(data);
        setFeedback(`Resultado cargado para ${formatLabel(data.name)}.`, 'success');
    } catch (error) {
        resetResult();
        setFeedback(error.message || 'Ha ocurrido un error al consultar el backend.', 'error');
    } finally {
        pokemonSearchForm.querySelector('button[type="submit"]').disabled = false;
    }
});
```

- `event.preventDefault()`: cancela el envío normal del formulario (que recargaría la página) para gestionarlo con JavaScript.
- `async/await`: permite escribir código asíncrono (que espera respuestas de red) de forma secuencial y legible. `await` pausa la ejecución hasta que la promesa se resuelve.
- `encodeURIComponent(searchValue)`: codifica caracteres especiales de la URL. Por ejemplo, `nidoran♀` se convertiría en `nidoran%E2%99%80`, garantizando que la URL sea válida.
- `!response.ok`: el objeto `Response` de `fetch` tiene una propiedad `ok` que es `false` cuando el código HTTP es 4xx o 5xx. Se comprueba explícitamente porque `fetch` no lanza error por sí solo en estos casos.
- `button.disabled = true/false` en `try/finally`: el botón se desactiva durante la petición para evitar búsquedas múltiples simultáneas y se reactiva siempre en `finally`, incluso si hay un error.

Esta llamada conecta directamente con el endpoint `GET /api/pokemon/:name` del `server.js`.

---

**JavaScript — Renderizado de estadísticas con animación escalonada** (`script.js`, líneas 385–407)

```javascript
const statLabels = {
    hp: 'PS', attack: 'ATQ', defense: 'DEF',
    'special-attack': 'A.ESP', 'special-defense': 'D.ESP', speed: 'VEL'
};

pokemonStatsGrid.innerHTML = pokemon.stats
    .map((stat, index) => {
        const statValue = stat.base_stat;
        const statWidth = Math.min((statValue / 180) * 100, 100);
        const statColor = getStatColor(statValue);
        const statDelay = 90 + (index * 45);
        const statDuration = 0.55 + ((1 - (statValue / 255)) * 0.28);

        return `
            <div class="pokemon-stat">
                <span class="pokemon-stat-label">${statLabels[stat.name]}</span>
                <span class="pokemon-stat-value">${statValue}</span>
                <div class="pokemon-stat-bar-track">
                    <div class="pokemon-stat-bar-fill"
                        style="--stat-width:${statWidth}%;
                               --stat-color:${statColor};
                               --stat-delay:${statDelay}ms;
                               --stat-duration:${statDuration}s;">
                    </div>
                </div>
            </div>
        `;
    }).join('');
```

- `.map((stat, index) => ...)`: itera sobre los 6 objetos de stat del array. `index` (0–5) se usa para calcular el delay.
- `statWidth = Math.min((statValue / 180) * 100, 100)`: convierte el valor de la stat (rango 0–255) a porcentaje de la barra. Se usa 180 como referencia de "stat muy alta" para que los valores altos pero no máximos muestren barras claramente llenas. `Math.min(..., 100)` evita que supere el 100%.
- `statDelay = 90 + (index * 45)`: el delay en milisegundos aumenta 45ms por cada stat. La primera barra (PS) aparece a los 90ms, la segunda (ATQ) a los 135ms, y así sucesivamente, creando el efecto escalonado.
- `--stat-width`, `--stat-color`, `--stat-delay`, `--stat-duration`: propiedades CSS personalizadas pasadas como estilos en línea. El CSS de `styles.css` las recoge en la animación `@keyframes` de las barras para controlar su anchura final, color, retraso de inicio y duración de la animación.
- `statLabels[stat.name]`: traduce los nombres de la API en inglés (`'special-attack'`) a las abreviaturas mostradas en pantalla (`'A.ESP'`).

---

## 8. Funcionalidad Backend — Servidor Node.js con Express

### 8.1 Descripción del comportamiento (Qué hace)

El backend es un servidor HTTP que corre localmente en `http://localhost:3000`. Expone varios endpoints REST que el frontend consume. Su función principal es actuar como intermediario entre el buscador de la página y la PokéAPI pública: cuando el frontend busca un Pokémon, no llama directamente a `pokeapi.co`, sino al servidor local. El servidor comprueba si tiene ese resultado guardado en memoria (caché). Si lo tiene y no ha caducado (menos de 1 hora), lo devuelve directamente sin llamar a ninguna API externa. Si no lo tiene, consulta la PokéAPI, filtra y simplifica los datos (descartando la gran cantidad de campos que la API devuelve pero el frontend no necesita), guarda el resultado en caché y lo devuelve al frontend. Los endpoints disponibles son:

- `GET /api/pokemon/:name` — Información completa de un Pokémon por nombre o número.
- `GET /api/pokemon?limit=20&offset=0` — Lista paginada de Pokémon.
- `GET /api/search?q=texto` — Búsqueda por nombre o prefijo.
- `GET /api/type/:type` — Pokémon de un tipo y sus relaciones de daño.
- `GET /health` — Comprobación de estado del servidor.
- `GET /api/cache/stats` — Estado actual de la caché (para desarrollo).

### 8.2 Explicación del funcionamiento (Cómo lo hace)

El servidor usa Express para definir rutas HTTP. Cada ruta es una función que recibe un objeto `req` (la petición del cliente) y un objeto `res` (la respuesta que se enviará). La caché se implementa con un `Map` de JavaScript (estructura clave-valor en memoria) donde cada entrada guarda los datos y el timestamp de cuando se guardaron. Al consultar una entrada, se compara el tiempo transcurrido con el TTL (Time To Live) de 1 hora: si ha caducado, se elimina y se fuerza una nueva petición a la API. El middleware CORS permite que el navegador acepte las respuestas del servidor, ya que el frontend y el backend corren en puertos distintos y el navegador aplica la política de mismo origen por seguridad.

### 8.3 Fragmentos de código más relevantes

---

**`package.json` — Configuración del proyecto Node**

```json
{
  "name": "pokemon-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- `"main": "server.js"`: indica el archivo de entrada del proyecto. Las plataformas de despliegue lo usan para saber qué ejecutar.
- `"start"`: comando de producción ejecutado con `npm start`. Heroku, Railway y similares lo buscan automáticamente para arrancar la aplicación.
- `"dev"`: comando de desarrollo ejecutado con `npm run dev`. El flag `--watch` es nativo de Node 18 y reinicia el servidor automáticamente al detectar cambios en los archivos, eliminando la necesidad de herramientas externas como `nodemon`.
- `"^2.8.5"`: el símbolo `^` (caret) permite instalar versiones compatibles más recientes. En versionado semántico (semver), `^2.8.5` acepta cualquier versión `2.x.x` mayor o igual a `2.8.5`, pero nunca una `3.x.x` que podría tener cambios que rompan la compatibilidad.
- `"engines"`: declara el requisito mínimo de Node.js. Es leído por plataformas de despliegue para configurar el entorno automáticamente, y avisa a desarrolladores que intenten ejecutar el proyecto con una versión insuficiente.

---

**`server.js` — Configuración inicial y middlewares**

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
```

- `require('express')` y `require('cors')`: importa los módulos instalados. Node.js busca estos módulos en la carpeta `node_modules/`, creada al ejecutar `npm install`.
- `express()`: crea la instancia de la aplicación Express. Es el objeto principal al que se añaden rutas y middlewares.
- `process.env.PORT || 3000`: `process.env` es el objeto de variables de entorno del sistema. Si existe una variable `PORT` (asignada por plataformas de despliegue), se usa; si no, se usa `3000` por defecto.
- `app.use(cors())`: registra el middleware CORS. Sin esto, el navegador bloquearía las peticiones del frontend en `localhost:5500` al backend en `localhost:3000` por ser orígenes distintos (política de mismo origen).
- `app.use(express.json())`: permite que el servidor entienda cuerpos de petición en formato JSON.

---

**`server.js` — Sistema de caché TTL**

```javascript
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

function getFromCache(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
}
```

- `new Map()`: estructura de datos nativa de JavaScript. A diferencia de un objeto plano, el `Map` está optimizado para inserciones y búsquedas frecuentes y mantiene el orden de inserción.
- `CACHE_TTL = 1000 * 60 * 60`: `1000` milisegundos = 1 segundo; `× 60` = 1 minuto; `× 60` = 1 hora. Expresarlo como multiplicación hace el valor más legible y fácil de cambiar.
- `Date.now()`: devuelve el timestamp actual en milisegundos desde el 1 de enero de 1970 (Unix epoch).
- `Date.now() - entry.timestamp > CACHE_TTL`: si han pasado más milisegundos de los que define el TTL, la entrada ha caducado.
- `cache.delete(key)`: elimina la entrada caducada para liberar memoria.
- `{ data, timestamp: Date.now() }`: shorthand de objetos de ES6. `data` equivale a `data: data`.

Estas funciones son llamadas por todos los endpoints del servidor.

---

**`server.js` — Helper `fetchPokeAPI()`**

```javascript
async function fetchPokeAPI(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`);
    return res.json();
}
```

- `fetch` nativo de Node 18: no requiere librerías externas como `node-fetch`. Este es el motivo por el que el proyecto requiere Node 18+.
- `!res.ok`: el objeto `Response` tiene la propiedad `ok` como `false` cuando el código de estado HTTP es 4xx o 5xx. En esos casos, `fetch` no lanza error por sí solo.
- `throw new Error(...)`: lanza un error que es capturado por el bloque `catch` del endpoint que llama a esta función, permitiendo gestionar errores de forma centralizada.

---

**`server.js` — Endpoint principal `GET /api/pokemon/:name`**

```javascript
app.get('/api/pokemon/:name', async (req, res) => {
    const name = req.params.name.toLowerCase().trim();
    const cacheKey = `pokemon:${name}`;

    const cached = getFromCache(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    try {
        const data = await fetchPokeAPI(`https://pokeapi.co/api/v2/pokemon/${name}`);
        const species = await fetchPokeAPI(data.species.url);

        const descEntry =
            species.flavor_text_entries.find(e => e.language.name === 'es') ||
            species.flavor_text_entries.find(e => e.language.name === 'en');

        const result = {
            id: data.id,
            name: data.name,
            types: data.types.map(t => t.type.name),
            abilities: data.abilities.map(a => ({
                name: a.ability.name,
                is_hidden: a.is_hidden,
            })),
            stats: data.stats.map(s => ({
                name: s.stat.name,
                base_stat: s.base_stat,
            })),
            sprites: {
                front: data.sprites.front_default,
                official_artwork: data.sprites.other?.['official-artwork']?.front_default || null,
            },
        };

        setCache(cacheKey, result);
        res.json(result);
    } catch (err) {
        const status = err.message.includes('404') ? 404 : 500;
        res.status(status).json({
            error: status === 404 ? 'Pokémon no encontrado' : 'Error interno del servidor',
        });
    }
});
```

- `app.get('/api/pokemon/:name', ...)`: registra un endpoint que responde a peticiones `GET`. `:name` es un parámetro dinámico de URL.
- `req.params.name`: extrae el valor del parámetro `:name` de la URL. Si la petición es a `/api/pokemon/pikachu`, `req.params.name` es `'pikachu'`.
- `{ ...cached, fromCache: true }`: el operador spread (`...`) copia todas las propiedades del objeto `cached` en uno nuevo, al que se añade `fromCache: true`. Permite saber desde el frontend si el dato vino de caché.
- Se hacen **dos llamadas secuenciales** a la PokéAPI: la primera obtiene los datos del Pokémon (stats, tipos, habilidades, sprites). La segunda llama a `data.species.url` (una URL dinámica que la primera llamada devuelve) para obtener la descripción de texto, que en la PokéAPI está en un recurso separado.
- `species.flavor_text_entries.find(e => e.language.name === 'es')`: busca la descripción en español. Si no existe (no todos los Pokémon tienen descripción en todos los idiomas), el `||` activa el fallback en inglés.
- `data.sprites.other?.['official-artwork']?.front_default`: el operador optional chaining `?.` devuelve `undefined` en lugar de lanzar un error si alguna propiedad intermedia no existe en el objeto.
- `err.message.includes('404')`: distingue entre un error de "Pokémon no encontrado" (404 de la PokéAPI) y un fallo del servidor (500).
- `res.status(status).json({...})`: establece el código de estado HTTP de la respuesta y envía un cuerpo JSON. Encadenar `.status()` y `.json()` es el patrón estándar de Express.

Esta respuesta es recibida por `script.js` en la función `submit` del formulario, línea 438.

---

## 9. Responsividad

### 9.1 Descripción del comportamiento (Qué hace)

La página se adapta correctamente a cinco escenarios de visualización: escritorio, tablet en vertical, tablet en horizontal, móvil en vertical y móvil en horizontal. El comportamiento en cada formato es el siguiente:

- **Escritorio (>1024px):** layout de tres columnas en el resultado del buscador, navbar con todos los enlaces en horizontal, carrusel con botones a los lados, secciones de información en grid de múltiples columnas.
- **Tablet en vertical (≤860px):** el resultado del Pokémon reorganiza la imagen a la izquierda ocupando dos filas, con los datos apilados a la derecha. Los roles pasan a dos columnas.
- **Tablet en horizontal y móvil grande (≤768px):** el resultado del Pokémon pasa a una sola columna. Los modales de roles se anclan a la parte inferior de la pantalla como hojas emergentes. La navbar mantiene los botones prev/next del carrusel visibles.
- **Móvil en vertical (≤480px):** todos los grids pasan a una sola columna. Todo el contenido se apila verticalmente.
- **Móvil en horizontal (altura ≤500px + landscape):** el telón se comprime verticalmente. Los modales activan scroll interno. Los arquetipos recuperan dos columnas para aprovechar el ancho.

### 9.2 Explicación del funcionamiento (Cómo lo hace)

La responsividad se implementa íntegramente en `styles.css` mediante **CSS Grid**, **Flexbox** y **media queries**, sin ningún framework externo. La estrategia es desktop-first: los estilos base están escritos para escritorio y las media queries redefinen los layouts para pantallas menores. Para el caso especial de móvil en horizontal, se usa un breakpoint basado en la altura del viewport (`max-height`) en lugar del ancho, porque en landscape el problema principal es la falta de espacio vertical. El botón hamburguesa de la navbar se gestiona en JavaScript para mantener el HTML limpio.

### 9.3 Fragmentos de código más relevantes

---

**CSS — Breakpoints principales** (`styles.css`)

```css
/* ── Tablet (≤1024px) ─────────────────────────────── */
@media (max-width: 1024px) {
    .pokemon-result-layout {
        grid-template-columns: 180px minmax(0, 1fr) minmax(0, 1.1fr);
        gap: 16px;
    }
}

/* ── Tablet vertical (≤860px) ─────────────────────── */
@media (max-width: 860px) {
    .pokemon-result-layout {
        grid-template-columns: 160px 1fr;
        grid-template-rows: auto auto;
    }
    .pokemon-result-visual {
        grid-row: 1 / 3;
    }
}

/* ── Móvil horizontal / tablet pequeña (≤768px) ───── */
@media (max-width: 768px) {
    .roles-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    .archetypes-carousel {
        grid-template-columns: auto 1fr auto;
        align-items: center;
    }
    .pokemon-result-layout {
        grid-template-columns: 1fr;
    }
    .role-modal {
        align-items: flex-end;
    }
    .role-modal-panel {
        width: 100%;
        max-height: 88vh;
        border-radius: 26px 26px 18px 18px;
    }
}

/* ── Móvil vertical (≤480px) ──────────────────────── */
@media (max-width: 480px) {
    .roles-grid {
        grid-template-columns: 1fr;
    }
    .info-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}
```

- `grid-template-columns: 160px 1fr`: columna fija de 160px (imagen) y columna flexible que toma el resto del espacio disponible (`1fr` = 1 fracción del espacio restante).
- `grid-row: 1 / 3`: hace que `.pokemon-result-visual` ocupe desde la fila 1 hasta la fila 3 del grid, permitiendo que los datos se apilen en la columna de la derecha.
- `align-items: flex-end` en `.role-modal`: cuando el modal es un `flexbox`, esta propiedad empuja el panel hijo hacia el borde inferior de la pantalla, comportándose como un bottom sheet.
- `border-radius: 26px 26px 18px 18px`: los cuatro valores corresponden a (superior-izquierda, superior-derecha, inferior-derecha, inferior-izquierda). Las esquinas inferiores tienen un radio menor porque el panel llega hasta el borde de la pantalla.
- `max-height: 88vh` en el panel del modal: limita la altura del modal al 88% de la altura del viewport, dejando siempre un margen visible del contenido de fondo por encima, lo que ayuda al usuario a entender que puede cerrar el modal pulsando fuera.

---

**CSS — Navbar hamburguesa** (`styles.css`)

```css
@media (max-width: 640px) {
    .site-nav-toggle {
        display: flex;
    }
    .site-nav-links {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        flex-direction: column;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.36s cubic-bezier(0.22, 1, 0.36, 1);
        padding: 0 16px;
    }
    .site-nav-links.is-open {
        max-height: 300px;
        padding: 10px 16px 16px;
    }
}
```

La animación usa `max-height` en lugar de `height` porque CSS no puede animar `height: auto` (valor desconocido en tiempo de compilación). Al transicionar de `max-height: 0` a `max-height: 300px`, el menú se despliega visualmente. El valor `300px` es suficiente para contener todos los enlaces; si el contenido fuera más largo, aumentaría sin cambiar la animación.

---

**JavaScript — Creación dinámica del botón hamburguesa** (`script.js`, líneas 463–474)

```javascript
const navToggle = document.createElement('button');
navToggle.className = 'site-nav-toggle';
navToggle.setAttribute('aria-label', 'Abrir menú');
navToggle.setAttribute('aria-expanded', 'false');
navToggle.innerHTML = '<span></span><span></span><span></span>';
siteNav?.querySelector('.site-nav-inner')?.appendChild(navToggle);

navToggle.addEventListener('click', () => {
    const isOpen = navLinksList.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
});
```

- `document.createElement('button')`: crea el elemento en memoria antes de insertarlo en el DOM.
- `aria-expanded`: atributo de accesibilidad que indica a lectores de pantalla si el menú está expandido o colapsado. Se actualiza con cada clic.
- `'<span></span><span></span><span></span>'`: las tres líneas del icono hamburguesa. En CSS, cuando se añade la clase `is-open`, las líneas superior e inferior giran 45° para formar una X y la del medio desaparece con `opacity: 0`.
- Crear el botón en JavaScript (en lugar de en el HTML) aplica el principio de mejora progresiva: el HTML funciona sin JavaScript, y el botón hamburguesa solo existe cuando JS está disponible.

---

**CSS — Breakpoint landscape móvil** (`styles.css`)

```css
@media (max-height: 500px) and (orientation: landscape) {
    .hero-stage {
        min-height: auto;
        padding: 4vh 0;
    }
    .curtain-text h1 {
        font-size: 1.4rem;
        margin: 0 0 4px;
    }
    .role-modal-panel {
        max-height: 94vh;
        overflow-y: auto;
        border-radius: 18px;
        padding: 10px 18px 20px;
    }
    .archetype-layout {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    }
}
```

- `max-height: 500px and orientation: landscape`: condición doble. Se aplica solo cuando la altura del viewport es menor de 500px (dispositivo en landscape) y la orientación es horizontal. Esto excluye ventanas de escritorio pequeñas, que tienen poco ancho pero no son dispositivos girados.
- `min-height: auto`: elimina la altura mínima de la sección hero para que se comprima al contenido disponible.
- `overflow-y: auto` en el modal: activa el scroll vertical interno del panel cuando el contenido no cabe en la pantalla en landscape.
- `grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr)`: recupera el layout de dos columnas en las tarjetas de arquetipos para aprovechar el ancho extra disponible en landscape.