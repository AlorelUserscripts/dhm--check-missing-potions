import {logError, takeTruthy} from '@aloreljs/rxutils/operators';
import {Observable} from 'rxjs';
import {delay, mapTo, shareReplay} from 'rxjs/operators';
import {observeVar} from './observeVar';

export const onLoggedIn$: Observable<void> = observeVar('username').pipe(
  takeTruthy(1),
  delay(1000),
  mapTo(undefined),
  logError('[DHMPotionChecker.onLoggedIn$]'),
  shareReplay()
);
