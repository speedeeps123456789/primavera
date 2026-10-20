document.addEventListener('DOMContentLoaded', () => {
  const bloomWord = document.getElementById('bloomWord');
  const cursorDot = document.getElementById('cursorDot');
  if (!bloomWord) return;

  let currentText = 'primavera';
  let isDefaultText = true;
  let letters = Array.from(bloomWord.querySelectorAll('.letter'));
  let currentGrows = new Array(letters.length).fill(0);
  let letterPeakHolds = new Array(letters.length).fill(0);
  let canHoldAgain = new Array(letters.length).fill(true);

  let lastTime = performance.now();
  let time = 0;
  let currentSpeed = 2.5;
  const baseSpeed = 2.5;
  const phaseDelay = 1.75;

  let mouseX = -9999;
  let mouseY = -9999;
  let cursorVisible = false;
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(hover: none)').matches;
  if (isTouchDevice && cursorDot) {
    cursorDot.remove();
  }

  let isMouseDown = false;
  let mouseDownTime = 0;
  let mouseDownPos = { x: 0, y: 0 };

  let prevMouseX = -9999;
  let prevMouseY = -9999;
  let lastMouseTime = performance.now();

  let tagAngle = 0;
  let tagAngularVel = 0;
  const tagGravity = 45;
  const tagDamping = 0.94;

  function checkTagHit(curX, curY, prevX, prevY, dt) {
    if (!dlBtn || prevX < -1000 || curX < -1000) return;

    const rect = dlBtn.getBoundingClientRect();
    const pivotX = rect.left + rect.width / 2;
    const pivotY = rect.top + 23;
    const tagBottom = rect.bottom;

    const minY = Math.min(prevY, curY);
    const maxY = Math.max(prevY, curY);
    if (maxY < pivotY || minY > tagBottom + 20) return;

    const halfW = rect.width * 0.58;
    const leftBound = pivotX - halfW;
    const rightBound = pivotX + halfW;

    const wasInside = (prevX >= leftBound && prevX <= rightBound);
    const isInside = (curX >= leftBound && curX <= rightBound);
    const crossed = (prevX < pivotX && curX >= pivotX) || (prevX > pivotX && curX <= pivotX);

    if (wasInside || isInside || crossed) {
      const vx = (curX - prevX) / Math.max(0.004, dt);
      if (Math.abs(vx) > 35) {
        const currentY = (curY + prevY) / 2;

        const leverArm = Math.max(0.25, Math.min(1.0, (currentY - pivotY) / (rect.height || 200)));

        const impulse = vx * 0.009 * leverArm;

        tagAngularVel += impulse;
        tagAngularVel = Math.max(-45, Math.min(45, tagAngularVel));
      }
    }
  }

  function handlePointerMove(clientX, clientY) {
    const now = performance.now();
    const dt = Math.max(0.001, (now - lastMouseTime) / 1000);

    mouseX = clientX;
    mouseY = clientY;

    if (prevMouseX > -1000 && dt < 0.2) {
      checkTagHit(mouseX, mouseY, prevMouseX, prevMouseY, dt);
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;
    lastMouseTime = now;

    if (!isTouchDevice && !cursorVisible && cursorDot) {
      cursorVisible = true;
      cursorDot.style.opacity = '1';
    }
  }

  window.addEventListener('mousemove', (e) => {
    handlePointerMove(e.clientX, e.clientY);
  });

  window.addEventListener('mouseleave', () => {
    mouseX = -9999;
    mouseY = -9999;
    prevMouseX = -9999;
    prevMouseY = -9999;
    cursorVisible = false;
    if (cursorDot) cursorDot.style.opacity = '0';
  });

  window.addEventListener('mouseenter', (e) => {
    lastMouseTime = performance.now();
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
    if (cursorDot) cursorDot.style.opacity = '1';
    cursorVisible = true;
  });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouseX = -9999;
    mouseY = -9999;
    prevMouseX = -9999;
    prevMouseY = -9999;
    cursorVisible = false;
    isMouseDown = false;
    if (cursorDot) cursorDot.style.opacity = '0';
  });

  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const deltaY = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    if (isTouchDevice && dlBtn && Math.abs(deltaY) > 1.2) {
      tagAngularVel += Math.max(-8, Math.min(8, deltaY * 0.04));
    }
  }, { passive: true });

  const dlBtn = document.getElementById('dlBtn') || document.querySelector('.nursery-tag');
  const dlText = dlBtn ? dlBtn.querySelector('.tag-action') : null;

  if (dlBtn) {
    dlBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      dlBtn.classList.add('bloomed');
      tagAngularVel += (Math.random() > 0.5 ? 1 : -1) * 8;
    });

    dlBtn.addEventListener('click', () => {
      dlBtn.classList.add('bloomed');
      tagAngularVel += (Math.random() > 0.5 ? 1 : -1) * 10;
      if (navigator.vibrate) {
        try { navigator.vibrate([25, 35, 45]); } catch (e) {}
      }
      setTimeout(() => {
        dlBtn.classList.remove('bloomed');
      }, 1200);
    });

    dlBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      dlBtn.classList.add('bloomed');
      tagAngularVel += (Math.random() > 0.5 ? 1 : -1) * 8;
    }, { passive: true });
  }

  let headlineBurstUntil = 0;
  let headlineIsHeld = false;

  if (bloomWord) {
    bloomWord.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      headlineIsHeld = true;
      headlineBurstUntil = performance.now() + 1800;
    });
  }

  window.addEventListener('mousedown', () => {
    isMouseDown = true;
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
    headlineIsHeld = false;
    if (typeof specimenBlocks !== 'undefined') {
      specimenBlocks.forEach(b => { b.isHeld = false; });
    }
  });

  const growSlider = document.getElementById('growSlider');
  const sliderControl = document.getElementById('sliderControl');
  let manualSliderActive = false;
  let manualGrowValue = 0;
  let isDraggingSlider = false;

  function updateSliderFromClientX(clientX) {
    if (!growSlider) return;
    const rect = growSlider.getBoundingClientRect();
    const clampedX = Math.max(rect.left, Math.min(rect.right, clientX));
    const ratio = (clampedX - rect.left) / Math.max(1, rect.width);
    const val = Math.round(ratio * 100);
    growSlider.value = val;
    manualGrowValue = val;
    manualSliderActive = true;
  }

  if (sliderControl && growSlider) {

    growSlider.addEventListener('input', (e) => {
      manualGrowValue = parseInt(e.target.value, 10);
      manualSliderActive = true;
    });

    sliderControl.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      isDraggingSlider = true;
      updateSliderFromClientX(e.clientX);
      sliderControl.setPointerCapture(e.pointerId);
    });

    sliderControl.addEventListener('pointermove', (e) => {
      if (isDraggingSlider) {
        updateSliderFromClientX(e.clientX);
      }
    });

    const stopSliderDrag = (e) => {
      if (isDraggingSlider) {
        isDraggingSlider = false;
        try { sliderControl.releasePointerCapture(e.pointerId); } catch(err){}
      }
      manualSliderActive = false;
    };

    growSlider.addEventListener('mouseup', stopSliderDrag);
    growSlider.addEventListener('touchend', stopSliderDrag);
    sliderControl.addEventListener('pointerup', stopSliderDrag);
    sliderControl.addEventListener('pointercancel', stopSliderDrag);
    window.addEventListener('pointerup', stopSliderDrag);
  }

  window.addEventListener('copy', (e) => {
    e.preventDefault();
  });
  window.addEventListener('cut', (e) => {
    e.preventDefault();
  });
  window.addEventListener('contextmenu', (e) => {

  });

  let mobileInput = null;
  if (!isTouchDevice) {
    mobileInput = document.createElement('input');
    mobileInput.type = 'text';
    mobileInput.className = 'hidden-type-input';
    mobileInput.setAttribute('autocomplete', 'off');
    mobileInput.setAttribute('autocorrect', 'off');
    mobileInput.setAttribute('autocapitalize', 'off');
    mobileInput.setAttribute('spellcheck', 'false');
    if (bloomWord) {
      bloomWord.appendChild(mobileInput);
      bloomWord.addEventListener('click', () => {
        mobileInput.focus();
      });
    }

    mobileInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length > 0) {
        currentText = val;
        isDefaultText = false;
      } else {
        currentText = 'primavera';
        isDefaultText = true;
      }
      renderWord();
    });
  } else if (bloomWord) {
    bloomWord.removeAttribute('title');
  }

  function renderWord() {
    bloomWord.innerHTML = '';
    if (mobileInput) bloomWord.appendChild(mobileInput);
    const chars = Array.from(currentText);

    const len = chars.length;
    const maxVw = Math.min(19.8, Math.max(5.5, 160 / Math.max(len, 6)));
    bloomWord.style.fontSize = `clamp(2.5rem, ${maxVw}vw, 22.5rem)`;

    const newGrows = [];
    chars.forEach((char, idx) => {
      const span = document.createElement('span');
      span.className = 'letter';
      if (char === ' ') {
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = char;
      }
      bloomWord.appendChild(span);
      newGrows.push(currentGrows[idx] !== undefined ? currentGrows[idx] : 0);
    });

    letters = Array.from(bloomWord.querySelectorAll('.letter'));
    currentGrows = newGrows;
    letterPeakHolds = new Array(letters.length).fill(0);
    canHoldAgain = new Array(letters.length).fill(true);
  }

  window.addEventListener('keydown', (e) => {

    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (currentText.length > 0) {
        currentText = currentText.slice(0, -1);
      }
      if (currentText.length === 0) {
        currentText = 'primavera';
        isDefaultText = true;
      }
      renderWord();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      currentText = 'primavera';
      isDefaultText = true;
      manualSliderActive = false;
      if (growSlider) growSlider.value = 0;
      if (growVal) growVal.textContent = '0';
      renderWord();
      return;
    }

    if (e.key.length === 1) {
      if (isDefaultText) {
        currentText = e.key;
        isDefaultText = false;
      } else if (currentText.length < 24) {
        currentText += e.key;
      }
      renderWord();
    }
  });

  const ALL_GLYPHS = "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~¡¢£¤¥¦§¨©ª«¬®¯°±²³´¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿĀāĂăĄąĆćĈĉĊċČčĎďĐđĒēĔĕĖėĘęĚěĜĝĞğĠġĢģĤĥĦħĨĩĪīĬĭĮįİıĲĳĴĵĶķĸĹĺĻļĽľĿŀŁłŃńŅņŇňŉŊŋŌōŎŏŐőŒœŔŕŖŗŘřŚśŜŝŞşŠšŢţŤťŦŧŨũŪūŬŭŮůŰűŲųŴŵŶŷŸŹźŻżŽžſƏƒƗƠơƯưǍǎǏǐǑǒǓǔǕǖǗǘǙǚǛǜǢǣǦǧǨǩǪǫǸǹǺǻǼǽǾǿȀȁȂȃȄȅȆȇȈȉȊȋȌȍȎȏȐȑȒȓȔȕȖȗȘșȚțȲȳȷɄɑəɡɨʉʻʼʾʿˆˇˈˊˋˌ˘˙˚˛˜˝̧̨̛̣̤̦̭̮̱̀́̂̃̄̆̇̈̉̊̋̌̍̏̑͏͘ΔΩμπЀЁЂЃЄЅІЇЈЉЊЋЌЍЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюяѐёђѓєѕіїјљњћќѝўџѢѣѪѫѲѳѴѵҊҋҌҍҎҏҐґҒғҔҕҖҗҘҙҚқҜҝҞҟҠҡҢңҤҥҨҩҪҫҬҭҮүҰұҲҳҴҵҶҷҸҹҺһҼҽҾҿӀӁӂӃӄӅӆӇӈӉӊӋӌӍӎӏӐӑӒӓӔӕӖӗӘәӚӛӜӝӞӟӠӡӢӣӤӥӦӧӨөӪӫӬӭӮӯӰӱӲӳӴӵӶӷӸӹӺӻӼӽӾӿԐԑԒԓԚԛԜԝԤԥԦԧԨԩԮԯ฿ᶰḌḍḎḏḠḡḤḥḪḫḰḱḶḷḸḹḺḻḾḿṀṁṂṃṄṅṆṇṈṉṊṋṚṛṜṝṞṟṠṡṢṣṬṭṮṯẀẁẂẃẄẅẎẏẒẓẗẞẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ‐‑‒–—―‘’‚“”„†‡•…‧‰′″‹›⁂⁃⁄⁰⁴⁵⁶⁷⁸⁹⁺⁽⁾ⁿ₀₁₂₃₄₅₆₇₈₉₍₎₡₤₦₧₪₫€₮₱₲₴₵₸₹₺₽ℓ№℗℠™℮⅛⅜⅝⅞←↑→↓↔↕↖↗↘↙∂∅∏∑−√∞∫≈≠≤≥■□▲△▶▷▼▽◀◁◆◇◊○●◦◻◼☜☞☺❦⬛⬜ꜩꞋꞌ";

  const specimenBlocks = Array.from(document.querySelectorAll('.specimen-text')).map(el => {
    const chars = [];
    const blockData = {
      container: el,
      chars: chars,
      burstUntil: 0,
      isHeld: false
    };

    if (el.id === 'glyphGrid') {

      Array.from(ALL_GLYPHS).forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.className = 'specimen-char';
        charSpan.textContent = char;
        el.appendChild(charSpan);

        chars.push({
          el: charSpan,
          currentGrow: 0,
          isBloomed: false
        });
      });
    } else {

      const htmlContent = el.innerHTML;
      const lines = htmlContent.split(/<br\s*[\/]?>/i);
      el.innerHTML = '';

      lines.forEach((lineHtml, lineIdx) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = lineHtml;
        const lineText = tempDiv.textContent || '';
        const rawWords = lineText.trim().split(/\s+/).filter(w => w.length > 0);
        const totalWords = rawWords.length;
        const clusterStartIndex = Math.max(0, totalWords - 2);
        let clusterSpan = null;

        rawWords.forEach((wordStr, wIndex) => {
          const wordSpan = document.createElement('span');
          wordSpan.className = 'specimen-word';

          Array.from(wordStr).forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'specimen-char';
            charSpan.textContent = char;
            wordSpan.appendChild(charSpan);

            chars.push({
              el: charSpan,
              currentGrow: 0,
              isBloomed: false
            });
          });

          if (wIndex >= clusterStartIndex && totalWords >= 3) {
            if (!clusterSpan) {
              clusterSpan = document.createElement('span');
              clusterSpan.className = 'specimen-nowrap-cluster';
              el.appendChild(clusterSpan);
            }
            clusterSpan.appendChild(wordSpan);
            if (wIndex < totalWords - 1) {
              clusterSpan.appendChild(document.createTextNode('\u00A0'));
            }
          } else {
            el.appendChild(wordSpan);
            if (wIndex < totalWords - 1) {
              el.appendChild(document.createTextNode(' '));
            }
          }
        });

        if (lineIdx < lines.length - 1) {
          el.appendChild(document.createElement('br'));
        }
      });
    }

    if (el.id !== 'glyphGrid') {
      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        blockData.isHeld = true;
        blockData.burstUntil = performance.now() + 1800;
      });

      el.addEventListener('touchstart', (e) => {
        blockData.burstUntil = performance.now() + 1800;
      }, { passive: true });
    }

    return blockData;
  });

  let headlineLettersMetrics = [];

  function updateSpecimenMetrics() {
    const sX = window.scrollX;
    const sY = window.scrollY;

    headlineLettersMetrics = letters.map(letter => {
      const r = letter.getBoundingClientRect();
      return {
        pageX: r.left + sX + r.width / 2,
        pageY: r.top + sY + r.height / 2,
        width: r.width,
        height: r.height
      };
    });

    specimenBlocks.forEach(block => {
      const bRect = block.container.getBoundingClientRect();
      block.pageTop = bRect.top + sY;
      block.pageBottom = bRect.bottom + sY;
      block.chars.forEach(item => {
        const r = item.el.getBoundingClientRect();
        item.pageX = r.left + sX + r.width / 2;
        item.pageY = r.top + sY + r.height / 2;
        item.h = r.height || 22;
      });
    });
  }

  setTimeout(updateSpecimenMetrics, 80);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateSpecimenMetrics);
  }
  window.addEventListener('resize', updateSpecimenMetrics);

  function animate(now) {
    const delta = (now - lastTime) / 1000;
    lastTime = now;

    currentSpeed += (baseSpeed - currentSpeed) * (delta * 0.45);
    time += delta * currentSpeed;

    if (cursorDot && cursorVisible) {
      cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      const rawCursor = (Math.sin(time * 2.5) + 1) / 2;
      const cursorGrow = isMouseDown ? 100 : Math.round(50 + rawCursor * 50);
      cursorDot.style.fontVariationSettings = `'GROW' ${cursorGrow}`;
    }

    const curScrollY = window.scrollY;
    const curScrollX = window.scrollX;

    letters.forEach((letter, i) => {
      const metric = headlineLettersMetrics[i];
      let charCenterX, charCenterY, letterW;

      if (metric) {
        charCenterX = metric.pageX - curScrollX;
        charCenterY = metric.pageY - curScrollY;
        letterW = metric.width;
      } else {
        const rect = letter.getBoundingClientRect();
        charCenterX = rect.left + rect.width / 2;
        charCenterY = rect.top + rect.height / 2;
        letterW = rect.width;
      }

      const dist = Math.hypot(mouseX - charCenterX, mouseY - charCenterY);

      const maxRadius = Math.max(140, letterW * 2.2);
      let proximityInfluence = 0;

      if (cursorVisible && dist < maxRadius) {
        const norm = dist / maxRadius;
        proximityInfluence = 1 - norm;
      }

      const rawPhase = (Math.sin(time - i * phaseDelay) + 1) / 2;
      const naturalWave = rawPhase * 100;

      let localInfluence = proximityInfluence;
      if (isMouseDown && cursorVisible && dist < maxRadius * 1.1) {
        const pressIntensity = Math.max(0, 1 - dist / (maxRadius * 1.1));
        localInfluence = Math.max(localInfluence, pressIntensity * 1.3);
      }

      let targetGrow;
      if (manualSliderActive) {

        targetGrow = Math.max(manualGrowValue, proximityInfluence * 100);
      } else {
        const isHeadlineBurst = headlineIsHeld || (now < headlineBurstUntil);
        targetGrow = naturalWave + (100 - naturalWave) * localInfluence;
        if (isHeadlineBurst || (isMouseDown && cursorVisible && dist < maxRadius * 0.75)) {
          targetGrow = 100;
        }
      }

      if (manualSliderActive) {
        currentGrows[i] += (targetGrow - currentGrows[i]) * 0.45;
      } else {

        if (currentGrows[i] >= 98.5 && canHoldAgain[i]) {
          currentGrows[i] = 100;
          letterPeakHolds[i] = 0.35;
          canHoldAgain[i] = false;
        }

        if (letterPeakHolds[i] > 0) {
          letterPeakHolds[i] -= delta;
          currentGrows[i] = 100;
        } else {
          const isPressingNear = (headlineIsHeld || now < headlineBurstUntil) || (isMouseDown && cursorVisible && dist < maxRadius);
          const lerpSpeed = isPressingNear ? 0.25 : (proximityInfluence > 0.25 ? 0.20 : 0.12);
          currentGrows[i] += (targetGrow - currentGrows[i]) * lerpSpeed;

          if (currentGrows[i] < 75) {
            canHoldAgain[i] = true;
          }
        }
      }

      const val = Math.max(0, Math.min(100, Math.round(currentGrows[i])));
      letter.style.fontVariationSettings = `'GROW' ${val}`;
    });

    if (dlBtn) {
      const physDt = Math.min(delta, 0.04);

      const restoring = -tagGravity * Math.sin(tagAngle * (Math.PI / 180)) * 60;
      tagAngularVel += restoring * physDt;

      tagAngularVel *= Math.pow(tagDamping, physDt * 60);

      tagAngle += tagAngularVel * physDt;
      tagAngle = Math.max(-42, Math.min(42, tagAngle));

      const ambientBreeze = Math.sin(time * 1.5) * 2.2;
      const displayAngle = tagAngle + ambientBreeze;

      dlBtn.style.transform = `rotate(${displayAngle.toFixed(2)}deg)`;
    }

    const winH = window.innerHeight;

    specimenBlocks.forEach(block => {
      const bTop = block.pageTop !== undefined ? (block.pageTop - curScrollY) : block.container.getBoundingClientRect().top;
      const bBottom = block.pageBottom !== undefined ? (block.pageBottom - curScrollY) : block.container.getBoundingClientRect().bottom;

      if (bBottom < -80 || bTop > winH + 80) return;

      const isBlockBurst = block.isHeld || (now < (block.burstUntil || 0));
      const isNearDesktop = (!isTouchDevice) && cursorVisible && (mouseY >= bTop - 180 && mouseY <= bBottom + 180);
      const isVisibleOnMobile = isTouchDevice && (bBottom >= -50 && bTop <= winH + 50);

      if (!isNearDesktop && !isVisibleOnMobile && !isBlockBurst && !manualSliderActive && !block.hasActiveChars) return;

      let stillActive = false;

      block.chars.forEach(item => {
        let target = 0;

        if (manualSliderActive) {

          target = manualGrowValue;
        } else if (isBlockBurst) {

          target = 100;
        } else {
          const cx = item.pageX !== undefined ? (item.pageX - curScrollX) : (item.el.getBoundingClientRect().left + item.el.offsetWidth / 2);
          const cy = item.pageY !== undefined ? (item.pageY - curScrollY) : (item.el.getBoundingClientRect().top + item.el.offsetHeight / 2);
          const ch = item.h || 22;

          if (isTouchDevice) {

            const focalY = winH * 0.50;
            const distFocal = Math.abs(cy - focalY);

            const focalBand = Math.max(90, ch * 1.85);

            if (distFocal < focalBand) {
              const normFocal = distFocal / focalBand;

              target = ((Math.cos(normFocal * Math.PI) + 1) / 2) * 100;
            }

            if (cursorVisible) {
              const t = (110 - Math.min(110, Math.max(18, ch))) / 92;
              const radius = Math.max(65, ch * (1.9 + t * 2.2));
              const effDist = Math.hypot(mouseX - cx, (mouseY - cy) * (1.2 + t * 0.2));
              if (effDist < radius) {
                const norm = effDist / radius;
                const touchProx = ((Math.cos(norm * Math.PI) + 1) / 2) * 100;
                target = Math.max(target, touchProx);
              }
            }
          } else if (isNearDesktop) {

            const t = (110 - Math.min(110, Math.max(18, ch))) / 92;
            const baseMultiplier = 1.9 + t * 2.5;
            const radiusMultiplier = isMouseDown ? baseMultiplier * 1.15 : baseMultiplier;
            const radius = Math.max(56, ch * radiusMultiplier);

            const vSquash = 1.25 + t * 0.35;
            const effDist = Math.hypot(mouseX - cx, (mouseY - cy) * vSquash);

            if (effDist < radius) {
              const norm = effDist / radius;

              const prox = (Math.cos(norm * Math.PI) + 1) / 2;
              target = isMouseDown ? Math.min(100, prox * 140) : prox * 100;
            }
          }
        }

        if (!manualSliderActive) {
          if (target > 15) {
            item.peakTarget = Math.max(item.peakTarget || 0, target);
            item.holdUntil = now + 250 + (target / 100) * 200;
          } else if (now < (item.holdUntil || 0)) {
            target = item.peakTarget || target;
          } else {
            item.peakTarget = 0;
          }
        }

        if (target === 0 && item.currentGrow === 0) return;

        stillActive = true;

        const isSproutingFast = isBlockBurst || (isMouseDown && target > 40);
        const lerpRate = manualSliderActive 
          ? 0.45
          : (target > item.currentGrow 
              ? (isSproutingFast ? 0.22 : 0.16) 
              : 0.045);
        item.currentGrow += (target - item.currentGrow) * lerpRate;

        const shouldBloom = item.currentGrow > 10 || target > 15;
        if (shouldBloom && !item.isBloomed) {
          item.isBloomed = true;
          item.el.classList.add('bloomed');
        } else if (!shouldBloom && item.isBloomed) {
          item.isBloomed = false;
          item.el.classList.remove('bloomed');
        }

        if (item.currentGrow > 0.4 || target > 0) {
          const val = Math.max(0, Math.min(100, Math.round(item.currentGrow)));
          item.el.style.fontVariationSettings = `'GROW' ${val}`;
        } else if (item.currentGrow !== 0) {
          item.currentGrow = 0;
          item.el.style.fontVariationSettings = `'GROW' 0`;
        }
      });

      block.hasActiveChars = stillActive;
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame((now) => {
    lastTime = now;
    animate(now);
  });
});
