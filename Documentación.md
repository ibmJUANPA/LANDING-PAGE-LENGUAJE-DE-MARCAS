# Documentación Técnica — PokéVGC Landing Page

---

## 1. Instrucciones de inicio y ejecución

### Requisitos previos

- Node.js v18 o superior
- npm

### Pasos (Desde la terminal de VSCode)

```bash
# 1. Entramos en la carpeta del backend (Estando en la carpeta principal/raiz)
cd backend 

# 2. Instalar las dependencias del backend 
npm install

# 3. Arrancamos el servidor
node server.js
```

Con el servidor corriendo, abrir `index.html` directamente en el navegador o servirla con un servidor estático como Live Server de VS Code. El front-end se conecta automáticamente al backend en `http://localhost:3000`.

### Verificar que el backend funciona

```
GET http://localhost:3000/health
→ { "status": "ok", "uptime": ... }

GET http://localhost:3000/api/pokemon/pikachu
→ { "id": 25, "name": "pikachu", "types": ["electric"], ... }
```

---

## 2. Funcionalidades implementadas

1. **Telón de entrada controlado por el ratón** — dos paneles que cubren la pantalla al cargar y se abren deslizándose al hacer scroll con el ratón.
2. **Navbar inteligente con detección de sección activa** — barra de navegación que aparece y desaparece según el scroll y resalta automáticamente la sección visible.
3. **Toggle de modo oscuro/claro persistente** — alternancia de tema con persistencia en `localStorage` y respeto a la preferencia del sistema operativo.
4. **Carrusel bidireccional e infinito de arquetipos** — carrusel horizontal con navegación en ambos sentidos sin cortes al pasar del último al primer elemento.
5. **Buscador de Pokémon con backend y PokéAPI** *(funcionalidad de back-end)* — formulario de búsqueda conectado a un servidor Express propio que consulta la PokéAPI, aplica caché en memoria y devuelve los datos al front-end para renderizarlos.

---

## 3. Funcionalidad 1 — Telón de entrada controlado por el ratón

### 3.1. Descripción — qué hace

Al cargar la página, dos paneles de color rojo cubren la totalidad de la pantalla simulando el telón de un estadio deportivo. Mientras el telón está cerrado, todo el contenido de la web queda bloqueado y el usuario no puede interactuar con él. El usuario abre el telón acumulando scroll hacia abajo con la rueda del ratón: los paneles se deslizan lateralmente (el izquierdo hacia la izquierda, el derecho hacia la derecha) de forma directamente proporcional al desplazamiento acumulado, creando la sensación de que el propio usuario está abriendo el telón con sus manos. El texto instructivo superpuesto entre los dos paneles se desvanece conforme se van abriendo. Solo cuando el telón alcanza la apertura completa el scroll normal del contenido queda desbloqueado. La funcionalidad también responde a swipe táctil en móvil y a las teclas de teclado.

### 3.2. Explicación del funcionamiento — cómo lo hace

El telón se modela como un valor numérico `curtainProgress` que va de `0` (cerrado) a `1` (totalmente abierto). Cada vez que el usuario mueve la rueda del ratón, el evento `wheel` captura la cantidad de píxeles de desplazamiento (`deltaY`), la divide entre un divisor fijo (`700`) para convertirla en un incremento de progreso, y lo suma al valor acumulado. Ese valor se mantiene siempre dentro del rango `[0, 1]` mediante la función `clamp`. Con el nuevo progreso calculado, se actualiza en tiempo real el `transform: translateX()` de cada panel CSS, lo que produce el deslizamiento visual. Mientras el progreso es menor que `1`, se añade la clase `pre-opening` al `body`, que aplica `overflow: hidden` para bloquear el scroll. Al llegar a `1`, esa clase se elimina y el contenido queda accesible. Para los dispositivos táctiles, se calcula el delta entre la posición actual y la última posición registrada del dedo en cada frame del evento `touchmove`, multiplicado por un factor de sensibilidad. Para el teclado, cada pulsación aplica un delta fijo equivalente a un quinto de la apertura total.

### 3.3. Fragmentos de código relevantes

**Archivos implicados:** `index.html` (estructura HTML), `styles.css` (posicionamiento y transición de los paneles), `script.js` (toda la lógica de control).

#### Estructura HTML de los paneles

```html
<!-- index.html -->
<div id="curtain-wrapper">
    <div class="curtain left-curtain"></div>
    <div class="curtain right-curtain"></div>
    <div class="curtain-text">
        <h1>ENTRANDO AL ESTADIO</h1>
        <p>Haz scroll para empezar el combate</p>
        <div class="scroll-arrow">↓</div>
    </div>
</div>
```

Los dos `div.curtain` son los paneles del telón. El `div.curtain-text` contiene el mensaje instructivo superpuesto entre ambos.

#### CSS — posicionamiento y transición

```css
/* styles.css */
.curtain {
    position: fixed;   /* Siempre cubre el viewport, independientemente del scroll */
    top: 0;
    width: 50%;        /* Cada panel ocupa la mitad de la pantalla */
    height: 100%;
    background: var(--poke-red);
    transition: transform 0.05s linear; /* Micro-transición para suavizar cada actualización */
    z-index: 9000;     /* Por encima de todo el contenido */
}
.left-curtain  { left: 0; }
.right-curtain { right: 0; }

/* Bloquea el scroll del contenido mientras el telón no está abierto */
body.pre-opening {
    overflow: hidden;
}
```

`position: fixed` hace que los paneles estén siempre pegados al viewport aunque el usuario haga scroll. La transición de `0.05s linear` suaviza cada micro-actualización del `transform` sin añadir retardo perceptible, manteniendo la respuesta directa al ratón.

