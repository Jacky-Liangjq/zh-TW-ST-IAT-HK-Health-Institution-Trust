define(['pipAPI', 'pipScorer', 'underscore'], function (APIConstructor, Scorer, _) {
    function stiatExtension(options) {
        var API = new APIConstructor();
        var scorer = new Scorer();
        var piCurrent = API.getCurrent();

        // 默认配置
        var stiatObj = _.extend({
            canvas: { maxWidth: 800, proportions: 0.8, background: '#ffffff', borderWidth: 0 },
            category: { name: 'Category', title: { media: { word: 'Category' }, css: { color: '#000', 'font-size': '2em' }, height: 4 }, media: [], css: { color: '#000', 'font-size': '2em' } },
            attribute1: { name: 'Attribute1', title: { media: { word: 'Attribute1' }, css: { color: '#000', 'font-size': '2em' }, height: 4 }, media: [], css: { color: '#000', 'font-size': '2em' } },
            attribute2: { name: 'Attribute2', title: { media: { word: 'Attribute2' }, css: { color: '#000', 'font-size': '2em' }, height: 4 }, media: [], css: { color: '#000', 'font-size': '2em' } },
            trialsByBlock: [],
            base_url: { image: 'https://cdn.jsdelivr.net/gh/baranan/minno-tasks@0.2/IAT/images/' }
        }, options);

        API.addSettings('canvas', stiatObj.canvas);

        // --- 触控区域定义 ---
        var touchLayout = [
            { id: 'leftZone', css: { position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', 'z-index': 999, 'background-color': 'transparent' } },
            { id: 'rightZone', css: { position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', 'z-index': 999, 'background-color': 'transparent' } }
        ];

        // --- 基础试次模板 ---
        API.addTrialSets('base', [{
            input: [
                { handle: 'left', on: 'click', type: 'inputByElement', element: 'leftZone' },
                { handle: 'right', on: 'click', type: 'inputByElement', element: 'rightZone' }
            ],
            layout: [
                { prop: 'leftZone', props: touchLayout[0] },
                { prop: 'rightZone', props: touchLayout[1] }
            ]
        }]);

        // --- 指令页模板 ---
        API.addTrialSets('instructions', [{
            input: [{ handle: 'skip', on: 'click', type: 'inputByElement', element: 'startBtn' }],
            layout: [
                { location: { top: 5, left: 5, width: 90, height: 65 }, media: { html: '<%= trialData.instHTML %>' }, css: { 'overflow-y': 'auto', 'font-size': '0.9em' } },
                { id: 'startBtn', location: { top: 75, left: 20, width: 60, height: 12 }, css: { 'background-color': '#28a745', color: '#fff', 'border-radius': '10px', 'display': 'flex', 'align-items': 'center', 'justify-content': 'center', 'font-size': '1.5em' }, media: { word: '點擊此處開始' } }
            ]
        }]);

        // --- 刺激项显示模板 ---
        API.addTrialSets('stimulus', [{
            inherit: 'base',
            data: { score: 0 },
            stimuli: [
                { inherit: { type: 'exSBY', set: 'target' } },
                { inherit: { type: 'exSBY', set: 'error' } }
            ],
            interactions: [
                {
                    conditions: [{ type: 'inputEquals', value: 'targetCorrect' }],
                    actions: [{ type: 'goto', value: 'next' }]
                },
                {
                    conditions: [{ type: 'inputEquals', value: 'targetError' }],
                    actions: [
                        { type: 'setTrialAttr', setter: { score: 1 } },
                        { type: 'showStim', handle: 'error' }
                    ]
                }
            ]
        }]);

        // --- 生成实验序列 ---
        var sequence = [];
        
        // 处理每一个 Block
        _.each(stiatObj.trialsByBlock, function (bConfig, bIndex) {
            // 1. 添加指令页
            sequence.push({
                inherit: 'instructions',
                data: { instHTML: bConfig.instHTML }
            });

            // 2. 添加测试试次 (这里简化处理，确保能跑通)
            // 实际逻辑会根据 block 类型随机抽取刺激词
            var totalTrials = bConfig.singleAttTrials + bConfig.sharedAttTrials + bConfig.categoryTrials;
            for (var i = 0; i < totalTrials; i++) {
                sequence.push({
                    inherit: 'stimulus',
                    data: { block: bIndex + 1 }
                });
            }
        });

        API.addSequence(sequence);

        // --- 计分逻辑 ---
        scorer.addSettings('compute', {
            ErrorVar: 'score',
            condVar: 'block',
            fastRT: 150,
            maxRT: 10000,
            errorLatency: { use: 'latency', penalty: 600, useForSTD: true }
        });

        API.addSettings('hooks', {
            endTask: function () {
                var score = scorer.computeD();
                piCurrent.feedback = score.F;
                if (minnoJS.logger) minnoJS.logger(JSON.stringify(score));
                if (minnoJS.onEnd) minnoJS.onEnd();
            }
        });

        return API.script;
    }

    return stiatExtension;
});
