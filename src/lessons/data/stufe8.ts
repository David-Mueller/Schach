import type { Lesson } from '../types'

// Stufe 8 – Endspiel-Schule: Opposition und Quadratregel.

export const stufe8Lessons: Lesson[] = [
  {
    id: 'endspiel-opposition',
    title: 'Opposition & Umwandlung',
    subtitle: 'Der König führt den Bauern zur Dame',
    playerColor: 'white',
    intro:
      'Das wichtigste Endspiel überhaupt: König und Bauer gegen König. Die ' +
      'goldene Regel lautet: Der König gehört VOR den Bauern, nicht dahinter! ' +
      'Und wenn sich die Könige Auge in Auge gegenüberstehen, spricht man von ' +
      'Opposition – wer dann NICHT ziehen muss, hat gewonnen. Dein König steht ' +
      'schon perfekt vor seinem Bauern. Führe ihn zur Umwandlung! Spiel die ' +
      'weißen Züge!',
    outro:
      'Eine neue Dame! Merk dir die zwei Endspiel-Gesetze: Erstens, der König ' +
      'marschiert VOR seinem Bauern her und räumt den Weg frei – der Bauer ' +
      'kommt hinterher. Zweitens, verliert dein König die Opposition, kann oft ' +
      'ein Bauernzug sie zurückholen: Der Bauer schenkt dir ein Tempo.',
    pgn: `[SetUp "1"]
[FEN "3k4/8/3K4/3P4/8/8/8/8 w - - 0 1"]

1. Kc6 {Der König geht seitlich voran – immer VOR dem Bauern bleiben! Er will die Felder erobern, über die der Bauer später marschieren muss.}
Kc8 {Schwarz stellt sich direkt gegenüber: Das ist die Opposition. Jetzt müsstest eigentlich du weichen … hättest du nicht noch ein Ass im Ärmel.}
2. d6 {Das Ass: ein Bauernzug! Der Bauer rückt auf, und plötzlich ist wieder SCHWARZ am Zug und muss die Opposition aufgeben. Merk dir: Ein Bauernzug in Reserve gewinnt die Opposition zurück.}
Kd8 {Der schwarze König pendelt zurück – mehr bleibt ihm nicht.}
3. d7 {Der Bauer rückt vor, beschützt von seinem König. Schau, wie eng es für Schwarz wird: Die Felder c8 und e8 nimmt ihm der Bauer weg.}
Ke7 {Der schwarze König muss das Umwandlungsfeld d8 verlassen – er hat schlicht kein anderes Feld mehr.}
4. Kc7 {Der Schlüsselzug: Dein König bewacht jetzt das Umwandlungsfeld d8 höchstpersönlich. Nichts kann den Bauern mehr aufhalten.}
Ke6 {Schwarz kann nur noch zuschauen.}
5. d8=Q {Die Umwandlung! Aus dem kleinen Bauern wird eine mächtige Dame. Mit ihr setzt du matt wie in der Damenmatt-Lektion – dieses Endspiel hast du gemeistert.}`,
  },
  {
    id: 'endspiel-quadrat',
    title: 'Die Quadratregel',
    subtitle: 'Fängt der König den Freibauern noch?',
    playerColor: 'black',
    intro:
      'Ein Freibauer ist ein Bauer, dem kein gegnerischer Bauer mehr den Weg ' +
      'zur Umwandlung versperren kann – brandgefährlich! Muss dein König so ' +
      'einen Sprinter jagen, hilft dir die Quadratregel: Denk dir ein Quadrat ' +
      'vom Bauern bis zu seinem Umwandlungsfeld. Steht dein König im Quadrat ' +
      '(oder kommt er hinein), fängt er den Bauern. Der weiße b-Bauer rennt ' +
      'gleich los – spiel die schwarzen Züge!',
    outro:
      'Bauer gefangen! Merk dir den Trick, ganz ohne Rechnen: Male in Gedanken ' +
      'das Quadrat vom Bauern zum Umwandlungsfeld. König im Quadrat = Bauer ' +
      'gefangen. König außerhalb = der Bauer gewinnt das Wettrennen. Und ' +
      'Vorsicht: Ist der Gegner am Zug, wird das Quadrat einen Schritt kleiner!',
    pgn: `[SetUp "1"]
[FEN "8/8/8/4k3/1P6/8/6K1/8 w - - 0 1"]

1. b5 {Der Freibauer sprintet los! Denk dir jetzt sein Quadrat: von b5 bis b8 und hinüber bis e8 und e5. Dein König steht auf e5 – gerade noch auf der Kante des Quadrats. Das reicht!}
Kd5 {Sofort hinein ins Quadrat, mit jedem Bauernschritt läufst du diagonal mit. Nie zögern – ein einziger verlorener Zug, und der Bauer entwischt.}
2. b6 Kc6 {Schau, die Diagonale ist der schnellste Weg: Dein König ist dem Bauern schon ganz nah und bewacht das Feld b7.}
3. b7 {Weiß versucht es trotzig weiter – aber das ist bereits ein Fehler mit Ansage: Der Bauer läuft deinem König direkt vors Schwert. Aufgeben mochte Weiß ihn wohl nicht.}
Kxb7 {Zugeschnappt! Der Freibauer ist gefangen, kurz bevor er sich verwandeln konnte. Die Quadratregel hat dich keinen einzigen Rechenschritt gekostet.}
4. Kf3 Kc6 {Ohne den Bauern kann Weiß nichts mehr gewinnen – König gegen König ist immer remis. Dein Wissen hat den halben Punkt gerettet!}`,
  },
]