#### Funciones principales en `script.js`

```javascript
// script.js

let curtainProgress = 0; // Estado global del telón: 0 = cerrado, 1 = abierto

// Mantiene un valor dentro de un rango [min, max]
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Aplica el progreso actual a los elementos del DOM
const syncCurtain = () => {
    // translateX negativo desplaza el panel izquierdo hacia la izquierda
    leftCurtain.style.transform  = `translateX(${-100 * curtainProgress}%)`;
    // translateX positivo desplaza el panel derecho hacia la derecha
    rightCurtain.style.transform = `translateX(${100 * curtainProgress}%)`;

    // El texto se desvanece más rápido que los paneles (factor 1.35 > 1)
    curtainText.style.opacity = String(1 - curtainProgress * 1.35);

    // Gestiona el bloqueo/desbloqueo del scroll del body
    if (curtainProgress < 1) {
        body.classList.add('pre-opening');
    } else {
        body.classList.remove('pre-opening');
    }
};

// Convierte un delta en píxeles en avance de progreso
const updateCurtainProgress = (deltaY) => {
    const step = deltaY / 700; // 700px de scroll = apertura completa
    curtainProgress = clamp(curtainProgress + step, 0, 1);
    syncCurtain();
};
```

`syncCurtain` es la función central: calcula los nuevos valores CSS a partir del estado `curtainProgress` y los aplica directamente sobre los elementos del DOM. Es llamada cada vez que el progreso cambia, ya sea por ratón, táctil o teclado.

#### Evento de rueda del ratón

```javascript
// script.js

window.addEventListener('wheel', (event) => {
    const atTop = window.scrollY <= 0;

    // El telón intercepta el scroll si:
    // a) aún no está completamente abierto (el usuario avanza)
    // b) está parcialmente abierto, el usuario está en lo alto y hace scroll hacia arriba (retrocede)
    const shouldControlCurtain =
        curtainProgress < 1 ||
        (curtainProgress > 0 && atTop && event.deltaY < 0);

    if (!shouldControlCurtain) return;

    event.preventDefault(); // Cancela el scroll nativo del navegador
    updateCurtainProgress(event.deltaY);
}, { passive: false }); // passive: false es obligatorio para poder llamar preventDefault
```

Sin `{ passive: false }`, el navegador ejecutaría el scroll nativo antes de que el código pueda cancelarlo con `preventDefault()`, provocando un desplazamiento involuntario del contenido mientras el telón aún está activo. Este listener afecta al comportamiento de `index.html` y se coordina con las clases CSS de `styles.css`.

#### Soporte táctil

```javascript
// script.js

let touchLastY = 0;

window.addEventListener('touchstart', (event) => {
    touchLastY = event.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchmove', (event) => {
    if (curtainProgress === 1) return; // Ya abierto: no intervenir

    event.preventDefault();

    const currentY = event.touches[0].clientY;
    const deltaY   = touchLastY - currentY; // Positivo al deslizar el dedo hacia arriba
    touchLastY     = currentY;

    updateCurtainProgress(deltaY * 1.4); // x1.4 para igualar la sensibilidad con el ratón
}, { passive: false });
```

El multiplicador `1.4` compensa que el movimiento del dedo produce deltas de menor magnitud que la rueda del ratón. Sin él, el gesto táctil se sentiría mucho más lento que el ratón para la misma distancia recorrida.

---

## 4. Funcionalidad 2 — Navbar inteligente con detección de sección activa

### 4.1. Descripción — qué hace

La barra de navegación permanece completamente oculta mientras la sección inicial (hero) es visible en pantalla. En el momento en que el usuario hace scroll y esa sección deja de verse, la navbar aparece deslizándose desde la parte superior con una transición suave. Cuando el usuario vuelve al inicio, la navbar vuelve a ocultarse. Mientras navega por la página, el enlace de la barra que corresponde a la sección actualmente visible en pantalla se resalta automáticamente. En dispositivos móviles, los enlaces de navegación desaparecen y son sustituidos por un botón hamburguesa que despliega el menú en vertical. Todos los enlaces de la barra ejecutan un scroll suave hasta su sección destino, compensando el espacio que ocupa la propia navbar para que la sección no quede tapada.

### 4.2. Explicación del funcionamiento — cómo lo hace

La aparición y desaparición de la navbar se gestiona con un `IntersectionObserver` que vigila la sección hero. Esta API del navegador notifica cuándo un elemento entra o sale del viewport sin necesidad de escuchar el evento `scroll` en cada frame. Cuando el hero deja de intersectar el viewport, el observer añade la clase `is-visible` a la navbar, lo que activa una transición CSS que la baja desde fuera de la pantalla hasta su posición. Un segundo `IntersectionObserver` observa todas las secciones con `id` simultáneamente y, cuando alguna ocupa al menos el 30% del viewport, recorre todos los enlaces y añade la clase `is-active` solo al que apunta a esa sección. El botón hamburguesa no existe en el HTML sino que se crea e inyecta dinámicamente en el DOM por JavaScript para mantener el HTML limpio. El scroll suave calcula la posición exacta de la sección destino y le resta la altura de la navbar y un margen de 12px para que el título de la sección quede perfectamente visible.

### 4.3. Fragmentos de código relevantes

**Archivos implicados:** `index.html` (estructura de la nav y atributos `data-nav-target`), `styles.css` (estado oculto, transición, clase `is-visible` y `is-active`), `script.js` (ambos observers, generación del botón hamburguesa y scroll suave).

#### Estructura HTML de la navbar

