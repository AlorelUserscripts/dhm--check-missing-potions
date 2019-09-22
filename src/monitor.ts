import {NOOP_OBSERVER} from '@aloreljs/rxutils';
import {logError} from '@aloreljs/rxutils/operators';
import {startCase} from 'lodash-es';
import {Observable, of} from 'rxjs';
import {distinctUntilChanged, map, switchMap, tap} from 'rxjs/operators';
import {getSetting} from './settings';
import {observeVar} from './util/observeVar';
import {POTS$} from './util/POTS';

function mkPotionDiv(potion: string): HTMLElement {
  const displayedPotion = startCase(potion);
  const div = document.createElement('div');
  div.classList.add('notification-idle');
  div.style.display = 'none';
  div.title = displayedPotion;

  const img = document.createElement('img');
  img.src = `/images/${potion}.png`;
  img.classList.add('img-small');

  const txt = document.createElement('span');
  txt.innerText = '??';
  div.append(img, txt);

  getSetting('min')
    .pipe(
      switchMap((min): Observable<null | number> => {
        return getSetting('pots').pipe(
          map(enabledPots => enabledPots.includes(potion)),
          distinctUntilChanged(),
          switchMap(potionEnabled => {
            console.debug('[DHMPotionChecker]', displayedPotion, potionEnabled ? 'enabled' : 'disabled');
            if (!potionEnabled) {
              return of(null);
            } else {
              return observeVar(potion).pipe(
                map(count => {
                  const isLte = count <= min;
                  console.debug('[DHMPotionChecker]', `${displayedPotion} count:`, count, 'which is', isLte ? '<=' : '>', 'the desired', min);

                  return isLte ? count : null;
                })
              );
            }
          })
        );
      }),
      distinctUntilChanged(),
      tap(v => {
        if (v === null) {
          div.style.display = 'none';
        } else {
          div.style.display = null;
          txt.innerText = v.toString();
        }
      }),
      logError(`[DHMPotionchecker.monitor(${potion})]`)
    )
    .subscribe(NOOP_OBSERVER);

  return div;
}

let notificationArea: HTMLElement;

POTS$
  .pipe(
    tap(allPots => {
      notificationArea = document.getElementById('notfications-area-top')!;
      notificationArea.append(...allPots.map(mkPotionDiv));
    }),
    logError('[DHMPotionChecker.initMonitor]')
  )
  .subscribe(NOOP_OBSERVER);
