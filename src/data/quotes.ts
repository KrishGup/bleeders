import type { ArcId, QuoteEntry } from './types';

let counter = 0;
function q(character: string, arc: ArcId, text: string, context: string): QuoteEntry {
  counter += 1;
  return { id: `${character}:q${counter}`, character, arc, text, context };
}

/**
 * Quote mode lines. Wording follows the common English translations, lightly
 * tightened. Contexts never name the speaker.
 */
export const QUOTES: QuoteEntry[] = [
  q(
    'sosuke-aizen',
    'fake-karakura',
    'Since when were you under the impression that I wasn’t using Kyōka Suigetsu?',
    'Revealing to a battlefield of captains that they had been striking an illusion all along.',
  ),
  q(
    'sosuke-aizen',
    'soul-society',
    'Admiration is the emotion furthest from understanding.',
    'Explaining why a devoted subordinate never truly knew him.',
  ),
  q(
    'sosuke-aizen',
    'soul-society',
    'No one stands on top of the world. Not you, not I, not even gods. But that unbearable vacancy of the throne in the heavens ends now. From now on, I will stand in the heavens.',
    'Ascending into the sky inside a pillar of light above Sōkyoku Hill.',
  ),
  q(
    'sosuke-aizen',
    'soul-society',
    'Don’t use such strong words. It makes you look weak.',
    'To an enraged young captain who swore to kill him.',
  ),
  q(
    'ulquiorra-cifer',
    'hueco-mundo',
    'I see… so this is it. This thing in my hand… is the heart.',
    'Crumbling to ash atop Las Noches, reaching for a human girl’s hand.',
  ),
  q(
    'ulquiorra-cifer',
    'hueco-mundo',
    'The heart — where is it? If I tear open your chest, will I see it? If I crack open your skull, will it be inside?',
    'Interrogating a captive human girl about the thing she keeps calling her “heart”.',
  ),
  q(
    'grimmjow-jaegerjaquez',
    'hueco-mundo',
    'I am the King!',
    'Roaring his supremacy at the substitute Shinigami in the middle of a duel in Hueco Mundo.',
  ),
  q(
    'kenpachi-zaraki',
    'soul-society',
    'This eyepatch eats my spiritual power. I wear it so I can enjoy a fight a little longer.',
    'Explaining his eyepatch to an intruder in the middle of a duel.',
  ),
  q(
    'mayuri-kurotsuchi',
    'hueco-mundo',
    'I loathe perfection. Once something is perfect, there is nothing beyond it — no room for creativity, no room for imagination. For a scientist, perfection is despair.',
    'Lecturing an Espada scientist who proclaimed himself a perfect being.',
  ),
  q(
    'kisuke-urahara',
    'substitute',
    'Come at me with the intent to kill. Otherwise you won’t be able to protect anyone.',
    'Training a powerless boy with a cane-sword in a vast underground cavern.',
  ),
  q(
    'kaien-shiba',
    'hueco-mundo',
    'Where do you think the heart is?',
    'A lieutenant’s lesson to his young subordinate, remembered decades later in Las Noches.',
  ),
  q(
    'jushiro-ukitake',
    'soul-society',
    'There are two kinds of fights: fights to protect your life, and fights to protect your pride.',
    'Holding back a young subordinate from interfering in her lieutenant’s last stand.',
  ),
  q(
    'shinji-hirako',
    'fake-karakura',
    'Welcome to the inverted world.',
    'Releasing his Zanpakutō, and turning his opponent’s sense of direction upside down.',
  ),
  q(
    'gin-ichimaru',
    'fake-karakura',
    'I’m a snake. Cold-blooded, no heart, slithering around looking for prey — and swallowing whatever I like.',
    'Describing himself to the substitute he once mocked at the Seireitei’s west gate.',
  ),
  q(
    'gin-ichimaru',
    'soul-society',
    'Goodbye, Rangiku. I’m sorry.',
    'To his childhood friend, as he ascends alongside the traitors.',
  ),
  q(
    'kaname-tosen',
    'soul-society',
    'The path with the least bloodshed — that is the path of justice I follow.',
    'Facing down the bloodthirsty captain of the 11th Division.',
  ),
  q(
    'yhwach',
    'tybw',
    'Fear is necessary for evolution — the fear that one could be destroyed at any moment.',
    'Explaining to his chosen successor why the world must never be free of fear.',
  ),
  q(
    'uryu-ishida',
    'substitute',
    'I am a Quincy. And I hate Shinigami.',
    'Introducing himself as a rival to a classmate who had just become a Shinigami.',
  ),
  q(
    'oscar-joaquin-de-la-rosa',
    'soul-society',
    'Your fists are strong — so don’t use them for yourself. Use them to protect someone else.',
    'Teaching his brawling young grandson in Mexico, a coin pressed into his hand.',
  ),
  q(
    'orihime-inoue',
    'arrancar',
    'If I had five lives, I would fall in love with the same person five times.',
    'Saying a silent goodbye to a sleeping friend before leaving for Hueco Mundo.',
  ),
  q(
    'isshin-kurosaki',
    'substitute',
    'GOOD MORNING, ICHIGOOO!',
    'Launching a flying kick at his son as a wake-up call.',
  ),
  q(
    'don-kanonji',
    'substitute',
    'Bwahahaha! The spirits are always with you!',
    'His signature catchphrase on a hit paranormal TV show.',
  ),
  q(
    'renji-abarai',
    'soul-society',
    'Kurosaki… I’m begging you. Save Rukia.',
    'Defeated and bleeding, gripping the collar of the intruder who beat him.',
  ),
  q(
    'shuhei-hisagi',
    'fake-karakura',
    'The shape of my Zanpakutō is the shape of something that takes lives.',
    'Explaining to an Arrancar why he fears his own blade.',
  ),
  q(
    'izuru-kira',
    'fake-karakura',
    'Battle should be gloomy, wretched and full of despair.',
    'Lecturing a war-chanting Arrancar who thought fighting was glorious.',
  ),
  q(
    'ichigo-kurosaki',
    'hueco-mundo',
    'I’m not fighting because I want to win. I’m fighting because I have to win.',
    'Explaining to an Espada why he keeps getting back up.',
  ),
  q(
    'ichigo-kurosaki',
    'fake-karakura',
    'This form is the result of using the Final Getsuga Tenshō. I become Getsuga itself.',
    'Revealing the price of his final technique to a transcendent foe.',
  ),
  q(
    'hollow-ichigo',
    'soul-society',
    'What’s the difference between a king and his horse?',
    'Taunting his other half inside their shared inner world.',
  ),
  q(
    'barragan-louisenbairn',
    'fake-karakura',
    'I am the King of Hueco Mundo!',
    'Raging at the Shinigami who dared cut down his army.',
  ),
  q(
    'ikkaku-madarame',
    'arrancar',
    'My only wish is to fight under that man — and to die fighting under him.',
    'Explaining why he keeps his Bankai a secret from his own division.',
  ),
  q(
    'soi-fon',
    'soul-society',
    'Why… why didn’t you take me with you?!',
    'Breaking down in the middle of a battle with the mentor who abandoned her.',
  ),
  q(
    'nemu-kurotsuchi',
    'soul-society',
    'Yes, Mayuri-sama.',
    'Her standard reply to every order — no matter how cruel.',
  ),
  q(
    'toshiro-hitsugaya',
    'soul-society',
    'If you ever make Hinamori bleed, I’ll kill you.',
    'A warning to a smiling captain lurking near his childhood friend.',
  ),
  q(
    'kon',
    'substitute',
    'NEE-SAAAN!',
    'Leaping, arms wide, at the petite Shinigami he adores.',
  ),
  q(
    'nelliel-tu-odelschwanck',
    'hueco-mundo',
    'Itsugo! Itsugo!',
    'Happily mispronouncing the name of the Shinigami she has latched onto.',
  ),
];