```html
<!-- index.html -->
<nav class="site-nav" id="site-nav" aria-label="Navegación principal">
    <div class="site-nav-inner">
        <span class="site-nav-logo">◆ PokéVGC</span>
        <ul class="site-nav-links" role="list">
            <li><a href="#section-basics"     class="site-nav-link" data-nav-target="section-basics">Conceptos</a></li>
            <li><a href="#section-roles"      class="site-nav-link" data-nav-target="section-roles">Roles</a></li>
            <li><a href="#section-archetypes" class="site-nav-link" data-nav-target="section-archetypes">Arquetipos</a></li>
            <li><a href="#section-search"     class="site-nav-link" data-nav-target="section-search">Buscador</a></li>
        </ul>
        <button class="site-nav-darkmode" id="nav-darkmode">🌙</button>
    </div>
</nav>
```

El atributo `data-nav-target` en cada enlace almacena el `id` de su sección destino. JavaScript lo lee para compararlo con el `id` de la sección que el observer detecta como activa, evitando tener que parsear el atributo `href`.

#### CSS — estado inicial oculto y transición de aparición

```css
/* styles.css */
.site-nav {
    position: fixed;
    top: 0;
    width: 100%;
    transform: translateY(-100%); /* Desplazada fuera del viewport hacia arriba */
    opacity: 0;
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                opacity   0.35s ease;
    z-index: 8000;
}

/* Clase que activa la entrada de la navbar */
.site-nav.is-visible {
    transform: translateY(0); /* Baja a su posición natural */
    opacity: 1;
}
```

La navbar arranca en `translateY(-100%)` y `opacity: 0`, es decir, completamente fuera de pantalla e invisible. Al añadir `is-visible` desde JavaScript, la transición CSS anima ambas propiedades. La curva `cubic-bezier(0.22, 1, 0.36, 1)` produce una entrada rápida que desacelera suavemente al final, como si la barra «cayera» y frenara en su posición.

#### Observer que muestra y oculta la navbar

```javascript
// script.js

const navObserver = new IntersectionObserver(
    ([entry]) => {
        if (!entry.isIntersecting) {
            // La sección hero ha salido del viewport → mostrar navbar
            siteNav.classList.add('is-visible');
        } else {
            // La sección hero está visible → ocultar navbar y cerrar menú móvil
            siteNav.classList.remove('is-visible');
            navLinksList?.classList.remove('is-open');
        }
    },
    {
        threshold: 0,
        rootMargin: '-60px 0px 0px 0px' // La navbar aparece 60px antes de que
                                         // el hero desaparezca completamente
    }
);
navObserver.observe(heroSection); // Vigila solo la sección hero
```

`IntersectionObserver` recibe un callback que se ejecuta cuando el elemento observado cambia su estado de visibilidad. El parámetro `rootMargin: '-60px 0px 0px 0px'` adelanta en 60px el momento en que el observer considera que el hero ha salido, para que la navbar ya esté visible antes de que el hero desaparezca del todo. Esta API es más eficiente que escuchar `scroll` porque el navegador gestiona la detección internamente sin bloquear el hilo principal.

#### Observer que detecta la sección activa

```javascript
// script.js

const allSections = document.querySelectorAll('section[id]');

const activeLinkObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                navLinks.forEach((link) => {
                    // Añade is-active al enlace cuyo data-nav-target coincide con el id de la sección visible
                    link.classList.toggle(
                        'is-active',
                        link.dataset.navTarget === entry.target.id
                    );
                });
            }
        });
    },
    { threshold: 0.3 } // La sección debe ocupar al menos el 30% del viewport para activarse
);

allSections.forEach((section) => activeLinkObserver.observe(section));
```

El umbral `0.3` (30%) evita activaciones falsas por secciones que aparecen parcialmente en el borde del viewport al pasar de una a otra. `classList.toggle(clase, condición)` es un método que añade la clase si la condición es `true` y la elimina si es `false`, permitiendo actualizar todos los enlaces en una sola pasada.

#### Botón hamburguesa generado dinámicamente

```javascript
// script.js

const navToggle = document.createElement('button');
navToggle.className = 'site-nav-toggle';
navToggle.setAttribute('aria-label', 'Abrir menú');
navToggle.setAttribute('aria-expanded', 'false');
navToggle.innerHTML = '<span></span><span></span><span></span>'; // Tres líneas del icono

siteNav?.querySelector('.site-nav-inner')?.appendChild(navToggle);

navToggle.addEventListener('click', () => {
    const isOpen = navLinksList.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen)); // Accesibilidad: informa a lectores de pantalla
});
```

El botón se crea con `document.createElement` y se inserta en el DOM con `appendChild`. Al no estar en el HTML, no existe en el árbol cuando CSS lo oculta en escritorio, lo que evita un elemento inaccesible innecesario. `aria-expanded` se actualiza en cada toggle para que los lectores de pantalla anuncien el estado del menú.

#### Scroll suave con compensación de offset

```javascript
// script.js

link.addEventListener('click', (event) => {
    event.preventDefault(); // Cancela el salto nativo del ancla href

    const targetEl  = document.getElementById(targetId);
    const navHeight = siteNav?.offsetHeight ?? 0;

    // getBoundingClientRect().top da la posición relativa al viewport
    // window.scrollY la convierte en posición absoluta en el documento
    // Se resta la altura de la navbar y 12px de margen visual
    const targetTop = targetEl.getBoundingClientRect().top
                    + window.scrollY
                    - navHeight
                    - 12;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
});
```

Sin la resta de `navHeight`, el navegador desplazaría la sección hasta el borde superior del viewport, quedando parcialmente tapada por la navbar en `position: fixed`. `behavior: 'smooth'` es la propiedad CSS que activa el desplazamiento animado nativo del navegador en lugar de un salto instantáneo. Este listener afecta a los enlaces de `index.html` y se coordina con los estilos de `.site-nav` en `styles.css`.

