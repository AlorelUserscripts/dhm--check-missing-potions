import {logError} from '@aloreljs/rxutils/operators';
import {Observable, timer} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';

declare var unsafeWindow: any;

export function observeVar<T = number>(name: string): Observable<T> {
  return timer(0, 1000).pipe(
    map((): T => unsafeWindow[name]),
    distinctUntilChanged(),
    logError(`[DHMPotionChecker.observeVar(${name})`)
  );
}
