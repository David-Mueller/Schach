import type { Lesson } from '../types'

// Stufe 10 – Angriffspläne: Opfer und Initiative gegen den König.

export const stufe10Lessons: Lesson[] = [
  {
    id: 'angriff-griechisch',
    title: 'Das Griechische Geschenk',
    subtitle: 'Läuferopfer auf h7 – der Klassiker',
    playerColor: 'white',
    intro:
      'Das Griechische Geschenk ist der berühmteste Königsangriff überhaupt: ' +
      'Der Läufer opfert sich auf h7, der Springer springt mit Schach nach g5, ' +
      'und die Dame stürmt nach h5. Wichtig sind drei Zutaten: Läufer zielt auf ' +
      'h7, Springer erreicht g5, und KEIN schwarzer Springer steht auf f6. Alle ' +
      'drei sind da – schnür das Geschenk auf! Spiel die weißen Züge!',
    outro:
      'Mattangriff wie aus dem Bilderbuch! Merk dir die Checkliste fürs ' +
      'Griechische Geschenk: Lxh7+, Sg5+, Dh5 – und vorher prüfen, dass kein ' +
      'Verteidiger nach f6 kann und deine Dame wirklich nach h5 kommt. Und ' +
      'umgekehrt: Wenn DU mit Schwarz rochierst, lass h7 nie unbewacht!',
    pgn: `[SetUp "1"]
[FEN "r1b2rk1/ppqn1ppp/4p3/3pP3/3P4/3B1N2/PPP2PPP/R2Q1RK1 w - - 0 1"]

1. Bxh7+ {Das Geschenk! Der Läufer opfert sich für einen einzigen Bauern – direkt neben dem König. Sieht verrückt aus, aber jetzt wird der König aus seiner Festung gelockt.}
Kxh7 {Schwarz nimmt an. Ablehnen wäre auch traurig: Dann fehlt einfach ein Bauer, und der Angriff kommt trotzdem.}
2. Ng5+ {Zutat Nummer zwei: Springerschach! Beachte, warum das klappt: Der Bauer e5 hat vorher den schwarzen Springer von f6 vertrieben – niemand kann den Angriff mehr stören.}
Kg8 {Der Rückzug ist die beste Chance. Nach Kg6 würde die weiße Dame den König über die offenen Felder jagen – ein Spaziergang ins Verderben.}
3. Qh5 {Zutat Nummer drei: Die Dame stürmt heran und droht Matt auf h7! Läufer weg, Springer da, Dame da – das Griechische Geschenk ist komplett aufgebaut.}
Nf6 {Die zäheste Verteidigung: Der Springer greift die Dame an und deckt gleichzeitig h7.}
4. exf6 {Aber da war ja noch der Bauer e5! Er schlägt den Verteidiger einfach vom Brett – und die Mattdrohung auf h7 lebt wieder.}
gxf6 {Der Fehler in höchster Not: Schwarz nimmt zurück und öffnet damit selbst den Käfig. Nur Te8 hätte dem König ein Fluchtfeld auf f8 geschaffen und das Matt noch hinausgezögert.}
5. Qh7# {Matt! Die Dame setzt sich auf h7, beschützt vom Springer g5. Der König findet kein Feld mehr – das Griechische Geschenk hat die ganze Partie in fünf Zügen entschieden.}`,
  },
  {
    id: 'angriff-koenigsgambit',
    title: 'Das Königsgambit',
    subtitle: 'Mutiger Angriff für Weiß',
    playerColor: 'white',
    intro:
      'Das Königsgambit ist die mutigste Eröffnung der Schachgeschichte: Schon ' +
      'im zweiten Zug opfert Weiß den f-Bauern! Der Plan dahinter: die f-Linie ' +
      'für den Turm öffnen, das volle Zentrum erobern und mit allen Figuren auf ' +
      'den schwarzen König losgehen. So haben schon die alten Meister vor ' +
      'hunderten Jahren angegriffen. Spiel die weißen Züge!',
    outro:
      'Das ist der Geist des Königsgambits! Merk dir die Hauptidee: Der f-Bauer ' +
      'wird geopfert, um die f-Linie zu öffnen und das Zentrum mit d4 und e4 zu ' +
      'erobern. Und die wichtigste Feinheit: Erst Sf3 spielen, damit die ' +
      'schwarze Dame nicht mit Dh4+ hereinplatzt. Wer das Königsgambit spielt, ' +
      'muss angreifen wollen!',
    pgn: `1. e4 e5
2. f4 {Das Königsgambit! Weiß bietet den f-Bauern an. Der Plan: Verschwindet der schwarze e-Bauer vom Zentrum, gehört die Mitte ganz allein Weiß – und die f-Linie öffnet sich für den Turm.}
exf4 {Schwarz nimmt an und hält sich am Extra-Bauern fest.}
3. Nf3 {Der wichtigste Zug der ganzen Eröffnung! Er entwickelt nicht nur den Springer – er verhindert vor allem das freche Dh4+, das sonst den weißen König durchs halbe Brett scheuchen würde.}
g5 {Schwarz klammert sich an die Beute: Der Bauer g5 soll f4 für immer festhalten. Aber so viele Bauernzüge am Königsflügel reißen gefährliche Löcher.}
4. h4 {Sofort den Hebel ansetzen! Der Bauer greift die schwarze Bauernkette an. Nebenbei ist g5 jetzt vergiftet: Schlüge die schwarze Dame irgendwann dort zu, nimmt der h-Bauer sie einfach vom Brett.}
g4 {Der Bauer rückt weiter vor und vertreibt deinen Springer – aber jeder schwarze Bauernzug ist ein Zug ohne Entwicklung.}
5. Ne5 {Kein Rückzug, sondern ein Sprung mitten ins Zentrum! Von e5 aus beäugt der Springer den vorwitzigen Bauern g4 und das ewig schwache Feld f7.}
Nf6 {Schwarz entwickelt endlich eine Figur und greift e4 an.}
6. d4 {Da ist der Lohn des Gambits: das Doppel-Zentrum! Beide weißen Zentrumsbauern stehen stolz in der Mitte, und der Läufer c1 blickt bereits hungrig auf den Bauern f4.}
d6 {Schwarz stupst den Springer an – er muss die Mitte wieder verlassen.}
7. Nd3 {Der Springer weicht geordnet zurück und nimmt dabei den Bauern f4 ins Visier – die schwarze Beute wird gleich zurückerobert.}
Nxe4 {Schwarz schnappt sich noch einen Bauern. Ganz schön gierig – während Weiß entwickelt, sammelt Schwarz Bauern und lässt seinen König in der Mitte stehen.}
8. Bxf4 {Der Läufer holt sich den Gambitbauern zurück und entwickelt sich dabei. Zieh Bilanz: ein Bauer weniger, dafür Zentrum, offene Linien und die aktiveren Figuren – genau dafür spielt man das Königsgambit!}`,
  },
]
