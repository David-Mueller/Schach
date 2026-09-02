import type { Lesson } from '../types'

// Stufe 2 – Eröffnungs-Führerschein.

export const stufe2Lessons: Lesson[] = [
  {
    id: 'eroeffnung-italienisch',
    title: 'Italienische Partie',
    subtitle: 'Der Klassiker für Weiß',
    playerColor: 'white',
    intro:
      'Die Italienische Partie ist seit 500 Jahren beliebt – weil sie alle goldenen ' +
      'Regeln befolgt und trotzdem giftig ist. Spiel die weißen Züge!',
    outro:
      'Stark! Du kennst jetzt den Hauptplan der Italienischen Partie: schnelles d4 ' +
      'im Zentrum, aktive Figuren, sicherer König. Probier sie in deiner nächsten Partie aus!',
    pgn: `1. e4 e5 2. Nf3 {Springer greift e5 an – wie in der Grundschule gelernt.}
Nc6 3. Bc4 {Das Markenzeichen der Italienischen Partie: Der Läufer schielt auf f7.}
Bc5 4. c3 {Ein schlauer Vorbereitungszug: Der Bauer will gleich d4 unterstützen und das Zentrum erobern.}
Nf6 {Schwarz greift währenddessen e4 an.}
5. d4 {Da ist der Vorstoß! Weiß baut ein starkes Bauernzentrum und greift nebenbei den Läufer c5 an.}
exd4 6. cxd4 {Der c3-Bauer hat seinen Job gemacht: Weiß hat jetzt zwei Bauern im Zentrum.}
Bb4+ {Der Läufer rettet sich mit Schach.}
7. Bd2 {Ruhig bleiben: Der Läufer blockt das Schach einfach ab.}
Bxd2+ 8. Nbxd2 {Mit dem Springer zurückschlagen – so kommt gleich noch eine Figur ins Spiel.}
d5 {Schwarz schlägt im Zentrum zurück – ein wichtiger Befreiungszug.}
9. exd5 Nxd5 10. O-O {König in Sicherheit! Weiß steht wunderbar entwickelt und kontrolliert das Zentrum.}
O-O`,
  },
  {
    id: 'eroeffnung-london',
    title: 'Londoner System',
    subtitle: 'Der solide Aufbau für Weiß',
    playerColor: 'white',
    intro:
      'Das Londoner System ist wie ein Haus, das du in jeder Partie fast gleich ' +
      'aufbauen kannst – egal was der Gegner spielt. Das Herzstück ist die ' +
      'Bauernpyramide c3, d4, e3 mit dem Läufer davor auf f4. Spiel die weißen Züge!',
    outro:
      'Das Londoner Haus steht! Merk dir die Zugfolge: d4, Lf4, e3, Sf3, dann Ld3 ' +
      'und c3. Mit diesem sicheren Aufbau kannst du gegen fast alles spielen.',
    pgn: `1. d4 {Der Damenbauer besetzt das Zentrum – der Startzug des Londoner Systems.}
d5
2. Bf4 {Der wichtigste Zug! Der Läufer kommt VOR die Bauernkette – spielst du erst e3, wäre er für immer eingesperrt.}
Nf6
3. e3 {Der erste Stein der Pyramide: e3 stützt d4 und öffnet dem Läufer f1 den Weg.}
e6
4. Nf3 {Der Springer auf sein bestes Feld – er deckt später wichtige Zentrumsfelder.}
Bd6 {Schwarz fordert deinen guten Läufer zum Tausch heraus.}
5. Bg3 {Der Trick: nicht tauschen, sondern ausweichen! Nimmt Schwarz auf g3, bekommst du mit hxg3 sogar eine offene Linie für den Turm.}
O-O
6. Bd3 {Der zweite Läufer zielt Richtung Königsflügel – von hier schaut er genau auf h7.}
c5 {Schwarz greift dein Zentrum von der Seite an.}
7. c3 {Der Schlussstein! Die Pyramide c3-d4-e3 steht: Der Punkt d4 ist doppelt gestützt und dein Zentrum felsenfest.}
Nc6
8. O-O {Aufbau fertig, König sicher. Genau diese Stellung kannst du in fast jeder Partie anpeilen.}`,
  },
  {
    id: 'eroeffnung-damengambit',
    title: 'Damengambit',
    subtitle: 'Die klassische Eröffnung mit d4 und c4',
    playerColor: 'white',
    intro:
      'Das Damengambit klingt nach einem Opfer – ist aber keins! Weiß bietet den ' +
      'Bauern c4 nur scheinbar an, um das Zentrum zu erobern. Hier lernst du die ' +
      'Hauptvariante, wenn Schwarz das Gambit ablehnt. Spiel die weißen Züge!',
    outro:
      'Sehr gut! Merk dir: Das Damengambit ist kein echtes Opfer, denn den Bauern ' +
      'c4 kann Weiß jederzeit zurückholen. Dafür bekommst du Druck im Zentrum und ein freies Spiel.',
    pgn: `1. d4 d5
2. c4 {Das Damengambit! Weiß bietet einen Bauern an – aber keine Sorge: Nimmt Schwarz mit dxc4, holt Weiß ihn mit e3 und Lxc4 einfach zurück. Der wahre Plan: den Bauern d5 weglocken und das Zentrum erobern.}
e6 {Schwarz lehnt ab und stützt lieber sein Zentrum – die solideste Antwort.}
3. Nc3 {Der Springer entwickelt sich und erhöht den Druck auf d5.}
Nf6
4. Bg5 {Eine Fesselung! Der Springer f6 darf eigentlich nicht ziehen, sonst hängt die Dame auf d8. Damit ist der Verteidiger von d5 lahmgelegt.}
Be7 {Schwarz stellt den Läufer dazwischen und hebt die Fesselung wieder auf.}
5. e3 {Der Bauer öffnet dem Läufer f1 den Weg und macht die Stellung stabil.}
O-O
6. Nf3 {Alle Springer im Spiel – Weiß ist bereit für die Rochade und steht bequem.}
Nbd7 {Schwarz entwickelt den Springer nach d7 statt c6 – der c-Bauer will sich später noch am Zentrum beteiligen.}`,
  },
]
