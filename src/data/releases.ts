import type { ReleaseEntry, ReleaseKind } from './types';

type Details = Omit<ReleaseEntry, 'id' | 'character' | 'kind' | 'name'>;

function entry(character: string, kind: ReleaseKind, name: string, details: Details): ReleaseEntry {
  const slug = kind
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '-');
  return { id: `${character}:${slug}`, character, kind, name, ...details };
}

const shikai = (c: string, name: string, d: Details) => entry(c, 'Shikai', name, d);
const bankai = (c: string, name: string, d: Details) => entry(c, 'Bankai', name, d);
const resurreccion = (c: string, name: string, d: Details) => entry(c, 'Resurrección', name, d);
const schrift = (c: string, letter: string, epithet: string, d: Omit<Details, 'letter'>) =>
  entry(c, 'Schrift', epithet, { ...d, letter });
const fullbring = (c: string, name: string, d: Details) => entry(c, 'Fullbring', name, d);
const doll = (c: string, name: string, d: Details) => entry(c, 'Bount Doll', name, d);
const power = (c: string, name: string, d: Details) => entry(c, 'Power', name, d);

/**
 * Release mode clues. Each entry becomes a ladder: the opener (release
 * command, or the name's meaning), then the ability, then a masked name, then
 * an extra clue — one step every few wrong guesses.
 */