---

## 5. Funcionalidad 3 — Toggle de modo oscuro/claro persistente

### 5.1. Descripción — qué hace

La página incluye un botón en la navbar con un icono de luna o sol que alterna entre el modo claro y el modo oscuro. Al activar el modo oscuro, todos los colores, fondos y superficies de la página cambian instantáneamente a una paleta oscura sin recargar la página. La preferencia queda guardada en el navegador del usuario y se mantiene en futuras visitas. Si el usuario no ha visitado la página antes, el tema que se aplica por defecto es el que tiene configurado su sistema operativo (claro u oscuro). El icono del botón cambia entre 🌙 y ☀️ según el modo activo.

### 5.2. Explicación del funcionamiento — cómo lo hace

Al cargar la página, JavaScript comprueba en primer lugar si existe un valor guardado en `localStorage` bajo la clave `'theme'`. Si existe, lo aplica. Si no existe (primera visita), consulta la media query `prefers-color-scheme: dark` del sistema operativo mediante `window.matchMedia` y usa ese resultado. Con ese booleano llama a la función `applyTheme`, que simplemente añade o elimina la clase `dark-mode` del elemento `body` y guarda la preferencia en `localStorage`. Todo el sistema de colores de la página está construido sobre **custom properties CSS** (variables como `--bg-color`, `--text-color`, `--card-bg`…) definidas en `:root`. En el selector `body.dark-mode`, esas mismas variables se redefinen con los valores oscuros. Como todos los componentes de la página usan exclusivamente esas variables para sus colores, el cambio de clase en el `body` provoca que toda la página se actualice de golpe sin necesitar reglas específicas por componente.

### 5.3. Fragmentos de código relevantes

**Archivos implicados:** `script.js` (lógica de inicialización y toggle), `styles.css` (variables CSS de `:root` y `body.dark-mode`), `index.html` (botón `#nav-darkmode`).

#### Lógica de inicialización y persistencia

```javascript
// script.js

const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
// .matches devuelve true si el SO tiene activado el modo oscuro

const savedTheme = localStorage.getItem('theme');
// Puede ser 'dark', 'light' o null si es la primera visita

// Orden de prioridad:
// 1º valor guardado por el usuario, 2º preferencia del SO, 3º modo claro por defecto
const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

applyTheme(isDark); // Aplicar el tema correcto antes de que el usuario vea la página
```

`window.matchMedia()` permite consultar una media query CSS desde JavaScript y obtener su estado actual. `localStorage.getItem()` devuelve `null` si la clave no existe, lo que identifica la primera visita y delega la decisión en la preferencia del sistema.

#### Función `applyTheme`

```javascript
// script.js

const applyTheme = (dark) => {
    body.classList.toggle('dark-mode', dark);
    // classList.toggle(clase, fuerza): añade la clase si fuerza es true, la elimina si es false

    if (darkBtn) darkBtn.textContent = dark ? '☀️' : '🌙';
    // Actualiza el icono del botón en index.html según el tema activo

    localStorage.setItem('theme', dark ? 'dark' : 'light');
    // Persiste la elección para la próxima visita
};

darkBtn?.addEventListener('click', () => {
    applyTheme(!body.classList.contains('dark-mode'));
    // Invierte el estado actual: si está en oscuro pasa a claro, y viceversa
});
```

El diseño de `applyTheme` como función que recibe un booleano (en lugar de un simple `toggle` sin argumento) permite llamarla tanto en la inicialización como en el clic con el mismo código, eliminando duplicación de lógica. El operador `?.` en `darkBtn?.addEventListener` es optional chaining: evita errores si el botón no existe en el DOM.

#### Variables CSS en `styles.css`

```css
/* styles.css */

/* Modo claro — valores por defecto */
:root {
    --bg-color:    #f0f0f0;
    --text-color:  #222;
    --nav-bg:      rgba(240, 240, 248, 0.92);
    --card-bg:     rgba(255, 248, 231, 0.97);
    --poke-blue:   #3b4cca;
    --poke-yellow: #ffcb05;
    --poke-red:    #ee1515;
    --input-bg:    rgba(255, 255, 255, 0.96);
}

/* Modo oscuro — sobrescritura de las mismas variables */
body.dark-mode {
    --bg-color:    #131318;
    --text-color:  #e8e8f0;
    --nav-bg:      rgba(18, 18, 28, 0.94);
    --card-bg:     rgba(28, 28, 46, 0.97);
    --poke-blue:   #7b8fff; /* Versión más clara para mantener contraste en fondos oscuros */
    --poke-red:    #ff5f5f;
    --input-bg:    rgba(30, 30, 48, 0.96);
}
```

Cuando JavaScript añade `dark-mode` al `body`, el selector `body.dark-mode` en CSS tiene mayor especificidad que `:root`, por lo que sus variables sobreescriben las del modo claro. Todos los componentes que usan `var(--bg-color)`, `var(--text-color)`, etc. se actualizan automáticamente sin necesitar ninguna regla adicional. `--poke-blue` y `--poke-red` toman valores más luminosos en modo oscuro porque los colores de marca originales tienen bajo contraste sobre fondos muy oscuros.

---

## 6. Funcionalidad 4 — Carrusel bidireccional e infinito de arquetipos

### 6.1. Descripción — qué hace

La sección de arquetipos muestra seis estrategias de equipo competitivo en un carrusel horizontal. El usuario puede navegar hacia adelante con el botón `›` o hacia atrás con el botón `‹`. El carrusel es **infinito en ambos sentidos**: al llegar al último elemento y pulsar siguiente, el carrusel regresa sin corte ni salto brusco al primer elemento; al estar en el primer elemento y pulsar anterior, el carrusel llega al último. El deslizamiento entre tarjetas es siempre animado y fluido.

