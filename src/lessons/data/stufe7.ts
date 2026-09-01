import type { Lesson } from '../types'

// Stufe 7 – Taktik-Meisterklasse: Spieß, Abzug und Doppelangriff.

export const stufe7Lessons: Lesson[] = [
  {
    id: 'taktik2-spiess',
    title: 'Der Spieß',
    subtitle: 'Die wertvolle Figur muss weglaufen',
    playerColor: 'white',
    intro:
      'Der Spieß ist der große Bruder der Fesselung – nur andersherum: Vorne ' +
      'steht die wertvolle Figur, und wenn sie wegläuft, fällt die Figur dahinter. ' +
      'Der schwarze König hat sich weit vorgewagt und steht mit seiner Dame auf ' +
      'derselben Linie. Aufgespießt! Spiel die weißen Züge!',
    outro:
      'Dame erobert! Merk dir den Unterschied: Bei der Fesselung steht die ' +
      'wertvolle Figur HINTEN und die vordere darf nicht ziehen. Beim Spieß steht ' +
      'sie VORNE und muss ziehen – und dahinter fällt die Beute. Suche nach ' +
      'Königen und Damen auf einer Linie!',
    pgn: `[SetUp "1"]
[FEN "3q4/pp3ppp/3k4/8/8/8/PP2RPPP/R5K1 w - - 0 1"]

1. Rd2+ {Der Spieß! Der Turm gibt Schach, und genau hinter dem König steht die Dame auf derselben Linie. Der König MUSS aus dem Schach – aber seine Dame kann er nicht mitnehmen.}
Ke5 {Der König läuft davon. Auch Kc7 hätte nicht wirklich geholfen: Dann deckt der König zwar die Dame, aber Turm gegen Dame wäre für dich immer noch ein Riesengeschäft.}
2. Rxd8 {Die Beute wird eingesammelt: eine ganze Dame für nichts! Genau das ist der Spieß – die wertvolle Figur vorne muss weglaufen, die dahinter ist verloren.}
Ke6 {Schwarz marschiert mit dem König Richtung Turm und hofft, ihn noch zu fangen.}
3. Rad1 {Der zweite Turm kommt dazu – jetzt gehört die ganze d-Linie dir. Der König fängt hier niemanden mehr, und mit zwei Türmen gegen einen nackten König gewinnst du diese Stellung im Schlaf.}`,
  },
  {
    id: 'taktik2-abzug',
    title: 'Das Abzugsschach',
    subtitle: 'Eine Figur zieht weg – zwei greifen an',
    playerColor: 'white',
    intro:
      'Beim Abzug zieht eine Figur zur Seite und deckt dahinter einen Angriff ' +
      'auf – wie ein Vorhang, der aufgeht. Das Gemeine: Die wegziehende Figur ' +
      'darf gleichzeitig etwas ganz anderes angreifen! Dein Turm e1 zielt schon ' +
      'auf den schwarzen König, nur dein eigener Springer steht im Weg. Und die ' +
      'schwarze Dame hat sich auf h4 vorgewagt … Spiel die weißen Züge!',
    outro:
      'Dame gewonnen! Merk dir das Abzugs-Geheimnis: Die wegziehende Figur darf ' +
      'sich fast alles erlauben, denn der Gegner muss zuerst das aufgedeckte ' +
      'Schach abwehren. Schau in deinen Partien immer, ob eine deiner Figuren ' +
      'einer anderen die Sicht versperrt – dahinter schlummern Abzüge!',
    pgn: `[SetUp "1"]
[FEN "4kb1r/pp3ppp/8/4N3/7q/8/P4PPP/4R1K1 w - - 0 1"]

1. Nf3+ {Der Abzug! Der Springer zieht weg und öffnet dem Turm die e-Linie – Schach! Und schau, wohin der Springer springt: Er greift gleichzeitig die schwarze Dame auf h4 an. Sie kann nicht fliehen, denn Schwarz muss ZUERST das Schach abwehren.}
Be7 {Der Läufer wirft sich dazwischen. Auch die Dame hätte auf e7 blocken können – aber dann tauscht der Turm sie einfach ab, und Turm gegen Dame ist ein Spitzengeschäft für dich. So oder so: Die Dame ist verloren.}
2. Nxh4 {Jetzt in aller Ruhe: Der Springer kassiert die Dame. Das ist die Zauberkraft des Abzugs – zwei Angriffe in einem einzigen Zug, und der Gegner kann nur einen abwehren.}
g5 {Schwarz versucht wütend, den Springer am Rand zu fangen. Randspringer müssen wirklich aufpassen!}
3. Nf3 {Rechtzeitig raus aus der Falle – immer zuerst an die Sicherheit der eigenen Figuren denken.}
g4 {Der Bauer rennt hinterher und greift schon wieder an.}
4. Nd4 {Der Springer hüpft ins sichere Zentrum. Bilanz: Du hast eine ganze Dame gewonnen, und alle deine Figuren stehen sicher.}`,
  },
  {
    id: 'taktik2-doppelangriff',
    title: 'Doppelangriff mit der Dame',
    subtitle: 'Zwei Ziele mit einem Zug',
    playerColor: 'white',
    intro:
      'Die Dame ist die Königin des Doppelangriffs: Sie zieht auf ein Feld, von ' +
      'dem aus sie ZWEI Ziele gleichzeitig bedroht. Der Gegner kann nur eines ' +
      'retten. Schau aufs Brett: Der schwarze König steht auf einer offenen ' +
      'Diagonale, und der Läufer b5 ist ungedeckt. Findest du das Zauberfeld? ' +
      'Spiel die weißen Züge!',
    outro:
      'Läufer eingesackt! Merk dir die Doppelangriffs-Formel: Suche zuerst alle ' +
      'ungedeckten Figuren des Gegners, dann ein Feld, von dem deine Dame sie UND ' +
      'den König (oder eine zweite Figur) gleichzeitig angreift. Am stärksten ist ' +
      'der Doppelangriff mit Schach – dann hat der Gegner keine Zeit zum Retten.',
    pgn: `[SetUp "1"]
[FEN "5rk1/pp4pp/8/1b6/8/8/PP3PPP/3Q2K1 w - - 0 1"]

1. Qd5+ {Das Zauberfeld! Von d5 gibt die Dame Schach über die lange Diagonale UND greift auf derselben Reihe den ungedeckten Läufer b5 an. Zwei Ziele, ein Zug – das ist der Doppelangriff.}
Rf7 {Schwarz blockt das Schach mit dem Turm. Aber das rettet nur den König – das zweite Ziel kann niemand mehr beschützen.}
2. Qxb5 {Die Ernte: Der Läufer ist weg. Merk dir: Ungedeckte Figuren sind Magneten für Doppelangriffe. Decke deine eigenen Figuren – und jage die ungedeckten des Gegners!}
Rf5 {Der Turm schnappt wütend nach der Dame. Immer wachsam bleiben, auch nach einem gewonnenen Doppelangriff!}
3. Qe2 {Die Dame bringt sich samt Beute in Sicherheit. Mit einer Mehrfigur ist die Partie für dich so gut wie gewonnen.}`,
  },
]
