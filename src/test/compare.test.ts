import { describe, expect, it } from 'vitest';
import { characterById } from '../data';
import { insigniaOf } from '../data/taxonomy';
import { compareAttribute, compareCharacters } from '../lib/compare';

const c = characterById;

describe('compare', () => {
  it('marks a character against itself as all correct', () => {
    expect(
      compareCharacters(c('ichigo-kurosaki'), c('ichigo-kurosaki')).every((x) => x.verdict === 'correct'),
    ).toBe(true);
  });

  it('scores overlapping races as partial', () => {
    const cell = compareAttribute('race', c('shinji-hirako'), c('ichigo-kurosaki'));
    expect(cell.verdict).toBe('partial');
    expect(compareAttribute('race', c('uryu-ishida'), c('kenpachi-zaraki')).verdict).toBe('wrong');
  });

  it('scores affiliations as sets', () => {
    expect(compareAttribute('affiliation', c('gin-ichimaru'), c('sosuke-aizen')).verdict).toBe('correct');
    expect(compareAttribute('affiliation', c('renji-abarai'), c('sosuke-aizen')).verdict).toBe('partial');
  });

  it('gives related ranks a partial match', () => {
    expect(compareAttribute('rank', c('kisuke-urahara'), c('byakuya-kuchiki')).verdict).toBe('partial');
    expect(compareAttribute('rank', c('nelliel-tu-odelschwanck'), c('ulquiorra-cifer')).verdict).toBe(
      'partial',
    );
    expect(compareAttribute('rank', c('renji-abarai'), c('byakuya-kuchiki')).verdict).toBe('wrong');
  });

  it('points division arrows toward the answer', () => {
    const cell = compareAttribute('insignia', c('shinji-hirako'), c('renji-abarai'));
    expect(cell.verdict).toBe('wrong');
    expect(cell.arrow).toBe('up');
    expect(compareAttribute('insignia', c('rukia-kuchiki'), c('renji-abarai')).arrow).toBe('down');
  });

  it('only compares insignia of the same kind', () => {
    const espadaVsDivision = compareAttribute('insignia', c('grimmjow-jaegerjaquez'), c('renji-abarai'));
    expect(espadaVsDivision.verdict).toBe('wrong');
    expect(espadaVsDivision.arrow).toBeUndefined();
    expect(compareAttribute('insignia', c('as-nodt'), c('bambietta-basterbine')).arrow).toBe('down');
    expect(compareAttribute('insignia', c('shawlong-kufang'), c('grimmjow-jaegerjaquez')).verdict).toBe(
      'correct',
    );
    expect(compareAttribute('insignia', c('orihime-inoue'), c('yasutora-sado')).verdict).toBe('correct');
  });

  it('labels insignia readably', () => {
    expect(insigniaOf(c('ichibe-hyosube'))?.label).toBe('Squad 0');
    expect(insigniaOf(c('dordoni-del-socaccio'))?.label).toBe('#103');
    expect(insigniaOf(c('tesla-lindocruz'))?.long).toBe('Serves the 5th Espada');
    expect(insigniaOf(c('yhwach'))?.label).toBe('“A”');
    expect(insigniaOf(c('keigo-asano'))).toBeNull();
  });

  it('orders debut arcs by release, films included', () => {
    expect(compareAttribute('debut', c('ichigo-kurosaki'), c('yhwach')).arrow).toBe('up');
    expect(compareAttribute('debut', c('yhwach'), c('jin-kariya')).arrow).toBe('down');
    expect(compareAttribute('debut', c('senna'), c('ulquiorra-cifer')).arrow).toBe('up');
  });
});