### 6.2. Explicación del funcionamiento — cómo lo hace

El carrusel se basa en la técnica de **clonado de nodos extremos**. Al inicializarse, JavaScript lee las tarjetas originales del DOM y añade dos clones: una copia del último elemento al principio del track y una copia del primero al final. La estructura resultante es `[clon-último] [orig-1] ... [orig-N] [clon-primero]`. El carrusel arranca mostrando el índice 1 (primer elemento real). Cuando el usuario pulsa una flecha, el índice se incrementa o decrementa y se aplica un `transform: translateX()` al track para deslizarse hasta la nueva posición con una transición CSS animada. Si tras la animación el índice es `0` (el clon del último) o `N+1` (el clon del primero), el carrusel detecta que está sobre un clon: desactiva la transición CSS, salta instantáneamente al elemento real equivalente en el extremo opuesto, y en el siguiente frame reactiva la transición. Ese salto ocurre cuando el frame ya se ha renderizado, por lo que el usuario nunca lo percibe: solo ve el deslizamiento animado hacia el clon y, sin ningún corte visible, el carrusel queda posicionado en el elemento real listo para seguir navegando.

### 6.3. Fragmentos de código relevantes

**Archivos implicados:** `index.html` (estructura del carrusel), `styles.css` (viewport, track y transición), `script.js` (inicialización, clonado, navegación y teletransportación silenciosa).

#### Estructura HTML del carrusel

```html
<!-- index.html -->
<div class="archetypes-carousel">
    <button class="carousel-button carousel-button-prev" id="archetypes-prev">‹</button>
    <div class="archetypes-viewport">
        <div class="archetypes-track" id="archetypes-track">
            <article class="archetype-card">...</article>
            <article class="archetype-card">...</article>
            <!-- ... hasta 6 tarjetas -->
        </div>
    </div>
    <button class="carousel-button carousel-button-next" id="archetypes-next">›</button>
</div>
```

`.archetypes-viewport` es la ventana visible con `overflow: hidden`. `.archetypes-track` es el contenedor que se desplaza horizontalmente con `transform`.

#### CSS — estructura y transición

```css
/* styles.css */
.archetypes-viewport {
    overflow: hidden; /* Oculta todas las tarjetas excepto la que está en el centro */
    width: 100%;
}

.archetypes-track {
    display: flex;    /* Coloca todas las tarjetas en fila horizontal */
    transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.archetype-card {
    flex: 0 0 100%;   /* Cada tarjeta ocupa exactamente el 100% del ancho del viewport */
    min-width: 100%;
}
```

`flex: 0 0 100%` significa: no crecer (`0`), no encoger (`0`), tamaño base del 100% del contenedor. Así cada tarjeta ocupa exactamente el mismo espacio que el viewport, y desplazar el track en múltiplos del 100% siempre muestra exactamente una tarjeta. La transición se aplica al track completo, por lo que cualquier cambio de `transform` queda animado automáticamente.

#### Inicialización y clonado de extremos

```javascript
// script.js

const originalArchetypeCards = Array.from(
    archetypesTrack.querySelectorAll('.archetype-card')
);
const archetypesCount = originalArchetypeCards.length; // 6
let currentArchetypeIndex = archetypesCount > 1 ? 1 : 0; // Empieza en el índice 1
let isAdjustingCarousel   = false; // Flag para bloquear clics durante la teletransportación

if (archetypesCount > 1) {
    const firstClone = originalArchetypeCards[0].cloneNode(true);
    const lastClone  = originalArchetypeCards[archetypesCount - 1].cloneNode(true);

    firstClone.setAttribute('aria-hidden', 'true'); // Los clones no son contenido real
    lastClone.setAttribute('aria-hidden',  'true');

    archetypesTrack.insertBefore(lastClone, originalArchetypeCards[0]);
    // Resultado: [clon-último] [orig-1] [orig-2] ... [orig-6]
    archetypesTrack.appendChild(firstClone);
    // Resultado: [clon-último] [orig-1] [orig-2] ... [orig-6] [clon-primero]
}
```

`cloneNode(true)` crea una copia profunda del nodo incluyendo todos sus hijos. `insertBefore(nodo, referencia)` inserta el nodo justo antes del elemento de referencia. `aria-hidden: true` indica a los lectores de pantalla que ignoren los clones, ya que son duplicados decorativos para el efecto visual.

#### Navegación y sincronización

```javascript
// script.js

// Aplica el desplazamiento al track según el índice actual
const syncArchetypesCarousel = () => {
    archetypesTrack.style.transform =
        `translateX(-${currentArchetypeIndex * 100}%)`;
    // índice 0 → translateX(0%), índice 1 → translateX(-100%), índice 2 → translateX(-200%)...
};

archetypesPrev.addEventListener('click', () => {
    if (archetypesCount <= 1 || isAdjustingCarousel) return;
    currentArchetypeIndex -= 1;
    syncArchetypesCarousel();
});

archetypesNext.addEventListener('click', () => {
    if (archetypesCount <= 1 || isAdjustingCarousel) return;
    currentArchetypeIndex += 1;
    syncArchetypesCarousel();
});
```

#### Teletransportación silenciosa al terminar la transición

