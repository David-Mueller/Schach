import type { Lesson } from '../types'

// Stufe 9 – Matt-Kunst: Kombinationen, die zwingend zum Matt führen.

export const stufe9Lessons: Lesson[] = [
  {
    id: 'matt2-grundreihe',
    title: 'Grundreihenmatt',
    subtitle: 'Die schwache letzte Reihe ausnutzen',
    playerColor: 'white',
    intro:
      'Nach der Rochade schützen die Bauern den König – aber sie können auch zur ' +
      'Falle werden! Steht der König hinter seinen drei Bauern und ein Turm oder ' +
      'eine Dame erobert die Grundreihe, gibt es kein Entkommen. Hier bewacht die ' +
      'schwarze Dame das Einbruchsfeld d8. Lenke die Wächter ab! Spiel die ' +
      'weißen Züge!',
    outro:
      'Grundreihenmatt! Merk dir die Kombination: Erst den Wächter der ' +
      'Grundreihe ablenken oder abtauschen, dann mit dem Turm einbrechen. Und ' +
      'für deine eigenen Partien: Gönn deinem König irgendwann ein Luftloch ' +
      '(h3 oder g3) – dann kann dir das Grundreihenmatt nie passieren.',
    pgn: `[SetUp "1"]
[FEN "4r1k1/4qppp/8/8/8/4Q3/5PPP/3R2K1 w - - 0 1"]

1. Qxe7 {Das Ablenkungsopfer als Tausch: Deine Dame schlägt die schwarze Dame – die einzige Figur, die das Feld d8 bewacht hat. Schwarz muss zurücknehmen … und genau dabei verlässt der zweite Wächter seine Grundreihe.}
Rxe7 {Der Turm nimmt zurück – aber jetzt ist die 8. Reihe schutzlos. Zähl nach: Der schwarze König hat kein einziges Luftloch, die Bauern f7, g7 und h7 sperren ihn selbst ein.}
2. Rd8+ {Der Einbruch auf der Grundreihe! Der König kann nicht auf die 7. Reihe fliehen – seine eigenen Bauern stehen im Weg. Es ist ein Schach, das nur noch geblockt werden kann.}
Re8 {Der Turm eilt zurück und wirft sich dazwischen – die letzte Verteidigung.}
3. Rxe8# {Und Schluss! Der Turm schlägt den Blocker, und niemand kann zurücknehmen. Der König ist in seinem eigenen Bauernhäuschen gefangen: Grundreihenmatt.}`,
  },
  {
    id: 'matt2-erstickt',
    title: 'Das Erstickte Matt',
    subtitle: 'Damenopfer und Springerkunst',
    playerColor: 'white',
    intro:
      'Jetzt kommt die berühmteste Kombination der Schachgeschichte: das ' +
      'Erstickte Matt. Der schwarze König wird von seinen EIGENEN Figuren so ' +
      'eingemauert, dass ein einziger Springer ihn mattsetzt. Dafür opferst du ' +
      'sogar deine Dame – das teuerste Geschenk mit der bösesten Absicht. ' +
      'Spiel die weißen Züge und staune!',
    outro:
      'Das Erstickte Matt – du kannst jetzt die schönste Kombination des ' +
      'Schachs! Merk dir die Zugfolge wie ein Gedicht: Damenschach auf der ' +
      'Diagonale, Springerschach, DOPPELSCHACH mit dem Springer, Damenopfer ' +
      'auf g8 – und der Springer setzt matt, weil der König an seinen eigenen ' +
      'Figuren erstickt.',
    pgn: `[SetUp "1"]
[FEN "5rk1/pp4pp/8/6N1/8/8/P4PPP/3Q2K1 w - - 0 1"]

1. Qd5+ {Das Startsignal: Schach auf der langen Diagonale. Blocken mit Tf7 wäre ein Fehler – der Springer g5 schlägt den Turm, und der König dürfte nicht zurücknehmen, weil die Dame f7 deckt.}
Kh8 {Der König drückt sich in die Ecke. Sicher sieht das aus – aber genau in der Ecke wird die Luft gleich sehr dünn.}
2. Nf7+ {Springerschach! Schwarz könnte den Springer mit dem Turm schlagen und ihn so loswerden – das kostet zwar den Turm gegen den Springer, wäre aber die einzige Rettung vor dem Matt.}
Kg8 {Schwarz will das Material behalten – und genau das ist hier der entscheidende Fehler. Jetzt läuft die berühmte Mühle an.}
3. Nh6+ {DOPPELSCHACH! Der Springer gibt Schach, und gleichzeitig ist die Diagonale der Dame wieder offen. Gegen ein Doppelschach hilft kein Blocken und kein Schlagen – der König MUSS ziehen. Und f8 ist von seinem eigenen Turm besetzt!}
Kh8 {Zurück in die Ecke – das einzige Feld. Alles läuft wie am Schnürchen.}
4. Qg8+ {Das Damenopfer! Die Dame stellt sich mitten hinein und wird vom Springer h6 gedeckt – der König darf sie nicht schlagen. Schwarz bleibt nur eine einzige Antwort.}
Rxg8 {Der Turm muss die Dame nehmen – und mauert damit das letzte Fluchtfeld seines eigenen Königs zu. Schau hin: g7, h7 und g8 sind alle von schwarzen Figuren besetzt.}
5. Nf7# {Der Springer kehrt zurück – matt! Der König erstickt an seinen eigenen Figuren: Turm und Bauern nehmen ihm jedes Feld, und den Springer kann niemand schlagen. Das Erstickte Matt!}`,
  },
]
