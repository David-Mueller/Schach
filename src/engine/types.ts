// Gemeinsame Typen für Engine-Ausgabe und Analyse.

/** Eine Analyse-Linie aus Stockfish (MultiPV). */
export interface EngineLine {
  /** Bester Zug der Linie in UCI-Notation, z. B. "e2e4" oder "e7e8q". */
  move: string
  /** Bewertung in Centipawns aus Sicht der Seite am Zug (fehlt bei Matt). */
  cp?: number
  /** Matt in N Zügen (positiv: Seite am Zug setzt Matt, negativ: wird mattgesetzt). */
  mate?: number
  /** Hauptvariante als UCI-Züge, beginnend mit `move`. */
  pv: string[]
}

/** Ergebnis einer Stellungsanalyse. */
export interface Analysis {
  fen: string
  depth: number
  /** Linien sortiert: lines[0] ist die beste. */
  lines: EngineLine[]
}

/** Bewertung aus Weiß-Sicht, normalisiert für Eval-Bar & Patzer-Erkennung. */
export interface Eval {
  /** Centipawns aus Weiß-Sicht (bei Matt: ±10000 - N). */
  cpWhite: number
  /** Matt in N (aus Weiß-Sicht, Vorzeichen wie cpWhite), falls vorhanden. */
  mateWhite?: number
}

export function lineToEval(line: EngineLine, sideToMove: 'w' | 'b'): Eval {
  const sign = sideToMove === 'w' ? 1 : -1
  if (line.mate !== undefined) {
    const m = line.mate * sign
    return { cpWhite: Math.sign(m) * (10000 - Math.abs(m)), mateWhite: m }
  }
  return { cpWhite: (line.cp ?? 0) * sign }
}