```javascript
// script.js

archetypesTrack.addEventListener('transitionend', () => {
    if (archetypesCount <= 1) return;

    // Caso 1: llegó al clon del último (índice 0) → saltar al real (índice N)
    if (currentArchetypeIndex === 0) {
        isAdjustingCarousel = true;
        archetypesTrack.style.transition = 'none'; // Desactiva la transición CSS
        currentArchetypeIndex = archetypesCount;   // Cambia el índice al elemento real
        syncArchetypesCarousel();                  // Aplica el nuevo translateX sin animación

        // Doble requestAnimationFrame: garantiza que el cambio de posición se renderice
        // en el frame actual ANTES de reactivar la transición en el siguiente frame
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                archetypesTrack.style.transition = ''; // Reactiva la transición
                isAdjustingCarousel = false;
            });
        });

    // Caso 2: llegó al clon del primero (índice N+1) → saltar al real (índice 1)
    } else if (currentArchetypeIndex === archetypesCount + 1) {
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

`transitionend` es un evento del DOM que se dispara cuando una transición CSS termina. El patrón de **doble `requestAnimationFrame`** es imprescindible: con un solo `rAF`, el navegador podría procesar el cambio de posición y la reactivación de la transición en el mismo ciclo de renderizado, haciendo visible el salto. Con dos `rAF` consecutivos se fuerza que el reposicionamiento se pinte en el frame 1 y la transición se reactive en el frame 2, cuando el track ya está en su nueva posición, garantizando que el salto sea siempre imperceptible.

---

## 7. Funcionalidad 5 — Buscador de Pokémon con backend y PokéAPI

### 7.1. Descripción — qué hace

La sección final de la landing incluye un formulario de búsqueda donde el usuario puede introducir el nombre o el número de Pokédex de cualquier Pokémon. Al enviarlo, la página consulta un servidor backend propio y muestra una tarjeta de resultado con la imagen oficial del Pokémon, su número de Pokédex, tipos con badges de color temático, peso, altura, descripción en español, lista de habilidades y barras de estadísticas base animadas con colores proporcionales al valor. Si el Pokémon no existe, se muestra un mensaje de error. Si se busca el mismo Pokémon más de una vez, la respuesta llega más rápida porque el backend la sirve desde su caché interna.

### 7.2. Explicación del funcionamiento — cómo lo hace

El sistema funciona en dos capas separadas. La capa de **backend** es un servidor Express en Node.js que expone el endpoint `GET /api/pokemon/:name`. Cuando recibe una petición, comprueba primero si ese Pokémon ya está en una caché en memoria (`Map` de JavaScript). Si está en caché y no ha expirado (TTL de 1 hora), devuelve los datos directamente. Si no, realiza dos peticiones consecutivas a la PokéAPI: la primera obtiene los datos generales del Pokémon; la URL de especie que devuelve esa respuesta se usa para la segunda petición, que obtiene la descripción en texto. El servidor construye un objeto limpio con solo los campos necesarios, lo guarda en caché y lo envía al cliente. La capa de **front-end** escucha el evento `submit` del formulario, llama al backend con `fetch`, y al recibir la respuesta llama a la función `renderPokemon`, que rellena los campos de la tarjeta de resultado y la hace visible con una transición de entrada. Las barras de estadísticas reciben su ancho objetivo, color y tiempos de animación como custom properties CSS inyectadas en el atributo `style`, de modo que el CSS las anima automáticamente al insertarse en el DOM.

### 7.3. Fragmentos de código relevantes

**Archivos implicados:** `server.js` (servidor Express, caché y endpoints), `script.js` (petición `fetch`, renderizado y animación), `index.html` (formulario y tarjeta de resultado), `styles.css` (estilos de la tarjeta y animación de barras), `package.json` (dependencias `express` y `cors`).

#### `package.json` — dependencias del backend

```json
{
    "name": "pokemon-backend",
    "version": "1.0.0",
    "main": "server.js",
    "scripts": {
        "start": "node server.js",
        "dev":   "node --watch server.js"
    },
    "dependencies": {
        "cors":    "^2.8.5",
        "express": "^4.18.2"
    }
}
```

`express` es el framework que proporciona el sistema de rutas y middleware. `cors` es el middleware que añade las cabeceras HTTP necesarias para que el navegador permita peticiones desde un origen diferente al del servidor.

#### Configuración del servidor Express

```javascript
// server.js

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());         // Habilita peticiones cross-origin: imprescindible para que
                         // el fetch del front-end no sea bloqueado por el navegador
app.use(express.json()); // Parsea automáticamente el body de peticiones con Content-Type JSON
```

Sin `cors()`, el navegador rechazaría la petición `fetch` del front-end porque el HTML y el servidor tienen orígenes distintos (distinto puerto o protocolo). `process.env.PORT` permite configurar el puerto desde una variable de entorno en producción; `|| 3000` actúa como valor por defecto en desarrollo.

#### Caché en memoria con TTL

```javascript
// server.js

const cache     = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hora en milisegundos

function getFromCache(key) {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key); // Elimina entradas expiradas para no acumular memoria
        return null;
    }
    return entry.data;
}

function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });
    // timestamp guarda el momento exacto en que se almacenó el dato
}
```

`Map` es una estructura de datos clave-valor de JavaScript. Cada entrada almacena el objeto de datos y un `timestamp` (número de milisegundos desde epoch). Al recuperar, se compara `Date.now()` (milisegundos actuales) con ese timestamp: si la diferencia supera el TTL, la entrada se considera obsoleta y se descarta, forzando una nueva consulta a la PokéAPI.

#### Endpoint `GET /api/pokemon/:name`

```javascript
// server.js

