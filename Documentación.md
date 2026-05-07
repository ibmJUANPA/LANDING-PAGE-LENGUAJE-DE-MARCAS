# Documentación Técnica — PokéVGC Landing Page

## Índice

1. [Cómo iniciar el proyecto](#1-cómo-iniciar-el-proyecto)
2. [Telón de apertura con scroll](#2-telón-de-apertura-con-scroll)
3. [Modo oscuro con persistencia](#3-modo-oscuro-con-persistencia)
4. [Navbar con scroll inteligente y sección activa](#4-navbar-con-scroll-inteligente-y-sección-activa)
5. [Carrusel de arquetipos con animación de transición](#5-carrusel-de-arquetipos-con-animación-de-transición)

---

## 1. Cómo iniciar el proyecto

El proyecto está dividido en dos partes independientes: el **frontend** (los archivos `index.html`, `styles.css` y `script.js`) y el **backend** (la carpeta `backend/` con Node.js). Para que el buscador de Pokémon funcione, el backend tiene que estar corriendo antes de abrir la página.

### Requisitos previos

- **Node.js versión 18 o superior.** Puedes comprobarlo abriendo una terminal y ejecutando:

```bash
node --version
```

Si la versión que aparece es inferior a 18, descarga la versión LTS desde [nodejs.org](https://nodejs.org).

### Pasos para arrancar el backend

**Paso 1.** Abre Visual Studio Code con la carpeta raíz del proyecto.

**Paso 2.** Abre una terminal integrada (`Ctrl + ñ` en Windows) o desde el menú `Terminal → Nueva Terminal`.

**Paso 3.** Navega a la carpeta del backend:

```bash
cd backend
```

**Paso 4.** Instala las dependencias. Solo es necesario hacerlo la primera vez:

```bash
npm install
```

> **Nota para Windows:** si aparece un error de permisos en PowerShell (`execution policy`), ejecuta primero este comando como Administrador y acepta con `S`:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```
> Alternativamente, usa el **Símbolo del sistema (CMD)** en vez de PowerShell, donde este error no ocurre.

**Paso 5.** Arranca el servidor:

```bash
node server.js
```

Deberías ver en la terminal:

```
🟡 Servidor Pokémon corriendo en http://localhost:3000
```

**Paso 6.** Con el servidor corriendo, abre `index.html` en el navegador. Puedes hacerlo con la extensión **Live Server** de VS Code (click derecho sobre `index.html` → *Open with Live Server*) o simplemente arrastrando el archivo al navegador.

> **Importante:** la terminal con el servidor tiene que permanecer abierta mientras uses la página. Si la cierras, el buscador dejará de funcionar y aparecerá un error de red.

### Estructura de archivos

```
proyecto/
├── index.html          ← Estructura HTML de la página
├── styles.css          ← Todos los estilos y animaciones
├── script.js           ← Lógica del frontend
├── img/                ← Imágenes de Pokémon
└── backend/
    ├── server.js       ← Servidor Express (backend)
    └── package.json    ← Dependencias del backend
```

---

## 2. Telón de apertura con scroll

### Descripción general

Al cargar la página, el usuario ve un telón rojo dividido en dos mitades (izquierda y derecha) que cubre toda la pantalla. Para entrar en la página, el usuario tiene que hacer scroll hacia abajo, lo que separa progresivamente las dos mitades del telón. El efecto funciona tanto con la rueda del ratón, como con el teclado y con gestos táctiles en móvil.

### Estructura HTML

El telón está definido en `index.html` en las líneas **14–22**:

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

Son tres elementos: la cortina izquierda, la cortina derecha, y el texto con el título que se desvanece a medida que el telón se abre.

### CSS — Bloqueo del scroll y posicionamiento

Mientras el telón no se ha abierto completamente, el body tiene la clase `pre-opening` aplicada (líneas **154–157** de `styles.css`), que bloquea el scroll normal de la página:

```css
body.pre-opening {
    overflow: hidden;
    height: 100vh;
}
```

Las dos mitades del telón se posicionan con `position: fixed` para que cubran siempre toda la pantalla independientemente del scroll (líneas **218–228** de `styles.css`):

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

El uso de `will-change: transform` es una optimización que le indica al navegador que este elemento va a animarse, permitiéndole preparar la aceleración por hardware de antemano.

### JavaScript — La variable `curtainProgress`

Toda la lógica del telón gira en torno a una sola variable declarada en la línea **28** de `script.js`:

```javascript
let curtainProgress = 0;
```

Esta variable va de `0` (telón cerrado) a `1` (telón completamente abierto). Es el único estado que controla la posición del telón en todo momento.

### JavaScript — `syncCurtain()`: traducir el progreso a movimiento visual

La función `syncCurtain()` (líneas **40–51**) es la que aplica el estado de `curtainProgress` al DOM:

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

- La cortina izquierda se mueve hacia la izquierda (`translateX` negativo) proporcional al progreso.
- La cortina derecha se mueve hacia la derecha (`translateX` positivo) de la misma forma.
- El texto del telón se desvanece con `opacity`, pero más rápido que el telón en sí: el multiplicador `1.35` hace que el texto desaparezca antes de que el telón se haya abierto del todo, dando una sensación más limpia.
- Cuando `curtainProgress` llega a `1`, se elimina la clase `pre-opening` del body y el scroll de la página queda libre.

### JavaScript — `updateCurtainProgress()`: calcular el avance

La función `updateCurtainProgress()` (líneas **53–57**) recibe un `deltaY` (cuántos píxeles se ha desplazado el usuario) y lo convierte en un incremento de progreso:

```javascript
const updateCurtainProgress = (deltaY) => {
    const step = deltaY / 700;
    curtainProgress = clamp(curtainProgress + step, 0, 1);
    syncCurtain();
};
```

El divisor `700` determina la "resistencia" del telón: cuántos píxeles hay que hacer scroll para abrirlo completamente. La función `clamp` (definida en la línea **38**) garantiza que `curtainProgress` nunca salga del rango `[0, 1]`.

### JavaScript — Rueda del ratón

El evento `wheel` (líneas **62–74**) intercepta el scroll solo mientras sea necesario:

```javascript
window.addEventListener('wheel', (event) => {
    const atTop = window.scrollY <= 0;
    const shouldControlCurtain =
        curtainProgress < 1 ||
        (curtainProgress > 0 && atTop && event.deltaY < 0);

    if (!shouldControlCurtain) {
        return;
    }

    event.preventDefault();
    updateCurtainProgress(event.deltaY);
}, { passive: false });
```

La condición `shouldControlCurtain` cubre dos casos: que el telón no esté completamente abierto (avanzar), o que el usuario esté en el tope de la página y scrollee hacia arriba con el telón parcialmente abierto (retroceder). El `{ passive: false }` es obligatorio para poder llamar a `event.preventDefault()` y evitar que el navegador también haga scroll normal.

### JavaScript — Soporte táctil

Para móvil (líneas **76–96**), se usan los eventos `touchstart` y `touchmove`. El truco está en guardar la posición Y del dedo en el evento anterior (`touchLastY`) y calcular el delta frame a frame:

```javascript
window.addEventListener('touchmove', (event) => {
    if (curtainProgress === 1) return;
    event.preventDefault();

    const currentY = event.touches[0].clientY;
    const deltaY = touchLastY - currentY;
    touchLastY = currentY;

    updateCurtainProgress(deltaY * 1.4);
}, { passive: false });
```

El multiplicador `1.4` hace que el gesto táctil sea algo más sensible que el scroll de ratón, compensando que los dedos en móvil tienden a hacer gestos más cortos.

### JavaScript — Teclado

El evento `keydown` (líneas **98–117**) permite abrir el telón con las teclas `↓`, `Espacio` y `Av Pág`, y cerrarlo con `↑` y `Re Pág`:

```javascript
if (isForwardKey) {
    updateCurtainProgress(140);
} else if (isReverseKey) {
    updateCurtainProgress(-140);
}
```

Cada pulsación equivale a un delta de `140px`, lo que da una apertura escalonada pero fluida (140 / 700 = 0.2, es decir, cada pulsación abre un 20% del telón).

---

## 3. Modo oscuro con persistencia

### Descripción general

El botón 🌙 en la navbar cambia toda la página a modo oscuro con una transición suave. La preferencia se guarda en `localStorage` para que persista entre sesiones. Además, si el sistema operativo del usuario tiene el modo oscuro activado, la página lo detecta automáticamente.

### HTML — El botón

El botón está definido en `index.html` en la línea **33**:

```html
<button class="site-nav-darkmode" id="nav-darkmode" aria-label="Cambiar modo oscuro" title="Modo oscuro">🌙</button>
```

### CSS — Variables como sistema de temas

Todo el sistema de colores se basa en variables CSS definidas en `:root` (desde la línea **1** de `styles.css`). El modo oscuro simplemente sobreescribe esas variables en el selector `body.dark-mode` (líneas **48–85**):

```css
:root {
    --bg-color: #f0f0f0;
    --text-color: #222;
    --card-soft: rgba(255, 244, 214, 0.94);
    --nav-bg: rgba(240, 240, 248, 0.92);
    /* ... */
}

body.dark-mode {
    --bg-color: #131318;
    --text-color: #e8e8f0;
    --card-soft: rgba(30, 30, 42, 0.96);
    --nav-bg: rgba(18, 18, 28, 0.94);
    /* ... */
}
```

La transición suave entre modos está definida en el `body` (línea **147** de `styles.css`):

```css
transition: background-color 0.4s ease, color 0.4s ease;
```

Esto hace que cuando se añade o elimina la clase `dark-mode` del body, el cambio de color no sea instantáneo sino gradual durante 0.4 segundos.

### JavaScript — Lógica de persistencia

La lógica del modo oscuro está en las líneas **476–492** de `script.js`. Se ejecuta en tres pasos al cargar la página:

**Paso 1 — Detectar preferencia guardada y preferencia del sistema:**

```javascript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');
const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
```

La lógica de prioridad es: si hay algo guardado en `localStorage`, se usa eso. Si no hay nada guardado, se mira la preferencia del sistema operativo con `prefers-color-scheme`.

**Paso 2 — La función `applyTheme()`:**

```javascript
const applyTheme = (dark) => {
    body.classList.toggle('dark-mode', dark);
    if (darkBtn) darkBtn.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
};
```

Esta función hace tres cosas a la vez: añade o quita la clase `dark-mode` del body (lo que desencadena todas las transiciones CSS), cambia el emoji del botón, y guarda la preferencia en `localStorage`.

**Paso 3 — Aplicar el tema inicial y escuchar clics:**

```javascript
applyTheme(isDark);

darkBtn?.addEventListener('click', () => {
    applyTheme(!body.classList.contains('dark-mode'));
});
```

Al cargar la página se aplica el tema correspondiente. Al hacer clic en el botón, simplemente se invierte el estado actual.

---

## 4. Navbar con scroll inteligente y sección activa

### Descripción general

La barra de navegación permanece completamente oculta mientras el usuario está en la primera sección de la página. En cuanto la primera sección sale del viewport, la navbar aparece desde arriba con una transición suave. Además, el enlace correspondiente a la sección que está viendo el usuario se resalta automáticamente en todo momento.

### HTML

La navbar está definida en `index.html` en las líneas **24–35**. Cada enlace tiene un atributo `data-nav-target` con el ID de la sección a la que apunta:

```html
<a href="#section-roles" class="site-nav-link" data-nav-target="section-roles">Roles</a>
```

Las secciones del contenido tienen IDs correspondientes, como `id="section-roles"` en la línea **61**.

### CSS — La navbar empieza oculta

La navbar arranca fuera de pantalla gracias a `transform: translateY(-110%)` y con `opacity: 0` (líneas **889–909** de `styles.css`):

```css
.site-nav {
    position: fixed;
    top: 0;
    transform: translateY(-110%);
    opacity: 0;
    pointer-events: none;
    transition: transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
                opacity 0.32s ease;
}
```

El `pointer-events: none` desactiva todos los clics mientras está oculta, evitando interacciones accidentales. La curva `cubic-bezier(0.22, 1, 0.36, 1)` da un efecto de "rebote suave" a la entrada.

Cuando se añade la clase `is-visible` (líneas **910–914**), la navbar vuelve a su posición natural:

```css
.site-nav.is-visible {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
}
```

### JavaScript — `IntersectionObserver` para mostrar/ocultar la navbar

En vez de usar el evento `scroll` (que se dispara constantemente y es costoso en rendimiento), se usa `IntersectionObserver` (líneas **495–510** de `script.js`). Este observador vigila la primera sección (`#section-basics`) y actúa cuando entra o sale del viewport:

```javascript
const navObserver = new IntersectionObserver(
    ([entry]) => {
        if (!entry.isIntersecting) {
            siteNav.classList.add('is-visible');
        } else {
            siteNav.classList.remove('is-visible');
        }
    },
    { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
);
navObserver.observe(heroSection);
```

El `rootMargin: '-60px 0px 0px 0px'` añade un margen negativo de 60px en la parte superior, haciendo que la sección se considere "fuera del viewport" un poco antes de que realmente lo esté. Esto da tiempo a que la navbar aparezca suavemente antes de que el usuario pierda de vista la sección.

### JavaScript — `IntersectionObserver` para el enlace activo

Un segundo observador (líneas **513–531**) vigila todas las secciones simultáneamente y actualiza el enlace activo:

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

El `threshold: 0.3` significa que la sección tiene que estar al menos un 30% visible para activar su enlace correspondiente. Esto evita que el enlace activo cambie con secciones que apenas asoman por el borde de la pantalla.

### JavaScript — Scroll suave con offset de la navbar

Al hacer clic en un enlace, en vez de dejar que el navegador haga su scroll por defecto (que dejaría el contenido tapado por la navbar fija), se calcula manualmente la posición correcta (líneas **533–549**):

```javascript
const navHeight = siteNav?.offsetHeight ?? 0;
const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - 12;
window.scrollTo({ top: targetTop, behavior: 'smooth' });
```

`getBoundingClientRect().top` da la posición de la sección relativa al viewport. Sumando `window.scrollY` se obtiene la posición absoluta en el documento. Se resta la altura de la navbar y 12px de margen extra para que el contenido quede bien visible.

### JavaScript — Botón hamburguesa en móvil

El botón hamburguesa se crea dinámicamente en JavaScript en las líneas **463–474**, en vez de estar en el HTML. Esto mantiene el HTML limpio y el botón solo existe cuando el JS está activo:

```javascript
const navToggle = document.createElement('button');
navToggle.className = 'site-nav-toggle';
navToggle.innerHTML = '<span></span><span></span><span></span>';
siteNav?.querySelector('.site-nav-inner')?.appendChild(navToggle);
```

Las tres etiquetas `<span>` son las tres líneas del icono hamburguesa, animadas con CSS cuando se añade la clase `is-open`.

---

## 5. Carrusel de arquetipos con animación de transición

### Descripción general

El carrusel de la sección de arquetipos permite navegar entre 6 tarjetas con animación de deslizamiento. Lo más destacado es que implementa un **bucle infinito real**: al llegar al último elemento y pulsar siguiente, el carrusel parece volver al primero sin salto brusco. Esto se consigue con una técnica de clonado de nodos y reposicionamiento instantáneo.

### HTML — Estructura del carrusel

El carrusel está definido en `index.html` entre las líneas **125–247**. La estructura es:

```html
<div class="archetypes-carousel">
    <button class="carousel-button carousel-button-prev" id="archetypes-prev">‹</button>
    <div class="archetypes-viewport">
        <div class="archetypes-track" id="archetypes-track">
            <article class="archetype-card">...</article>
            <article class="archetype-card">...</article>
            <!-- ... 6 cards en total -->
        </div>
    </div>
    <button class="carousel-button carousel-button-next" id="archetypes-next">›</button>
</div>
```

El `archetypes-viewport` actúa como ventana con `overflow: hidden` (línea **396** de `styles.css`), mostrando solo una carta a la vez. El `archetypes-track` es el contenedor que se mueve con `translateX`.

### CSS — El movimiento del track

El track tiene `display: flex` para que todas las cartas estén en línea, y la transición de deslizamiento definida en `styles.css` línea **401**:

```css
.archetypes-track {
    display: flex;
    transition: transform 0.48s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform;
}
```

La curva `cubic-bezier(0.25, 0.46, 0.45, 0.94)` es una aceleración de tipo "ease-out": el movimiento empieza rápido y desacelera suavemente al llegar a la carta destino, dando una sensación natural de inercia.

### JavaScript — Clonado para el bucle infinito

El truco del bucle infinito se implementa en las líneas **202–216** de `script.js`. Justo después de obtener las cartas originales, se clonan la primera y la última:

```javascript
const originalArchetypeCards = Array.from(archetypesTrack.querySelectorAll('.archetype-card'));
const archetypesCount = originalArchetypeCards.length;
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

El resultado en el DOM es:

```
[clon de la última] [card 1] [card 2] ... [card 6] [clon de la primera]
     índice 0         índice 1  índice 2    índice 6      índice 7
```

Por eso `currentArchetypeIndex` empieza en `1` (la primera carta real, no el clon). Los clones tienen `aria-hidden="true"` para que los lectores de pantalla no los anuncien.

### JavaScript — `syncArchetypesCarousel()`: mover el track

La función `syncArchetypesCarousel()` (líneas **218–222**) aplica la posición actual al DOM:

```javascript
const syncArchetypesCarousel = () => {
    archetypesTrack.style.transform = `translateX(-${currentArchetypeIndex * 100}%)`;
    archetypesPrev.disabled = archetypesCount <= 1;
    archetypesNext.disabled = archetypesCount <= 1;
};
```

Mover el track un `100%` equivale exactamente al ancho de una carta, porque cada carta ocupa el 100% del viewport del carrusel.

### JavaScript — El reposicionamiento invisible

La magia del bucle infinito ocurre en el evento `transitionend` (líneas **242–271**), que se dispara cuando termina la animación CSS:

```javascript
archetypesTrack.addEventListener('transitionend', () => {
    if (currentArchetypeIndex === 0) {
        // Llegamos al clon de la última → saltar a la última real sin animación
        isAdjustingCarousel = true;
        archetypesTrack.style.transition = 'none';
        currentArchetypeIndex = archetypesCount;
        syncArchetypesCarousel();

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                archetypesTrack.style.transition = '';
                isAdjustingCarousel = false;
            });
        });
    } else if (currentArchetypeIndex === archetypesCount + 1) {
        // Llegamos al clon de la primera → saltar a la primera real sin animación
        isAdjustingCarousel = true;
        archetypesTrack.style.transition = 'none';
        currentArchetypeIndex = 1;
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

El proceso es:

1. El usuario pulsa "siguiente" estando en la carta 6 → el track se anima hacia el clon de la carta 1 (índice 7).
2. La animación termina → `transitionend` se dispara.
3. Se desactiva la transición CSS con `transition: 'none'`.
4. Se reposiciona el track instantáneamente a la carta 1 real (índice 1). Como no hay transición, el salto es invisible.
5. Se vuelve a activar la transición en el siguiente frame con `requestAnimationFrame` doble (el primer frame aplica el cambio de posición, el segundo reactiva la transición).

El `requestAnimationFrame` doble es necesario porque el navegador agrupa los cambios de estilo: si se reactiva la transición en el mismo frame en que se mueve el elemento, el navegador los ejecuta juntos y la transición vuelve a dispararse. Con dos frames se garantiza que el cambio de posición ya está pintado antes de reactivar la animación.

La variable `isAdjustingCarousel` (línea **205**) bloquea los clics del usuario durante este reposicionamiento para evitar comportamientos inesperados si pulsa muy rápido.