export const RELEASES: ReleaseEntry[] = [
  // — Shikai ——————————————————————————————————————————————————————————
  shikai('ichigo-kurosaki', 'Zangetsu', {
    meaning: 'Slaying Moon',
    ability:
      'A guardless, always-released cleaver as tall as its wielder, famous for firing crescents of energy.',
    extra: 'Signature move: Getsuga Tenshō',
  }),
  shikai('rukia-kuchiki', 'Sode no Shirayuki', {
    command: 'Dance',
    meaning: 'Sleeve of White Snow',
    ability: 'A pure-white blade trailing a ribbon; its "dances" freeze everything within a circle of ice.',
    extra: 'Said to be the most beautiful ice-type Zanpakutō in Soul Society',
  }),
  shikai('renji-abarai', 'Zabimaru', {
    command: 'Howl',
    meaning: 'Snake Tail',
    ability: 'A segmented blade that lashes out like a whip, its jagged sections linked by reiatsu.',
    extra: 'Its spirit is a baboon and a snake chained together',
  }),
  shikai('byakuya-kuchiki', 'Senbonzakura', {
    command: 'Scatter',
    meaning: 'Thousand Cherry Blossoms',
    ability: 'The blade disperses into countless tiny petal-like blades that shred whatever they surround.',
    extra: 'Bankai: Senbonzakura Kageyoshi',
  }),
  shikai('toshiro-hitsugaya', 'Hyōrinmaru', {
    command: 'Sit upon the frosted heavens',
    meaning: 'Ice Ring',
    ability: 'A chained blade that summons a dragon of water and ice — the strongest ice-type Zanpakutō.',
    extra: 'Bankai: Daiguren Hyōrinmaru',
  }),
  shikai('rangiku-matsumoto', 'Haineko', {
    command: 'Growl',
    meaning: 'Ash Cat',
    ability: 'The blade dissolves into a cloud of ash that slices anything it settles on.',
  }),
  shikai('momo-hinamori', 'Tobiume', {
    command: 'Snap',
    meaning: 'Flying Plum Tree',
    ability: 'A blade that sprouts branching prongs and launches explosive fireballs.',
  }),
  shikai('izuru-kira', 'Wabisuke', {
    command: 'Raise your head',
    meaning: 'The Wretched One',
    ability: 'A square-hooked blade that doubles the weight of anything it strikes, forcing foes to bow.',
  }),
  shikai('shuhei-hisagi', 'Kazeshini', {
    command: 'Reap',
    meaning: 'Wind Death',
    ability: 'Two chained, double-bladed sickles that spin unpredictably — a shape built for taking lives.',
  }),
  shikai('ikkaku-madarame', 'Hōzukimaru', {
    command: 'Extend',
    meaning: 'Demon Lantern',
    ability: 'A spear that splits into a three-section staff for unpredictable, whirling strikes.',
    extra: 'Bankai: Ryūmon Hōzukimaru',
  }),
  shikai('yumichika-ayasegawa', 'Fuji Kujaku', {
    command: 'Bloom',
    meaning: 'Wisteria Peacock',
    ability: 'A four-bladed sickle that hides its true nature: a Kidō-type blade whose vines drain reiatsu.',
    extra: "True name: Ruri'iro Kujaku",
  }),
  shikai('kenpachi-zaraki', 'Nozarashi', {
    command: 'Drink',
    meaning: 'Exposed to the Elements',
    ability: 'A notched blade that becomes a colossal cleaver able to cut through almost anything.',
    extra: 'Its name was unknown to its wielder for most of his life',
  }),
  shikai('marechiyo-omaeda', 'Gegetsuburi', {
    command: 'Crush',
    meaning: 'Five-Shaped Head',
    ability: 'A spiked iron ball on a chain — a flail as blunt as its owner.',
  }),
  shikai('soi-fon', 'Suzumebachi', {
    command: 'Sting all enemies to death',
    meaning: 'Hornet',
    ability: 'A golden stinger worn on the middle finger; strike the same spot twice and the target dies.',
    extra: 'Bankai: Jakuhō Raikōben',
  }),
  shikai('sajin-komamura', 'Tenken', {
    command: 'Roar',
    meaning: "Heaven's Punishment",
    ability: 'Summons the gigantic arm and blade of an unseen giant that mirror his every swing.',
    extra: "Bankai: Kokujō Tengen Myō'ō",
  }),
  shikai('mayuri-kurotsuchi', 'Ashisogi Jizō', {
    command: 'Rip',
    meaning: 'Leg-Cutting Jizō',
    ability: "A trident topped with a baby's face whose poison paralyzes the limbs but leaves the pain.",
    extra: 'Bankai: Konjiki Ashisogi Jizō',
  }),
  shikai('jushiro-ukitake', 'Sōgyo no Kotowari', {
    command: 'All waves, rise now and become my shield; lightning, strike now and become my blade',
    meaning: 'Twin Fish Principle',
    ability: 'Twin blades joined by a rope of talismans: one absorbs an attack, the other fires it back.',
  }),
  shikai('shunsui-kyoraku', 'Katen Kyōkotsu', {
    command:
      'When the flower wind rages, the flower god roars; when the heavenly wind rages, the heavenly demon sneers',
    meaning: 'Flowered Heaven, Crazed Bone',
    ability: "Twin blades that turn children's games into real rules binding both fighters.",
    extra: 'Bankai: Katen Kyōkotsu: Karamatsu Shinjū',
  }),
  shikai('genryusai-yamamoto', 'Ryūjin Jakka', {
    command: 'Reduce all creation to ash',
    meaning: 'Flowing Blade Like Fire',
    ability: 'The oldest and most powerful fire-type Zanpakutō, engulfing everything in flame.',
    extra: 'Bankai: Zanka no Tachi',
  }),
  shikai('chojiro-sasakibe', 'Gonryōmaru', {
    ability: 'A slender, rapier-like blade that channels lightning.',
    extra: 'Bankai: Kōkō Gonryō Rikyū',
  }),
  shikai('gin-ichimaru', 'Shinsō', {
    command: 'Shoot to kill',
    meaning: 'God Spear',
    ability: 'A short wakizashi that extends at blinding speed to skewer targets at great distances.',
    extra: 'Bankai: Kamishini no Yari',
  }),
  shikai('sosuke-aizen', 'Kyōka Suigetsu', {
    command: 'Shatter',
    meaning: 'Mirror Flower, Water Moon',
    ability: 'Anyone who witnesses its release falls under perfect hypnosis that controls all five senses.',
  }),
  shikai('kaname-tosen', 'Suzumushi', {
    command: 'Cry',
    meaning: 'Bell Cricket',
    ability: 'A ring-hilted blade whose high-pitched hum knocks out anyone who hears it.',
    extra: 'Bankai: Suzumushi Tsuishiki: Enma Kōrogi',
  }),
  shikai('shinji-hirako', 'Sakanade', {
    command: 'Collapse',
    meaning: 'Inverted Stroke',
    ability:
      'A ring-hilted blade whose scent reverses its targets’ sense of up, down, left, right — and sight.',
    extra: 'Welcome to the inverted world',
  }),
  shikai('rojuro-otoribashi', 'Kinshara', {
    command: 'Play',
    meaning: 'Golden Sāla Tree',
    ability: 'A whip-like blade with a golden, flower-tipped lash; every swing is a note in a symphony.',
    extra: 'Bankai: Kinshara Butōdan',
  }),
  shikai('kensei-muguruma', 'Tachikaze', {
    command: 'Blow it away',
    meaning: 'Cutting Wind',
    ability: 'A combat knife that fires invisible, slicing wind with every swing and punch.',
    extra: 'Bankai: Tekken Tachikaze',
  }),
  shikai('kaien-shiba', 'Nejibana', {
    command: 'Rage over the seas and skies',
    meaning: 'Twisted Flower',
    ability: 'A trident-headed spear that controls water, adding the crash of the tides to every strike.',
  }),
  shikai('kisuke-urahara', 'Benihime', {
    command: 'Awaken',
    meaning: 'Crimson Princess',
    ability: 'A cane-sword that unleashes slicing crimson blasts and nets of red reiatsu.',
    extra: 'Bankai: Kannonbiraki Benihime Aratame',
  }),
  shikai('hiyori-sarugaki', 'Kubikiri Orochi', {
    meaning: 'Beheading Great Serpent',
    ability: 'A huge, serrated cleaver that saws through anything it hits.',
  }),
  shikai('love-aikawa', 'Tengumaru', {
    meaning: 'Long-Nosed Goblin',
    ability: 'A colossal spiked club that can burst into flame.',
  }),
  shikai('maki-ichinose', 'Nijigasumi', {
    meaning: 'Rainbow Mist',
    ability: 'A blade that bends light — blinding its targets and rendering its wielder invisible.',
  }),
  shikai('shusuke-amagai', 'Raika', {
    command: 'Sever',
    meaning: 'Thunder Fire',
    ability: 'A fire-type blade, drawn upside down, that engulfs its targets in roaring flame.',
  }),
  shikai('kenryu', 'Benishidare', {
    ability: 'Its release smothers enemy blades in roses that dull and bind their edges.',
  }),
  shikai('koga-kuchiki', 'Muramasa', {
    command: 'Whisper',
    ability:
      'A blade whose spirit whispers to other Zanpakutō, freeing them from — and turning them against — their masters.',
  }),
  // — Bankai ——————————————————————————————————————————————————————————
  bankai('ichigo-kurosaki', 'Tensa Zangetsu', {
    meaning: 'Heaven Chain Slaying Moon',
    ability: 'Compresses immense power into a slim black blade and coat, granting blinding speed.',
    extra: 'Its final form is Mugetsu',
  }),
  bankai('byakuya-kuchiki', 'Senbonzakura Kageyoshi', {
    meaning: 'Thousand Cherry Blossoms, Vibrant Display',
    ability: 'A thousand giant blades rise from the ground and scatter into a hundred million petals.',
    extra: 'Shikai: Senbonzakura',
  }),
  bankai('renji-abarai', 'Hihiō Zabimaru', {
    meaning: 'Baboon King Snake Tail',
    ability: "A gigantic skeletal serpent with a baboon's skull that fires a blast of reiatsu from its jaws.",
    extra: 'Its true form is Sōō Zabimaru',
  }),
  bankai('toshiro-hitsugaya', 'Daiguren Hyōrinmaru', {
    meaning: 'Great Crimson Lotus Ice Ring',
    ability: 'Wings and a tail of ice; petals of ice behind him count down how long it can hold.',
    extra: 'Shikai: Hyōrinmaru',
  }),
  bankai('genryusai-yamamoto', 'Zanka no Tachi', {
    meaning: 'Blade of the Remaining Flame',
    ability: 'Condenses every flame into the blade itself — hot enough to erase anything it touches.',
    extra: 'Shikai: Ryūjin Jakka',
  }),
  bankai('sajin-komamura', "Kokujō Tengen Myō'ō", {
    meaning: 'Black Rope Heavenly Mirror Wisdom King',
    ability: 'Summons a colossal armored giant that mirrors his movements — and shares his wounds.',
    extra: 'Shikai: Tenken',
  }),
  bankai('soi-fon', 'Jakuhō Raikōben', {
    meaning: 'Hornet Thunder Public Whip',
    ability: 'A massive golden missile launcher strapped to the arm, firing one devastating shot.',
    extra: 'Shikai: Suzumebachi',
  }),
  bankai('mayuri-kurotsuchi', 'Konjiki Ashisogi Jizō', {
    meaning: 'Golden Leg-Cutting Jizō',
    ability: "A colossal caterpillar-bodied creature with a baby's head that exhales deadly poison.",
    extra: 'Shikai: Ashisogi Jizō',
  }),
  bankai('gin-ichimaru', 'Kamishini no Yari', {
    meaning: 'God-Killing Spear',
    ability:
      'Extends to thirteen kilometers at incredible speed — and can leave a cell-dissolving poison behind.',
    extra: 'Shikai: Shinsō',
  }),
  bankai('rukia-kuchiki', 'Hakka no Togame', {
    meaning: 'White Haze Censure',
    ability: 'Freezes everything around her — her own body included — to absolute zero.',
    extra: 'Shikai: Sode no Shirayuki',
  }),
  bankai('kaname-tosen', 'Suzumushi Tsuishiki: Enma Kōrogi', {
    meaning: 'Bell Cricket, Final Form: Cricket of the King of Hell',
    ability: 'A dome that steals sight, sound, smell and spiritual sense from everyone inside — except him.',
    extra: 'Shikai: Suzumushi',
  }),
  bankai('shunsui-kyoraku', 'Katen Kyōkotsu: Karamatsu Shinjū', {
    meaning: 'Flowered Heaven, Crazed Bone: Black Pine Lovers’ Suicide',
    ability:
      'A tragedy in four acts that drags both fighters through its scenes — and the doom it foretells.',
    extra: 'Shikai: Katen Kyōkotsu',
  }),
  bankai('ikkaku-madarame', 'Ryūmon Hōzukimaru', {
    meaning: 'Dragon Crest Demon Lantern',
    ability: 'Three huge blades on chains whose dragon crest glows red as the battle heats up.',
    extra: 'Shikai: Hōzukimaru',
  }),
  bankai('shinji-hirako', 'Sakashima Yokoshima Happō Fusagari', {
    meaning: 'Upside-Down Evil, Blocked in Eight Directions',
    ability: "Turns everyone nearby into each other's enemies — friend and foe alike.",
    extra: 'Shikai: Sakanade',
  }),
  bankai('kisuke-urahara', 'Kannonbiraki Benihime Aratame', {
    meaning: 'Goddess-Opening Crimson Princess, Remade',
    ability: 'A towering, doll-like figure that "remakes" anything it touches — even wounds.',
    extra: 'Shikai: Benihime',
  }),
  bankai('rojuro-otoribashi', 'Kinshara Butōdan', {
    meaning: 'Golden Sāla Dance Troupe',
    ability: 'Stages an opera whose sounds become real attacks — but only for those who can hear it.',
    extra: 'Shikai: Kinshara',
  }),
  bankai('kensei-muguruma', 'Tekken Tachikaze', {
    meaning: 'Iron Fist Cutting Wind',
    ability: 'Knuckle-blades wrapped in wind that turn every punch into a devastating shockwave.',
    extra: 'Shikai: Tachikaze',
  }),
  // — Resurrección —————————————————————————————————————————————————————
  resurreccion('grimmjow-jaegerjaquez', 'Pantera', {
    command: 'Grind',
    meaning: 'Panther',
    ability: 'Becomes a sleek, panther-like warrior with long hair, claws, a tail and ripping Desgarrón.',
  }),
  resurreccion('ulquiorra-cifer', 'Murciélago', {
    command: 'Enclose',
    meaning: 'Bat',
    ability: 'Grows black wings and spears of green light — with a second, demonic release beyond it.',
    extra: 'Resurrección: Segunda Etapa',
  }),
  resurreccion('nnoitra-gilga', 'Santa Teresa', {
    command: 'Pray',
    meaning: 'Saint Teresa',
    ability: 'Sprouts six arms, each wielding a crescent-shaped scythe.',
  }),
  resurreccion('szayelaporro-granz', 'Fornicarás', {
    command: 'Sip',
    ability: 'Sprouts tentacle wings that make voodoo dolls of his enemies — down to their organs.',
  }),
  resurreccion('coyote-starrk', 'Los Lobos', {
    command: 'Kick about',
    meaning: 'The Wolves',
    ability:
      'Merges with his other half into twin pistols that fire endless Cero and packs of exploding wolves.',
  }),
  resurreccion('barragan-louisenbairn', 'Arrogante', {
    command: 'Rot',
    meaning: 'Arrogant',
    ability: 'Becomes a skeletal king whose breath of death ages anything it touches into dust.',
  }),
  resurreccion('tier-harribel', 'Tiburón', {
    command: 'Destroy',
    meaning: 'Shark',
    ability: 'Wields a sword of high-pressure water and can summon tidal waves.',
  }),
  resurreccion('zommari-rureaux', 'Brujería', {
    meaning: 'Witchcraft',
    ability: 'His body sprouts dozens of eyes; whatever they mark falls under his control.',
  }),
  resurreccion('aaroniero-arruruerie', 'Glotonería', {
    command: 'Devour',
    meaning: 'Gluttony',
    ability: 'A massive, octopus-like body that unleashes the powers of every Hollow he has eaten.',
  }),
  resurreccion('yammy-llargo', 'Ira', {
    command: 'Enrage',
    meaning: 'Rage',
    ability: 'Swells into a colossal, many-limbed beast — the true Cero Espada.',
  }),
  resurreccion('nelliel-tu-odelschwanck', 'Gamuza', {
    command: 'Declare',
    meaning: 'Chamois',
    ability: 'Becomes a centaur-like knight wielding a double-headed lance.',
  }),
  resurreccion('luppi-antenor', 'Trepadora', {
    command: 'Strangle',
    meaning: 'Creeper',
    ability: 'Grows eight tentacles that strike and constrict from every direction.',
  }),
  resurreccion('dordoni-del-socaccio', 'Giralda', {
    command: 'Whirl',
    meaning: 'Weathervane',
    ability: 'Whips up twin tornadoes shaped like the heads of great birds.',
  }),
  resurreccion('cirucci-sanderwicci', 'Golondrina', {
    command: 'Tear apart',
    meaning: 'Swallow',
    ability: 'Grows huge wings of razor-edged feathers she can launch like blades.',
  }),
  resurreccion('ggio-vega', 'Tigre Estoque', {
    command: 'Bite off',
    meaning: 'Tiger Estoc',
    ability: 'Becomes a saber-toothed tiger warrior with blades along his arms.',
  }),
  resurreccion('emilou-apacci', 'Cierva', {
    command: 'Gore',
    meaning: 'Doe',
    ability: 'Grows hooves and a horn, and hurls ring-shaped blades.',
  }),
  resurreccion('cyan-sung-sun', 'Anaconda', {
    command: 'Strangle',
    meaning: 'Anaconda',
    ability: 'Her legs become a long serpent’s tail, and her venom and regeneration make her a slippery foe.',
  }),
  resurreccion('franceska-mila-rose', 'Leona', {
    meaning: 'Lioness',
    ability: 'Becomes a lioness warrior with a wild mane and a massive broadsword.',
  }),
  resurreccion('shawlong-kufang', 'Tijereta', {
    meaning: 'Earwig',
    ability: 'Grows long, claw-like blades from his fingers that can slice through steel.',
  }),
  resurreccion('edrad-liones', 'Volcánica', {
    command: 'Erupt',
    meaning: 'Volcanic',
    ability: 'Encases him in volcanic armor and fires explosive blasts of flame.',
  }),
  resurreccion('yylfordt-granz', 'Toro Embestida', {
    meaning: 'Charging Bull',
    ability: 'Transforms him into a horned, bull-like warrior who charges through anything.',
  }),
  resurreccion('tesla-lindocruz', 'Verdugo', {
    meaning: 'Executioner',
    ability: 'Becomes a towering, boar-like beast of immense brute strength.',
  }),
  resurreccion('wonderweiss-margela', 'Extinguir', {
    meaning: 'Extinguish',
    ability: 'Engineered to swallow flame itself — built to seal away the Captain-Commander’s fire.',
  }),
  resurreccion('findor-carias', 'Pinza Aguda', {
    meaning: 'Sharp Pincer',
    ability: 'Transforms his arms into massive crab-like pincers.',
  }),
  resurreccion('charlotte-chuhlhourne', 'Bruja', {
    meaning: 'Witch',
    ability: 'Becomes a flamboyant witch who traps foes inside a mirrored garden of roses.',
  }),
  resurreccion('abirama-redder', 'Águila', {
    meaning: 'Eagle',
    ability: 'Sprouts eagle wings and fires a storm of feather darts.',
  }),
  // — Schrift ——————————————————————————————————————————————————————————
  schrift('yhwach', 'A', 'The Almighty', {
    ability:
      'Sees every possible future and can rewrite it — and can grant or reclaim power from every Quincy.',
  }),
  schrift('uryu-ishida', 'A', 'The Antithesis', {
    ability: 'Reverses what has happened between two points: wounds become health, health becomes wounds.',
  }),
  schrift('jugram-haschwalth', 'B', 'The Balance', {
    ability: 'Redirects misfortune: any harm that befalls him is passed on to his opponent.',
    extra: 'Vollständig: Freund Schild',
  }),
  schrift('pernida-parnkgjas', 'C', 'The Compulsory', {
    ability: 'Nerves that burrow into a target and seize control of their limbs.',
  }),
  schrift('askin-nakk-le-vaar', 'D', 'The Deathdealing', {
    ability: 'Sets a lethal dose of anything — and grows immune to whatever nearly killed him.',
  }),
  schrift('bambietta-basterbine', 'E', 'The Explode', {
    ability: 'Anything her reishi touches becomes a bomb.',
  }),
  schrift('as-nodt', 'F', 'The Fear', {
    ability: 'Thorns that inject pure, paralyzing terror into anyone they pierce.',
    extra: 'Vollständig: Tatarforas',
  }),
  schrift('liltotto-lamperd', 'G', 'The Glutton', {
    ability: 'A mouth that stretches wide enough to devour anything — or anyone.',
  }),
  schrift('bazz-b', 'H', 'The Heat', {
    ability: 'Fingertips that fire searing columns of flame.',
  }),
  schrift('cang-du', 'I', 'The Iron', {
    ability: 'Skin that turns as hard as iron — tough enough to block a Bankai.',
  }),
  schrift('quilge-opie', 'J', 'The Jail', {
    ability: 'Seals an opponent inside an inescapable cage of light.',
    extra: 'Vollständig: Biskiel',
  }),
  schrift('pepe-waccabrada', 'L', 'The Love', {
    ability: 'Heart-shaped beams that turn their targets into adoring slaves.',
  }),
  schrift('gerard-valkyrie', 'M', 'The Miracle', {
    ability: 'The more he is wounded, the larger and stronger he becomes.',
  }),
  schrift('driscoll-berci', 'O', 'The Overkill', {
    ability: 'Grows stronger with every enemy he kills.',
  }),
  schrift('meninas-mcallon', 'P', 'The Power', {
    ability: 'Monstrous physical strength.',
  }),
  schrift('berenice-gabrielli', 'Q', 'The Question', {
    ability: 'Makes her opponents doubt everything they say.',
  }),
  schrift('jerome-guizbatt', 'R', 'The Roar', {
    ability: 'Transforms into a giant ape and attacks with shattering roars.',
  }),
  schrift('mask-de-masculine', 'S', 'The Superstar', {
    ability: 'Grows stronger the louder he is cheered on.',
  }),
  schrift('candice-catnipp', 'T', 'The Thunderbolt', {
    ability: 'Hurls bolts of lightning powerful enough to level a battlefield.',
  }),
  schrift('nanana-najahkoop', 'U', 'The Underbelly', {
    ability: "Reads the weak points in an opponent's reiatsu and paralyzes them.",
  }),
  schrift('gremmy-thoumeaux', 'V', 'The Visionary', {
    ability: 'Anything he can imagine becomes real.',
  }),
  schrift('nianzol-weizol', 'W', 'The Wind', {
    ability: 'Bends the trajectory of any attack aimed at him.',
  }),
  schrift('lille-barro', 'X', 'The X-Axis', {
    ability: 'Every shot pierces everything between the muzzle and the target.',
    extra: 'Vollständig: Jilliel',
  }),
  schrift('royd-lloyd', 'Y', 'The Yourself', {
    ability: "Copies a target's appearance — and the elder twin, their memories and personality too.",
  }),
  schrift('giselle-gewelle', 'Z', 'The Zombie', {
    ability: 'Her blood turns anyone, living or dead, into an obedient zombie.',
  }),
  // — Fullbring ————————————————————————————————————————————————————————
  fullbring('kugo-ginjo', 'Cross of Scaffold', {
    ability: 'A cross pendant that becomes a great sword — and can absorb the Fullbring of others.',
  }),
  fullbring('shukuro-tsukishima', 'Book of the End', {
    ability: 'A bookmark that becomes a blade; whatever it cuts gains a past in which he was always there.',
  }),
  fullbring('riruka-dokugamine', 'Dollhouse', {
    ability: 'Shrinks anyone she "permits" and traps them inside an object she loves.',
    extra: 'Her heart-shaped pistol: Love Gun',
  }),
  fullbring('yukio-hans-vorarlberna', 'Invaders Must Die', {
    ability: 'His handheld console traps people inside video-game worlds of his design.',
  }),
  fullbring('giriko-kutsuzawa', 'Time Tells No Lies', {
    ability: 'A pocket watch that binds everyone present to a time-limited contract — break it and die.',
  }),
  fullbring('jackie-tristan', 'Dirty Boots', {
    ability: 'Boots that grow stronger the dirtier she gets.',
  }),
  fullbring('moe-shishigawara', 'Jackpot Knuckle', {
    ability:
      'A ring-knuckle that grants a random power with each punch — sometimes great, sometimes useless.',
  }),
  // — Other powers —————————————————————————————————————————————————————
  power('yasutora-sado', 'Brazo Derecha de Gigante', {
    meaning: 'Right Arm of the Giant',
    ability: 'Armors his right arm in black and red, defending and firing devastating blasts.',
    extra: 'Its partner: Brazo Izquierda del Diablo',
  }),
  power('orihime-inoue', 'Shun Shun Rikka', {
    meaning: 'Shield of the Six Flowers',
    ability: 'Six tiny spirits in her hairpins that shield, heal and attack by "rejecting" events.',
    extra: 'Sōten Kisshun · Santen Kesshun · Koten Zanshun',
  }),
  power('uryu-ishida', 'Ginrei Kojaku', {
    ability: 'A great bow of spirit energy that unleashes a storm of more than a thousand arrows at once.',
    extra: 'His silver blade: Seele Schneider',
  }),
  power('yoruichi-shihoin', 'Shunkō', {
    meaning: 'Flash War Cry',
    ability: 'A fusion of Kidō and hand-to-hand combat that wraps her back and shoulders in lightning.',
    extra: 'Its ultimate form turns her into a thunder beast',
  }),
  power('don-kanonji', 'Kanonji Cannonball', {
    ability: 'A tiny ball of spiritual energy fired with a dramatic pose — and almost no effect.',
  }),
  // — Bount Dolls ——————————————————————————————————————————————————————
  doll('jin-kariya', 'Messer', {
    meaning: 'Knife (German)',
    ability: "A wind doll fused into its master's own body, slicing with razor-sharp gales.",
  }),
  doll('yoshino-soma', 'Goethe', {
    ability: 'A golem of living fire, summoned by striking a claw against her bracelet.',
  }),
  doll('go-koga', 'Dalk', {
    ability: 'A haughty female doll that splits into a swarm of crushing metal spheres.',
  }),
  doll('ryo-utagawa', 'Fried', {
    ability: 'A golden snake doll that sleeps as a pocket watch — and turns objects into snakes.',
  }),
  doll('mabashi', 'Ritz', {
    ability: 'A tiny, flower-dwelling doll that possesses whoever it touches.',
  }),
  doll('ugaki', 'Gesell', {
    ability: 'A doll built for spying and transport, fighting while its master hides.',
  }),
  doll('sawatari', 'Baura', {
    ability: 'A colossal, rock-skinned whale that swallows foes and swims through dimensions.',
  }),
  doll('yoshi', 'Nieder', {
    ability: 'A bickering pair of dolls — a sword and a war fan joined by a chain.',
  }),
];