async function fetchPokeAPI(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`);
    return res.json(); // Parsea y devuelve el JSON de la respuesta
}

app.get('/api/pokemon/:name', async (req, res) => {
    const name     = req.params.name.toLowerCase().trim();
    // req.params.name extrae el segmento dinámico :name de la URL
    const cacheKey = `pokemon:${name}`;

    const cached = getFromCache(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });
    // Si hay caché válida, responde inmediatamente sin llamar a la PokéAPI

    try {
        // Primera petición: datos generales del Pokémon
        const data = await fetchPokeAPI(`https://pokeapi.co/api/v2/pokemon/${name}`);

        // Segunda petición: datos de especie (contiene la descripción textual)
        const species = await fetchPokeAPI(data.species.url);

        // Buscar la descripción en español; inglés como fallback si no existe
        const descEntry =
            species.flavor_text_entries.find(e => e.language.name === 'es') ||
            species.flavor_text_entries.find(e => e.language.name === 'en');

        // Construir el objeto de respuesta filtrado con solo los campos necesarios
        const result = {
            id:          data.id,
            name:        data.name,
            height:      data.height / 10,  // La PokéAPI devuelve decímetros → convertir a metros
            weight:      data.weight / 10,  // La PokéAPI devuelve hectogramos → convertir a kg
            description: descEntry
                             ? descEntry.flavor_text.replace(/\f/g, ' ')
                             : null,
            // \f es un carácter de salto de página que la PokéAPI incluye en algunos textos
            types:       data.types.map(t => t.type.name),
            abilities:   data.abilities.map(a => ({
                             name:      a.ability.name,
                             is_hidden: a.is_hidden
                         })),
            stats:       data.stats.map(s => ({
                             name:      s.stat.name,
                             base_stat: s.base_stat
                         })),
            sprites: {
                front:            data.sprites.front_default,
                official_artwork: data.sprites.other?.['official-artwork']
                                  ?.front_default || null,
                shiny:            data.sprites.front_shiny || null,
            },
        };

        setCache(cacheKey, result); // Guardar en caché antes de responder
        res.json(result);

    } catch (err) {
        const status = err.message.includes('404') ? 404 : 500;
        res.status(status).json({
            error:  status === 404 ? 'Pokémon no encontrado' : 'Error interno del servidor',
            detail: err.message,
        });
    }
});
```

El filtrado del objeto es una decisión de diseño relevante: la PokéAPI devuelve objetos con más de 100 propiedades. El backend extrae y reenvía solo los campos que el front-end necesita, reduciendo el tamaño del payload y desacoplando el front-end de la estructura interna de la API externa. `.map()` transforma arrays de objetos complejos en arrays de objetos simples con solo las propiedades necesarias.

#### Front-end — envío del formulario y llamada al backend

```javascript
// script.js

pokemonSearchForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita la recarga de página que haría un submit nativo

    const searchValue = pokemonSearchInput.value.trim().toLowerCase();
    if (!searchValue) {
        setFeedback('Escribe un Pokémon para hacer la búsqueda.', 'error');
        return;
    }

    setFeedback('Buscando datos en el backend...', 'success');
    pokemonSearchForm.querySelector('button[type="submit"]').disabled = true;
    // Deshabilitar el botón evita envíos duplicados mientras la petición está en vuelo

    try {
        const response = await fetch(
            `http://localhost:3000/api/pokemon/${encodeURIComponent(searchValue)}`
            // encodeURIComponent codifica caracteres especiales en la URL (tildes, espacios...)
        );
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'No se pudo obtener el Pokémon');

        renderPokemon(data);
        setFeedback(`Resultado cargado para ${formatLabel(data.name)}.`, 'success');

    } catch (error) {
        resetResult();
        setFeedback(error.message || 'Error al consultar el backend.', 'error');

    } finally {
        pokemonSearchForm.querySelector('button[type="submit"]').disabled = false;
        // finally se ejecuta siempre, tanto si hubo éxito como si hubo error
    }
});
```

#### Front-end — renderizado de tipos y barras de estadísticas

```javascript
// script.js

// Mapa de color oficial por tipo de Pokémon
const typeColors = {
    normal: '#a8a77a', fire:    '#ee8130', water:   '#6390f0',
    electric: '#f7d02c', grass: '#7ac74c', psychic: '#f95587',
    dragon: '#6f35fc',  dark:   '#705746', steel:   '#b7b7ce',
    // ... 18 tipos en total
};

// Genera un badge HTML con el color correspondiente al tipo
pokemonResultTypes.innerHTML = pokemon.types
    .map((type) => {
        const color = typeColors[type] || '#666';
        return `<span class="pokemon-type-badge" style="background:${color}">
                    ${formatLabel(type)}
                </span>`;
    })
    .join('');

// Devuelve el color de la barra según el valor de la estadística
const getStatColor = (value) => {
    if (value >= 150) return '#21c7c7'; // Cian    — excepcional
    if (value >= 120) return '#27c93f'; // Verde   — muy alto
    if (value >= 90)  return '#ffd232'; // Amarillo — alto
    if (value >= 60)  return '#ff8c32'; // Naranja  — medio
    return '#ee3b2f';                   // Rojo     — bajo
};

// Genera el HTML de cada fila de estadística con sus datos de animación
pokemonStatsGrid.innerHTML = pokemon.stats.map((stat, index) => {
    const statWidth    = Math.min((stat.base_stat / 180) * 100, 100);
    // Porcentaje del ancho: 180 es el valor de referencia máximo
    const statColor    = getStatColor(stat.base_stat);
    const statDelay    = 90 + (index * 45);
    // Cada barra aparece 45ms después que la anterior, creando un efecto escalonado
    const statDuration = 0.55 + ((1 - Math.min(stat.base_stat, 180) / 180) * 0.28);
    // Estadísticas bajas se animan más lento para un efecto más dramático

    return `
        <div class="pokemon-stat">
            <span class="pokemon-stat-label">${statLabels[stat.name]}</span>
            <span class="pokemon-stat-value">${stat.base_stat}</span>
            <div class="pokemon-stat-bar-track">
                <div class="pokemon-stat-bar-fill"
                    style="--stat-width:${statWidth}%;
                           --stat-color:${statColor};
                           --stat-delay:${statDelay}ms;
                           --stat-duration:${statDuration.toFixed(2)}s;">
                </div>
            </div>
        </div>`;
}).join('');
```

Las barras inyectan sus parámetros de animación como custom properties CSS directamente en el atributo `style`. El CSS de `styles.css` las lee con `var()` para ejecutar la animación:

```css
/* styles.css */
.pokemon-stat-bar-fill {
    width: 0;
    background: var(--stat-color);
    animation: stat-bar-grow var(--stat-duration) var(--stat-delay) ease-out forwards;
}

