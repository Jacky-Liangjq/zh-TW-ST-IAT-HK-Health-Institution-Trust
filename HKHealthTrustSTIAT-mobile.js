define([
    'pipAPI',
   
    'https://cdn.jsdelivr.net/gh/Privatealligator/Jacky-problem1@main/qstiat6-mobile.js'
], function (APIConstructor, stiatExtension) {
    var API = new APIConstructor();

    var healthInstitutionsAllCN = [
        { word: '醫院管理局' }, { word: '醫管局' }, { word: '衞生署' }, { word: '衛生署' },
        { word: '衞生防護中心' }, { word: '衛生防護中心' }, { word: '政府醫院' }, { word: '公立醫院' },
        { word: '公共醫療體系' }, { word: '基層醫療系統' }, { word: '社區健康中心' }, { word: '公共醫療機構' }
    ];

    var trustworthyWords = [
        { word: '能力出眾' }, { word: '能幹的' }, { word: '卓有成效' }, { word: '有效果的' },
        { word: '技術過硬' }, { word: '有才能的' }, { word: '了如指掌' }, { word: '有章法的' },
        { word: '能當大任' }, { word: '稱職的' }
    ];

    var untrustworthyWords = [
        { word: '能力不足' }, { word: '平庸的' }, { word: '徒勞無功' }, { word: '沒效果的' },
        { word: '技術拙劣' }, { word: '沒才能的' }, { word: '一竅不通' }, { word: '亂套的' },
        { word: '難當大任' }, { word: '不稱職' }
    ];

    var instHTML = '<div style="font-size:1.2em; text-align:left; padding:10px;">' +
        '<p>接下來，屏幕上方會出現類別名稱。</p>' +
        '<p>請<b>點擊屏幕左側</b>或<b>右側</b>來進行分類。</p>' +
        '<p>如果出錯，會出現紅色的 <b>X</b>，請點擊另一側修正。</p>' +
        '<p style="text-align:center; color:blue;"><b>點擊下方按鈕開始</b></p></div>';

    return stiatExtension({
        category: {
            name: '健康機構',
            title: { media: { word: '健康機構' }, css: { color: '#000', 'font-size': '2em' }, height: 7 },
            media: healthInstitutionsAllCN,
            css: { color: '#000', 'font-size': '2.5em' }
        },
        attribute1: {
            name: '可信',
            title: { media: { word: '可信' }, css: { color: '#000', 'font-size': '2em' }, height: 7 },
            media: trustworthyWords,
            css: { color: '#000', 'font-size': '2.5em' }
        },
        attribute2: {
            name: '不可信',
            title: { media: { word: '不可信' }, css: { color: '#000', 'font-size': '2em' }, height: 7 },
            media: untrustworthyWords,
            css: { color: '#000', 'font-size': '2.5em' }
        },
        trialsByBlock: [
            { instHTML: instHTML, block: 1, miniBlocks: 2, singleAttTrials: 15, sharedAttTrials: 15, categoryTrials: 0 },
            { instHTML: instHTML, block: 2, miniBlocks: 2, singleAttTrials: 10, sharedAttTrials: 10, categoryTrials: 5 },
            { instHTML: instHTML, block: 3, miniBlocks: 2, singleAttTrials: 10, sharedAttTrials: 10, categoryTrials: 5 },
            { instHTML: instHTML, block: 4, miniBlocks: 2, singleAttTrials: 10, sharedAttTrials: 10, categoryTrials: 5 },
            { instHTML: instHTML, block: 5, miniBlocks: 2, singleAttTrials: 10, sharedAttTrials: 10, categoryTrials: 5 }
        ]
    });
});
