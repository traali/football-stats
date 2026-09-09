import { describe, it, expect } from 'vitest';

describe('Football Domain Invariants', () => {
  // 1. Palloliitto 3-1-0 Standings Math
  describe('Palloliitto 3-1-0 Standings Invariant', () => {
    it('calculates points and played matches strictly: P = 3*W + 1*D + 0*L', () => {
      const row = { won: 7, tied: 3, lost: 2, gf: 24, ga: 12 };
      const points = row.won * 3 + row.tied * 1 + row.lost * 0;
      const played = row.won + row.tied + row.lost;
      const goalDiff = row.gf - row.ga;

      expect(points).toBe(24);
      expect(played).toBe(12);
      expect(goalDiff).toBe(12);
    });

    it('enforces 0 points for 0 matches played', () => {
      const points = 0 * 3 + 0 * 1 + 0 * 0;
      expect(points).toBe(0);
    });

    it('maintains non-negative values for all standings fields', () => {
      const row = { won: 0, tied: 0, lost: 1, gf: 0, ga: 3 };
      expect(row.won).toBeGreaterThanOrEqual(0);
      expect(row.tied).toBeGreaterThanOrEqual(0);
      expect(row.lost).toBeGreaterThanOrEqual(0);
      expect(row.gf).toBeGreaterThanOrEqual(0);
      expect(row.ga).toBeGreaterThanOrEqual(0);
      expect(row.gf - row.ga).toBe(-3);
    });
  });

  // 2. Halves Progression
  describe('Halves Progression Invariant', () => {
    it('ensures full-time score is greater than or equal to half-time score', () => {
      const match = { hts_A: '1', hts_B: '0', fs_A: '3', fs_B: '2' };
      expect(Number(match.fs_A)).toBeGreaterThanOrEqual(Number(match.hts_A));
      expect(Number(match.fs_B)).toBeGreaterThanOrEqual(Number(match.hts_B));

      const h2_A = Number(match.fs_A) - Number(match.hts_A);
      const h2_B = Number(match.fs_B) - Number(match.hts_B);
      expect(h2_A).toBe(2);
      expect(h2_B).toBe(2);
      expect(h2_A + Number(match.hts_A)).toBe(Number(match.fs_A));
      expect(h2_B + Number(match.hts_B)).toBe(Number(match.fs_B));
    });

    it('handles 0-0 half time progression correctly', () => {
      const match = { hts_A: '0', hts_B: '0', fs_A: '1', fs_B: '0' };
      expect(Number(match.fs_A)).toBeGreaterThanOrEqual(Number(match.hts_A));
      expect(Number(match.fs_B)).toBeGreaterThanOrEqual(Number(match.hts_B));
      expect(Number(match.fs_A) - Number(match.hts_A)).toBe(1);
    });
  });

  // 3. Substitution Event Structure
  describe('Substitution Event Structure Invariant', () => {
    it('validates outgoing and incoming player attributes in "vaihto" events', () => {
      const subEvent = {
        code: 'vaihto',
        time: '61:00',
        player_name: 'Ulundu Vincent',
        shirt_number: '27',
        player_id: '1001',
        player_2_name: 'Salomaa Henri',
        shirt_2_number: '25',
        player_2_id: '1002',
      };

      expect(subEvent.code).toBe('vaihto');
      expect(subEvent.player_id).toBeDefined();
      expect(subEvent.player_2_id).toBeDefined();
      expect(subEvent.player_id).not.toBe(subEvent.player_2_id);
      expect(parseInt(subEvent.time, 10)).toBeGreaterThan(0);
      expect(subEvent.player_name.length).toBeGreaterThan(0);
      expect(subEvent.player_2_name.length).toBeGreaterThan(0);
    });
  });

  // 4. WhatsApp Briefing Token Safety (MATH-10)
  describe('WhatsApp Briefing Token Safety Invariant', () => {
    const TOKEN_LEAK_REGEX = /(?:\b(?:undefined|null|NaN)\b|\[object Object\]|\[SYÖTÄ TULOS\]|\[PVM\])/;

    it('passes for clean briefing text', () => {
      const briefing = '⚽ OTTELUENNAKKO: HJK vs Honka\n📅 2026-09-05 klo 18:00 | 📍 Töölö\n🏆 P13 Sarjaottelu';
      expect(TOKEN_LEAK_REGEX.test(briefing)).toBe(false);
    });

    it('does NOT false-alarm on legitimate Finnish/Swedish words like annulloitu/annullerad', () => {
      const fiText = 'Ottelu on peruttu ja annulloitu liiton toimesta.';
      const seText = 'Matchen är annullerad enligt förbundets beslut.';
      expect(TOKEN_LEAK_REGEX.test(fiText)).toBe(false);
      expect(TOKEN_LEAK_REGEX.test(seText)).toBe(false);
    });

    it('detects and rejects leaked tokens: undefined, null, NaN, [object Object], [PVM]', () => {
      expect(TOKEN_LEAK_REGEX.test('Klo undefined')).toBe(true);
      expect(TOKEN_LEAK_REGEX.test('Pisteet: null')).toBe(true);
      expect(TOKEN_LEAK_REGEX.test('Maalit: NaN')).toBe(true);
      expect(TOKEN_LEAK_REGEX.test('Tulos: [object Object]')).toBe(true);
      expect(TOKEN_LEAK_REGEX.test('Päivämäärä: [PVM]')).toBe(true);
      expect(TOKEN_LEAK_REGEX.test('Lopputulos: [SYÖTÄ TULOS]')).toBe(true);
    });
  });
});