@keyframes stat-bar-grow {
    from { width: 0; }
    to   { width: var(--stat-width); }
}
```

Este patrón mantiene la lógica de cálculo en JavaScript y la lógica de animación en CSS, con una separación limpia de responsabilidades entre ambos archivos. La propiedad `forwards` en `animation` hace que la barra mantenga el estado final (ancho completo) en lugar de volver a `0` al terminar.

---

## 10. Responsividad.

### 10.1. Descripción — qué hace

La landing page se adapta correctamente a los cinco formatos requeridos: escritorio, tablet en vertical, tablet en horizontal, móvil en vertical y móvil en horizontal. En cada formato, el layout, la tipografía y los componentes interactivos se reorganizan para garantizar legibilidad, usabilidad y jerarquía visual correcta sin desbordes ni elementos superpuestos.

### 10.2. Explicación del funcionamiento — cómo lo hace

El diseño utiliza una combinación de **unidades relativas** (`%`, `vw`, `vh`, `rem`), **Flexbox**, **CSS Grid** y **media queries** definidas en `styles.css`. Los grids de contenido usan `grid-template-columns` con `auto-fit` y `minmax` para colapsar automáticamente de múltiples columnas a una sola cuando el espacio disponible es insuficiente. La navbar detecta el tamaño de pantalla a través de una media query en CSS y oculta los enlaces de texto, mientras que JavaScript genera e inyecta el botón hamburguesa solo cuando es necesario. El telón de entrada y el carrusel usan unidades de viewport para mantenerse siempre al 100% del espacio visible.

### 10.3. Fragmentos de código relevantes

**Archivos implicados:** `styles.css` (media queries, grids y ajustes de layout), `script.js` (generación del botón hamburguesa).

#### Puntos de ruptura principales

```css
/* styles.css */

/* Tablet vertical y horizontal — hasta 768px de ancho */
@media (max-width: 768px) {
    .info-grid,
    .roles-grid,
    .archetypes-team-grid {
        grid-template-columns: 1fr; /* Colapsa a una sola columna */
    }

    .site-nav-links {
        display: none; /* Oculta los enlaces de texto en favor del menú hamburguesa */
    }

    .pokemon-result-inner {
        flex-direction: column; /* La tarjeta de resultado apila imagen y datos verticalmente */
    }
}

/* Móvil vertical — hasta 480px */
@media (max-width: 480px) {
    .hero-title     { font-size: clamp(2rem, 8vw, 4rem); }
    .section-title  { font-size: clamp(1.5rem, 6vw, 2.5rem); }
    /* clamp(mínimo, preferido, máximo): escala la tipografía de forma fluida */

    .archetype-card { padding: 1.2rem; } /* Reduce el padding en pantallas muy pequeñas */
}

/* Móvil horizontal */
@media (max-width: 768px) and (orientation: landscape) {
    .curtain-text h1 { font-size: 2rem; } /* Reduce el título del telón en landscape */
    .hero-section    { min-height: 100svh; }
    /* svh (small viewport height): unidad que excluye la barra del navegador en móvil */
}
```

`grid-template-columns: 1fr` asigna todo el espacio disponible a una única columna, apilando verticalmente los elementos que en escritorio estaban en fila. `clamp(mínimo, preferido, máximo)` permite que los tamaños de fuente escalen de forma fluida entre un mínimo y un máximo sin necesitar múltiples media queries para la tipografía.

#### Grid adaptable con `auto-fit` y `minmax`

```css
/* styles.css */

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
}
```

`repeat(auto-fit, minmax(280px, 1fr))` crea automáticamente tantas columnas como quepan con un mínimo de `280px` cada una. En escritorio caben 3 o 4 columnas; en tablet caben 2; en móvil cabe 1. Este patrón evita la necesidad de media queries explícitas para los grids de contenido, ya que el propio CSS calcula el número de columnas según el espacio disponible.

#### Menú hamburguesa — coordinación CSS y JavaScript

```css
/* styles.css */
.site-nav-toggle {
    display: none; /* Oculto en escritorio */
}

@media (max-width: 768px) {
    .site-nav-toggle {
        display: flex; /* Visible en móvil y tablet */
    }
}
```

```javascript
// script.js — el botón solo se crea si la resolución lo necesita
const navToggle = document.createElement('button');
navToggle.className = 'site-nav-toggle';
navToggle.setAttribute('aria-label', 'Abrir menú');
navToggle.innerHTML = '<span></span><span></span><span></span>';
siteNav?.querySelector('.site-nav-inner')?.appendChild(navToggle);

navToggle.addEventListener('click', () => {
    const isOpen = navLinksList.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
});
```

La coordinación entre CSS y JavaScript se produce así: CSS oculta el botón en escritorio (`display: none`) y lo muestra en móvil (`display: flex`), mientras que JavaScript gestiona la lógica de apertura y cierre del menú añadiendo y quitando la clase `is-open` a la lista de enlaces. Esta separación respeta el principio de que CSS controla la presentación y JavaScript controla el comportamiento.