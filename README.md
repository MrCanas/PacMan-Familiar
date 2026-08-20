# PacMan-Familiar

# 🎮 Pac-Man Familiar

Juego web tipo Pac-Man personalizado con las caras de los miembros de la familia. Antes de cada partida se elige **con qué familia se juega**, **quién es el protagonista**, **quiénes son exactamente los fantasmas** (de 1 a 4, elegidos uno a uno) y **en qué escenario**: el laberinto de neón de siempre o el patio con piscina.

Hay dos elencos: **los Valverde** (8 personajes) y **los Marín** (los 5 originales).

Proyecto pensado para construir junto a tres niños (el mayor de 14 años) como experiencia de aprendizaje de desarrollo web.

---

## 🎯 Objetivos del proyecto

1. **Jugable y divertido** desde la primera versión.
2. **Personalizable**: caras intercambiables, roles asignables, laberintos editables.
3. **Bien ordenado**: estructura clara, código legible, buenas prácticas de Git.
4. **Sin coste**: todo el stack es gratis (Canvas API nativa, Vite, GitHub, Vercel).
5. **Educativo**: que el de 14 pueda leer el código y entender cómo funciona.

---

## 🛠️ Stack técnico

- **Lenguaje**: TypeScript
- **Build tool**: Vite
- **Renderizado**: HTML5 Canvas API (nativa, sin librerías de juegos)
- **Estilos**: CSS plano (sin frameworks)
- **Persistencia local**: `localStorage` (selección de roles, récord)
- **Hosting**: Vercel (deploy automático desde GitHub)
- **Backend**: ninguno por ahora. Si más adelante se quiere leaderboard global o niveles compartidos, se evaluará Supabase.

### Convenciones

- TypeScript estricto (`strict: true` en `tsconfig.json`).
- ESLint + Prettier configurados desde el inicio.
- Nombres de archivos en `PascalCase` para clases, `camelCase` para utilidades.
- Imports relativos cortos; alias `@/` apuntando a `src/`.

---

## 📁 Estructura del proyecto

```
pacman-familia/
├── assets/
│   └── originals/               # fotos originales por familia (NO se suben a Git)
│       ├── valverde/
│       └── clasica/
├── scripts/
│   └── prepare-characters.py    # recorta las fotos a sprites cuadrados de cara
├── public/
│   └── characters/              # sprites listos para el juego (WebP 384×384)
│       ├── valverde/            # abuela, papa, tito-mario, tita-m-jose,
│       │                        # tito-javier, tito-jorge, mateo, olivia
│       └── clasica/             # maria, jose, mama, prima-ana, primo-javier
├── supabase/
│   └── schema.sql               # tabla y vista del ranking compartido
├── src/
│   ├── main.ts                  # entry point: monta el canvas y arranca la app
│   ├── game/
│   │   ├── Game.ts              # pantallas, bucle de dibujo y avance de la partida
│   │   ├── PlaySession.ts       # una partida: fichas, pasos, colisiones
│   │   ├── StepClock.ts         # reloj de pasos: permite velocidad por baldosa
│   │   ├── GridMap.ts           # tablero en capas (terreno / decorado / puntos)
│   │   ├── terrain.ts           # terrenos, decorados y su velocidad
│   │   ├── scenarios/
│   │   │   ├── legend.ts        # alfabeto con el que se escriben los niveles
│   │   │   ├── classicMaze.ts   # laberinto de neón (se escribe a medias y se refleja)
│   │   │   ├── patioPiscina.ts  # patio con piscina, tumbonas y mesas
│   │   │   └── themes/          # cómo se pinta cada escenario
│   │   ├── ghostAI.ts           # persecución imperfecta + aleatoriedad
│   │   ├── difficulty.ts        # fácil / medio / difícil
│   │   ├── renderEntity.ts      # dibujo del protagonista y los fantasmas
│   │   ├── sprites.ts           # caché de caras recortadas en círculo
│   │   ├── viewport.ts          # ajuste responsive del canvas (+ nitidez HiDPI)
│   │   └── Score.ts             # puntuación y récord
│   ├── entities/                # implementación anterior, sólo la usan los tests
│   ├── ui/
│   │   ├── FamilyPicker.ts      # con qué familia se juega
│   │   ├── CharacterPicker.ts   # quién es el protagonista
│   │   ├── GhostPicker.ts       # qué fantasmas, escenario y dificultad
│   │   ├── RankingScreen.ts     # las dos listas del ranking
│   │   ├── HUD.ts               # puntaje, récord y quién persigue
│   │   ├── theme.ts             # paleta, botones y rejilla de retratos
│   │   └── GameOver.ts          # pantalla final con caras
│   ├── data/
│   │   ├── characters.json      # ELENCO: lo leen el juego y el script de sprites
│   │   ├── families.ts          # familias y personajes, a partir del JSON
│   │   ├── storage.ts           # lo que se recuerda en localStorage
│   │   └── ranking.ts           # puntuación y ranking compartido (Supabase)
│   ├── input/
│   │   ├── Keyboard.ts          # flechas + WASD
│   │   ├── Touch.ts             # swipes sobre el tablero y cruceta en pantalla
│   │   └── PlayerInput.ts       # une teclado y táctil
│   ├── assets/
│   │   └── sounds/              # efectos (opcional, fase posterior)
│   └── styles/
│       └── main.css
├── index.html
├── .env.example                 # claves del ranking (opcional)
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .eslintrc.json
├── .prettierrc
├── .gitignore
└── README.md
```

