import type { Lesson } from '../types'

// Stufe 5 – Gambits & Pläne: mutige Ideen für Fortgeschrittene.

export const stufe5Lessons: Lesson[] = [
  {
    id: 'gambit-blackmar-diemer',
    title: 'Blackmar-Diemer-Gambit',
    subtitle: 'Ein Bauer für vollen Angriff',
    playerColor: 'white',
    intro:
      'Im Blackmar-Diemer-Gambit gibt Weiß ganz bewusst einen Bauern her – und ' +
      'bekommt dafür etwas anderes: schnelle Entwicklung, offene Linien und Angriff ' +
      'auf den schwarzen König. Ein Gambit ist ein Tauschgeschäft: Material gegen ' +
      'Zeit. Spiel die weißen Züge!',
    outro:
      'Das ist der Gambit-Geist! Merk dir: Wer einen Bauern opfert, muss dafür ' +
      'angreifen – jede Figur schnell entwickeln, Linien öffnen, Druck machen. ' +
      'Wer nach einem Opfer langsam spielt, hat einfach nur einen Bauern weniger.',
    pgn: `1. d4 d5
2. e4 {Das Gambit! Weiß bietet den e-Bauern an. Ehrlich gesagt: Der Bauer ist wirklich weg – aber Weiß bekommt dafür Entwicklung und Angriff.}
dxe4 {Schwarz nimmt das Geschenk an.}
3. Nc3 {Der Springer entwickelt sich und greift den Bauern e4 gleich an – kein Zug ohne Drohung!}
Nf6 {Schwarz hält den Extra-Bauern mit dem Springer fest.}
4. f3 {Die Kernidee des Gambits: Weiß bietet sogar noch einen Tausch an, um die f-Linie zu öffnen. Auf dieser Linie liegt f7 – das schwächste Feld bei Schwarz.}
exf3
5. Nxf3 {Bilanz: Weiß hat einen Bauern weniger, aber zwei Figuren entwickelt und die halboffene f-Linie. Der Turm wird nach der Rochade direkt auf f7 zielen.}
e6
6. Bd3 {Der Läufer stellt sich auf die Angriffsdiagonale – er schaut genau auf h7, direkt neben dem künftigen Rochadefeld des schwarzen Königs.}
Be7
7. O-O {Rochade – und schau auf den Turm: Er steht sofort auf der offenen f-Linie und drückt auf f7. Das ist der Lohn für den geopferten Bauern.}
O-O
8. Qe1 {Ein typisches Angriffsmanöver: Die Dame räumt die e-Linie und will über e1 nach h4 schwenken – direkt vor den schwarzen König.}
Nbd7
9. Qh4 {Da ist sie! Dame und Läufer zielen jetzt beide auf h7, der Turm auf f7. Alle weißen Figuren greifen an – genau so spielt man ein Gambit.}`,
  },
  {
    id: 'damengambit-angenommen',
    title: 'Damengambit angenommen',
    subtitle: 'Warum der Bauer nicht zu halten ist',
    playerColor: 'white',
    intro:
      'Was passiert eigentlich, wenn Schwarz das Damengambit annimmt und den Bauern ' +
      'c4 behalten will? Dann schnappt eine berühmte Falle zu! Hier lernst du den ' +
      'Plan, den Bauern zurückzuholen – und wie du Festhalte-Versuche bestrafst. ' +
      'Spiel die weißen Züge!',
    outro:
      'Falle zugeschnappt! Merk dir beides: Als Weißer holst du den Gambitbauern ' +
      'in Ruhe mit e3 und Lxc4 zurück. Und als Schwarzer versuche nie, den Bauern ' +
      'mit b5 festzuhalten – nach a4 und Df3 bricht alles zusammen.',
    pgn: `1. d4 d5
2. c4 dxc4 {Schwarz nimmt das Gambit an. Das ist erlaubt – aber den Bauern behalten kann Schwarz nicht, wie du gleich siehst.}
3. e3 {Der Plan ist einfach: Der Läufer f1 kommt nach c4 und holt sich den Bauern zurück. Ganz ohne Eile.}
b5 {Der berühmte Fehler! Schwarz will den Extra-Bauern mit aller Gewalt festhalten. Das sieht schlau aus – geht aber schief.}
4. a4 {Der Hebel: Weiß greift die Bauernkette sofort an der Wurzel an. Die schwarzen Bauern stehen weit weg von zu Hause und haben keine Freunde in der Nähe.}
c6 {Schwarz stützt b5 mit dem Nachbarn – die letzte Hoffnung.}
5. axb5 cxb5 {Schau dir die Diagonale von a8 nach f3 an: Durch die Bauerntausche ist sie offen wie eine Autobahn. Genau das nutzt Weiß jetzt aus.}
6. Qf3 {Der Fallenzug! Die Dame zielt quer übers ganze Brett auf den ungedeckten Turm a8. Schwarz kann die Diagonale nicht mehr richtig schließen.}
Nc6 {Der Springer wirft sich dazwischen – etwas Besseres gibt es nicht mehr.}
7. Qxc6+ {Die Dame schlägt trotzdem zu: Der Springer war ungedeckt, und es ist sogar Schach! Der Turm a8 ist immer noch bedroht.}
Bd7 {Nur dieser Läuferzug blockt das Schach und rettet den Turm gleichzeitig.}
8. Qf3 {Die Dame zieht sich gemütlich zurück. Zähl nach: Weiß hat eine ganze Figur für einen Bauern gewonnen – das Festhalten mit b5 war ein teurer Fehler.}`,
  },
]
