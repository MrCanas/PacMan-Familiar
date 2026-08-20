import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  computeScore,
  createRankingClient,
  isRankingEnabled,
  RankingClient,
  readConfig,
  SPEED_BONUS_MAX,
  topEaters,
  topScorers,
  WIN_BONUS,
  type MatchResult,
  type RankingRow,
} from '@/data/ranking';

const CONFIG = { url: 'https://ejemplo.supabase.co', anonKey: 'clave' };

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => {
      m.delete(k);
    },
    setItem: (k: string, v: string) => {
      m.set(k, v);
    },
  } as Storage;
}

function match(over: Partial<MatchResult> = {}): MatchResult {
  return {
    familyId: 'valverde',
    characterId: 'abuela',
    characterName: 'Abuela',
    scenarioId: 'patio',
    difficulty: 'medium',
    pellets: 12,
    score: 120,
    won: false,
    durationMs: 30_000,
    ...over,
  };
}

function row(over: Partial<RankingRow> = {}): RankingRow {
  return {
    characterId: 'abuela',
    characterName: 'Abuela',
    familyId: 'valverde',
    totalPellets: 100,
    bestScore: 1000,
    matches: 3,
    wins: 1,
    ...over,
  };
}

describe('computeScore', () => {
  it('perder vale sólo lo comido', () => {
    expect(computeScore({ pellets: 12, won: false, durationMs: 30_000 })).toBe(120);
  });

  it('ganar suma premio y bonus de rapidez', () => {
    const rapido = computeScore({ pellets: 100, won: true, durationMs: 10_000 });
    expect(rapido).toBe(1000 + WIN_BONUS + (SPEED_BONUS_MAX - 100));
  });

  it('cuanto más se tarda menos bonus, y nunca negativo', () => {
    const rapido = computeScore({ pellets: 50, won: true, durationMs: 20_000 });
    const lento = computeScore({ pellets: 50, won: true, durationMs: 120_000 });
    expect(rapido).toBeGreaterThan(lento);
    const lentisimo = computeScore({ pellets: 50, won: true, durationMs: 10_000_000 });
    expect(lentisimo).toBe(500 + WIN_BONUS);
  });

  it('los dos rankings pueden discrepar: comer mucho no es ganar', () => {
    // Uno come el doble pero nunca gana; el otro gana rápido.
    const comilon = computeScore({ pellets: 200, won: false, durationMs: 60_000 });
    const ganador = computeScore({ pellets: 100, won: true, durationMs: 15_000 });
    expect(comilon).toBeLessThan(ganador);
  });

  it('no da puntos negativos con datos raros', () => {
    expect(computeScore({ pellets: -5, won: false, durationMs: -1 })).toBe(0);
  });
});

describe('configuración', () => {
  it('sin variables no hay ranking', () => {
    expect(readConfig({} as ImportMetaEnv)).toBeNull();
    expect(isRankingEnabled({} as ImportMetaEnv)).toBe(false);
    expect(createRankingClient({} as ImportMetaEnv)).toBeNull();
  });

  it('con una sola variable tampoco', () => {
    expect(isRankingEnabled({ VITE_SUPABASE_URL: 'https://x.co' } as ImportMetaEnv)).toBe(false);
  });

  it('los valores de ejemplo de .env.example no cuentan como configuración', () => {
    const env = {
      VITE_SUPABASE_URL: 'https://tu-proyecto.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'tu-anon-key',
    } as ImportMetaEnv;
    expect(isRankingEnabled(env)).toBe(false);
  });

  it('con las dos claves sí, y se le quita la barra final', () => {
    const env = {
      VITE_SUPABASE_URL: 'https://real.supabase.co/',
      VITE_SUPABASE_ANON_KEY: 'abc123',
    } as ImportMetaEnv;
    expect(readConfig(env)).toEqual({ url: 'https://real.supabase.co', anonKey: 'abc123' });
    expect(isRankingEnabled(env)).toBe(true);
  });
});

describe('ordenación de los dos rankings', () => {
  const rows = [
    row({ characterId: 'a', totalPellets: 50, bestScore: 3000 }),
    row({ characterId: 'b', totalPellets: 900, bestScore: 400 }),
    row({ characterId: 'c', totalPellets: 300, bestScore: 1500 }),
  ];

  it('el que más come encabeza por puntos comidos acumulados', () => {
    expect(topEaters(rows).map((r) => r.characterId)).toEqual(['b', 'c', 'a']);
  });

  it('el que más puntos saca encabeza por su mejor partida', () => {
    expect(topScorers(rows).map((r) => r.characterId)).toEqual(['a', 'c', 'b']);
  });

  it('respetan el límite y no tocan el array original', () => {
    expect(topEaters(rows, 2)).toHaveLength(2);
    expect(rows[0]!.characterId).toBe('a');
  });
});

describe('RankingClient', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  function client(fetchImpl: typeof fetch): RankingClient {
    return new RankingClient({ config: CONFIG, fetchImpl, storage });
  }

  const ok = (): Response => ({ ok: true, status: 200 }) as Response;

  it('envía la partida a match_results', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(ok());
    expect(await client(fetchImpl).submit(match())).toBe(true);

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(String(url)).toBe(`${CONFIG.url}/rest/v1/match_results`);
    expect(init?.method).toBe('POST');
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>[];
    expect(body[0]).toMatchObject({ character_id: 'abuela', pellets: 12, won: false });
  });

  it('si falla la red la partida se queda en cola', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new Error('sin cobertura'));
    const c = client(fetchImpl);
    expect(await c.submit(match())).toBe(false);
    expect(c.readOutbox()).toHaveLength(1);
  });

  it('la cola se vacía en el siguiente envío con éxito', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('sin cobertura'))
      .mockResolvedValue(ok());
    const c = client(fetchImpl);
    await c.submit(match({ pellets: 1 }));
    expect(c.readOutbox()).toHaveLength(1);

    expect(await c.submit(match({ pellets: 2 }))).toBe(true);
    expect(c.readOutbox()).toEqual([]);
    const body = JSON.parse(String(fetchImpl.mock.calls[1]![1]?.body)) as unknown[];
    expect(body).toHaveLength(2);
  });

  it('un error del servidor también deja la partida en cola', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue({ ok: false, status: 401 } as Response);
    const c = client(fetchImpl);
    expect(await c.submit(match())).toBe(false);
    expect(c.readOutbox()).toHaveLength(1);
  });

  it('flushOutbox sin nada pendiente no llama al servidor', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(ok());
    expect(await client(fetchImpl).flushOutbox()).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('una cola corrupta no rompe nada', async () => {
    storage.setItem('pacman-familiar.pendingResults', '{no es json}');
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(ok());
    const c = client(fetchImpl);
    expect(c.readOutbox()).toEqual([]);
    expect(await c.submit(match())).toBe(true);
  });

  it('lee el ranking y traduce los nombres de columna', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        {
          character_id: 'mateo',
          character_name: 'Mateo',
          family_id: 'valverde',
          total_pellets: 420,
          best_score: 2600,
          matches: 7,
          wins: 2,
        },
      ],
    } as unknown as Response);

    const rows = await client(fetchImpl).fetchRanking();
    expect(rows).toEqual([
      {
        characterId: 'mateo',
        characterName: 'Mateo',
        familyId: 'valverde',
        totalPellets: 420,
        bestScore: 2600,
        matches: 7,
        wins: 2,
      },
    ]);
  });

  it('un ranking que responde mal lanza error', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue({ ok: false, status: 500 } as Response);
    await expect(client(fetchImpl).fetchRanking()).rejects.toThrow(/500/);
  });
});
