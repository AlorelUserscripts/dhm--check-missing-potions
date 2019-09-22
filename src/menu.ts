import {NOOP_OBSERVER} from '@aloreljs/rxutils';
import {logError} from '@aloreljs/rxutils/operators';
import {startCase} from 'lodash-es';
import {fromEvent, merge, Observable} from 'rxjs';
import {distinctUntilChanged, filter, map, switchMap, switchMapTo, take, tap} from 'rxjs/operators';
import {getSetting, setSetting} from './settings';
import potionsUlCss from './util/potionsUlCss';
import {POTS$} from './util/POTS';

const enum Conf {
  DIALOGUE_ID = 'alorel-pot-checker-dialogue',
  INPUT_ID = 'alorel-pot-checker-input',
}

declare function openDialogue(which: string, width: string): void;

declare function closeSmittysDialogue(which: string): void;

function mkMenuDialog(pots: string[] | readonly string[]): HTMLElement {
  const dia = document.createElement('div');
  dia.classList.add('smittys-dialogues');
  dia.id = Conf.DIALOGUE_ID;
  dia.style.display = 'none';

  const closeBtn = document.createElement('input');
  closeBtn.type = 'button';
  closeBtn.value = 'Close';
  closeBtn.addEventListener('click', e => {
    e.preventDefault();
    closeSmittysDialogue(Conf.DIALOGUE_ID);
  });

  const valueInp = document.createElement('input');
  valueInp.type = 'number';
  valueInp.id = Conf.INPUT_ID;
  valueInp.setAttribute('onkeypress', 'return isNumberKey(event)');
  getSetting('min')
    .pipe(
      take(1),
      switchMap((v): Observable<Event> => {
        valueInp.value = typeof <any>v === 'number' ? v.toString() : '5';

        return merge(
          fromEvent(valueInp, 'input', {passive: true}),
          fromEvent(valueInp, 'input', {passive: true})
        );
      }),
      map(() => (valueInp.value || '').trim()),
      distinctUntilChanged(),
      filter(v => !isNaN(<any>v)),
      tap(v => {
        setSetting('min', parseInt(v));
      }),
      logError('[DHMPotionChecker.menuDialogInit]')
    )
    .subscribe(NOOP_OBSERVER);

  const inpLabel = document.createElement('label');
  inpLabel.htmlFor = Conf.INPUT_ID;
  inpLabel.innerText = `Minimum potions to own: `;

  const potionsSpan = document.createElement('span');
  potionsSpan.innerText = 'Monitor potions:';

  const potionsUl = document.createElement('ul');
  potionsUl.style.listStyle = 'none';

  getSetting('pots')
    .pipe(
      take(1),
      tap(initialValue => {
        for (const pot of pots) {
          const container = document.createElement('li');
          const innerContainer = document.createElement('div');
          container.appendChild(innerContainer);
          const root = innerContainer.attachShadow({mode: 'closed'});

          const label = document.createElement('label');

          const style = document.createElement('style');
          style.innerHTML = potionsUlCss;

          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = initialValue.includes('pot');

          const img = document.createElement('img');
          img.src = `/images/${pot}.png`;

          const span = document.createElement('span');
          span.innerText = startCase(pot);

          label.append(cb, img, span);

          root.append(style, label);
          potionsUl.appendChild(container);

          fromEvent(cb, 'change', {passive: true})
            .pipe(
              switchMapTo(getSetting('pots').pipe(take(1))),
              tap(livePots => {
                const idx = livePots.indexOf(pot);
                if (idx === -1 && cb.checked) {
                  setSetting('pots', [...livePots, pot]);
                } else if (idx !== -1 && !cb.checked) {
                  const sliced = livePots.slice(0);
                  sliced.splice(idx, 1);
                  setSetting('pots', sliced);
                }
              }),
              logError(`DHMPotionChecker.onChange(${pot})]`)
            )
            .subscribe(NOOP_OBSERVER);
        }
      }),
      logError('[DHMPotionChecker.menuInit]')
    )
    .subscribe(NOOP_OBSERVER);

  dia.append(
    inpLabel,
    valueInp,
    document.createElement('br'),
    document.createElement('br'),
    potionsSpan,
    potionsUl,
    document.createElement('br'),
    document.createElement('br'),
    closeBtn
  );

  document.getElementById('game-screen')!.appendChild(dia);

  return dia;
}

function mkMenuElement(): HTMLElement {
  const menuElement = document.createElement('div');
  menuElement.classList.add('main-button');
  menuElement.style.cursor = 'pointer';

  const tbl = document.createElement('table');
  const tbody = document.createElement('tbody');
  tbl.appendChild(tbody);
  const tr = document.createElement('tr');
  tbody.appendChild(tr);
  const imgTd = document.createElement('td');
  const img = document.createElement('img');
  img.classList.add('img-medium');
  img.src = `/images/brewingSkill.png`;
  imgTd.appendChild(img);
  const textTd = document.createElement('td');
  textTd.innerText = 'Potion monitor';
  textTd.style.textAlign = 'right';
  textTd.style.paddingRight = '20px';
  tr.append(imgTd, textTd);

  menuElement.addEventListener(
    'click',
    () => {
      openDialogue(Conf.DIALOGUE_ID, '90%');
    },
    {passive: true}
  );

  menuElement.appendChild(tbl);

  const referenceNode = document.getElementById('dialogue-profile-guest-button')!;
  referenceNode.parentElement!.insertBefore(menuElement, referenceNode.nextSibling!);

  return menuElement;
}

POTS$.pipe(
  tap(mkMenuDialog),
  logError('[DHMPotionChecker.mkMenuDialog]'),
  tap(mkMenuElement),
  logError('[DHMPotionChecker.mkMenuElement]')
).subscribe(NOOP_OBSERVER);
