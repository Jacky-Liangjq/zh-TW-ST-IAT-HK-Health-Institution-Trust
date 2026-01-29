define(
  [
    'pipAPI',
    'https://cdn.jsdelivr.net/gh/baranan/minno-tasks@0.*/stiat/qualtrics/qstiat6.js'
  ],
  function (APIConstructor, stiatExtension) {

    var API = new APIConstructor();

    /* =====================================================
       目標類別：香港健康／公共醫療相關機構（只中文，全用）
       ===================================================== */
    var healthInstitutionsAllCN = [
      { word:'醫院管理局' },
      { word:'醫管局' },
      { word:'衛生署' },
      { word:'公共衛生署' },
      { word:'衞生防護中心' },
      { word:'衛生防護中心' },
      { word:'政府醫院' },
      { word:'公立醫院' },
      { word:'公共醫療體系' },
      { word:'基層醫療系統' },
      { word:'社區健康中心' },
      { word:'公共醫療機構' }
    ];

    /* =====================================================
       屬性詞（只中文；斜杠前後全部用）
       ===================================================== */

    var trustworthyWords = [
      { word:'能力出眾' }, { word:'能幹的' },
      { word:'卓有成效' }, { word:'有效果的' },
      { word:'技術過硬' }, { word:'有才能的' },
      { word:'了如指掌' }, { word:'有章法的' },
      { word:'能當大任' }, { word:'勝任的' },
      { word:'將心比心' }, { word:'關懷的' },
      { word:'關懷備至' }, { word:'關懷的' },
      { word:'設身處地' }, { word:'善解人意' },
      { word:'樂於助人' },
      { word:'仁善無害' }, { word:'無害的' },
      { word:'一視同仁' }, { word:'公平的' },
      { word:'剛正不阿' }, { word:'正義的' },
      { word:'恪守原則' }, { word:'有原則的' },
      { word:'信守承諾' }, { word:'可靠的' },
      { word:'言行一致' }, { word:'一致的' }
    ];

    var untrustworthyWords = [
      { word:'平庸無能' }, { word:'無能的' },
      { word:'碌碌無為' }, { word:'徒勞的' },
      { word:'濫竽充數' }, { word:'業餘的' },
      { word:'草台班子' }, { word:'混亂的' },
      { word:'不堪重任' }, { word:'失職的' },
      { word:'漠不關心' },
      { word:'事不關己' }, { word:'冷漠的' },
      { word:'無動於衷' },
      { word:'袖手旁觀' },
      { word:'居心叵測' }, { word:'惡意的' },
      { word:'厚此薄彼' }, { word:'偏頗的' },
      { word:'徇私枉法' }, { word:'腐敗的' },
      { word:'不擇手段' }, { word:'不道德的' },
      { word:'言而無信' }, { word:'欺騙' },
      { word:'反覆無常' }, { word:'矛盾的' }
    ];

    /* =====================================================
       中文操作說明（完全覆蓋英文）
       ===================================================== */
    var instHTML = `
      <div style="font-size:20px; line-height:1.6;">
        <p>請盡快且準確地對詞語進行分類。</p>
        <p>請使用鍵盤作答：</p>
        <p><b>E</b> 鍵（左手）　<b>I</b> 鍵（右手）</p>
        <p>若出現錯誤提示，請更正後繼續。</p>
        <p>按空白鍵開始。</p>
      </div>
    `;

    return stiatExtension({

      trialsByBlock: [
        { instHTML, block:1, miniBlocks:1, singleAttTrials:10, sharedAttTrials:10, categoryTrials:0 },
        { instHTML, block:2, miniBlocks:1, singleAttTrials:10, sharedAttTrials:7,  categoryTrials:7 },
        { instHTML, block:3, miniBlocks:1, singleAttTrials:0,  sharedAttTrials:20, categoryTrials:20 },
        { instHTML, block:4, miniBlocks:1, singleAttTrials:10, sharedAttTrials:7,  categoryTrials:7 },
        { instHTML, block:5, miniBlocks:1, singleAttTrials:0,  sharedAttTrials:20, categoryTrials:20 }
      ],

      category: {
        name: '健康機構',
        title: {
          media: { word:'健康機構' },
          css: { 'font-size':'2em' },
          height: 7
        },
        media: healthInstitutionsAllCN,
        css: { 'font-size':'3em' }
      },

      attribute1: {
        name: '可信',
        title: {
          media: { word:'可信' },
          css: { 'font-size':'2em' },
          height: 7
        },
        media: trustworthyWords,
        css: { 'font-size':'3em' }
      },

      attribute2: {
        name: '不可信',
        title: {
          media: { word:'不可信' },
          css: { 'font-size':'2em' },
          height: 7
        },
        media: untrustworthyWords,
        css: { 'font-size':'3em' }
      }
    });
  }
);