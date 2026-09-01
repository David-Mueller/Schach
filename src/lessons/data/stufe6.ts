import type { Lesson } from '../types'

// Stufe 6 – Schwarz am Zug: die wichtigsten Verteidigungen gegen 1. e4.

export const stufe6Lessons: Lesson[] = [
  {
    id: 'schwarz-sizilianisch',
    title: 'Sizilianische Verteidigung',
    subtitle: 'Eröffnung für Schwarz gegen 1. e4',
    playerColor: 'black',
    intro:
      'Bis jetzt hast du meistens mit Weiß gespielt – Zeit für die andere Seite! ' +
      'Die Sizilianische Verteidigung ist die beliebteste Antwort auf 1. e4: Statt ' +
      'brav zu spiegeln, kämpft Schwarz mit dem c-Bauern ums Zentrum und baut sich ' +
      'eine sichere Festung. Spiel die schwarzen Züge!',
    outro:
      'Stark! Merk dir den Sizilianisch-Plan: Mit c5 ums Zentrum kämpfen, den ' +
      'Läufer nach g7 fianchettieren und früh rochieren. Deine Stellung ist sicher ' +
      'wie eine Burg – und der Läufer g7 lauert auf der langen Diagonale.',
    pgn: `1. e4 c5 {Das ist Sizilianisch! Der c-Bauer kontrolliert das Zentrumsfeld d4 von der Seite. Schwarz spiegelt Weiß nicht nach – er will sein eigenes Spiel machen.}
2. Nf3 d6 {Dieser kleine Bauer ist ein Wächter: Er deckt e5 und öffnet dem Läufer c8 die Tür.}
3. d4 {Weiß will das volle Zentrum. Aber Vorsicht, jetzt kommt der sizilianische Trick.}
cxd4 {Du tauschst deinen Flügelbauern gegen einen wertvollen weißen Zentrumsbauern – ein gutes Geschäft! Weiß hat jetzt einen Zentrumsbauern weniger.}
4. Nxd4 Nf6 {Der Springer entwickelt sich und greift sofort e4 an – Weiß muss reagieren.}
5. Nc3 g6 {Der Startschuss zum Fianchetto: Der Läufer soll aufs Eckfeld g7. Von dort schaut er über die lange Diagonale – sobald der Springer f6 Platz macht, bis nach b2.}
6. Be2 Bg7 {Da steht er! Ein Läufer auf g7 ist Angreifer und Bodyguard zugleich – er beschützt später deinen rochierten König.}
7. O-O O-O {Rochade – dein König sitzt sicher hinter den Bauern f7, g6, h7 und dem Läufer g7. Diese Aufstellung heißt Drachenaufbau.}
8. Be3 Nc6 {Fertig entwickelt! Beide Seiten haben Chancen: Weiß mehr Platz, du eine bombensichere Stellung und die halboffene c-Linie für deine Türme.}`,
  },
  {
    id: 'schwarz-caro-kann',
    title: 'Caro-Kann',
    subtitle: 'Das solide Bollwerk für Schwarz',
    playerColor: 'black',
    intro:
      'Caro-Kann ist die Verteidigung für alle, die es solide mögen: Erst baut der ' +
      'kleine Bauer c6 eine Stütze, dann schlägt d5 im Zentrum zu. Das Beste daran: ' +
      'Dein Läufer c8 kommt raus, BEVOR die Bauernmauer ihn einsperrt. Spiel die ' +
      'schwarzen Züge!',
    outro:
      'Ein Bollwerk wie aus dem Lehrbuch! Merk dir die Caro-Kann-Reihenfolge: ' +
      'c6 stützt, d5 schlägt zu, und der Läufer c8 kommt VOR e6 ins Freie. ' +
      'Keine Schwächen, keine eingesperrten Figuren – so verteidigt man solide.',
    pgn: `1. e4 c6 {Der Caro-Kann-Zug. Er sieht schüchtern aus, hat aber einen Plan: Er stützt schon jetzt den Vorstoß d5.}
2. d4 d5 {Jetzt greifst du e4 an – und dein Bauer d5 ist von c6 gedeckt. Weiß muss sich um sein Zentrum kümmern.}
3. Nc3 dxe4 {Du tauschst in aller Ruhe. Keine Angst vor dem Abtausch: Deine Stellung bleibt kerngesund.}
4. Nxe4 Bf5 {Der wichtigste Zug der Eröffnung! Der Läufer verlässt sein Zuhause, BEVOR der Bauer nach e6 zieht und ihm die Tür zusperrt. Nebenbei greift er den Springer e4 an.}
5. Ng3 {Der Springer flieht und greift nun selbst deinen Läufer an.}
Bg6 {Der Läufer weicht gemütlich aus – auf g6 steht er sicher hinter seinen Bauern und behält seine schöne Diagonale.}
6. Nf3 Nd7 {Dieser Springer wirkt bescheiden, aber er passt auf: Er kontrolliert e5 und hält später dem Bruder auf f6 den Rücken frei.}
7. Bd3 Bxd3 {Weiß bietet den Läufertausch an – nimm ruhig an! Dein Läufer hat seine Arbeit getan, und jeder Tausch macht die Stellung übersichtlicher.}
8. Qxd3 e6 {Erst JETZT kommt e6 – der Läufer c8 ist ja längst draußen. Sieh dir die Mauer an: c6 und e6 halten alles dicht, keine Figur ist eingesperrt.}
9. O-O Ngf6 {Beide Springer stehen perfekt, keine einzige Figur ist eingesperrt. Das ist der Stolz von Caro-Kann: eine Stellung ganz ohne Schwächen.}`,
  },
  {
    id: 'schwarz-franzoesisch',
    title: 'Französische Verteidigung',
    subtitle: 'Die Bauernkette und ihr Angriffsplan',
    playerColor: 'black',
    intro:
      'In der Französischen Verteidigung baut Schwarz mit e6 und d5 eine ' +
      'Bauernkette – eine schräge Mauer aus Bauern, die sich gegenseitig ' +
      'beschützen. Und dann kommt der Trick: Eine Kette greift man an ihrem ' +
      'Fuß an, nicht an der Spitze! Spiel die schwarzen Züge!',
    outro:
      'Genau so knackt man eine Bauernkette! Merk dir den Franzosen-Plan: ' +
      'e6 und d5 bauen die Mauer, c5 hackt am Fuß der weißen Kette, und dann ' +
      'stürzen sich alle Figuren auf den Bauern d4. Druck von allen Seiten!',
    pgn: `1. e4 e6 {Der Franzosenzug: Der Bauer macht dem Kollegen d5 den Weg frei und bleibt selbst als Stütze zurück.}
2. d4 d5 {Da ist die Kampfansage ans weiße Zentrum: Dein Bauer d5 ist von e6 gedeckt und greift e4 an.}
3. e5 {Weiß schiebt vorbei und baut seine eigene Kette: d4 und e5. Jetzt stehen sich zwei Bauernketten gegenüber – wer greift besser an?}
c5 {Der Schlüsselzug! Merk dir: Eine Bauernkette greift man am Fuß an. Der Fuß der weißen Kette ist d4 – und genau den attackiert dein c-Bauer.}
4. c3 {Weiß eilt zur Hilfe und stützt d4 mit einem weiteren Bauern.}
Nc6 {Der zweite Angreifer auf d4. Zählen lernen ist im Schach Gold wert: Angreifer gegen Verteidiger!}
5. Nf3 Qb6 {Die Dame darf hier ausnahmsweise früh raus – sie hat einen klaren Job: Von b6 drückt sie auf b2 – und sobald der Bauer c5 auf d4 schlägt, auch schräg auf d4.}
6. Be2 cxd4
7. cxd4 Nge7 {Ein schlauer Umweg: Der Springer will nicht nach f6, sondern über e7 nach f5 – dort greift er d4 noch einmal an.}
8. O-O Nf5 {Angekommen! Zähl die Angreifer auf d4: Dame b6, Springer c6, Springer f5 – drei gegen zwei Verteidiger (Springer f3 und Dame d1). Der Fuß der weißen Kette wackelt gewaltig.}`,
  },
  {
    id: 'schwarz-italienisch',
    title: 'Italienisch kontern',
    subtitle: 'Gegen die Italienische Partie verteidigen',
    playerColor: 'black',
    intro:
      'Die Italienische Partie kennst du als Weißer in- und auswendig. Aber was ' +
      'machst du, wenn sie GEGEN dich gespielt wird? Hier lernst du die klassische ' +
      'Abwehr: ruhig entwickeln, den Läufer mit Schach tauschen und dann mit d5 ' +
      'im Zentrum zurückschlagen. Spiel die schwarzen Züge!',
    outro:
      'Perfekt verteidigt! Merk dir das Rezept gegen Italienisch: Lb4+ tauscht ' +
      'die Läufer und stoppt den weißen Schwung, und der Konterstoß d5 sprengt ' +
      'das Zentrum. Danach stehst du völlig gleichberechtigt – aus der Verteidigung ' +
      'wird ein Gegenangriff.',
    pgn: `1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 {Bis hierhin kennst du alles von der weißen Seite. Jetzt lernst du, was Schwarz WIRKLICH vorhat.}
4. c3 {Achtung, Weiß verrät seinen Plan: Der Bauer c3 will den Kollegen d4 unterstützen und ein Riesenzentrum aufbauen.}
Nf6 {Keine Panik – erst mal mitentwickeln und e4 angreifen. Wer bedroht wird, muss selbst drohen!}
5. d4 {Da kommt der Vorstoß. Sieht gewaltig aus – aber du hast alles im Griff.}
exd4 {Ruhig tauschen. Niemals erstarren, wenn der Gegner im Zentrum vorgeht!}
6. cxd4 Bb4+ {Der Rettungszug mit Schach! Der Läufer springt aus der Schusslinie des Bauern d4 und nervt den weißen König. Weiß muss reagieren und verliert seinen Schwung.}
7. Bd2 Bxd2+ {Tauschen ist hier genau richtig: Jede getauschte Figur macht den weißen Angriff kleiner.}
8. Nbxd2 d5 {Der Konterstoß mitten ins Zentrum! Merk dir: Gegen ein breites Bauernzentrum hilft kein Abwarten – man sprengt es. Der Bauer greift den Läufer c4 an und ist von der Dame gedeckt.}
9. exd5 Nxd5 {Geschafft: Das weiße Riesenzentrum ist halb verschwunden, dein Springer thront mitten auf dem Brett. Weiß hat aus der Eröffnung keinen Vorteil mehr.}`,
  },
]
