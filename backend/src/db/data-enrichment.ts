// Role : Fournir des donnees manuelles pour enrichir les editeurs et les jeux.
export type ManualEditorData = {
    id: number;
    website?: string;
    logoUrl?: string; // Les URLs de logo peuvent manquer, on conserve au moins le site
    description?: string;
};

// Type : Decrit des metadonnees manuelles pour un jeu.
export type ManualGameData = {
    id: number;
    description?: string;
    imageUrl?: string;
    rulesVideoUrl?: string;
};

// Donnees manuelles d'editeurs.
export const MANUAL_EDITORS: ManualEditorData[] = [
    {
        id: 110,
        website: 'https://flipflapeditions.com',
        description: 'Flip Flap Editions est une maison d’édition de jeux de société qui se distingue par un style graphique fort et des jeux interactifs.',
    },
    {
        id: 112,
        website: 'https://leconservatoiredujeu.fr', // Associe
        description: 'Paille Editions est un éditeur et distributeur français créant des jeux originaux pour tous les âges.'
    },
    {
        id: 145,
        website: 'https://hurrican.fr',
        logoUrl: 'https://hurrican.fr/wp-content/uploads/2019/06/logo-hurrican.png', // Essai de deviner ou laisser vide si pas sur
    },
    {
        id: 157,
        website: 'https://oya.fr',
        description: 'Oya est un éditeur et distributeur de jeux de société, gérant également un bar à jeux à Paris.',
    },
    {
        id: 158,
        website: 'http://www.pearlgames.be',
        description: 'Pearl Games est un éditeur belge connu pour des jeux de stratégie profonds comme Troyes et Deus.',
    },
    {
        id: 163,
        website: 'https://runeseditions.com',
        description: 'Runes Editions édite des jeux aux thèmes forts et mécaniques originales.'
    },
    {
        id: 182,
        website: 'https://ferti-games.com',
        description: 'Ferti Games est un éditeur français de jeux de société et jeux en bois (Passe-trappe).'
    },
    {
        id: 185,
        website: 'https://www.pinkmonkeygames.com',
        description: 'Pink Monkey Games crée des jeux familiaux, simples d’accès mais tactiques.'
    },
    {
        id: 186,
        website: 'https://tactic.net',
        description: 'Tactic Games est un éditeur finlandais produisant des jeux de société et d’extérieur depuis plus de 50 ans.'
    },
    {
        id: 190,
        website: 'https://lesgensqui.com',
        description: 'Chouic est un éditeur nantais connu pour ses jeux d’ambiance et applications mobiles.'
    },
    {
        id: 197,
        website: 'https://jeux-ducale.fr',
        description: 'Ducale est une marque historique française de cartes à jouer et jeux de société.'
    },
    {
        id: 200,
        website: 'https://www.bragelonne.fr',
        description: 'Bragelonne Games est le label jeux de société de la maison d’édition Bragelonne.'
    },
    {
        id: 216,
        website: 'https://ludotech.fr',
        description: 'Ludo.tech met les nouvelles technologies au service du jeu.'
    },
    {
        id: 218,
        website: 'https://auroragames.fr',
        description: 'Aurora Games se concentre sur des expériences de jeu narratives et visuelles.'
    },
    {
        id: 220,
        website: 'https://faireplayeditions.fr',
        description: 'Faire Play Editions est une jeune maison d\'édition corse créant des jeux aux univers variés.'
    },
    {
        id: 232,
        website: 'https://ludiconcept.fr',
        description: 'Ludiconcept conçoit des jeux de société sur mesure et des serious games pour entreprises et collectivités.'
    },
    {
        id: 245,
        website: 'http://www.jyde-games.com',
        description: 'JyDe Editions édite des jeux de société de qualité pour tous publics, du familial à l\'expert.'
    },
    {
        id: 257,
        website: 'https://cheesecakegames.com',
        description: 'Cheesecake Games est un studio indépendant créant des expériences ludiques intuitives sur diverses plateformes.'
    },
    {
        id: 266,
        website: 'https://ouimbagames.com',
        description: 'Ouimba Games est l\'éditeur du jeu basque "J\'emme", un jeu de stratégie abstrait.'
    },
    {
        id: 273,
        website: 'https://olibrius.net',
        description: 'Olibrius est un créateur d\'Objets Ludiques Non Identifiés, proposant des jeux originaux.'
    },
    {
        id: 276,
        website: 'https://rivieragames.com',
        description: 'Riviera Games est spécialisé dans les casse-têtes, jeux de logique et Escape Games.'
    },
    {
        id: 287,
        website: 'https://captain.games',
        description: 'Captain Games est la maison d\'édition de Cédrick Caumont, co-fondateur de Repos Production.'
    },
    {
        id: 290,
        website: 'https://hotmacacos.com',
        description: 'Hot Macacos propose des jeux innovants utilisant des matériaux tactiles et des concepts originaux.'
    },
    {
        id: 338,
        website: 'https://arkhamsociety.fr',
        description: 'Arkham Society édite des jeux de société immersifs.'
    },
    {
        id: 342,
        website: 'https://wearerosenoire.com',
        description: 'Rose Noire Edition est une maison d\'édition indépendante créant des univers ludiques riches de sens.'
    },
    {
        id: 344,
        website: 'https://thetaworld.fr',
        description: 'Theta World développe un univers cohérent et immersif à travers ses jeux de société interconnectés.'
    },
    {
        id: 202,
        website: 'https://dtda.fr',
        description: 'DTDA Games est un studio parisien créant des jeux enchanteurs et poétiques (Efemeris).'
    },
    {
        id: 204,
        website: 'https://weelingua.com',
        description: 'Weelingua est un éditeur belge spécialisé dans les jeux éducatifs pour l\'apprentissage des langues.'
    },
    {
        id: 205,
        website: 'http://www.alf-ludotheques.org',
        description: 'L\'ALF fédère les ludothèques françaises et promeut le jeu comme pratique culturelle.'
    },
    {
        id: 209,
        website: 'https://surfinmeeple.com',
        description: 'Surfin Meeple est un éditeur et distributeur de jeux de société modernes.'
    },
    {
        id: 210,
        website: 'https://www.gamebrewer.com',
        description: 'Game Brewer est un éditeur belge connu pour ses jeux de stratégie (Eurogames) de qualité supérieure.'
    },
    {
        id: 211,
        website: 'https://www.flatlined.games',
        description: 'Flatlined Games est un éditeur belge indépendant proposant des jeux aux thèmes forts et variés.'
    },
    {
        id: 226,
        website: 'https://gamefactory-games.com',
        description: 'Game Factory est un éditeur suisse proposant des jeux familiaux et d\'ambiance originaux.'
    },
    {
        id: 227,
        website: 'https://www.deliciousgames.org',
        description: 'Delicious Games est un éditeur tchèque connu pour ses jeux de stratégie experts comme Underwater Cities.'
    },
    {
        id: 235,
        website: 'https://atmgaming.eu',
        description: 'ATM Gaming (I Love Games) crée des jeux d\'ambiance drôles et décalés comme Juduku.'
    },
    {
        id: 236,
        website: 'https://sandcastle-games.com',
        description: 'Sand Castle Games est l\'éditeur du célèbre jeu de stratégie et de combos Res Arcana.'
    },
    {
        id: 237,
        website: 'https://www.kosmos.de',
        description: 'Kosmos est un éditeur historique allemand proposant une vaste gamme de jeux (Catan, série EXIT).'
    },
    {
        id: 240,
        website: 'https://magilano.com',
        description: 'Magilano est l\'éditeur allemand derrière le succès mondial du jeu de cartes Skyjo.'
    },
    {
        id: 246,
        description: 'Le Lapin Sigma est un éditeur alsacien qui revisite des classiques comme le Petit Bac avec humour.'
    },
    {
        id: 249,
        description: 'Pétard Troll est un éditeur de jeux de société conviviaux et accessibles.'
    },
    {
        id: 252,
        website: 'http://www.hutter-trade.com',
        description: 'Huch! est un éditeur allemand proposant des jeux originaux, éducatifs et de stratégie.'
    },
    {
        id: 258,
        description: 'Bières et Cookies à 10h21 est une maison d\'édition française basée à Caluire-et-Cuire.'
    },
    {
        id: 259,
        website: 'https://icemakesgames.com',
        description: 'Ice Makes est un studio de Hong Kong créant des jeux innovants (Age of Civilization).'
    },
    {
        id: 261,
        website: 'https://www.gateongames.com',
        description: 'GateOnGames est un éditeur italien spécialisé dans les jeux de société, cartes et JDR.'
    },
    {
        id: 262,
        website: 'https://oppitoys.com',
        description: 'Oppi est une marque de jouets éducatifs et innovants (Piks) favorisant le développement des enfants.'
    },
    {
        id: 264,
        description: 'Mythic Games était connu pour ses jeux de figurines narratifs et immersifs (Joan of Arc, Reichbusters).'
    },
    {
        id: 286,
        website: 'https://azaogames.com',
        description: 'Azao Games est un fabricant et éditeur belge proposant des jeux de qualité et une production locale.'
    },
    {
        id: 288,
        website: 'https://gdmgames.com',
        description: 'GDM Games est un éditeur espagnol publiant des jeux variés pour l\'international.'
    },
    {
        id: 289,
        website: 'https://grammesedition.fr',
        description: 'Grammes Édition est une maison d\'édition familiale créatrice de jeux comme Clash of Decks.'
    },
    {
        id: 291,
        website: 'https://klostergames.se',
        description: 'Kloster Games est un éditeur suédois créant des jeux accessibles pour tous niveaux.'
    },
    {
        id: 293,
        website: 'https://legacyofthecrown.com',
        description: 'Legacy of Crown édite un jeu de rôle dystopique victorien dans un univers "Grand Royaume".'
    },
    {
        id: 295,
        website: 'https://www.tsume-art.com/fr/jeux',
        description: 'Yoka By Tsume (Tsume Art) édite des jeux de société souvent basés sur des licences manga/anime.'
    },
    {
        id: 362,
        website: 'https://www.gigamic.com',
        description: 'Enigami est une marque de Gigamic dédiée aux jeux d\'enquête immersifs (Enquêtes Sous Scellés).'
    },
    {
        id: 394,
        website: 'https://fentasy.games',
        description: 'Fentasy Games est un éditeur français spécialisé dans les jeux experts et Eurogames immersifs.'
    }
];

