import type { Lesson } from '../types'

// Stufe 1 – Grundschule: die goldenen Eröffnungsregeln.

export const stufe1Lessons: Lesson[] = [
  {
    id: 'grundschule-zentrum',
    title: 'Zentrum & Entwicklung',
    subtitle: 'Die zwei wichtigsten Regeln',
    playerColor: 'white',
    intro:
      'Die goldene Regel Nummer 1: Besetze das Zentrum! Die vier Felder in der ' +
      'Brettmitte sind die wichtigsten. Regel Nummer 2: Bring deine Figuren schnell ' +
      'ins Spiel. Spiel die weißen Züge nach!',
    outro:
      'Geschafft! Merk dir den Dreiklang: Zentrum besetzen, Springer und Läufer ' +
      'entwickeln, König in Sicherheit bringen. Damit startest du in jede Partie gut.',
    pgn: `1. e4 {Der Königsbauer zieht ins Zentrum – er öffnet gleich zwei Figuren den Weg: Dame und Läufer.}
e5 {Schwarz macht es genauso.}
2. Nf3 {Der Springer kommt ins Spiel und greift sofort den Bauern e5 an. Springer vor Läufer entwickeln!}
Nc6 {Schwarz verteidigt seinen Bauern mit dem Springer.}
3. Bc4 {Der Läufer zielt auf f7 – das schwächste Feld bei Schwarz, denn nur der König beschützt es.}
Bc5 {Auch Schwarz entwickelt seinen Läufer aktiv.}
4. Nc3 {Der zweite Springer! Schau, wie alle weißen Figuren mitspielen dürfen.}
Nf6 {Schwarz entwickelt ebenfalls den zweiten Springer.}
5. d3 {Dieser kleine Bauernzug stützt e4 und öffnet dem zweiten Läufer den Weg.}
d6
6. O-O {Die Rochade! Der König hüpft in Sicherheit und der Turm ist bereit. Goldene Regel Nummer 3.}
O-O {Beide Könige sind sicher – jetzt beginnt das eigentliche Spiel mit gleichen Chancen.}`,
  },
  {
    id: 'grundschule-rochade',
    title: 'Der sichere König',
    subtitle: 'Warum du früh rochieren solltest',
    playerColor: 'white',
    intro:
      'Dein König ist die wichtigste Figur – wird er mattgesetzt, ist die Partie ' +
      'sofort vorbei. Die Rochade bringt ihn mit einem einzigen Zug in Sicherheit ' +
      'und weckt gleichzeitig den Turm auf. Spiel die weißen Züge!',
    outro:
      'Super! Merk dir: Ein König in der Brettmitte ist ein Ziel, ein rochierter ' +
      'König ist eine Festung. Rochiere in fast jeder Partie in den ersten zehn Zügen.',
    pgn: `1. e4 {Der Startzug öffnet die Diagonale für den Läufer f1 – ohne freie Felder zwischen König und Turm gibt es keine Rochade.}
e5
2. Bc4 {Der Läufer springt hinaus. Schau: Zwischen König und Turm h1 muss alles leer sein, bevor der König rochieren darf.}
Nf6 {Vorsicht, Schwarz greift deinen Bauern e4 an!}
3. d3 {Erst in Ruhe verteidigen: Der kleine Bauer deckt e4 und öffnet nebenbei dem zweiten Läufer die Tür.}
Bc5
4. Nf3 {Jetzt ist auch der Springer aus dem Weg – der Königsflügel ist komplett geräumt.}
d6
5. O-O {Die Rochade! König und Turm ziehen gemeinsam: der König zwei Felder zur Seite, der Turm hüpft über ihn hinweg. Bliebe der König in der Mitte, könnten Türme und Damen ihn auf der offenen Linie jagen.}
O-O {Auch Schwarz versteckt seinen König. Ein König in der Mitte kassiert Schachs, Fesselungen und Angriffe auf f7 – das erspart man sich mit der frühen Rochade.}`,
  },
  {
    id: 'grundschule-dame',
    title: 'Die Dame bleibt zu Hause',
    subtitle: 'Warum ein früher Damenausflug Zeit kostet',
    playerColor: 'white',
    intro:
      'Die Dame ist deine stärkste Figur – aber gerade deshalb darf sie am Anfang ' +
      'nicht alleine losziehen. Kleine Figuren können sie angreifen, und jedes Mal ' +
      'muss sie fliehen. Schau zu, wie Schwarz diesen Fehler macht, und spiel die weißen Züge!',
    outro:
      'Genau so! Merk dir: Erst Springer und Läufer, die Dame kommt später. Wer die ' +
      'Dame zu früh herausholt, schenkt dem Gegner Zeit – und Zeit ist im Schach Gold wert.',
    pgn: `1. e4 d5 {Schwarz bietet einen Bauerntausch an.}
2. exd5 Qxd5 {Da ist der Fehler: Die Dame kommt viel zu früh heraus. Gleich wird sie gejagt!}
3. Nc3 {Perfekt: Der Springer entwickelt sich und greift gleichzeitig die Dame an. Schwarz MUSS schon wieder mit der Dame ziehen.}
Qa5 {Die Dame flieht. Dieser verlorene Zug heißt Tempoverlust – Schwarz hat zweimal gezogen und nichts entwickelt.}
4. d4 {Während die Dame unterwegs war, schnappt sich Weiß in aller Ruhe das Zentrum.}
Nf6
5. Nf3 {Der zweite Springer kommt ins Spiel. Vergleich mal: Weiß entwickelt Figur um Figur, Schwarz hat außer dem Springer f6 nur die Dame bewegt.}
c6 {Schwarz muss der Dame vorsichtshalber ein Fluchtfeld bauen – noch ein Zug, der nichts entwickelt.}
6. Bc4 Bf5
7. Bd2 {Der Läufer schielt durch das Feld c3 heimlich zur Dame auf a5 hinüber – zieht der Springer irgendwann weg, muss sie schon wieder aufpassen.}
e6
8. O-O {Zähl mal nach: Weiß hat vier Figuren entwickelt und den König in Sicherheit gebracht. Die schwarze Dame ist zweimal gezogen und hat nichts erreicht.}`,
  },
  {
    id: 'grundschule-schaefermatt',
    title: 'Das Schäfermatt abwehren',
    subtitle: 'Verteidigung gegen den ältesten Trick',
    playerColor: 'black',
    intro:
      'Das Schäfermatt ist der bekannteste Anfängertrick: Weiß greift mit Dame und ' +
      'Läufer das Feld f7 an und hofft auf ein Blitzmatt. Wer die Abwehr kennt, hat ' +
      'keine Angst mehr davor – und steht danach sogar besser! Spiel die schwarzen Züge!',
    outro:
      'Stark verteidigt! Merk dir: Gegen frühe Damenangriffe ruhig bleiben, f7 im ' +
      'Auge behalten und mit Entwicklungszügen abwehren. Dann bestraft sich der Trick von selbst.',
    pgn: `1. e4 e5
2. Qh5 {Achtung, die weiße Dame greift zwei Dinge gleichzeitig an: deinen Bauern e5 und das Feld f7 – das schwächste Feld am Brett, denn nur dein König beschützt es.}
Nc6 {Der Springer verteidigt e5 und entwickelt sich. Spiel hier nicht sofort g6 – sonst nimmt die Dame mit Dxe5 deinen Bauern und greift dabei auch noch den Turm h8 an!}
3. Bc4 {Jetzt wird es ernst: Läufer und Dame zielen beide auf f7. Es droht Dxf7 – matt!}
g6 {Die beste Abwehr! Der kleine Bauer verstellt die Diagonale und greift die Dame sogar an – sie muss fliehen, du gewinnst Zeit.}
4. Qf3 {Die Dame weicht aus und droht schon wieder Matt auf f7, diesmal über die f-Linie.}
Nf6 {Wieder ganz ruhig: Der Springer stellt sich in den Weg und entwickelt sich dabei. Zwei Drohungen abgewehrt, zwei Figuren im Spiel!}
5. Ne2 {Siehst du das Problem von Weiß? Die Dame besetzt f3 – das Lieblingsfeld des eigenen Springers. Er muss auf ein schlechteres Feld ausweichen.}
Bg7 {Dein Läufer zielt auf die lange Diagonale und macht den Weg für die Rochade frei.}
6. Nbc3 O-O {König in Sicherheit! Vergleich die Stellungen: Deine Figuren stehen aktiv und dein König ist sicher – die weiße Dame hat nur Zeit verschwendet.}`,
  },
]
