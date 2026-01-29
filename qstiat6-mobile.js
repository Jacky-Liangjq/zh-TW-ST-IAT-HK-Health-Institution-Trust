/* qstiat6-mobile.js
   Mobile-only ST-IAT Qualtrics extension:
   - No keyboard required
   - No “tap anywhere” input
   - Only accepts clicks on two fixed-size on-screen buttons
   - Buttons are strictly equal width/height (prevents bias)
   - Start/Continue use a single on-screen button (no space key)
   - Keeps your trialsByBlock parameters unchanged (you set them in task file)
*/

define(['pipAPI', 'pipScorer', 'underscore'], function (APIConstructor, Scorer, _) {
  function stiatExtension(options) {
    var API = new APIConstructor();
    var scorer = new Scorer();
    var piCurrent = API.getCurrent();

    var stiatObj = {
      canvas: {
        maxWidth: 725,
        proportions: 0.7,
        background: '#ffffff',
        borderWidth: 0,
        canvasBackground: '#ffffff',
        borderColor: '#ffffff'
      },

      // These get overridden by your task file
      category: {
        name: 'Category',
        title: { media: { word: 'Category' }, css: { color: '#000', 'font-size': '2em' }, height: 4 },
        media: [],
        css: { color: '#000', 'font-size': '2em' }
      },
      attribute1: {
        name: 'Attribute1',
        title: { media: { word: 'Attribute1' }, css: { color: '#000', 'font-size': '2em' }, height: 4 },
        media: [],
        css: { color: '#000', 'font-size': '2em' }
      },
      attribute2: {
        name: 'Attribute2',
        title: { media: { word: 'Attribute2' }, css: { color: '#000', 'font-size': '2em' }, height: 4 },
        media: [],
        css: { color: '#000', 'font-size': '2em' }
      },

      // You set these in your task file; do not change here
      trialsByBlock: [],
      blockOrder: 'random',
      switchSideBlock: 4,

      base_url: { image: '' },
      ITIDuration: 250,
      fontColor: '#000000',

      // Top labels (we will sync them to the dynamic button labels per block)
      leftKeyText: '左邊',
      rightKeyText: '右邊',
      keysCss: { 'font-size': '1.05em', 'font-family': 'arial', color: '#000000', 'font-weight': '600' },

      orText: '或',
      orCss: { 'font-size': '1.4em', color: '#000000', 'font-weight': '600' },

      remindErrorText:
        '<p align="center" style="font-size:0.95em; font-family:arial; margin:0;">' +
        '如按錯，畫面會顯示紅色 <b style="color:#ff0000;">X</b>，請改按正確一邊後繼續。' +
        '</p>',

      finalText: '已經完成任務。<br/><br/>請按「繼續」。',

      // ===== Mobile buttons (EQUAL SIZE) =====
      touchButtons: {
        // fallback labels (usually you override dynamically per block)
        leftLabel: '可信',
        rightLabel: '不可信',
        startLabel: '開始',
        continueLabel: '繼續',

        // IMPORTANT: same css object is used for BOTH left and right buttons
        // so they are guaranteed to be identical size.
        css: {
          width: '40vw',
          height: '14vh',
          minHeight: '90px',
          maxHeight: '120px',
          background: '#f5f5f5',
          border: '2px solid #333',
          borderRadius: '12px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: '700',
          lineHeight: '1.25',
          color: '#000',
          boxSizing: 'border-box'
        },

        startCss: {
          width: '60vw',
          height: '10vh',
          minHeight: '70px',
          maxHeight: '110px',
          background: '#f5f5f5',
          border: '2px solid #333',
          borderRadius: '12px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          fontWeight: '700',
          lineHeight: '1.25',
          color: '#000',
          boxSizing: 'border-box'
        }
      },

      // Feedback strings (usually you keep empty for research use)
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

    // Merge defaults + your options
    _.extend(piCurrent, _.defaults(options, stiatObj));

    // Qualtrics hook
    API.addSettings('onEnd', window.minnoJS.onEnd);

    var attribute1 = piCurrent.attribute1.name;
    var attribute2 = piCurrent.attribute2.name;
    var category = piCurrent.category.name;

    // block-order condition saved into explicit table
    var block2Condition;

    // ====== Layouts ======
    var leftLayout = [
      { location: { left: 6, top: 1 }, media: { word: piCurrent.leftKeyText }, css: piCurrent.keysCss },
      { location: { right: 6, top: 1 }, media: { word: piCurrent.rightKeyText }, css: piCurrent.keysCss },
      { location: { left: 6, top: 4 }, media: piCurrent.attribute1.title.media, css: piCurrent.attribute1.title.css },
      { location: { right: 6, top: 4 }, media: piCurrent.attribute2.title.media, css: piCurrent.attribute2.title.css },
      { location: { left: 6, top: 4 + (piCurrent.attribute1.title.height | 3) }, media: { word: piCurrent.orText }, css: piCurrent.orCss },
      { location: { left: 6, top: 11 + (piCurrent.attribute1.title.height | 3) }, media: piCurrent.category.title.media, css: piCurrent.category.title.css }
    ];
    var rightLayout = [
      { location: { left: 6, top: 1 }, media: { word: piCurrent.leftKeyText }, css: piCurrent.keysCss },
      { location: { right: 6, top: 1 }, media: { word: piCurrent.rightKeyText }, css: piCurrent.keysCss },
      { location: { left: 6, top: 4 }, media: piCurrent.attribute1.title.media, css: piCurrent.attribute1.title.css },
      { location: { right: 6, top: 4 }, media: piCurrent.attribute2.title.media, css: piCurrent.attribute2.title.css },
      { location: { right: 6, top: 4 + (piCurrent.attribute2.title.height | 3) }, media: { word: piCurrent.orText }, css: piCurrent.orCss },
      { location: { right: 6, top: 11 + (piCurrent.attribute2.title.height | 3) }, media: piCurrent.category.title.media, css: piCurrent.category.title.css }
    ];
    var pracLayout = [
      { location: { left: 6, top: 1 }, media: { word: piCurrent.leftKeyText }, css: piCurrent.keysCss },
      { location: { right: 6, top: 1 }, media: { word: piCurrent.rightKeyText }, css: piCurrent.keysCss },
      { location: { left: 6, top: 4 }, media: piCurrent.attribute1.title.media, css: piCurrent.attribute1.title.css },
      { location: { right: 6, top: 4 }, media: piCurrent.attribute2.title.media, css: piCurrent.attribute2.title.css }
    ];

    var reminderStimulus = {
      location: { bottom: 1 },
      css: { color: piCurrent.fontColor, 'font-size': '1em' },
      media: { html: piCurrent.remindErrorText }
    };

    API.addSettings('canvas', piCurrent.canvas);
    API.addSettings('base_url', piCurrent.base_url);

    // ====== Stimulus Sets ======
    API.addStimulusSets({
      Default: [{ css: { color: '#000000', 'font-size': '2em' } }],
      instructions: [{ css: { 'font-size': '1.35em', color: '#000000', lineHeight: 1.3 }, nolog: true, location: { bottom: 1 } }],

      attribute1: [{
        data: { alias: attribute1, handle: 'targetStim' },
        inherit: 'Default',
        css: piCurrent.attribute1.css,
        media: { inherit: { type: 'exRandom', set: 'attribute1' } }
      }],
      attribute2: [{
        data: { alias: attribute2, handle: 'targetStim' },
        inherit: 'Default',
        css: piCurrent.attribute2.css,
        media: { inherit: { type: 'exRandom', set: 'attribute2' } }
      }],
      category: [{
        data: { alias: category, handle: 'targetStim' },
        inherit: 'Default',
        css: piCurrent.category.css,
        media: { inherit: { type: 'exRandom', set: 'category' } }
      }],

      error: [{
        data: { handle: 'error' },
        location: { top: 70 },
        css: { color: 'red', 'font-size': '4em' },
        media: { word: 'X' },
        nolog: true
      }],

      // ===== Touch buttons (equal size for left & right) =====
      touchLeftBtn: [{
        data: { handle: 'touchLeftBtn' },
        nolog: true,
        location: { left: 8, bottom: 8 },
        css: piCurrent.touchButtons.css,
        media: {
          html: function () {
            var txt = piCurrent.touchLeftDynamicLabel || piCurrent.touchButtons.leftLabel || '左';
            return (
              '<div style="width:100%;text-align:center;padding:0 8px;word-break:break-word;">' +
              '<b>' + txt + '</b>' +
              '</div>'
            );
          }
        }
      }],
      touchRightBtn: [{
        data: { handle: 'touchRightBtn' },
        nolog: true,
        location: { right: 8, bottom: 8 },
        css: piCurrent.touchButtons.css,
        media: {
          html: function () {
            var txt = piCurrent.touchRightDynamicLabel || piCurrent.touchButtons.rightLabel || '右';
            return (
              '<div style="width:100%;text-align:center;padding:0 8px;word-break:break-word;">' +
              '<b>' + txt + '</b>' +
              '</div>'
            );
          }
        }
      }],

      // Start / Continue button (single)
      touchStartBtn: [{
        data: { handle: 'touchStartBtn' },
        nolog: true,
        location: { center: 0, bottom: 8 },
        css: piCurrent.touchButtons.startCss || piCurrent.touchButtons.css,
        media: {
          html: function () {
            var txt = piCurrent.touchButtons.startLabel || '開始';
            return '<div style="width:100%;text-align:center;"><b>' + txt + '</b></div>';
          }
        }
      }],
      touchContinueBtn: [{
        data: { handle: 'touchContinueBtn' },
        nolog: true,
        location: { center: 0, bottom: 8 },
        css: piCurrent.touchButtons.startCss || piCurrent.touchButtons.css,
        media: {
          html: function () {
            var txt = piCurrent.touchButtons.continueLabel || '繼續';
            return '<div style="width:100%;text-align:center;"><b>' + txt + '</b></div>';
          }
        }
      }],

      dummyForLog: [{
        data: { name: 'dummyForLog', alias: 'dummyForLog' },
        location: { left: 99 },
        media: { word: ' ' }
      }]
    });

    // ====== Media Sets ======
    API.addMediaSets({
      attribute1: piCurrent.attribute1.media,
      attribute2: piCurrent.attribute2.media,
      category: piCurrent.category.media
    });

    // ====== Trial Sets ======
    // NOTE: No full-screen touch input. Only the button stims produce input.
    API.addTrialSets('sort', {
      data: { score: 0, parcel: 'first' },
      input: [
        { handle: 'skip1', on: 'keypressed', key: 27 }, // debug only; harmless on mobile
        { handle: 'left', on: 'click', stimHandle: 'touchLeftBtn' },
        { handle: 'right', on: 'click', stimHandle: 'touchRightBtn' }
      ],
      interactions: [
        { conditions: [{ type: 'begin' }], actions: [{ type: 'showStim', handle: 'targetStim' }] },

        // Error
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

        // Correct
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

        // Skip block (debug)
        { conditions: [{ type: 'inputEquals', value: 'skip1' }], actions: [{ type: 'setInput', input: { handle: 'skip2', on: 'enter' } }] },
        {
          conditions: [{ type: 'inputEquals', value: 'skip2' }],
          actions: [
            { type: 'goto', destination: 'nextWhere', properties: { blockStart: true } },
            { type: 'endTrial' }
          ]
        }
      ]
    });

    // Instructions: only Start button (no space key)
    API.addTrialSets('instructions', [{
      data: { blockStart: true, block: 0, condition: 'inst', score: 0 },
      input: [{ handle: 'go', on: 'click', stimHandle: 'touchStartBtn' }],
      interactions: [
        { conditions: [{ type: 'begin' }], actions: [{ type: 'showStim', handle: 'All' }] },
        {
          conditions: [{ type: 'inputEquals', value: 'go' }],
          actions: [
            { type: 'hideStim', handle: 'All' },
            { type: 'log' },
            { type: 'trigger', handle: 'endTrial', duration: 200 }
          ]
        },
        { conditions: [{ type: 'inputEquals', value: 'endTrial' }], actions: [{ type: 'endTrial' }] }
      ]
    }]);

    // Basic trial templates
    API.addTrialSets({
      leftAtt1: [{
        inherit: 'sort',
        data: { corResp: 'left' },
        stimuli: [{ inherit: { type: 'exRandom', set: 'attribute1' } }, { inherit: { set: 'error' } }]
      }],
      rightAtt2: [{
        inherit: 'sort',
        data: { corResp: 'right' },
        stimuli: [{ inherit: { type: 'exRandom', set: 'attribute2' } }, { inherit: { set: 'error' } }]
      }],
      leftCat: [{
        inherit: 'sort',
        data: { corResp: 'left' },
        stimuli: [{ inherit: { type: 'exRandom', set: 'category' } }, { inherit: { set: 'error' } }]
      }],
      rightCat: [{
        inherit: 'sort',
        data: { corResp: 'right' },
        stimuli: [{ inherit: { type: 'exRandom', set: 'category' } }, { inherit: { set: 'error' } }]
      }]
    });

    // ===== Logger (CSV, same idea as your desktop version) =====
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
        for (var i = 0; i < logs.length; i++) {
          if (logs[i] && logs[i].data && logs[i].data.hasOwnProperty('block')) myLogs.push(logs[i]);
        }

        var content = myLogs.map(function (log) {
          return [
            log.data.block,
            log.trial_id,
            log.data.condition,
            log.name,
            (log.stimuli && log.stimuli[0]) ? log.stimuli[0] : '',
            (log.media && log.media[0]) ? log.media[0] : '',
            log.responseHandle || '',
            log.data.score,
            log.latency,
            '',
            '',
            ''
          ];
        });

        // end row
        content.push([9, 999, 'end', '', '', '', '', '', '', piCurrent.d, piCurrent.feedback, block2Condition]);

        content.unshift(headers);
        return toCsv(content);

        function toCsv(m) { return m.map(buildRow).join('\n'); }
        function buildRow(arr) { return arr.map(normalize).join(','); }
        function normalize(val) {
          val = (val === null || val === undefined) ? '' : String(val);
          if (/(\n|,|")/.test(val)) return '"' + val.replace(/"/g, '""') + '"';
          return val;
        }
      },
      send: function (name, serialized) {
        window.minnoJS.logger(serialized);
      }
    });

    // ===== Sequence builder =====
    function getInstFromTemplate(inText, blockNum, nBlocks) {
      var t = inText.replace(/attribute1/g, attribute1);
      t = t.replace(/attribute2/g, attribute2);
      t = t.replace(/thecategory/g, category);
      t = t.replace(/blockNum/g, blockNum);
      t = t.replace(/nBlocks/g, nBlocks);
      return t;
    }

    function getInstHTML(params) {
      var instHTML = '';
      if (params.isPractice) {
        instHTML = getInstFromTemplate(piCurrent.instTemplatePractice || '', params.blockNum, params.nBlocks);
      } else if (params.categorySide == 'rightCat') {
        instHTML = getInstFromTemplate(piCurrent.instTemplateCategoryRight || '', params.blockNum, params.nBlocks);
      } else if (params.categorySide == 'leftCat') {
        instHTML = getInstFromTemplate(piCurrent.instTemplateCategoryLeft || '', params.blockNum, params.nBlocks);
      }
      return instHTML;
    }

    var trialSequence = [];

    // blockOrder
    var firstCatSide = 'leftCat';
    if (piCurrent.blockOrder == 'startRight') firstCatSide = 'rightCat';
    else if (piCurrent.blockOrder == 'random') firstCatSide = (Math.random() < 0.5) ? 'rightCat' : 'leftCat';

    var catSide = '';
    for (var iBlock = 1; iBlock <= piCurrent.trialsByBlock.length; iBlock++) {
      var isPrac = false;
      var currentCondition = '';
      var blockLayout;

      if (piCurrent.trialsByBlock[iBlock - 1].categoryTrials === 0) {
        isPrac = true;
      } else if (catSide != 'rightCat' && catSide != 'leftCat') {
        catSide = firstCatSide;
      } else if (piCurrent.switchSideBlock == iBlock || piCurrent.switchSideBlock <= 0) {
        catSide = (catSide == 'rightCat') ? 'leftCat' : 'rightCat';
      }

      var singleAttribute, catAttribute;

      if (isPrac) {
        blockLayout = pracLayout;
        currentCondition = attribute1 + ',' + attribute2;
      } else if (catSide == 'leftCat') {
        blockLayout = leftLayout;
        singleAttribute = 'rightAtt2';
        catAttribute = 'leftAtt1';
        currentCondition = category + '/' + attribute1 + ',' + attribute2;
      } else {
        blockLayout = rightLayout;
        singleAttribute = 'leftAtt1';
        catAttribute = 'rightAtt2';
        currentCondition = attribute1 + ',' + attribute2 + '/' + category;
      }

      if (iBlock === 2) block2Condition = currentCondition;

      // ===== Dynamic button labels per block (recommended) =====
      // Practice: left=attribute1, right=attribute2
      // Combined: show "category 或 attribute" on the side where category appears
      if (isPrac) {
        piCurrent.touchLeftDynamicLabel = piCurrent.attribute1.name;
        piCurrent.touchRightDynamicLabel = piCurrent.attribute2.name;
      } else if (catSide === 'leftCat') {
        piCurrent.touchLeftDynamicLabel = piCurrent.category.name + ' 或 ' + piCurrent.attribute1.name;
        piCurrent.touchRightDynamicLabel = piCurrent.attribute2.name;
      } else {
        piCurrent.touchLeftDynamicLabel = piCurrent.attribute1.name;
        piCurrent.touchRightDynamicLabel = piCurrent.attribute2.name + ' 或 ' + piCurrent.category.name;
      }

      // Sync top labels too (so participants see exactly the same mapping)
      piCurrent.leftKeyText = piCurrent.touchLeftDynamicLabel;
      piCurrent.rightKeyText = piCurrent.touchRightDynamicLabel;

      // refresh layouts’ top labels (because leftLayout/rightLayout were created once)
      leftLayout[0].media.word = piCurrent.leftKeyText;
      leftLayout[1].media.word = piCurrent.rightKeyText;
      rightLayout[0].media.word = piCurrent.leftKeyText;
      rightLayout[1].media.word = piCurrent.rightKeyText;
      pracLayout[0].media.word = piCurrent.leftKeyText;
      pracLayout[1].media.word = piCurrent.rightKeyText;

      // Instructions HTML for this block (you supply instHTML per block in your task)
      var instHTML = piCurrent.trialsByBlock[iBlock - 1].instHTML;
      if (instHTML === '') {
        instHTML = getInstHTML({
          blockNum: iBlock,
          nBlocks: piCurrent.trialsByBlock.length,
          isPractice: isPrac,
          categorySide: catSide
        });
      }

      // Instructions trial: shows Start button (no space key)
      trialSequence.push({
        inherit: 'instructions',
        data: { blockStart: true },
        layout: blockLayout,
        stimuli: [
          { inherit: 'instructions', media: { html: instHTML } },
          { inherit: { set: 'touchStartBtn' } }
        ]
      });

      // Mini-blocks
      for (var iMini = 1; iMini <= piCurrent.trialsByBlock[iBlock - 1].miniBlocks; iMini++) {
        var mixer = {
          mixer: 'random',
          data: [
            {
              mixer: 'repeat',
              times: piCurrent.trialsByBlock[iBlock - 1].singleAttTrials,
              data: [{
                inherit: singleAttribute,
                data: { condition: currentCondition, block: iBlock },
                layout: blockLayout
                  .concat(reminderStimulus)
                  .concat([{ inherit: { set: 'touchLeftBtn' } }, { inherit: { set: 'touchRightBtn' } }])
              }]
            },
            {
              mixer: 'repeat',
              times: piCurrent.trialsByBlock[iBlock - 1].sharedAttTrials,
              data: [{
                inherit: catAttribute,
                data: { condition: currentCondition, block: iBlock },
                layout: blockLayout
                  .concat(reminderStimulus)
                  .concat([{ inherit: { set: 'touchLeftBtn' } }, { inherit: { set: 'touchRightBtn' } }])
              }]
            }
          ]
        };

        if (!isPrac) {
          mixer.data.push({
            mixer: 'repeat',
            times: piCurrent.trialsByBlock[iBlock - 1].categoryTrials,
            data: [{
              inherit: catSide,
              data: { condition: currentCondition, block: iBlock },
              layout: blockLayout
                .concat(reminderStimulus)
                .concat([{ inherit: { set: 'touchLeftBtn' } }, { inherit: { set: 'touchRightBtn' } }])
            }]
          });
        }

        trialSequence.push(mixer);
      }
    }

    // Final screen: show Continue button
    trialSequence.push({
      inherit: 'instructions',
      data: { blockStart: true },
      layout: [{ media: { word: '' } }],
      stimuli: [
        {
          inherit: 'instructions',
          css: { color: piCurrent.fontColor },
          media: { html: '<div><p style="font-size:26px; margin:0;">' + piCurrent.finalText + '</p></div>' }
        },
        { inherit: { set: 'touchContinueBtn' } }
      ],
      input: [{ handle: 'done', on: 'click', stimHandle: 'touchContinueBtn' }],
      interactions: [
        { conditions: [{ type: 'begin' }], actions: [{ type: 'showStim', handle: 'All' }] },
        {
          conditions: [{ type: 'inputEquals', value: 'done' }],
          actions: [
            { type: 'hideStim', handle: 'All' },
            { type: 'log' },
            { type: 'trigger', handle: 'endTrial', duration: 100 }
          ]
        },
        { conditions: [{ type: 'inputEquals', value: 'endTrial' }], actions: [{ type: 'endTrial' }] }
      ]
    });

    API.addSequence(trialSequence);

    // ===== Scoring =====
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

    // Messages are typically unused in research; keep empty unless you want participant feedback
    var messageDef = [
      { cut: '-0.65', message: '' },
      { cut: '-0.35', message: '' },
      { cut: '-0.15', message: '' },
      { cut: '0.15', message: '' },
      { cut: '0.35', message: '' },
      { cut: '0.65', message: '' },
      { cut: '5', message: '' }
    ];
    var scoreMessageObject = { MessageDef: messageDef };
    scorer.addSettings('message', scoreMessageObject);

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
