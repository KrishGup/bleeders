import { CHARACTERS } from '../data';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__brand">
          <span className="kanji">ブリードル</span> Bleedle · {CHARACTERS.length} souls and counting
        </p>
        <p className="footer__legal">
          A free, unofficial fan game. <em>Bleach</em> and its characters © Tite Kubo / Shueisha, TV Tokyo,
          dentsu, Pierrot. Bleedle is not affiliated with or endorsed by the rights holders. All crests are
          original artwork.
        </p>
        <p className="footer__links">
          <a href="#/registry">Soul Registry</a>
          <span aria-hidden="true">·</span>
          <a href="#/achievements">Achievements</a>
          <span aria-hidden="true">·</span>
          <a href="https://github.com/KrishGup/bleeders" target="_blank" rel="noreferrer">
            Source
          </a>
        </p>
      </div>
    </footer>
  );
}
