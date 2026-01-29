define(['pipAPI', 'pipScorer', 'underscore'], function (APIConstructor, Scorer, _) {
  function stiatExtension(options) {
    var API = new APIConstructor();
    var scorer = new Scorer();
    var piCurrent = API.getCurrent();

    /* =========================
       Mobile（觸控按鈕）核心：把「按鍵」變成「畫面按鈕」
       - 仍然沿用原本的 e / i / space 輸入機制（不改你的參數、不改 scoring）
       - 但在畫面底部顯示兩個等大按鈕，點擊時「模擬」按下 E / I
       - 指示頁用「開始」按鈕，點擊時「模擬」Space
       ========================= */

    function fireKey(key) {
      try {
        var evt = new KeyboardEvent('keydown', {
          key: key,
          code: key === ' ' ? 'Space' : key.toUpperCase(),
          bubbles: true,
          cancelable: true
        });
        document.dispatchEvent(evt);
        window.dispatchEvent(evt);
      } catch (e) {
        // 某些舊瀏覽器：退回用 keyCode
        try {
          var code = key === ' ' ? 32 : key.toUpperCase().charCodeAt(0);
          var evt2 = document.createEvent('Event');
          evt2.initEvent('keydown', true, true);
          evt2.keyCode = code;
          evt2.which = code;
          document.dispatchEvent(evt2);
          window.dispatchEvent(evt2);
        } catch (e2) {}
      }
    }

    function escHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function makeBtnHtml(btnId, label, keyToFire) {
      // 等大、明確點擊區域、避免誤觸：只有按鈕本身可觸發
      var safeLabel = escHtml(label || '');
      return (
        '<div style="width:100%; text-align:center;">' +
        '<button type="button" id="' + btnId + '" ' +
        'style="' +
        'width:100%;' +
        'max-width:420px;' +
        'height:72px;' +
        'border:2px solid #000;' +
        'border-radius:12px;' +
        'background:#fff;' +
        'color:#000;' +
        'font-size:22px;' +
        'font-weight:700;' +
        'letter-spacing:1px;' +
        'touch-action:manipulation;' +
        '-webkit-tap-highlight-color:transparent;' +
        '">' +
        safeLabel +
        '</button>' +
        '<script>(function(){' +
        'var b=document.getElementById("' + btnId + '");' +
        'if(!b)return;' +
        'b.addEventListener("click",function(ev){ev.preventDefault();ev.stopPropagation();(' +
        fireKey.toString() +
        ')(' + JSON.stringify(keyToFire) + ');});' +
        'b.addEventListener("touchstart",function(ev){ev.preventDefault();ev.stopPropagation();});' +
        '})();</script>' +
        '</div>'
      );
    }

    var stiatObj = {
      canvas: {
        maxWidth: 725,
        proportions: 0.7,
        background: '#ffffff',
        borderWidth: 5,
        canvasBackground: '#ffffff',
        borderColor: 'lightblue'
      },

      // 預設（若 task 檔有傳入會覆蓋）
      category: {
        name: 'Category',
        title: { media: { word: 'Category' }, css: { color: '#000', 'font-size': '2em' }, height: 7 },
        media: [{ word: 'A' }],
        css: { color: '#000', 'font-size': '2em' }
      },
      attribute1: {
        name: '可信',
        title: { media: { word: '可信' }, css: { color: '#000', 'font-size': '2em' }, height: 7 },
        media: [{ word: '好' }],
        css: { color: '#000', 'font-size': '2em' }
      },
      attribute2: {
        name: '不可信',
        title: { media: { word: '不可信' }, css: { color: '#000', 'font-size': '2em' }, height: 7 },
        media: [{ word: '差' }],
        css: { color: '#000', 'font-size': '2em' }
      },

      trialsByBlock: [
        { instHTML: '', block: 1, miniBlocks: 1, singleAttTrials: 10, sharedAttTrials: 10, categoryTrials: 0 },
        { instHTML: '', block: 2, miniBlocks: 2, singleAttTrials: 10, sharedAttTrials: 7, categoryTrials: 7 },
        { instHTML: '', block: 3, miniBlocks: 2, singleAttTrials: 10, sharedAttTrials: 7, categoryTrials: 7 },
        { instHTML: '', block: 4, miniBlocks: 2, singleAttTrials: 10, sharedAttTrials: 7, categoryTrials: 7 },
        { instHTML: '', block: 5, miniBlocks: 2, singleAttTrials: 10, sharedAttTrials: 7, categoryTrials: 7 }
      ],

      blockOrder: 'random',
      switchSideBlock: 4,

      base_url: { image: '' },
      ITIDuration: 250,
      fontColor: '#000000',

      // —— 顯示用 ——（mobile 不顯示 Press "E"/"I"）
      leftKeyText: '',
      rightKeyText: '',
      keysCss: { 'font-size': '0.8em', 'font-family': 'arial', color: '#000000' },

      // 分類區「或」字
      orText: '或',
      orCss: { 'font-size': '1.6em', color: '#000000' },

      // —— Mobile 觸控按鈕標籤 ——（可由 task 覆寫）
      touchLeftLabel: '可信',
      touchRightLabel: '不可信',
      touchStartLabel: '開始',
      touchContinueLabel: '繼續',

      // 底部錯誤提示（如你 task 已在上方指示頁寫清楚，這裡也可留空）
      remindErrorText:
        '<p style="text-align:center; font-size:16px; font-family:arial; margin:0;">' +
        '如按錯，畫面會顯示紅色「<b>X</b>」，請改按正確的按鈕後繼續。' +
        '</p>',

      finalText: '已完成。<br/><br/>請按「繼續」。',

      // 這些模板通常會被你 task 的 instHTML 覆蓋；保留中文默認以免漏網
      instTemplatePractice:
        '<div style="font-size:20px; line-height:1.7; font-family:arial;">' +
        '<p style="margin:0 0 12px 0;"><b>第 blockNum／nBlocks 部分</b></p>' +
        '<p style="margin:0 0 12px 0;">請在保持準確的情況下，盡量快速地將詞語歸類。</p>' +
        '<p style="margin:0 0 12px 0;">準備好後，請按下方「開始」。</p>' +
        '</div>',
      instTemplateCategoryRight:
        '<div style="font-size:20px; line-height:1.7; font-family:arial;">' +
        '<p style="margin:0 0 12px 0;"><b>第 blockNum／nBlocks 部分</b></p>' +
        '<p style="margin:0 0 12px 0;">請在保持準確的情況下，盡量快速地將詞語歸類。</p>' +
        '<p style="margin:0 0 12px 0;">準備好後，請按下方「開始」。</p>' +
        '</div>',
      instTemplateCategoryLeft:
        '<div style="font-size:20px; line-height:1.7; font-family:arial;">' +
        '<p style="margin:0 0 12px 0;"><b>第 blockNum／nBlocks 部分</b></p>' +
        '<p style="margin:0 0 12px 0;">請在保持準確的情況下，盡量快速地將詞語歸類。</p>' +
        '<p style="margin:0 0 12px 0;">準備好後，請按下方「開始」。</p>' +
        '</div>',

      // feedback（如你不顯示可留英文或空；不影響 D-score 計算）
      fb_strongAssociationWithAttribute2: '',
      fb_moderateAssociationWithAttribute2: '',
      fb_weakAssociationWithAttribute2: '',
      fb_neutralAssociation: '',
      fb_weakAssociationWithAttribute1: '',
      fb_moderateAssociationWithAttribute1: '',
      fb_strongAssociationWithAttribute1: '',

      manyErrors: '',
      tooFast: '',
      notEnough: ''
    };

    _.extend(piCurrent, _.defaults(options, stiatObj));

    /* ===== Qualtrics hooks ===== */
    API.addSettings('onEnd', window.minnoJS.onEnd);

    API.addSettings('logger', {
      onRow: function (logName, log, settings, ctx) {
        if (!ctx.logs) ctx.logs = [];
        ctx.logs.push(log);
      },
      onEnd: function (name, settings, ctx) {
        return ctx.logs;
      },
      serialize: function (name, logs) {
        var headers = ['block', 'trial', 'cond', 'type', 'cat', 'stim', 'resp', 'err', 'rt', 'd', 'fb', 'bOrd'];
        var myLogs = [];
        for (var iLog = 0; iLog < logs.length; iLog++) {
          if (
            logs[iLog] &&
            logs[iLog].hasOwnProperty('trial_id') &&
            logs[iLog].hasOwnProperty('name') &&
            logs[iLog].hasOwnProperty('responseHandle') &&
            logs[iLog].hasOwnProperty('stimuli') &&
            logs[iLog].hasOwnProperty('media') &&
            logs[iLog].hasOwnProperty('latency') &&
            logs[iLog].data &&
            logs[iLog].data.hasOwnProperty('block') &&
            logs[iLog].data.hasOwnProperty('condition') &&
            logs[iLog].data.hasOwnProperty('score')
          ) {
            myLogs.push(logs[iLog]);
          }
        }

        var content = myLogs.map(function (log) {
          return [
            log.data.block,
            log.trial_id,
            log.data.condition,
            log.name,
            log.stimuli[0],
            log.media[0],
            log.responseHandle,
            log.data.score,
            log.latency,
            '',
            '',
            ''
          ];
        });

        content.push([9, 999, 'end', '', '', '', '', '', '', piCurrent.d, piCurrent.feedback, block2Condition]);

        content.unshift(headers);
        return toCsv(content);

        function toCsv(matrice) {
          return matrice.map(buildRow).join('\n');
        }
        function buildRow(arr) {
          return arr.map(normalize).join(',');
        }
        function normalize(val) {
          var quotableRgx = /(\n|,|")/;
          if (quotableRgx.test(val)) return '"' + String(val).replace(/"/g, '""') + '"';
          return String(val);
        }
      },
      send: function (name, serialized) {
        window.minnoJS.logger(serialized);
      }
    });

    /* =========================
       Script starts
       ========================= */

    var attribute1 = piCurrent.attribute1.name;
    var attribute2 = piCurrent.attribute2.name;
    var category = piCurrent.category.name;

    var block2Condition;

    /* ===== Layouts（重點：把觸控按鈕加入每個 trial layout）===== */

    var touchLeftStim = {
      location: { left: 18, bottom: 3 },
      css: { width: '46%' },
      media: { html: makeBtnHtml('minno-touch-left', piCurrent.touchLeftLabel || attribute1, 'e') }
    };
    var touchRightStim = {
      location: { right: 18, bottom: 3 },
      css: { width: '46%' },
      media: { html: makeBtnHtml('minno-touch-right', piCurrent.touchRightLabel || attribute2, 'i') }
    };

    var touchStartStim = {
      location: { center: 0, bottom: 3 },
      css: { width: '70%' },
      media: { html: makeBtnHtml('minno-touch-start', piCurrent.touchStartLabel || '開始', ' ') }
    };

    var touchContinueStim = {
      location: { center: 0, bottom: 3 },
      css: { width: '70%' },
      media: { html: makeBtnHtml('minno-touch-continue', piCurrent.touchContinueLabel || '繼續', ' ') }
    };

    // Trials layout（上方標籤）
    var leftLayout = [
      { location: { left: 6, top: 1 }, media: { word: '' }, css: piCurrent.keysCss },
      { location: { right: 6, top: 1 }, media: { word: '' }, css: piCurrent.keysCss },
      { location: { left: 6, top: 4 }, media: piCurrent.attribute1.title.media, css: piCurrent.attribute1.title.css },
      { location: { right: 6, top: 4 }, media: piCurrent.attribute2.title.media, css: piCurrent.attribute2.title.css },
      { location: { left: 6, top: 4 + (piCurrent.attribute1.title.height | 3) }, media: { word: piCurrent.orText }, css: piCurrent.orCss },
      { location: { left: 6, top: 11 + (piCurrent.attribute1.title.height | 3) }, media: piCurrent.category.title.media, css: piCurrent.category.title.css }
    ];

    var rightLayout = [
      { location: { left: 6, top: 1 }, media: { word: '' }, css: piCurrent.keysCss },
      { location: { right: 6, top: 1 }, media: { word: '' }, css: piCurrent.keysCss },
      { location: { left: 6, top: 4 }, media: piCurrent.attribute1.title.media, css: piCurrent.attribute1.title.css },
      { location: { right: 6, top: 4 }, media: piCurrent.attribute2.title.media, css: piCurrent.attribute2.title.css },
      { location: { right: 6, top: 4 + (piCurrent.attribute2.title.height | 3) }, media: { word: piCurrent.orText }, css: piCurrent.orCss },
      { location: { right: 6, top: 11 + (piCurrent.attribute2.title.height | 3) }, media: piCurrent.category.title.media, css: piCurrent.category.title.css }
    ];

    var pracLayout = [
      { location: { left: 6, top: 1 }, media: { word: '' }, css: piCurrent.keysCss },
      { location: { right: 6, top: 1 }, media: { word: '' }, css: piCurrent.keysCss },
      { location: { left: 6, top: 4 }, media: piCurrent.attribute1.title.media, css: piCurrent.attribute1.title.css },
      { location: { right: 6, top: 4 }, media: piCurrent.attribute2.title.media, css: piCurrent.attribute2.title.css }
    ];

    var reminderStimulus = {
      location: { bottom: 11 },
      css: { color: piCurrent.fontColor, 'font-size': '1em' },
      media: { html: piCurrent.remindErrorText }
    };

    function addTouchToLayout(layoutArr) {
      // 每個 trial 都加兩個底部按鈕（等大）
      // 注意：Minno layout 會把 html 直接放進 canvas；按鈕 click 會模擬 keydown
      return layoutArr.concat([touchLeftStim, touchRightStim]);
    }

    API.addSettings('canvas', piCurrent.canvas);
    API.addSettings('base_url', piCurrent.base_url);

    /* ===== Trial: sort（仍用 keypressed：由按鈕模擬鍵盤事件）===== */
    API.addTrialSets('sort', {
      data: { score: 0, parcel: 'first' },
      input: [
        { handle: 'skip1', on: 'keypressed', key: 27 }, // Esc
        { handle: 'left', on: 'keypressed', key: 'e' },
        { handle: 'right', on: 'keypressed', key: 'i' }
      ],
      interactions: [
        { conditions: [{ type: 'begin' }], actions: [{ type: 'showStim', handle: 'targetStim' }] },

        {
          conditions: [
            { type: 'inputEqualsTrial', property: 'corResp', negate: true },
            { type: 'inputEquals', value: ['right', 'left'] }
          ],
          actions: [
            { type: 'showStim', handle: 'error' },
            { type: 'setTrialAttr', setter: { score: 1 } }
          ]
        },

        {
          conditions: [{ type: 'inputEqualsTrial', property: 'corResp' }],
          actions: [
            { type: 'removeInput', handle: ['left', 'right'] },
            { type: 'hideStim', handle: 'All' },
            { type: 'log' },
            { type: 'setInput', input: { handle: 'end', on: 'timeout', duration: piCurrent.ITIDuration } }
          ]
        },

        { conditions: [{ type: 'inputEquals', value: 'end' }], actions: [{ type: 'endTrial' }] },

        { conditions: [{ type: 'inputEquals', value: 'skip1' }], actions: [{ type: 'setInput', input: { handle: 'skip2', on: 'enter' } }] },
        {
          conditions: [{ type: 'inputEquals', value: 'skip2' }],
          actions: [{ type: 'goto', destination: 'nextWhere', properties: { blockStart: true } }, { type: 'endTrial' }]
        }
      ]
    });

    /* ===== Trial: instructions（改成「開始」按鈕；按鈕模擬 Space）===== */
    API.addTrialSets('instructions', [
      {
        data: { blockStart: true, block: 0, condition: 'inst', score: 0 },
        input: [{ handle: 'space', on: 'space' }],
        interactions: [
          { conditions: [{ type: 'begin' }], actions: [{ type: 'showStim', handle: 'All' }] },
          {
            conditions: [{ type: 'inputEquals', value: 'space' }],
            actions: [
              { type: 'hideStim', handle: 'All' },
              { type: 'log' },
              { type: 'trigger', handle: 'endTrial', duration: 300 }
            ]
          },
          { conditions: [{ type: 'inputEquals', value: 'endTrial' }], actions: [{ type: 'endTrial' }] }
        ]
      }
    ]);

    /* ===== Basic trials ===== */
    API.addTrialSets({
      leftAtt1: [
        {
          inherit: 'sort',
          data: { corResp: 'left' },
          stimuli: [{ inherit: { type: 'exRandom', set: 'attribute1' } }, { inherit: { set: 'error' } }]
        }
      ],
      rightAtt2: [
        {
          inherit: 'sort',
          data: { corResp: 'right' },
          stimuli: [{ inherit: { type: 'exRandom', set: 'attribute2' } }, { inherit: { set: 'error' } }]
        }
      ],
      leftCat: [
        {
          inherit: 'sort',
          data: { corResp: 'left' },
          stimuli: [{ inherit: { type: 'exRandom', set: 'category' } }, { inherit: { set: 'error' } }]
        }
      ],
      rightCat: [
        {
          inherit: 'sort',
          data: { corResp: 'right' },
          stimuli: [{ inherit: { type: 'exRandom', set: 'category' } }, { inherit: { set: 'error' } }]
        }
      ]
    });

    /* ===== Stimulus Sets ===== */
    API.addStimulusSets({
      Default: [{ css: { color: 'white', 'font-size': '2em' } }],
      instructions: [{ css: { 'font-size': '1.4em', color: 'black', lineHeight: 1.2 }, nolog: true, location: { bottom: 16 } }],

      attribute1: [
        {
          data: { alias: attribute1, handle: 'targetStim' },
          inherit: 'Default',
          css: piCurrent.attribute1.css,
          media: { inherit: { type: 'exRandom', set: 'attribute1' } }
        }
      ],
      attribute2: [
        {
          data: { alias: attribute2, handle: 'targetStim' },
          inherit: 'Default',
          css: piCurrent.attribute2.css,
          media: { inherit: { type: 'exRandom', set: 'attribute2' } }
        }
      ],
      category: [
        {
          data: { alias: category, handle: 'targetStim' },
          inherit: 'Default',
          css: piCurrent.category.css,
          media: { inherit: { type: 'exRandom', set: 'category' } }
        }
      ],

      error: [{ data: { handle: 'error' }, location: { top: 70 }, css: { color: 'red', 'font-size': '4em' }, media: { word: 'X' }, nolog: true }],

      dummyForLog: [{ data: { name: 'dummyForLog', alias: 'dummyForLog' }, location: { left: 99 }, media: { word: ' ' } }]
    });

    /* ===== Media Sets ===== */
    API.addMediaSets({
      attribute1: piCurrent.attribute1.media,
      attribute2: piCurrent.attribute2.media,
      category: piCurrent.category.media
    });

    /* ===== Instruction helpers ===== */
    function getInstFromTemplate(inText, blockNum, nBlocks) {
      var retText = inText.replace(/attribute1/g, attribute1);
      retText = retText.replace(/attribute2/g, attribute2);
      retText = retText.replace(/thecategory/g, category);
      retText = retText.replace(/blockNum/g, blockNum);
      retText = retText.replace(/nBlocks/g, nBlocks);
      return retText;
    }

    function getInstHTML(params) {
      var instHTML = '';
      if (params.isPractice) instHTML = getInstFromTemplate(piCurrent.instTemplatePractice, params.blockNum, params.nBlocks);
      else if (params.categorySide === 'rightCat') instHTML = getInstFromTemplate(piCurrent.instTemplateCategoryRight, params.blockNum, params.nBlocks);
      else if (params.categorySide === 'leftCat') instHTML = getInstFromTemplate(piCurrent.instTemplateCategoryLeft, params.blockNum, params.nBlocks);
      return instHTML;
    }

    /* ===== Build sequence ===== */
    var trialSequence = [];

    var firstCatSide = 'leftCat';
    if (piCurrent.blockOrder === 'startRight') firstCatSide = 'rightCat';
    else if (piCurrent.blockOrder === 'random') firstCatSide = Math.random() < 0.5 ? 'rightCat' : 'leftCat';

    var catSide = '';

    for (var iBlock = 1; iBlock <= piCurrent.trialsByBlock.length; iBlock++) {
      var isPrac = false;
      var currentCondition = '';
      var blockLayout;

      if (piCurrent.trialsByBlock[iBlock - 1].categoryTrials === 0) {
        isPrac = true;
      } else if (catSide !== 'rightCat' && catSide !== 'leftCat') {
        catSide = firstCatSide;
      } else if (piCurrent.switchSideBlock === iBlock || piCurrent.switchSideBlock <= 0) {
        catSide = catSide === 'rightCat' ? 'leftCat' : 'rightCat';
      }

      if (isPrac) {
        blockLayout = pracLayout;
        currentCondition = attribute1 + ',' + attribute2;
      } else if (catSide === 'leftCat') {
        blockLayout = leftLayout;
        currentCondition = category + '/' + attribute1 + ',' + attribute2;
      } else {
        blockLayout = rightLayout;
        currentCondition = attribute1 + ',' + attribute2 + '/' + category;
      }

      if (iBlock === 2) block2Condition = currentCondition;

      var singleAttribute = catSide === 'rightCat' ? 'leftAtt1' : 'rightAtt2';
      var catAttribute = singleAttribute === 'leftAtt1' ? 'rightAtt2' : 'leftAtt1';

      var instHTML = piCurrent.trialsByBlock[iBlock - 1].instHTML;
      if (instHTML === '') {
        instHTML = getInstHTML({
          blockNum: iBlock,
          nBlocks: piCurrent.trialsByBlock.length,
          isPractice: isPrac,
          categorySide: catSide
        });
      }

      // Instructions trial：顯示「開始」按鈕（點擊=Space）
      trialSequence.push({
        inherit: 'instructions',
        data: { blockStart: true },
        layout: [{ media: { word: '' } }],
        stimuli: [
          { inherit: 'instructions', media: { html: instHTML } },
          {
            data: { handle: 'touchStart', alias: 'touchStart' },
            nolog: true,
            location: { bottom: 3 },
            css: { width: '70%' },
            media: { html: makeBtnHtml('minno-touch-start-' + iBlock, piCurrent.touchStartLabel || '開始', ' ') }
          }
        ]
      });

      for (var iMini = 1; iMini <= piCurrent.trialsByBlock[iBlock - 1].miniBlocks; iMini++) {
        var mixer = {
          mixer: 'random',
          data: [
            {
              mixer: 'repeat',
              times: piCurrent.trialsByBlock[iBlock - 1].singleAttTrials,
              data: [
                {
                  inherit: singleAttribute,
                  data: { condition: currentCondition, block: iBlock },
                  layout: addTouchToLayout(blockLayout).concat(reminderStimulus)
                }
              ]
            },
            {
              mixer: 'repeat',
              times: piCurrent.trialsByBlock[iBlock - 1].sharedAttTrials,
              data: [
                {
                  inherit: catAttribute,
                  data: { condition: currentCondition, block: iBlock },
                  layout: addTouchToLayout(blockLayout).concat(reminderStimulus)
                }
              ]
            }
          ]
        };

        if (!isPrac) {
          mixer.data.push({
            mixer: 'repeat',
            times: piCurrent.trialsByBlock[iBlock - 1].categoryTrials,
            data: [
              {
                inherit: catSide,
                data: { condition: currentCondition, block: iBlock },
                layout: addTouchToLayout(blockLayout).concat(reminderStimulus)
              }
            ]
          });
        }

        trialSequence.push(mixer);
      }
    }

    // Final screen：顯示「繼續」按鈕（點擊=Space）
    trialSequence.push({
      inherit: 'instructions',
      data: { blockStart: true },
      layout: [{ media: { word: '' } }],
      stimuli: [
        {
          inherit: 'instructions',
          css: { color: piCurrent.fontColor },
          media: { html: '<div style="font-size:26px; line-height:1.6; font-family:arial;">' + piCurrent.finalText + '</div>' }
        },
        {
          data: { handle: 'touchContinue', alias: 'touchContinue' },
          nolog: true,
          location: { bottom: 3 },
          css: { width: '70%' },
          media: { html: makeBtnHtml('minno-touch-continue-final', piCurrent.touchContinueLabel || '繼續', ' ') }
        }
      ]
    });

    API.addSequence(trialSequence);

    /* ===== Scoring ===== */
    scorer.addSettings('compute', {
      ErrorVar: 'score',
      condVar: 'condition',
      cond1VarValues: [category + '/' + attribute1 + ',' + attribute2],
      cond2VarValues: [attribute1 + ',' + attribute2 + '/' + category],
      parcelVar: 'parcel',
      parcelValue: ['first'],
      fastRT: 150,
      maxFastTrialsRate: 0.1,
      minRT: 400,
      maxRT: 10000,
      errorLatency: { use: 'latency', penalty: 600, useForSTD: true },
      postSettings: { score: 'score', msg: 'feedback', url: '/implicit/scorer' }
    });

    // feedback messages（如你不使用可留空）
    scorer.addSettings('message', { MessageDef: [{ cut: '5', message: '' }] });

    API.addSettings('hooks', {
      endTask: function () {
        var DScoreObj = scorer.computeD();
        piCurrent.feedback = DScoreObj.FBMsg;
        piCurrent.d = DScoreObj.DScore;
        window.minnoJS.onEnd();
      }
    });

    return API.script;
  }

  return stiatExtension;
});
