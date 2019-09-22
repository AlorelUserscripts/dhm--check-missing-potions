import {distinctUntilDeepChanged, logError} from '@aloreljs/rxutils/operators';
import {isEqual} from 'lodash-es';
import {BehaviorSubject, Observable} from 'rxjs';
import {delay, pluck, skip} from 'rxjs/operators';

const enum Conf {
  KEY = 'config'
}

export interface SettingsInterface {
  min: number;

  pots: string[];
}

declare var GM_getValue: any;
declare var GM_setValue: any;

const value$: BehaviorSubject<SettingsInterface> = new BehaviorSubject<SettingsInterface>((() => {
  let raw: any = GM_getValue(Conf.KEY) || {};
  if (typeof raw === 'string') {
    raw = JSON.parse(raw);
  }

  return {
    min: 5,
    pots: [],
    ...raw
  };
})());

value$.pipe(skip(1), delay(1)).subscribe(v => {
  GM_setValue(Conf.KEY, {...v});
});

export function setSetting<T extends keyof SettingsInterface>(k: T, value: SettingsInterface[T]): void {
  if (!isEqual(value, value$.value[k])) {
    value$.next({
      ...value$.value,
      [k]: value
    });
  }
}

export function getSetting<T extends keyof SettingsInterface>(k: T): Observable<SettingsInterface[T]> {
  return value$.pipe(
    pluck<SettingsInterface, T>(k),
    distinctUntilDeepChanged(),
    logError(`[DHMPotionChecker.getSetting(${k})`)
  );
}