---

## 🧩 Modelo de dominio

### `Character` (clase base)

Representa cualquier personaje en el tablero. No sabe si es protagonista o fantasma.

```ts
interface CharacterData {
  id: string; // 'abuela', 'tito-mario', 'maria'...
  name: string; // 'Abuela', 'Tito Mario', 'María'...
  imagePath: string; // '/characters/valverde/abuela.webp'
  accentColor: string; // borde/halo, y color del fantasma
}

interface FamilyData {
  id: string; // 'valverde' | 'clasica'
  name: string; // 'Los Valverde'
  tagline: string;
  characters: CharacterData[];
}
```

El elenco no se escribe en TypeScript sino en `src/data/characters.json`, porque
ese mismo fichero es el que lee `scripts/prepare-characters.py` para generar los
sprites. Una sola lista: así las caras del juego y los WebP no se desincronizan.

### Roles

```ts
type Role = 'protagonist' | 'ghost';

interface RoleAssignment {
  characterId: string;
  role: Role;
}
```

La asignación de roles se hace **antes de cada partida** en `CharacterPicker`. Se guarda la última selección en `localStorage` para no repetirla siempre.

### Configuración flexible

- 1 protagonista + de 1 a 4 fantasmas, **elegidos uno a uno** tocando su cara.
  El numerito sobre el retrato dice en qué orden salen.
- Escenario y dificultad se eligen en la misma pantalla.
- Todo queda recordado en `localStorage`, así que rejugar son dos toques.

### Escenarios

Un escenario se escribe como texto y se interpreta con el alfabeto de
`src/game/scenarios/legend.ts`:

| símbolo   | qué es                               |
| --------- | ------------------------------------ |
| `#`       | muro de neón (laberinto clásico)     |
| `H`       | seto (patio)                         |
| `C` / `T` | tumbona / mesa: obstáculos del patio |
| `.`       | punto sobre suelo normal             |
| (espacio) | suelo sin punto                      |
| `~` / `o` | agua sin punto / agua con flotador   |
| `P` / `G` | salida del jugador / de fantasma     |

El laberinto clásico se escribe **a medias**: diez símbolos por fila que se
reflejan sobre las otras diez columnas, y así la simetría sale garantizada. El
patio no es simétrico, así que se escribe entero.

Los tests de `scenarios.test.ts` recorren cada escenario con un flood-fill y
fallan si algún punto o alguna salida de fantasma queda inalcanzable — es decir,
si el nivel es imposible de ganar.

### Velocidad por terreno

En la piscina se nada a **0,8x**, tanto el protagonista como los fantasmas: cada
paso cuesta 1/0,8 = 1,25 veces más. Cruzar el agua es el atajo, pero se va lento
y hay doce puntos flotando dentro para que merezca la pena arriesgarse.

Esto es lo que obligó a cambiar el motor de movimiento: antes cada ficha se
movía con un `setInterval` de intervalo fijo, así que todas iban siempre igual de
rápido. Ahora cada ficha lleva su propio `StepClock`, que acumula el tiempo del
bucle de dibujo y suelta un paso cuando se junta lo suficiente, recalculando el
intervalo con la casilla que se está pisando.

---

## 🏆 Ranking compartido (opcional)

Dos listas, porque son dos preguntas distintas:

- 🍒 **Los que más comen** — puntos comidos sumando todas sus partidas.
- 🏆 **Los que más puntos** — su mejor partida.

Si los puntos fueran sólo `comidos × 10` las dos listas serían la misma, así que
la puntuación premia además ganar (+500) y hacerlo rápido (hasta +2000, que se va
gastando a 10 puntos por segundo). Se puede comer muchísimo sin ganar nunca.

**Sin configurar, el ranking no existe: ni pantalla ni botón.** Para activarlo:

