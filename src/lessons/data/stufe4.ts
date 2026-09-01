import type { Lesson } from '../types'

// Stufe 4 – Matt-Techniken: den Sieg mit Schwerfiguren sicher nach Hause bringen.

export const stufe4Lessons: Lesson[] = [
  {
    id: 'matt-treppe',
    title: 'Das Treppenmatt',
    subtitle: 'Zwei Türme treiben den König zum Rand',
    playerColor: 'white',
    intro:
      'Mit zwei Türmen setzt du jeden nackten König matt – ganz ohne deinen ' +
      'eigenen König! Die Türme arbeiten wie eine Treppe: Einer sperrt eine Reihe, ' +
      'der andere gibt auf der nächsten Schach. So wandert der König Stufe für ' +
      'Stufe an den Rand. Spiel die weißen Züge!',
    outro:
      'Treppenmatt geschafft! Merk dir: Ein Turm sperrt, der andere gibt Schach – ' +
      'immer abwechselnd. Und kommt der König zu nah, rennt der bedrohte Turm ' +
      'einfach ganz weit weg auf derselben Reihe. Die Sperre bleibt!',
    pgn: `[SetUp "1"]
[FEN "8/8/8/3k4/8/8/8/RR4K1 w - - 0 1"]

1. Rb5+ {Das erste Schach: Der Turm sperrt die komplette 5. Reihe. Der König muss sie verlassen – wir treiben ihn Richtung Brettrand.}
Kc6 {Der König läuft auf den Turm zu und greift ihn an! Ein bekannter Verteidigungstrick.}
2. Rh5 {Die Antwort darauf: Der Turm flieht ganz weit weg – aber auf derselben Reihe! Die 5. Reihe bleibt gesperrt, der König kommt nicht mehr zurück.}
Kd6
3. Ra6+ {Jetzt die nächste Treppenstufe: Der zweite Turm gibt Schach auf der 6. Reihe. Der König muss weiter nach hinten.}
Kd7
4. Rh7+ {Und wieder: Der andere Turm übernimmt und sperrt die 7. Reihe. Siehst du das Muster? Die Türme wechseln sich ab wie beim Treppensteigen.}
Kd8 {Der König steht am Rand – ihm bleibt nur noch die letzte Reihe.}
5. Ra8# {Die letzte Stufe: Schach auf der 8. Reihe. Der König kann nicht zurück, denn die 7. Reihe ist gesperrt. Matt!}`,
  },
  {
    id: 'matt-dame',
    title: 'Damenmatt',
    subtitle: 'Dame und König gegen den nackten König',
    playerColor: 'white',
    intro:
      'Die Dame allein kann nicht mattsetzen – sie braucht ihren König als Helfer. ' +
      'Die Technik: Die Dame sperrt den gegnerischen König am Rand ein, dein König ' +
      'marschiert heran, und erst dann kommt das Matt. Spiel die weißen Züge!',
    outro:
      'Perfekt mattgesetzt! Merk dir drei Dinge: Springerabstand halten, den König ' +
      'einsperren, dann den eigenen König heranführen. Und ganz wichtig: Lass dem ' +
      'gefangenen König immer ein freies Feld, bis das Matt kommt – sonst ist es Patt!',
    pgn: `[SetUp "1"]
[FEN "8/3k4/8/8/4Q3/8/8/6K1 w - - 0 1"]

1. Qe5 {Der Schlüsseltrick: Die Dame stellt sich im Springerabstand zum König auf – so als wäre sie ein Springer, der ihn schlagen könnte. Von hier nimmt sie ihm die meisten Felder weg, ganz ohne Schach.}
Kd8 {Dem König bleibt fast nichts – er weicht an den Rand zurück.}
2. Qg7 {Jetzt wird der Käfig zugesperrt: Die Dame kontrolliert die ganze 7. Reihe. Der König ist auf der letzten Reihe gefangen und kommt nie wieder heraus.}
Kc8
3. Kf2 {Die Dame könnte ewig Schach geben, aber mattsetzen kann sie allein nicht. Also marschiert jetzt dein König los – er wird zum Matt gebraucht.}
Kd8
4. Ke3 {Schritt für Schritt nach vorn. Der schwarze König kann nur hilflos hin und her pendeln.}
Kc8
5. Kd4 {Achtung, wichtigste Regel: Die Dame bleibt geduldig stehen und nimmt dem König NICHT alle Felder weg. Hätte er kein einziges Feld mehr und kein Schach – wäre es Patt und nur remis!}
Kd8
6. Kd5 Kc8
7. Kd6 {Der König ist da! Er deckt gleich die Felder direkt vor dem schwarzen König – jetzt ist alles bereit für das Matt.}
Kd8
8. Qd7# {Das Matt: Die Dame stellt sich direkt vor den König, dein eigener König beschützt sie. Kein Fluchtfeld, kein Wegschlagen – matt!}`,
  },
]
