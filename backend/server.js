const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Caché en memoria ────────────────────────────────────────────────────────
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

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Helper: fetch a PokéAPI ─────────────────────────────────────────────────
async function fetchPokeAPI(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PokéAPI error: ${res.status}`);
  return res.json();
}

// ─── GET /api/pokemon/:name ──────────────────────────────────────────────────
// Devuelve info completa de un pokémon por nombre o número
app.get('/api/pokemon/:name', async (req, res) => {
  const name = req.params.name.toLowerCase().trim();
  const cacheKey = `pokemon:${name}`;

  const cached = getFromCache(cacheKey);
  if (cached) {
    return res.json({ ...cached, fromCache: true });
  }

  try {
    const data = await fetchPokeAPI(`https://pokeapi.co/api/v2/pokemon/${name}`);
    const species = await fetchPokeAPI(data.species.url);

    // Descripción en español o inglés como fallback
    const descEntry =
      species.flavor_text_entries.find(e => e.language.name === 'es') ||
      species.flavor_text_entries.find(e => e.language.name === 'en');

    const result = {
      id: data.id,
      name: data.name,
      height: data.height / 10,   // en metros
      weight: data.weight / 10,   // en kg
      base_experience: data.base_experience,
      description: descEntry
        ? descEntry.flavor_text.replace(/\f/g, ' ')
        : null,
      types: data.types.map(t => t.type.name),
      abilities: data.abilities.map(a => ({
        name: a.ability.name,
        is_hidden: a.is_hidden,
      })),
      stats: data.stats.map(s => ({
        name: s.stat.name,
        base_stat: s.base_stat,
        effort: s.effort,
      })),
      sprites: {
        front: data.sprites.front_default,
        back: data.sprites.back_default,
        official_artwork:
          data.sprites.other?.['official-artwork']?.front_default || null,
        shiny: data.sprites.front_shiny || null,
      },
      evolution_chain_url: species.evolution_chain?.url || null,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    const status = err.message.includes('404') ? 404 : 500;
    res.status(status).json({
      error: status === 404 ? 'Pokémon no encontrado' : 'Error interno del servidor',
      detail: err.message,
    });
  }
});

// ─── GET /api/pokemon ────────────────────────────────────────────────────────
// Lista pokémon con paginación: ?limit=20&offset=0
app.get('/api/pokemon', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const cacheKey = `list:${limit}:${offset}`;

  const cached = getFromCache(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const data = await fetchPokeAPI(
      `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
    );

    const result = {
      count: data.count,
      limit,
      offset,
      next_offset: offset + limit < data.count ? offset + limit : null,
      prev_offset: offset > 0 ? Math.max(0, offset - limit) : null,
      results: data.results.map(p => ({
        name: p.name,
        url: p.url,
        id: parseInt(p.url.split('/').filter(Boolean).pop()),
      })),
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la lista', detail: err.message });
  }
});

// ─── GET /api/type/:type ─────────────────────────────────────────────────────
// Pokémon de un tipo concreto: fire, water, grass, etc.
app.get('/api/type/:type', async (req, res) => {
  const type = req.params.type.toLowerCase();
  const cacheKey = `type:${type}`;

  const cached = getFromCache(cacheKey);
  if (cached) return res.json({ ...cached, fromCache: true });

  try {
    const data = await fetchPokeAPI(`https://pokeapi.co/api/v2/type/${type}`);

    const result = {
      type: data.name,
      pokemon_count: data.pokemon.length,
      pokemon: data.pokemon.slice(0, 50).map(p => ({
        name: p.pokemon.name,
        id: parseInt(p.pokemon.url.split('/').filter(Boolean).pop()),
      })),
      damage_relations: {
        double_damage_from: data.damage_relations.double_damage_from.map(t => t.name),
        double_damage_to: data.damage_relations.double_damage_to.map(t => t.name),
        half_damage_from: data.damage_relations.half_damage_from.map(t => t.name),
        half_damage_to: data.damage_relations.half_damage_to.map(t => t.name),
        no_damage_from: data.damage_relations.no_damage_from.map(t => t.name),
        no_damage_to: data.damage_relations.no_damage_to.map(t => t.name),
      },
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    const status = err.message.includes('404') ? 404 : 500;
    res.status(status).json({ error: 'Tipo no encontrado', detail: err.message });
  }
});

// ─── GET /api/search?q=bulba ─────────────────────────────────────────────────
// Búsqueda por prefijo sobre la lista completa
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'El parámetro q debe tener al menos 2 caracteres' });
  }

  const cacheKey = 'all-names';
  let allPokemon = getFromCache(cacheKey);

  if (!allPokemon) {
    try {
      const data = await fetchPokeAPI('https://pokeapi.co/api/v2/pokemon?limit=10000');
      allPokemon = data.results.map(p => ({
        name: p.name,
        id: parseInt(p.url.split('/').filter(Boolean).pop()),
      }));
      setCache(cacheKey, allPokemon);
    } catch (err) {
      return res.status(500).json({ error: 'Error al obtener la lista completa', detail: err.message });
    }
  }

  const matches = allPokemon
    .filter(p => p.name.includes(q))
    .slice(0, 20);

  res.json({ query: q, results: matches });
});

// ─── GET /api/cache/stats ────────────────────────────────────────────────────
// Info sobre el estado de la caché (útil para desarrollo)
app.get('/api/cache/stats', (req, res) => {
  res.json({
    entries: cache.size,
    keys: [...cache.keys()],
    ttl_minutes: CACHE_TTL / 60000,
  });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ─── 404 genérico ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`🟡 Servidor Pokémon corriendo en http://localhost:${PORT}`);
  console.log(`   GET /api/pokemon/:name   → info completa`);
  console.log(`   GET /api/pokemon         → lista paginada`);
  console.log(`   GET /api/type/:type      → pokémon por tipo`);
  console.log(`   GET /api/search?q=bulba  → búsqueda por nombre`);
});