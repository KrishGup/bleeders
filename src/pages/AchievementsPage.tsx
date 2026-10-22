import { ACHIEVEMENTS } from '../game/achievements';
import { useStore } from '../state/store';
import { Icon } from '../components/Icon';

export function AchievementsPage() {
  const state = useStore((s) => s);
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id] !== undefined).length;

  return (
    <div className="achievements" data-mode="quote">
      <header className="page-head">
        <span className="page-head__kanji kanji" aria-hidden="true">
          勲章
        </span>
        <div>
          <h1 className="page-head__title">Achievements</h1>
          <p className="page-head__sub">
            {unlocked} of {ACHIEVEMENTS.length} seals earned. Some are hidden until you stumble into them.
          </p>
        </div>
        <div className="registry__progress">
          <span className="registry__progress-num">
            {unlocked}
            <span className="faint"> / {ACHIEVEMENTS.length}</span>
          </span>
          <span className="progress">
            <span className="progress__bar" style={{ width: `${(unlocked / ACHIEVEMENTS.length) * 100}%` }} />
          </span>
        </div>
      </header>

      <ul className="seal-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const at = state.achievements[achievement.id];
          const done = at !== undefined;
          const hidden = achievement.secret && !done;
          const { value, goal } = achievement.progress(state);
          return (
            <li key={achievement.id} className={`seal${done ? ' is-done' : ''}${hidden ? ' is-secret' : ''}`}>
              <span className="seal__stamp kanji" aria-hidden="true">
                {hidden ? '？' : achievement.kanji}
              </span>
              <span className="seal__text">
                <span className="seal__name">{hidden ? 'Secret seal' : achievement.name}</span>
                <span className="seal__desc">
                  {hidden ? 'Keep playing to discover this one.' : achievement.description}
                </span>
                {done ? (
                  <span className="seal__date">
                    <Icon name="check" size={13} strokeWidth={3} /> Earned{' '}
                    {new Date(at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                ) : !hidden && goal > 1 ? (
                  <span className="seal__progress">
                    <span className="progress progress--sm">
                      <span className="progress__bar" style={{ width: `${(value / goal) * 100}%` }} />
                    </span>
                    <span className="faint">
                      {value} / {goal}
                    </span>
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