// Donnees manuelles de jeux.
export const MANUAL_GAMES: ManualGameData[] = [
    {
        id: 206,
        description: 'IQ-Focus est un jeu de logique solitaire avec 120 défis. L\'objectif est de remplir la grille en se concentrant sur le carré central 3x3 pour correspondre au motif du défi.'
    },
    {
        id: 209,
        description: 'IQ-Twist est un jeu de logique où vous devez placer des pièces tordues sur le plateau. La difficulté vient des pions de couleur qui doivent correspondre à la couleur de la pièce posée dessus.'
    },
    {
        id: 210,
        description: 'IQ XOXO demande de remplir la grille avec des pièces pentomino colorées portant des X et des O, en respectant une alternance stricte entre eux.'
    },
    {
        id: 211,
        description: 'L\'Arche de Noé est un jeu magnétique de voyage où il faut placer les animaux par paires dans l\'arche, en s\'assurant qu\'ils se touchent et regardent vers le haut.'
    },
    {
        id: 212,
        description: 'La Forêt enchantée est un jeu magnétique où l\'on doit créer un chemin continu pour relier des créatures magiques tout en évitant les culs-de-sac.'
    },
    {
        id: 213,
        description: 'Gruyère Party est un jeu de déduction où il faut placer les morceaux de fromage pour que les souris apparaissent à travers les trous.'
    },
    {
        id: 214,
        description: 'Insectes en folie est un jeu de cache-cache magnétique où l\'on place des pierres pour ne laisser visibles que les insectes demandés par le défi.'
    },
    {
        id: 215,
        description: 'La Marche des Pingouins est un jeu magnétique où l\'on doit aligner les pingouins horizontalement, verticalement ou diagonalement sans espace.'
    },
    {
        id: 216,
        description: 'La Mare aux canards demande de placer les familles de canards sur le plateau de façon logique pour que les canetons suivent leur mère.'
    },
    {
        id: 217,
        description: 'Le Monde Aquatique est un jeu de voyage où l\'on place des nénuphars pour cacher les animaux non désirés et ne montrer que ceux du défi.'
    },
    {
        id: 218,
        description: 'Geosmart est un système de construction magnétique géométrique permettant de créer des structures 2D et 3D dynamiques et éducatives.'
    },
    {
        id: 219,
        description: 'Dwarfs est un jeu de placement de tuiles où vous devez organiser le travail de vos nains pour extraire le plus de minerai possible tout en protégeant votre mine.'
    },
    {
        id: 220,
        description: 'Kryptos est un jeu de déduction sur le thème de l\'espionnage où les joueurs doivent décrypter les codes de leurs adversaires en premier.'
    },
    {
        id: 226,
        description: 'Wendake est un jeu de stratégie (Eurogame) sur les tribus amérindiennes des Grands Lacs, utilisant un mécanisme original de sélection d\'actions.'
    },
    {
        id: 227,
        description: 'Lumens est un jeu d\'affrontement et de contrôle de zone pour deux joueurs dans un univers post-apocalyptique où la lumière est source de pouvoir.',
        imageUrl: 'https://cf.geekdo-images.com/image_id.jpg' // Placeholder, URLs non trouvees directement
    },
    {
        id: 228,
        description: 'Magic Maze est un jeu coopératif en temps réel où les joueurs doivent voler de l\'équipement dans un centre commercial avant la fin du sablier, le tout en silence.'
    },
    {
        id: 229,
        description: 'Magic Maze Kids est la version enfant du célèbre jeu coopératif, adaptée pour être accessible aux plus jeunes avec des règles progressives.'
    },
    {
        id: 230,
        description: 'Viking Gone Wild est un jeu de deck-building et de gestion de ressources basé sur le jeu mobile, où les chefs de clan s\'affrontent pour la faveur des dieux.'
    },
    {
        id: 231,
        description: 'Ice Cool est un jeu de pichenettes où des pingouins glissent et sautent à travers l\'école pour attraper des poissons sans se faire attraper par le surveillant.'
    },
    {
        id: 232,
        description: 'Thèbes est un jeu d\'archéologie où les joueurs voyagent en Europe et fouillent des sites antiques en gérant leur temps précieux pour découvrir des trésors.'
    },
    {
        id: 233,
        description: 'Limite Limite Limite est une extension ou version du jeu d\'ambiance trash où l\'on doit compléter des phrases avec les réponses les plus drôles ou scandaleuses.'
    },
    {
        id: 234,
        description: 'Limite Limite est le jeu d\'ambiance culte pour adultes où l\'humour noir et le second degré sont rois. Créez les associations les plus hilarantes.'
    },
    {
        id: 235,
        description: 'Watizit est un jeu de dessin et de déduction où il faut faire deviner des interdictions loufoques créées en combinant plusieurs mots.'
    },
    {
        id: 236,
        description: 'Krazy Wordz est un jeu de création de mots où les joueurs doivent inventer des mots fictifs correspondant à des thèmes improbables pour les faire deviner aux autres.'
    },
    {
        id: 237,
        description: 'Paku Paku est un jeu de dés et de rapidité frénétique où des pandas gourmands doivent empiler de la vaisselle sans la faire tomber.'
    },
    {
        id: 238,
        description: 'Les Loups-Garous de Thiercelieux est le célèbre jeu d\'ambiance, de bluff et de déduction où villageois et loups-garous s\'affrontent pour survivre.'
    },
    {
        id: 240,
        description: 'Chrono-Mots est un jeu d\'équipe coopératif où il faut faire deviner un mot en donnant des indices commençant par des lettres imposées, le tout contre la montre.'
    },
    {
        id: 241,
        description: 'Kontour est un jeu de dessin minimaliste où vous devez faire deviner un concept en 30 secondes et avec seulement 15 traits maximum.'
    },
    {
        id: 243,
        description: 'Galèrapagos est un jeu de survie semi-coopératif où les naufragés doivent construire un radeau pour s\'échapper avant l\'ouragan, tout en gérant la faim et la soif.'
    },
    {
        id: 244,
        description: 'Katarenga est un jeu de stratégie abstrait à deux joueurs où les déplacements des pions sont dictés par la couleur de la case sur laquelle ils se trouvent.'
    },
    {
        id: 245,
        description: '13 Indices est un jeu d\'enquête et de déduction où chaque joueur doit résoudre son propre mystère en voyant les indices des autres mais pas les siens.'
    },
    {
        id: 246,
        description: 'Otys est un jeu de gestion et d\'optimisation dans un futur submergé, où les joueurs envoient des plongeurs récupérer des ressources à différentes profondeurs.'
    },
    {
        id: 247,
        description: 'L\'Auberge Sanglante est un jeu de stratégie inspiré de faits divers réels, où des aubergistes cupides détroussent et assassinent leurs clients pour s\'enrichir.'
    },
    {
        id: 242,
        description: 'Yogi est un jeu d\'ambiance et de contorsion où les joueurs doivent obéir à des défis physiques imposés par des cartes, finissant souvent emmêlés.'
    },
    {
        id: 248,
        description: 'Poker Dice est un jeu de dés reprenant les combinaisons du poker (paires, suites, carrés) avec des dés spéciaux.'
    },
    {
        id: 249,
        description: 'Folanimo est un jeu d\'observation et de rapidité Djeco où il faut associer des têtes et des corps d\'animaux farfelus.'
    },
    {
        id: 250,
        description: 'Niwa est un jeu de stratégie abstrait pour deux joueurs où l\'on doit traverser le jardin adverse en utilisant des perles colorées.'
    },
    {
        id: 251,
        description: 'Animouv est un jeu de déplacement tactique où chaque joueur tente d\'aligner secrètement trois animaux sur le plateau.'
    },
    {
        id: 252,
        description: 'Archichato est un jeu d\'observation et de rapidité où les joueurs doivent être les premiers à reproduire une pyramide de cônes.'
    },
    {
        id: 253,
        description: 'Les Aventuriers du Rail France est une extension ajoutant la carte de France et une mécanique de construction de voies ferrées.'
    },
    {
        id: 254,
        description: 'Les Aventuriers du Rail Europe invite à traverser l\'Europe du début du 20e siècle, ajoutant gares, tunnels et ferries à la mécanique classique.'
    },
    {
        id: 256,
        description: 'Small World est un jeu de conquête de territoires fun et fantastique où les peuples trop à l\'étroit luttent pour leur place avant de décliner.'
    },
    {
        id: 257,
        description: 'Chimère est un jeu de création de créatures fabuleuses en temps réel pour remporter des concours saisonniers.'
    },
    {
        id: 258,
        description: 'Flamme Rouge est un jeu de course cycliste tactique où chaque joueur gère l\'endurance de son rouleur et de son sprinteur.'
    },
    {
        id: 259,
        description: 'Dragons est un jeu de prise de risque et de collection où les joueurs amassent des trésors tout en évitant les pièges.'
    },
    {
        id: 260,
        description: 'Micropolis est un jeu de stratégie où vous développez votre fourmilière en recrutant des spécialistes et en creusant des galeries.'
    },
    {
        id: 261,
        description: 'Princess Jing est un jeu de bluff et de miroirs où deux princesses tentent de s\'échapper discrètement de la Cité Interdite.'
    },
    {
        id: 262,
        description: 'Meeple Circus est un jeu d\'adresse où vous empilez des meeples pour réaliser les numéros de cirque les plus spectaculaires en musique.'
    },
    {
        id: 263,
        description: 'Auztralia est un jeu d\'aventure et de gestion uchronique où l\'on développe un réseau en Australie tout en combattant les Grands Anciens.'
    },
    {
        id: 264,
        description: 'One Deck Dungeon est un jeu d\'exploration de donjon coopératif ("roguelike") utilisant des dés et des cartes pour simuler une aventure complète.'
    },
    {
        id: 265,
        description: 'Kikafé? est un jeu de défausse et de mémoire hilarant où vous devez innocenter vos animaux en accusant ceux des autres d\'avoir fait une bêtise.'
    },
    {
        id: 266,
        description: 'Indian Summer est un jeu de puzzle automnal d\'Uwe Rosenberg où les joueurs recouvrent le sol forestier de feuilles, baies et noisettes.'
    },
    {
        id: 267,
        description: 'Memoarrr! est un jeu de mémoire tactique où il faut retourner des cartes partageant un animal ou un décor avec la précédente pour ne pas être éliminé.'
    },
    {
        id: 268,
        description: 'Gare à la toile est un jeu de parcours en 3D où des fourmis doivent traverser la forêt sans se faire attraper par les araignées magnétiques.'
    },
    {
        id: 269,
        description: 'La chasse aux monstres est un jeu de mémoire coopératif pour enfants où il faut trouver le bon jouet pour effrayer les monstres du placard.'
    },
    {
        id: 270,
        description: 'MonstruYeux est un jeu de rapidité et de dés où il faut être le premier à replacer les yeux d\'un monstre loufoque.'
    },
    {
        id: 271,
        description: 'Décrocher la lune est un jeu d\'équilibre poétique où les joueurs empilent des échelles pour atteindre la lune sans tout faire tomber.'
    },
    {
        id: 272,
        description: 'Welcome to the dungeon est un jeu de bluff et de "stop ou encore" où les joueurs parient sur leur capacité à vaincre un donjon avec un équipement réduit.'
    },
    {
        id: 273,
        description: 'Exposition universelle (Chicago 1893) est un jeu de majorité et de collection de cartes sur le thème de la célèbre exposition historique.'
    },
    {
        id: 274,
        description: 'Citadelles est un classique du jeu de bluff et de construction où chaque joueur choisit secrètement un personnage pour bâtir sa cité médiévale.'
    },
    {
        id: 275,
        description: 'Runewars le jeu de figurines est un jeu de batailles tactiques dans l\'univers de Terrinoth avec des figurines à peindre et des cadrans d\'ordres.'
    },
    {
        id: 276,
        description: 'Watson and Holmes est un jeu d\'enquête compétitif où les joueurs visitent des lieux pour résoudre des énigmes avant les autres.'
    },
    {
        id: 277,
        description: 'Nmbr 9 est un jeu de puzzle et d\'optimisation où l\'on empile des tuiles chiffres en hauteur pour marquer des points.'
    },
    {
        id: 279,
        description: 'Sushi Go! est un jeu de draft de cartes rapide et mignon où l\'on compose le meilleur repas de sushis pour marquer des points.'
    },
    {
        id: 280,
        description: 'Jamaïca est un jeu de course de pirates familial et tactique autour de l\'île, mêlant gestion de ressources et combats.'
    },
    {
        id: 281,
        description: 'Fluxx est un jeu de cartes chaotique où les règles et les conditions de victoire changent constamment en cours de partie.'
    },
    {
        id: 282,
        description: 'Jaipur est un jeu de duel de marchands rapide et tactique où l\'on doit vendre des marchandises (épices, tissus, diamants) pour surpasser son adversaire.'
    },
    {
        id: 283,
        description: 'Lindisfarne est un jeu de stratégie et de dés où les Vikings lancent des raids pour gagner la faveur du roi.'
    },
    {
        id: 284,
        description: 'Tag City est un "roll and write" urbain où les joueurs taguent des quartiers pour devenir le meilleur graffeur.'
    },
    {
        id: 285,
        description: 'Jungle Speed est un jeu d\'observation et de réflexes culte où il faut attraper le totem dès que deux symboles identiques apparaissent.'
    },
    {
        id: 286,
        description: 'Jungle Speed Kids est une version mémoire et réflexes du célèbre jeu, adaptée pour les plus jeunes avec des animaux de la jungle.'
    },
    {
        id: 287,
        description: 'Jungle Speed Skwak est une édition limitée et artistique du célèbre jeu de réflexes, illustrée par l\'artiste Skwak.'
    },
    {
        id: 288,
        description: 'Dobble est un jeu d\'observation et de rapidité culte où il faut repérer l\'unique symbole identique entre deux cartes rondes.'
    },
    {
        id: 289,
        description: 'Timeline est un jeu de culture générale où l\'on doit placer des événements historiques, inventions ou découvertes sur une frise chronologique.'
    },
    {
        id: 290,
        description: 'Perplexus Harry Potter est un casse-tête 3D sphérique où l\'on guide une bille à travers un labyrinthe complexe aux couleurs de Poudlard.'
    },
    {
        id: 291,
        description: 'TV Show est un jeu d\'ambiance et d\'imagination où l\'on crée ensemble le scénario d\'une série télévisée loufoque.'
    },
    {
        id: 293,
        description: 'NagaRaja est un jeu de duel et d\'exploration de temple où l\'on gère sa main de cartes pour récupérer des reliques.'
    },
    {
        id: 294,
        description: 'Gizmos est un jeu de construction de moteur (engine building) où l\'on assemble des machines utilisant des billes d\'énergie.'
    },
    {
        id: 296,
        description: 'Stay Cool est un jeu d\'ambiance stressant où l\'on doit répondre simultanément à des questions orales et écrites tout en surveillant le sablier.'
    },
    {
        id: 297,
        description: 'Débats Débiles est un jeu d\'ambiance où l\'on débat sur des sujets absurdes pour diviser l\'opinion des autres joueurs.'
    },
    {
        id: 298,
        description: 'Questions de merde est un jeu d\'ambiance irrévérencieux où l\'on répond à des questions philosophiques ou absurdes.'
    },
    {
        id: 299,
        description: 'Le Petit Poucet est un jeu coopératif pour enfants mêlant mémoire et tactique pour échapper à l\'ogre.'
    },
    {
        id: 300,
        description: 'Orbis est un jeu de gestion de ressources et de placement de tuiles où l\'on construit le plus bel univers pour attirer des adorateurs.'
    },
    {
        id: 301,
        description: 'Unlock! est une série de jeux d\'aventure coopératifs inspirés des escape games, utilisant des cartes et une application mobile.'
    },
    {
        id: 302,
        description: 'Solenia est un jeu de livraison de ressources sur une planète au cycle jour/nuit unique, avec un plateau roulant.'
    },
    {
        id: 303,
        description: 'Affinity est un jeu d\'ambiance sur les émotions où l\'on doit deviner ce que ressentent les autres joueurs par association d\'idées.'
    },
    {
        id: 304,
        description: 'Les Gens Qui est un jeu d\'ambiance où l\'on juge les comportements agaçants du quotidien.'
    },
    {
        id: 305,
        description: 'Dice Forge est un jeu innovant de "dice crafting" où l\'on améliore physiquement ses dés pour gagner la faveur des dieux.'
    },
    {
        id: 306,
        description: 'Shadows - Amsterdam est un jeu d\'enquête en temps réel et en équipes, mêlant interprétation d\'images et course contre la montre.'
    },
    {
        id: 309,
        description: 'Le Cercle des Enquêteurs est une série de livres-jeux d\'enquête coopératifs où les joueurs incarnent des personnages pour résoudre des mystères.'
    },
    {
        id: 310,
        description: 'Ksar est un jeu de stratégie abstraite en bois où les joueurs doivent former la plus longue suite de pièces de leur couleur.'
    },
    {
        id: 311,
        description: 'Arkantar est un jeu de stratégie abstrait où deux joueurs s\'affrontent avec des tuiles réversibles et des pions pour conquérir le royaume adverse.'
    },
    {
        id: 312,
        description: 'Par Odin est un jeu de logique solo narratif où l\'on doit résoudre 50 défis basés sur la mythologie nordique à l\'aide de dés divins.'
    },
    {
        id: 313,
        description: 'Shy Monsters est un jeu de bluff asymétrique pour deux joueurs où un maître du donjon tente de piéger un héros dans un labyrinthe.'
    },
    {
        id: 314,
        description: 'Crypt est un jeu de collection et de placement de dés où les joueurs pillent la crypte royale pour amasser le plus grand héritage.'
    },
    {
        id: 315,
        description: 'SuperNat contre MaxiBeurk est un jeu coopératif écologique où les joueurs aident SuperNat à nettoyer la nature avant que MaxiBeurk ne la pollue.'
    },
    {
        id: 316,
        description: 'Culot est un jeu d\'ambiance "Action ou Vérité" modernisé avec des cartes Corps et Posture pour des défis déjantés.'
    },
    {
        id: 317,
        description: 'Kids of London est un jeu de bluff et de stratégie où les joueurs dirigent des bandes d\'enfants voleurs dans les rues de Londres.'
    },
    {
        id: 318,
        description: 'Game Over est un jeu de mémoire et d\'exploration de donjon inspiré de la bande dessinée Kid Paddle, où il faut éviter les Blorks.'
    },
    {
        id: 319,
        description: 'Shabadabada est un jeu d\'ambiance musical où deux équipes s\'affrontent pour trouver des chansons contenant un mot imposé.'
    },
    {
        id: 320,
        description: 'Sonar Family est une version familiale du jeu de bataille sous-marine Captain Sonar, opposant deux équipes en temps réel.'
    },
    {
        id: 321,
        description: 'Claim est un jeu de plis tactique pour deux joueurs où l\'on recrute des partisans de différentes factions pour succéder au roi.'
    },
    {
        id: 322,
        description: 'Plouf Party est un jeu d\'ambiance et de bluff autour d\'une piscine où le but est de pousser les pions adverses à l\'eau.'
    },
    {
        id: 323,
        description: 'Selfie Safari est un jeu d\'ambiance où les joueurs doivent imiter des animaux pour faire deviner leurs selfies aux autres.'
    },
    {
        id: 324,
        description: 'Portrait Robot est un jeu d\'enquête coopératif où les joueurs doivent décrire et dessiner le visage d\'un coupable après une brève observation.'
    },
    {
        id: 325,
        description: 'Imagine est un jeu de créativité où l\'on fait deviner des énigmes en superposant et animant des cartes transparentes.'
    },
    {
        id: 326,
        description: 'Le Ciel Interdit est un jeu coopératif de survie où les joueurs doivent construire un circuit électrique sur une plateforme volante en pleine tempête.'
    },
    {
        id: 327,
        description: 'La Salsa des Œufs est un jeu d\'ambiance et d\'adresse où les joueurs doivent accomplir des gages en gardant des œufs coincés sur leur corps.'
    },
    {
        id: 328,
        description: 'Le Monstre des Couleurs est un jeu coopératif pour enfants basé sur le livre éponyme, aidant à identifier et exprimer ses émotions.'
    },
    {
        id: 329,
        description: 'Color Addict est un jeu de défausse frénétique basé sur l\'effet Stroop, où il faut assortir rapidement couleurs et mots écrits en couleurs.'
    },
    {
        id: 330,
        description: 'Big Bug Panic est un jeu de réflexes et d\'observation où les joueurs doivent taper sur le tas central quand le chiffre annoncé correspond à la carte.'
    },
    {
        id: 331,
        description: 'MimiQ Body est un jeu de 7 familles et de mimes où les joueurs demandent des cartes en imitant les grimaces ou poses illustrées.'
    },
    {
        id: 332,
        description: 'Jack le Pirate est un jeu de stop-ou-encore tactique où les joueurs tentent de se rapprocher le plus possible de 21 sans dépasser.'
    },
    {
        id: 333,
        description: 'Dosa est un jeu d\'adresse finlandais où l\'on lance des palets magnétiques qui doivent se "claper" sur des plateaux cibles.'
    },
    {
        id: 334,
        description: 'Gold Armada est un jeu de dés de type Yahtzee où les joueurs tentent d\'obtenir des combinaisons pour piller des doublons sur une île.'
    },
    {
        id: 335,
        description: 'Eski\'Pêche est un jeu de collecte tactique où les joueurs déplacent des esquimaux pour pêcher le plus de poissons possible.'
    },
    {
        id: 336,
        description: 'Karuba est un jeu de placement de tuiles où chaque joueur construit des chemins dans sa jungle pour mener ses aventuriers aux temples.'
    },
    {
        id: 337,
        description: 'Cuzco est un jeu de stratégie et de majorité (anciennement Java) où l\'on bâtit des temples et place des Incas sur un plateau en relief.'
    },
    {
        id: 338,
        description: 'U.S. Telegraph est un jeu de connexion et de gestion de ressources où l\'on construit le réseau télégraphique transcontinental américain.'
    },
    {
        id: 339,
        description: 'Deckscape est une série de jeux d\'escape game en format de poche, jouables avec un simple paquet de cartes.'
    },
    {
        id: 340,
        description: 'Save the Meeple est un jeu de placement d\'ouvriers où les meeples luttent contre les humains pour s\'échapper vers une autre planète.'
    },
    {
        id: 341,
        description: 'Cortex + est un jeu de défis cérébraux rapides testant la mémoire, la réflexion, le tactile et la coordination.'
    },
    {
        id: 342,
        description: 'Roi et Compagnie est un jeu de dés (King of Tokyo junior) où l\'on tente d\'attirer de nouveaux habitants dans son royaume.'
    },
    {
        id: 343,
        description: 'Escargots... Prêts ? Partez ! est un jeu de course avec des escargots magnétiques qui grimpent sur la boîte de jeu métallique.'
    },
    {
        id: 344,
        description: 'Ploufette en mission est un jeu de mémoire et d\'adresse où l\'on aide une grenouille à grimper aux murs pour rendre des objets.'
    },
    {
        id: 345,
        description: 'Le Verger (version XL) est le célèbre jeu coopératif où les enfants cueillent des fruits avant que le corbeau ne les mange, en version géante.'
    },
    {
        id: 346,
        description: 'Hop ! Hop ! Galopons ! est un jeu de course et de collecte pour tout-petits où l\'on ramène son cheval à l\'écurie.'
    },
    {
        id: 347,
        description: 'Théo le Pompier est un jeu de mémoire coopératif où les enfants aident les pompiers à trouver les bons objets pour éteindre des incendies.'
    },
    {
        id: 348,
        description: 'Ma Première Pêche est un jeu d\'adresse magnétique pour les tout-petits qui doivent pêcher des animaux marins selon les couleurs du dé.'
    },
    {
        id: 349,
        description: 'Abella l\'Abeille est un jeu coopératif où les enfants aident une abeille à transformer le nectar en miel en insérant des plaquettes dans une ruche magique.'
    },
    {
        id: 350,
        description: 'Corinth est un jeu de "roll & write" où les joueurs incarnent des marchands en Méditerranée, utilisant des dés pour livrer des marchandises et gérer des troupeaux.'
    },
    {
        id: 351,
        description: 'The River est un jeu de placement d\'ouvriers et de tuiles accessible où les joueurs colonisent une nouvelle terre en naviguant sur une rivière.'
    },
    {
        id: 352,
        description: 'Les Aventuriers du Rail - New York est une version rapide et compacte du célèbre jeu de trains, où l\'on utilise des taxis pour visiter les attractions de New York.'
    },
    {
        id: 353,
        description: 'Red7 est un jeu de cartes rapide et tactique où la règle de victoire change à chaque tour, obligeant les joueurs à s\'adapter constamment.'
    },
    {
        id: 354,
        description: 'Forêt des Ombres est une extension/stand-alone pour One Deck Dungeon, ajoutant de nouveaux héros et un donjon empoisonné à explorer.'
    },
    {
        id: 355,
        description: 'L\'Expédition Perdue est un jeu de survie et de gestion de main où les joueurs guident l\'expédition de Percy Fawcett à travers la jungle amazonienne.'
    },
    {
        id: 356,
        description: 'La Traque de l\'Anneau est un jeu de déduction et de mouvements cachés asymétrique, opposant Frodon et ses compagnons aux Nazgûls qui les pourchassent.'
    },
    {
        id: 358,
        description: 'Mû est un jeu de draft et de gestion de ressources où les joueurs rivalisent pour construire la cité la plus prestigieuse.'
    },
    {
        id: 359,
        description: 'Space Gate Odyssey est un jeu de gestion et de développement où les joueurs construisent leur station spatiale pour envoyer des colons sur des exoplanètes.'
    },
    {
        id: 361,
        description: 'Zombie Kidz Evolution est un jeu coopératif évolutif (legacy) pour enfants où ils doivent défendre leur école contre une invasion de zombies.'
    },
    {
        id: 362,
        description: 'Ganymede est un jeu de développement de tableau où les joueurs incarnent des corporations recrutant des colons pour explorer l\'espace.'
    },
    {
        id: 363,
        description: 'Greenville 1989 est un jeu coopératif narratif et d\'horreur où des adolescents tentent d\'échapper à une version cauchemardesque de leur ville.'
    },
    {
        id: 364,
        description: 'Gobi est un jeu de placement de tuiles et de connexion où les joueurs tracent des routes commerciales à travers le désert pour réunir des tribus nomades.'
    },
    {
        id: 365,
        description: '8Bit Box est un système de jeu de société imitant une console de jeux vidéo rétro, proposant plusieurs jeux aux mécaniques variées (course, pac-man, sport).'
    },
    {
        id: 366,
        description: 'Downforce est un jeu de course de voitures, d\'enchères et de paris où les joueurs doivent gérer leur main de cartes pour faire gagner leurs favoris.'
    },
    {
        id: 367,
        description: 'Pictomania est un jeu de dessin rapide où tout le monde dessine et devine en même temps, récompensant la rapidité et l\'observation.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=NulrLarRggrcFBB5XQblF95V95smRa3EEKim2lJL6dUV6ebzL'
    },
    {
        id: 368,
        description: 'CS Files est un jeu d\'enquête et d\'identités cachées où le médecin légiste aide les enquêteurs à démasquer le meurtrier parmi eux.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=iAErsleM97Lx9s637J74v5j32U7AxGHZt9fvDHDvTmodsqCnU7jWEuXTKCGKG6OO7beG0UEJuEh32cZiv1qeIxZoj4VsX0W6'
    },
    {
        id: 369,
        description: 'Monsieur Carrousel est un jeu coopératif pour enfants où l\'on place les enfants sur un manège en bois avant qu\'il ne commence à pleuvoir.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=BVu8k_yM5qXpl2dLsd79oFVgCtdoNcsh4JeExItzJpoD34SHnNRAnUxn7WvZfE4LLF0osRyxF0HQSjZV7gxctfWXp9bCh8r2MlmT8nHSLBpKHk4mEaXXim2m1CowB7'
    },
    {
        id: 370,
        description: 'Gangster Paradise est un jeu de négociation et de bluff où les joueurs incarnent des chefs de clans mafieux cherchant à blanchir de l\'argent.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=LIRjr95w530bFKhelpbDMhJIsIb-czjzaO4S9UBaw1lIiimjrcrkWjSYIih50evTHlc7f67tEVQd-uVnAmP4qXAykLXkBvm8MmTdFKvlugNNxn4lkC0YQMSlc2WvK8NgTyzWxEYQ'
    },
    {
        id: 371,
        description: 'Drekki est un jeu de bluff et de prise de risque où les joueurs doivent deviner la somme des cartes jouées pour éviter les brûlures du dragon.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=eW5ZrilhSfWS1OLrSQuEIB5aM7oUNdp_TUvApJ-OslahsUAPgfmNvQ52WEqRyOwMfcfeKBWp3gxxLRHfbRAovXj2k8bflY9qpuS1Gf8SmE3x'
    },
    {
        id: 372,
        description: 'Troll & Dragon est un jeu de dés "stop ou encore" où les joueurs collectent des trésors tout en évitant de réveiller les monstres.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=QV-BV7Gwqv4QRpyKh0LKfsPYEmccIThZEiPmzzlkBF5Oes50jnESXNRVRtLKrU9lNrwEcvR-uulckT3rRvcGvylxJGz94zAH0oPI4N61YYN7wRtIKUrLEFcAdFCoU82fmKRrJMgo'
    },
    {
        id: 373,
        description: 'Fertility est un jeu de placement de tuiles et de gestion de ressources dans l\'Égypte antique, où l\'on développe sa métropole grâce aux crues du Nil.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=qtIwUcN991XY1F5t3wfIeVOgIVsdhJ7GxRtri54RfOOwZfw--2jTshxsnDHhD8AruScvHgLjDY59amZhoENDLq8XhzkL8oe14XA3L_iwO6Ggqmv-6icPKov1zMWCPaI2JgHHrMQI'
    },
    {
        id: 376,
        description: 'La Belle au Bois Dormant est un jeu de logique et de labyrinthe pour enfants, basé sur le conte classique, avec 60 défis évolutifs.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=92EN5bBxyzIkyY1n3HX5MZEgnzDw0gxA-hp19O-_7_sOQ0ZWIKKzTPmt7PFV5ME_N1afVjSfMFiiCf8PSgWKCrriEbCQOhihXF-CTs6Y4pkHWfEl0DU1_nxLAYXk036SpAOL2aIQ'
    },
    {
        id: 377,
        description: 'Just One est un jeu coopératif d\'ambiance où les joueurs écrivent un indice pour faire deviner un mot mystère, mais les indices identiques s\'annulent.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=v6BzJO9tlYP3nk01BfkpHffJXyoIS1ItNcnSpRmHY6I7xNmzB-t0BzQxtekspx42r56fqNmPYL8JFnjQQQfdYmsBEe8yyvtRC2A8KDo'
    },
    {
        id: 378,
        description: 'Concept Kids Animaux est une version coopérative du jeu Concept adaptée aux enfants, pour faire deviner des animaux à l\'aide d\'icônes.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=128lruoEMuXhPeWYl-dpAwKnCGrKCOcQ7E0ksj5BhAkYLJj3GWkXheygFP4bM9ghdjOKfgoFv-9RbYYyc3-grRxEq-BmiRCEikdz9WcFmAmpANcqvNdt6cXypkVj8O2LgrOSLGWQ'
    },
    {
        id: 379,
        description: '7 Wonders Armada est une extension pour 7 Wonders ajoutant un plateau naval et de nouvelles interactions maritimes.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=A9KF-tdSDx7xhY3WqNyDtk7adkSzXKjHwc-6etXEvBt4vaBXpTSYtTb8mZVmCbTo'
    },
    {
        id: 380,
        description: 'Dany est un jeu de déduction, de bluff et de communication où des personnalités cherchent à exister dans la tête de Dany.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=bpQ-jZbxv22P2L3WplTh-qvcKX_7t6uJTmvdZbkhsxpzwzKQv6kYkYExZfX4Ar-fO9w3l8avwTFzh4NGe69tvuWuLgY4qSDqqrQNxuw7AvkJzA1RH2SrkJ4zYqVcw6JLzUh'
    },
    {
        id: 381,
        description: 'Manhattan est un jeu de majorité et de construction où les joueurs érigent des gratte-ciel pour contrôler les quartiers de la ville.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=dLQOBhoILvkzVIyQ1QkULR63lQGE-GbqhLP829NrdhJgaBKctoI-dKoRMn3K2Xzp4FsKHfdQEqoD46dOYVHjALjVBuXS9ooC8rxQ9pXyOP28RNdnK4HX-vvm2bXyb81kBSvBj2A'
    },
    {
        id: 382,
        description: 'Gamme de jeux L\'école des loisirs : Des jeux de société inspirés des héros et univers des livres jeunesse de la célèbre maison d\'édition.'
    },
    {
        id: 383,
        description: 'Speed Colors est un jeu de mémoire et de coloriage rapide où il faut mémoriser les couleurs d\'une image puis les reproduire au feutre.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=_NdAeIJeZzR12Sbe49A9nxujEXwftUUVja4vgokc_de1wNq7tS5C8kQWwhPfHB'
    },
    {
        id: 384,
        description: 'Abra Kazam est un jeu d\'ambiance où les joueurs doivent mimer des sortilèges avec une baguette magique pour les faire deviner.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=sNNNhjB33C0U5Dhb2-_Ii70Jt1pFhNTooN4w9cyJVGemW2zeOQRhy7bcxCbdoA4uKfxdSMMXcntxOZ4mBkiekCr2bCbbD7dLxqCQp9ye9Ttu4_RwsHOb'
    },
    {
        id: 385,
        description: 'Cerbère est un jeu semi-coopératif de course-poursuite où les joueurs tentent d\'échapper aux Enfers, quitte à trahir leurs compagnons.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=ehxCdvSTkoY4fQ0M1SfQcR99eMbytm-Vs1nxR4Ft4xu5Zszh3eA102_SwoIHWijDM6o5J7XahIXSc8aa35UUdhbXk-yNoTYwOYdsIbHDp1YWV5oiF_C3PFDKUAO1thq3CJmxUZOY'
    },
    {
        id: 386,
        description: 'Honga est un jeu de gestion de ressources et de tactique où l\'on doit s\'occuper du tigre à dents de sabre tout en développant son clan.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=nC8fNsXnGsvQUYKGViylP3-8ingyECrj_-UHsGa5rcUP1pXMvrvhnF2bUwr6FdajStpZbGcaq1BIgy5pUC6Cua1tgdRHwIVge'
    },
    {
        id: 387,
        description: 'Mountains est un jeu de mémoire et de prise de risque où les joueurs préparent leur équipement pour gravir des sommets.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=0jdDP95iip0ECX6F_7hBw2LMZnpIWfar5qi5lhDKKhTsKcwdR_OhllvP-cBMZWct-LPsAOQvtGsAngZPskkXGs6vmqdRANEAQA'
    },
    {
        id: 388,
        description: 'Slide Quest est un jeu coopératif d\'adresse où les joueurs guident ensemble un chevalier à roulette à travers des niveaux piégés en inclinant le plateau.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=12-sNDV39z4'
    },
    {
        id: 389,
        description: 'Beta Bots est un jeu de cartes et d\'enchères où les joueurs construisent et améliorent des robots pour accomplir des missions.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=a1TCZAkoWRnzjHxLdWPKcqOSS75Px2QRDRqAaeQzjohu0rEJOP0Scq_Z8xM_tbBzbwYkMfDmNPjALha9rAA-3l7e-T7JxuMF4YEUolgrbtz_z1N6_xYC8Cd-cv_cqZpRwcpOfKA'
    },
    {
        id: 390,
        description: 'Sherlock Express est un jeu de déduction rapide où les joueurs doivent innocenter des suspects pour trouver le coupable.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=Nu8kNoSF8OfgkuoT1XeXi_wrOPocZyDPpXtL0x81i0ndLhWT-gSNTsGXbx6fGRj0vJ0-_EQoXFX5cbTgMneafjYwutl-aKEDHMOntpk6iz5KWlsKy1aYdeFalWq1-eLi6B7jnxA'
    },
    {
        id: 391,
        description: 'Dice Academy est un jeu de dés et de rapidité façon "petit bac" où il faut associer un thème et une lettre.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=lOVRgT5XmyTItK4enCnB__Y3g0G3ZVOes-vJBbhbTOWE5KC7Gj5Jt4rvblHmsyCJHuQvs-LsyZCUtjnXdCFyvmZZ0wVPaylN1mf2Riy5kV4RDqtUOX0iHyipK2z779WIXMhmzJIg'
    },
    {
        id: 392,
        description: 'King Domino Age of Giants est une extension ajoutant des géants qui écrasent les couronnes et des objectifs de fin de partie.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=xjAL1VXqqXu3wUKQeiS26RnSGmxt-i8vR213240J-ke3i1ZMupnh6R-JoAbEoc9z8v2ZFq7QiDq9Q2pARB7TT7pL9scMPf8Vs-SzJ-WgBO1n99CnsStRP65wEsJUhPmH50gOIRBs'
    },
    {
        id: 393,
        description: 'Kuala est un jeu d\'aventure coopératif dont vous êtes le héros, où chaque joueur suit l\'histoire dans sa propre BD.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=PJPMjPedb4fIFdF6VHv5TU6XAKF_xk1lzBd-_jMn7N82vjwWm4VmCJ2C7TKWAWGcjZF7cdpTU9pFHbktx3CNTJZWO5a0hYcCvcXvaSMesbRuYZYIxL6wVwtgDe6U3KUktw9z4M8Y'
    },
    {
        id: 394,
        description: 'Mr Wolf est un jeu coopératif de mémoire pour enfants où l\'on doit cacher les animaux de la ferme avant que le loup n\'arrive.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=GxG2mz9xSYTjhdhMBIhHZAzshUOjhS3XzIw1hdlIUO0T1N_H5PlUxW2_eMA8-vCdHSAwXPBX0e6ByRfX4VEEoVcwr8X38ykfav96SczNppZDE9g5sF73e0n9d3RrPE6UwipzPJjJg'
    },
    {
        id: 395,
        description: 'Oh my Gold! est un jeu de dés de pirates où l\'on doit ouvrir des coffres et sécuriser des trésors.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=EuppoPTIy4-Twt1GJ-FDwhqUUrWtroUuIBLECEJ7ueMhH2jnnRm9tzyfKoIcZK2CYjqrzy3TTg1HAerzVEWBDtBDKlQifufOih0Xvpt-vs415udb7eXd_twDqbYBFQJS_-6ECSQ'
    },
    {
        id: 396,
        description: 'Boss Quest est un jeu de bluff et de pari où les joueurs, en tant que héros, tentent d\'infliger juste assez de dégâts au boss.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=U33btn2-w7ED1hzviKGiHHyd6wvfS9iFS0gQFfobSzNDNjxNPdm4b2di4HWgL9zfDtiuOMV6XOxhKZbph37Js55thoif14c3UzmOfCwy-hGyT9hGlnTpVpV6xgaCSoDJ98MncAzg'
    },
    {
        id: 397,
        description: 'Clank ! est un jeu de deck-building et d\'exploration de donjon où faire du bruit attire l\'attention du dragon.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=EnwU0Jfm2ZMOwNrKkLI1Rq4Ze5WubJ2kWexkuM8IyvHZ7NrWIvmJqE2Q5onGNw0hibexMMSzC1qDcs8ko6I11_vofPoMYbtlw5jMq4X1DqfYmREMY1htK5YaHQgqkg_-ddKB8ZOQ'
    },
    {
        id: 398,
        description: 'Passages Secrets est un jeu de stratégie où l\'on place des tuiles pour créer des chemins souterrains et récupérer des trésors.'
    },
    {
        id: 399,
        description: 'Clank ! Dans l\'espace ! est une version futuriste de Clank! où les joueurs cambriolent le vaisseau du Seigneur Eradikus.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=GiFPUaEB6Qkt5bA-uWqM4FA6kr4m83ovtHB_LiuIn0YHY-SfGGgFhWM5m6XSgFPP_dQiIGbTfpHd69dF4C9nIwin25j98HN9TbZL7q8ISRYj36rQY0lZAfSf0jWpJ_R4xL5NV95W0'
    },
    {
        id: 400,
        description: 'FlipShips est un jeu coopératif d\'adresse où les joueurs propulsent des vaisseaux (jetons) pour détruire les ennemis envahisseurs.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=aM-kPi5e-ttkWHeCLf9NUBfd0V9vwIRnOo11do8vjpy6Brhst53AiDX9xz_lsaOiiSa48GaCYwkvaY-0azrpg-2KZxvLwOuoHwBZdYPEQFNxsGCoCnzE9bz_NZ_Lsw_zFX16al_D7'
    },
    {
        id: 401,
        description: 'Gunkimono est un jeu de placement de tuiles et de majorité où les joueurs étendent leur influence militaire au Japon féodal.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=FUOJ4k7yu0Pibu4zX14x5ZxC0Jcdzpmtyt1p6Rwtbz0P3RLjHa5opbo5E9L2fcPCdXbHIF3iYbW_MLbL2WEF2ZtV5TF2AAo-ARJCJ8BxmXKTdxvKwtfQwfsLXPzVQuF_rvoKfjJQ'
    },
    {
        id: 402,
        description: 'Le Renard des Bois est un jeu de pli tactique pour deux joueurs inspiré des contes de fées, avec des cartes aux effets spéciaux.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=092w7gSfVRzVxs5YTGEus6yAuVWYKMIoOW3q--Weo31_kN0eGgDKk4Cpfnmc7tDxZNUcoJKxjgNaL0VynMP5vAZNRW-AC0kd4UUb320g6Ky6DaDhFKhup5lDSRlFo5l5HFvMuI4E'
    },
    {
        id: 403,
        description: 'L\'Auberge des Pirates est un jeu de bluff et de prise de risque où les joueurs doivent éviter d\'avoir des paires de cartes identiques.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=FRlG78872SMPm9N3WuxGlKd0_afrx3XuYLYY1BOTi1uQhl8-0ioo9aeAGXjKO19tUZrWhz1voQmB9HNwEgv0KEB4LZeibsvzocB30TaRa9pmTbf_N4JeIvifGSJrRVc1W7LB3HOc'
    },
    {
        id: 404,
        description: 'Pandai est un jeu d\'exploration familial où les joueurs déplacent des pandas pour faire naître des bébés tout en évitant les tigres.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=HXNR8xhNeledQu1DDdgbb09mmlfWznARjcBccivQ3JdlqmEjNlIMhcuGOteNDYGgHPJxREw8B7RiLx6W0PLMdPkdVUmc8omkUAe8mshm_eddrYaFY7Op88tIyYemXTrux0MEWpEVE'
    },
    {
        id: 405,
        description: 'Chapito est un jeu d\'adresse et de construction où les joueurs empilent des acrobates en bois pour réaliser des figures imposées.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=FoBRi_Khgdd1php36E89ZMFlthnYzkkqd4EmqK76KNsJc1wb1PzNESj63OhJmgsltBcL8M_zboJcPVNRxJ7hqif5tWA6j4mg4XRgPO8N7MKE98msvBAAn3wZ-d23KKsilJRI_l_SE'
    },
    {
        id: 406,
        description: 'Squadro est un jeu abstrait de stratégie en bois où l\'on doit traverser le plateau avec ses pièces en bloquant celles de l\'adversaire.',
        rulesVideoUrl: 'https://www.youtube.com/watch?v=xMoKuwaTp91Rtdeg8g8wkbSLZyqQ5DGgmLsel5MoG5gOhuUIskpvfVq9L27syVee2Pxrb18rumvPwXgLpKpE26npjJBR-eNflRpLsiKcoL9fSZpXGWaiMzKdubc-mVSgtQLJ0Aw'
    }
];