1. Crear un proyecto gratis en [supabase.com](https://supabase.com).
2. Pegar `supabase/schema.sql` en el SQL Editor y ejecutarlo.
3. Copiar `.env.example` a `.env.local` y pegar las dos claves
   (Supabase → Settings → API).

La `anon key` viaja en el JavaScript del navegador, así que es pública por
diseño; lo que protege la tabla es RLS (sólo insertar y leer) más los `CHECK`
que acotan los valores. Si el móvil se queda sin cobertura, la partida se guarda
en una cola en `localStorage` y se reintenta en el siguiente envío.

---

## 🎨 Assets de caras

El juego dibuja las caras a unos 24 px, así que las fotos de móvil (3000 px,
15 MB) no sirven tal cual: tardan una eternidad en cargar y se ven sucias al
reducirlas. Por eso hay dos carpetas:

- `assets/originals/<familia>/` — las fotos tal como salieron del móvil.
  **Están en `.gitignore`**: son decenas de MB y no se publican.
- `public/characters/<familia>/` — los sprites que usa el juego: WebP de 384×384
  px recortados a la cara. Los trece juntos pesan unos 155 KB.

El recorte lo hace `npm run sprites` (`scripts/prepare-characters.py`, necesita
Python con Pillow y NumPy). Por defecto detecta la cara por tono de piel, pero en
los primerísimos planos la cara ocupa el fotograma entero y no hay detección que
valga: para esos, el manifiesto lleva un `crop` explícito con el encuadre
elegido a ojo.

- Cómo agregar un personaje nuevo:
  1. Guardar la foto en `assets/originals/<familia>/<archivo>.jpg`.
  2. Añadir su entrada en `src/data/characters.json` (`source`, `id`, `name`,
     `accentColor`; opcionalmente `crop`).
  3. Ejecutar `npm run sprites`.
  4. Revisar el WebP en `public/characters/<familia>/<id>.webp`. Si sale
     descentrado, ajustar el `crop` y repetir.
  5. Listo — aparece automáticamente en el selector.

---

## 🗺️ Roadmap

### Fase 1 — MVP jugable

- [ ] Setup Vite + TypeScript + ESLint + Prettier.
- [ ] Canvas que renderiza un laberinto fijo.
- [ ] Protagonista que se mueve con flechas.
- [ ] Puntos comestibles distribuidos en el laberinto.
- [ ] Un fantasma con movimiento aleatorio.
- [ ] Detección de colisiones (comer puntos, ser atrapado).
- [ ] Pantalla "Game Over" simple.

### Fase 2 — Personalización

- [x] `CharacterPicker`: selección visual de roles antes de la partida.
- [x] Carga de caras desde `public/characters/`.
- [x] Renderizado de personajes con sus fotos en lugar de sprites genéricos.
- [x] Persistencia en `localStorage` de la última selección.
- [x] Dos elencos seleccionables (los Valverde y los Marín).
- [x] Elegir **quiénes** son los fantasmas, no sólo cuántos.

### Fase 3 — Pulido

- [ ] Múltiples fantasmas con IA diferenciada (uno persigue, otro patrulla).
- [ ] Power-ups (modo donde el protagonista come fantasmas).
- [ ] Vidas.
- [x] Segundo escenario: el patio con piscina.
- [x] Velocidad por terreno (0,8x en el agua).
- [x] Récord guardado.
- [ ] Sonidos (opcional: que los chicos los graben).
- [x] Soporte táctil para móvil/tablet (deslizar + cruceta en pantalla).
- [ ] Deploy en Vercel.

### Fase 4 — Extras (opcional)

- [ ] Editor de laberintos.
- [x] Leaderboard global con Supabase.
- [ ] Modo 2 jugadores local (uno controla protagonista, otro un fantasma).

---

## 🕹️ Controles

- **Teclado**: flechas o WASD.
- **Móvil**: desliza el dedo sobre el tablero (se puede encadenar sin levantarlo)
  o usa la cruceta que aparece bajo el tablero en pantallas táctiles.
- El tablero se escala solo al hueco disponible y se dibuja a la resolución real
  de la pantalla, así que no se ve borroso en móviles.

---

## 🚀 Comandos

```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (http://localhost:5173)
npm run sprites    # regenerar los sprites desde assets/originals/
npm run test       # tests (Vitest)
npm run build      # build de producción
npm run preview    # previsualizar build
npm run lint       # correr ESLint
npm run format     # correr Prettier
```

---

## 🌳 Convenciones de Git

Buena oportunidad para que el de 14 aprenda Git de verdad.

- **Ramas**: `main` (estable) + `feature/<nombre>` para cada cambio.
- **Commits**: mensajes cortos, imperativos, en español. Ejemplos:
  - `feat: agregar selector de personajes`
  - `fix: corregir colisión con paredes diagonales`
  - `style: ajustar tamaño de las caras`
  - `docs: actualizar README`
- **Pull requests**: incluso trabajando solo, abrir PR para revisar el diff antes de mergear.

---

## 📝 Notas para el desarrollo con Cursor

- Trabajar **en pasos pequeños y verificables**. Un commit = un cambio claro.
- Antes de pedirle a Cursor que escriba código, asegurarse de que entiende el modelo de dominio (este README es la fuente de verdad).
- Probar en el navegador después de cada cambio importante.
- Si algo se complica, dividirlo: primero el laberinto, después el movimiento, después las colisiones, después la IA.
