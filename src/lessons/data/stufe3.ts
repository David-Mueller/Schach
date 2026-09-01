import type { Lesson } from '../types'

// Stufe 3 – Taktik-Grundmuster: Gabel und Fesselung an konstruierten Stellungen.

export const stufe3Lessons: Lesson[] = [
  {
    id: 'taktik-gabel',
    title: 'Die Springergabel',
    subtitle: 'Zwei Figuren mit einem Zug angreifen',
    playerColor: 'white',
    intro:
      'Der Springer ist der Gabel-Meister: Er kann zwei Figuren gleichzeitig ' +
      'angreifen, und weil er so krumm springt, sieht man es oft zu spät. Die ' +
      'schwarze Dame greift gerade deinen Springer an – aber du hast einen viel ' +
      'besseren Zug. Spiel die weißen Züge!',
    outro:
      'Eine ganze Dame gewonnen! Merk dir das Muster: Ein Springerschach, das ' +
      'gleichzeitig eine zweite Figur angreift, heißt Königsgabel – der Gegner muss ' +
      'aufs Schach reagieren und kann die andere Figur nicht retten.',
    pgn: `[SetUp "1"]
[FEN "r4rk1/pp3p1p/8/3q4/4N3/8/PP3PPP/R3Q1K1 w - - 0 1"]

1. Nf6+ {Die Königsgabel! Der Springer gibt Schach und greift im selben Moment die Dame auf d5 an. Schwarz muss zuerst das Schach abwehren – die Dame kann ihm nicht helfen.}
Kg7 {Der König greift den frechen Springer sogar an. Aber der ist längst weitergezogen, bevor der König zuschnappen kann.}
2. Nxd5 {Der Lohn: Der Springer schnappt sich die Dame und ist mit einem Sprung wieder außer Reichweite des Königs.}
Rad8 {Schwarz versucht noch, den Springer mit dem Turm zu fangen.}
3. Nc3 {Ruhig in Sicherheit bringen – der Bauer b2 passt auf das Feld c3 auf. Du hast eine Dame für nichts gewonnen, die Partie ist praktisch entschieden.}`,
  },
  {
    id: 'taktik-fesselung',
    title: 'Die Fesselung',
    subtitle: 'Eine Figur festnageln und erobern',
    playerColor: 'white',
    intro:
      'Eine gefesselte Figur darf nicht ziehen, weil sonst der eigene König im ' +
      'Schach stünde. Und wer nicht weglaufen kann, den kann man in Ruhe ' +
      'einkreisen! Der schwarze Springer c6 greift gerade deinen Bauern d4 an – ' +
      'zeig ihm, wer hier wirklich in Gefahr ist. Spiel die weißen Züge!',
    outro:
      'Figur erobert! Merk dir den Zweischritt: Erst fesseln, dann mit Bauern oder ' +
      'Figuren den Druck erhöhen. Eine gefesselte Figur kann nicht fliehen – sie ' +
      'kann nur zuschauen, wie die Angreifer mehr werden.',
    pgn: `[SetUp "1"]
[FEN "r3k2r/5ppp/1pnp4/8/3P4/3B4/2P2PPP/R4RK1 w - - 0 1"]

1. Bb5 {Die Fesselung! Der Läufer zielt durch den Springer hindurch auf den König. Jetzt darf der Springer nicht mehr ziehen – auch dein Bauer d4 ist plötzlich nicht mehr angegriffen.}
Rc8 {Schwarz eilt mit dem Turm zur Hilfe und deckt den Springer.}
2. d5 {Druck erhöhen! Der Bauer greift den gefesselten Springer ein zweites Mal an. Zwei Angreifer, ein Verteidiger – und weglaufen ist verboten.}
Kd7 {Schwarz versucht in höchster Not, mit dem König die Fesselung aufzulösen.}
3. dxc6+ {Zu spät! Der kleine Bauer schlägt den Springer – sogar mit Schach.}
Kd8 {Zurückschlagen geht nicht: Der Bauer c6 wird vom Läufer b5 beschützt. Du hast eine ganze Figur gewonnen – die Fesselung hat sich gelohnt.}`,
  },
]
