import {distinctUntilDeepChanged, logError} from '@aloreljs/rxutils/operators';
import {isEqual} from 'lodash-es';
import {BehaviorSubject, Observable} from 'rxjs';
import {delay, mapTo, pluck, shareReplay, skip, switchMap, tap} from 'rxjs/operators';
import {onLoggedIn$} from './util/onLoggedIn';

export interface SettingsInterface {
  min: number;

  pots: string[];
}

declare var GM_getValue: any;
declare var GM_setValue: any;
declare var unsafeWindow: any;

const READY$: Observable<void> = onLoggedIn$
  .pipe(
    tap(() => {
      let raw: any = GM_getValue(unsafeWindow.username) || {};
      if (typeof raw === 'string') {
        raw = JSON.parse(raw);
      }

      value$ = new BehaviorSubject<SettingsInterface>({
        min: 20,
        pots: [],
        ...raw
      });

      value$.pipe(skip(1), delay(1)).subscribe(v => {
        GM_setValue(unsafeWindow.username, {...v});
      });
    }),
    mapTo(undefined),
    logError('[DHMPotionChecker.settingsInit]'),
    shareReplay()
  );

let value$: BehaviorSubject<SettingsInterface>;

export function setSetting<T extends keyof SettingsInterface>(k: T, value: SettingsInterface[T]): void {
  READY$.subscribe(() => {
    if (!isEqual(value, value$.value[k])) {
      value$.next({
        ...value$.value,
        [k]: value
      });
    }
  });
}

export function getSetting<T extends keyof SettingsInterface>(k: T): Observable<SettingsInterface[T]> {
  return READY$.pipe(
    switchMap(() => value$),
    pluck<SettingsInterface, T>(k),
    distinctUntilDeepChanged(),
    logError(`[DHMPotionChecker.getSetting(${k})`)
  );
}

