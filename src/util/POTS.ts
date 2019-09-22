import {logError} from '@aloreljs/rxutils/operators';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {onLoggedIn$} from './onLoggedIn';

export const POTS$: Observable<readonly string[]> = onLoggedIn$.pipe(
  map(() => Array.from(document.querySelectorAll('[id$="Potion"]'))),
  map((elements): readonly string[] => {
    const reg = /^item-box-([a-zA-Z]+Potion)$/;
    const out: string[] = [];
    let m: RegExpMatchArray | null;

    for (const el of elements) {
      if ((m = el.id.match(reg))) {
        out.push(m[1]);
      }
    }

    out.sort();

    return Object.freeze(out);
  }),
  logError('[DHMPotionChecker.POTS$]'),
  shareReplay()
);
