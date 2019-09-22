// ==UserScript==
// @name         DiamondHunt Mobile Potion Checker
// @namespace    org.alorel.diamondhunt-mobile-potion-checker
// @version      1.0.1
// @description  Checks if you have missing potions
// @author       Alorel
// @include      http*://diamondhunt.app*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @icon         https://diamondhunt.app/images/brewingSkill.png
// @homepage     https://github.com/AlorelUserscripts/dhm--check-missing-potions
// @require      https://cdn.jsdelivr.net/npm/lodash@4.17.15/lodash.min.js
// @require      https://cdn.jsdelivr.net/npm/rxjs@6.5.3/bundles/rxjs.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/@aloreljs/rxutils@1.1.0/_bundle/umd.min.js
// @updateURL    https://raw.githubusercontent.com/AlorelUserscripts/dhm--check-missing-potions/master/bundle.meta.js
// @downloadURL  https://raw.githubusercontent.com/AlorelUserscripts/dhm--check-missing-potions/master/bundle.user.js
// ==/UserScript==

(function (rxutils, operators, lodashEs, rxjs, operators$1) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var potionsUlCss = "img {width:1em;height:1em;display:inline-block;margin:0 5px}label{font-weight:bold}";

    function observeVar(name) {
        return rxjs.timer(0, 1000).pipe(operators$1.map(function () { return unsafeWindow[name]; }), operators$1.distinctUntilChanged(), operators.logError("[DHMPotionChecker.observeVar(" + name + ")"));
    }

    var onLoggedIn$ = observeVar('username').pipe(operators.takeTruthy(1), operators$1.delay(1000), operators$1.mapTo(undefined), operators.logError('[DHMPotionChecker.onLoggedIn$]'), operators$1.shareReplay());

    var READY$ = onLoggedIn$
        .pipe(operators$1.tap(function () {
        var raw = GM_getValue(unsafeWindow.username) || {};
        if (typeof raw === 'string') {
            raw = JSON.parse(raw);
        }
        value$ = new rxjs.BehaviorSubject(__assign({ min: 20, pots: [] }, raw));
        value$.pipe(operators$1.skip(1), operators$1.delay(1)).subscribe(function (v) {
            GM_setValue(unsafeWindow.username, __assign({}, v));
        });
    }), operators$1.mapTo(undefined), operators.logError('[DHMPotionChecker.settingsInit]'), operators$1.shareReplay());
    var value$;
    function setSetting(k, value) {
        READY$.subscribe(function () {
            var _a;
            if (!lodashEs.isEqual(value, value$.value[k])) {
                value$.next(__assign(__assign({}, value$.value), (_a = {}, _a[k] = value, _a)));
            }
        });
    }
    function getSetting(k) {
        return READY$.pipe(operators$1.switchMap(function () { return value$; }), operators$1.pluck(k), operators.distinctUntilDeepChanged(), operators.logError("[DHMPotionChecker.getSetting(" + k + ")"));
    }

    var POTS$ = onLoggedIn$.pipe(operators$1.map(function () { return Array.from(document.querySelectorAll('[id$="Potion"]')); }), operators$1.map(function (elements) {
        var reg = /^item-box-([a-zA-Z]+Potion)$/;
        var out = [];
        var m;
        for (var _i = 0, elements_1 = elements; _i < elements_1.length; _i++) {
            var el = elements_1[_i];
            if ((m = el.id.match(reg))) {
                out.push(m[1]);
            }
        }
        out.sort();
        return Object.freeze(out);
    }), operators.logError('[DHMPotionChecker.POTS$]'), operators$1.shareReplay());

    function mkMenuDialog(pots) {
        var dia = document.createElement('div');
        dia.classList.add('smittys-dialogues');
        dia.id = "alorel-pot-checker-dialogue" /* DIALOGUE_ID */;
        dia.style.display = 'none';
        var closeBtn = document.createElement('input');
        closeBtn.type = 'button';
        closeBtn.value = 'Close';
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            closeSmittysDialogue("alorel-pot-checker-dialogue" /* DIALOGUE_ID */);
        });
        var valueInp = document.createElement('input');
        valueInp.type = 'number';
        valueInp.id = "alorel-pot-checker-input" /* INPUT_ID */;
        valueInp.setAttribute('onkeypress', 'return isNumberKey(event)');
        getSetting('min')
            .pipe(operators$1.take(1), operators$1.switchMap(function (v) {
            valueInp.value = typeof v === 'number' ? v.toString() : '5';
            return rxjs.fromEvent(valueInp, 'input', { passive: true });
        }), operators$1.map(function () { return (valueInp.value || '').trim(); }), operators$1.distinctUntilChanged(), operators$1.filter(function (v) { return !isNaN(v); }), operators$1.tap(function (v) {
            setSetting('min', parseInt(v));
        }), operators.logError('[DHMPotionChecker.menuDialogInit]'))
            .subscribe(rxutils.NOOP_OBSERVER);
        var inpLabel = document.createElement('label');
        inpLabel.htmlFor = "alorel-pot-checker-input" /* INPUT_ID */;
        inpLabel.innerText = "Minimum potions to own: ";
        var potionsSpan = document.createElement('span');
        potionsSpan.innerText = 'Monitor potions:';
        var potionsUl = document.createElement('ul');
        potionsUl.style.listStyle = 'none';
        getSetting('pots')
            .pipe(operators$1.take(1), operators$1.tap(function (initialValue) {
            var _loop_1 = function (pot) {
                var container = document.createElement('li');
                var innerContainer = document.createElement('div');
                container.appendChild(innerContainer);
                var root = innerContainer.attachShadow({ mode: 'closed' });
                var label = document.createElement('label');
                var style = document.createElement('style');
                style.innerHTML = potionsUlCss;
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = initialValue.includes(pot);
                var img = document.createElement('img');
                img.src = "/images/" + pot + ".png";
                var span = document.createElement('span');
                span.innerText = lodashEs.startCase(pot);
                label.append(cb, img, span);
                root.append(style, label);
                potionsUl.appendChild(container);
                rxjs.fromEvent(cb, 'change', { passive: true })
                    .pipe(operators$1.switchMapTo(getSetting('pots').pipe(operators$1.take(1))), operators$1.tap(function (livePots) {
                    var idx = livePots.indexOf(pot);
                    if (idx === -1 && cb.checked) {
                        setSetting('pots', __spreadArrays(livePots, [pot]));
                    }
                    else if (idx !== -1 && !cb.checked) {
                        var sliced = livePots.slice(0);
                        sliced.splice(idx, 1);
                        setSetting('pots', sliced);
                    }
                }), operators.logError("DHMPotionChecker.onChange(" + pot + ")]"))
                    .subscribe(rxutils.NOOP_OBSERVER);
            };
            for (var _i = 0, pots_1 = pots; _i < pots_1.length; _i++) {
                var pot = pots_1[_i];
                _loop_1(pot);
            }
        }), operators.logError('[DHMPotionChecker.menuInit]'))
            .subscribe(rxutils.NOOP_OBSERVER);
        dia.append(inpLabel, valueInp, document.createElement('br'), document.createElement('br'), potionsSpan, potionsUl, document.createElement('br'), document.createElement('br'), closeBtn);
        document.getElementById('game-screen').appendChild(dia);
        return dia;
    }
    function mkMenuElement() {
        var menuElement = document.createElement('div');
        menuElement.classList.add('main-button');
        menuElement.style.cursor = 'pointer';
        var tbl = document.createElement('table');
        var tbody = document.createElement('tbody');
        tbl.appendChild(tbody);
        var tr = document.createElement('tr');
        tbody.appendChild(tr);
        var imgTd = document.createElement('td');
        var img = document.createElement('img');
        img.classList.add('img-medium');
        img.src = "/images/brewingSkill.png";
        imgTd.appendChild(img);
        var textTd = document.createElement('td');
        textTd.innerText = 'Potion monitor';
        textTd.style.textAlign = 'right';
        textTd.style.paddingRight = '20px';
        tr.append(imgTd, textTd);
        menuElement.addEventListener('click', function () {
            closeSmittysDialogue('dialogue-profile');
            openDialogue("alorel-pot-checker-dialogue" /* DIALOGUE_ID */, '90%');
        }, { passive: true });
        menuElement.appendChild(tbl);
        var referenceNode = document.getElementById('dialogue-profile-guest-button');
        referenceNode.parentElement.insertBefore(menuElement, referenceNode.nextSibling);
        return menuElement;
    }
    POTS$.pipe(operators$1.tap(mkMenuDialog), operators.logError('[DHMPotionChecker.mkMenuDialog]'), operators$1.tap(mkMenuElement), operators.logError('[DHMPotionChecker.mkMenuElement]')).subscribe(rxutils.NOOP_OBSERVER);

    function mkPotionDiv(potion) {
        var displayedPotion = lodashEs.startCase(potion);
        var div = document.createElement('div');
        div.classList.add('notification-idle');
        div.style.display = 'none';
        div.title = displayedPotion;
        var img = document.createElement('img');
        img.src = "/images/" + potion + ".png";
        img.classList.add('img-small');
        var txt = document.createElement('span');
        txt.innerText = '??';
        div.append(img, txt);
        getSetting('min')
            .pipe(operators$1.switchMap(function (min) {
            return getSetting('pots').pipe(operators$1.map(function (enabledPots) { return enabledPots.includes(potion); }), operators$1.distinctUntilChanged(), operators$1.switchMap(function (potionEnabled) {
                console.debug('[DHMPotionChecker]', displayedPotion, potionEnabled ? 'enabled' : 'disabled');
                if (!potionEnabled) {
                    return rxjs.of(null);
                }
                else {
                    return observeVar(potion).pipe(operators$1.map(function (count) {
                        var isLte = count <= min;
                        console.debug('[DHMPotionChecker]', displayedPotion + " count:", count, 'which is', isLte ? '<=' : '>', 'the desired', min);
                        return isLte ? count : null;
                    }));
                }
            }));
        }), operators$1.distinctUntilChanged(), operators$1.tap(function (v) {
            if (v === null) {
                div.style.display = 'none';
            }
            else {
                div.style.display = null;
                txt.innerText = v.toString();
            }
        }), operators.logError("[DHMPotionchecker.monitor(" + potion + ")]"))
            .subscribe(rxutils.NOOP_OBSERVER);
        return div;
    }
    var notificationArea;
    POTS$
        .pipe(operators$1.tap(function (allPots) {
        notificationArea = document.getElementById('notfications-area-top');
        notificationArea.append.apply(notificationArea, allPots.map(mkPotionDiv));
    }), operators.logError('[DHMPotionChecker.initMonitor]'))
        .subscribe(rxutils.NOOP_OBSERVER);

}(window['@aloreljs/rxutils'], window['@aloreljs/rxutils'].operators, _, rxjs, rxjs.operators));
