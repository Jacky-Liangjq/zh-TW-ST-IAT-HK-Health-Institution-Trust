define(
  [
    'pipAPI',
    'https://cdn.jsdelivr.net/gh/baranan/minno-tasks@0.*/stiat/qualtrics/qstiat6.js'
  ],
  function (APIConstructor, stiatExtension) {

    var API = new APIConstructor();

    /* =========================
       1) 目標類別（health institutions）
       - 只中文
       - 請把你所有機構名稱「各版本中文名」都填進去（包含同一機構的不同叫法）
       ========================= */
    var healthInstitutions = [
      // 示例（請刪掉/替換為你的實際清單）：
      // { word: '國家衛生健康委員會' }, { word: '國家衛健委' }, { word: '衛健委' },
      // { word: '疾病預防控制中心' }, { word: '疾控中心' },
      // { word: '醫院管理局' }, { word: '醫管局' },
      // { word: '衛生署' },
      // { word: '衛生福利部' }, { word: '衛福部' }
    ];

    /* =========================
       2) 屬性詞：只中文；斜杠前後都用
       - attribute1 = Trustworthy（可信）
       - attribute2 = Untrustworthy（不可信）
       ========================= */

    // Trustworthy（可信）——斜杠前後都用（只中文）
    var trustworthyWords = [
      { word: '能力出眾' }, { word: '能幹的' },
      { word: '卓有成效' }, { word: '有效果的' },
      { word: '技術過硬' }, { word: '有才能的' },
      { word: '了如指掌' }, { word: '有章法的' },
      { word: '能當大任' }, { word: '勝任的' },
      { word: '將心比心' }, { word: '關懷的' },
      { word: '關懷備至' }, { word: '關懷的' },
      { word: '設身處地' }, { word: '善解人意' },
      { word: '樂於助人' },
      { word: '仁善無害' }, { word: '無害的' },
      { word: '一視同仁' }, { word: '公平的' },
      { word: '剛正不阿' }, { word: '正義的' },
      { word: '恪守原則' }, { word: '有原則的' },
      { word: '信守承諾' }, { word: '可靠的' },
      { word: '言行一致' }, { word: '一致的' }
    ];

    // Untrustworthy（不可信）——斜杠前後都用（只中文）
    var untrustworthyWords = [
      { word: '平庸無能' }, { word: '無能的' },
      { word: '碌碌無為' }, { word: '徒勞的' },
      { word: '濫竽充數' }, { word: '業餘的' },
      { word: '草台班子' }, { word: '混亂的' },
      { word: '不堪重任' }, { word: '失職的' },
      { word: '漠不關心' },
      { word: '事不關己' }, { word: '冷漠的' },
      { word: '無動於衷' },
      { word: '袖手旁觀' },
      { word: '居心叵測' }, { word: '惡意的' },
      { word: '厚此薄彼' }, { word: '偏頗的' },
      { word: '徇私枉法' }, { word: '腐敗的' },
      { word: '不擇手段' }, { word: '不道德的' },
      { word: '言而無信' }, { word: '欺騙' },
      { word: '反覆無常' }, { word: '矛盾的' }
    ];

    /* =========================
       3) 中文操作介面（避免 qstiat6 默認英文 instruction）
       - 這裡用 trialsByBlock 覆蓋每個 block 的 instHTML
       - 如你不需要中文說明頁，可刪掉 trialsByBlock 整段
       ========================= */
    var instCommon = `
      <div style="font-size:20px; line-height:1.6;">
        <p>請盡快且準確地按鍵分類。</p>
        <p>請用鍵盤作答（非滑鼠）：<b>E</b> 鍵 / <b>I</b> 鍵。</p>
        <p>若出現錯誤提示，請更正後繼續。</p>
        <p>按空白鍵開始。</p>
      </div>
    `;

    // 一些 block 會顯示類別/屬性標籤在左右兩側；此處只做中文說明，不改鍵位規則（由 qstiat6 控制）
    var trialsByBlockCN = [
      {
        instHTML: `
          <div style="font-size:20px; line-height:1.6;">
            <p>第 1 部分：練習</p>
            ${instCommon}
          </div>
        `,
        block: 1,
        miniBlocks: 1,
        singleAttTrials: 10,
        sharedAttTrials: 10,
        categoryTrials: 0
      },
      {
        instHTML: `
          <div style="font-size:20px; line-height:1.6;">
            <p>第 2 部分：包含目標類別的練習</p>
            ${instCommon}
          </div>
        `,
        block: 2,
        miniBlocks: 1,
        singleAttTrials: 10,
        sharedAttTrials: 7,
        categoryTrials: 7
      },
      {
        instHTML: `
          <div style="font-size:20px; line-height:1.6;">
            <p>第 3 部分：正式作答</p>
            ${instCommon}
          </div>
        `,
        block: 3,
        miniBlocks: 1,
        singleAttTrials: 0,
        sharedAttTrials: 20,
        categoryTrials: 20
      },
      {
        instHTML: `
          <div style="font-size:20px; line-height:1.6;">
            <p>第 4 部分：規則切換練習</p>
            ${instCommon}
          </div>
        `,
        block: 4,
        miniBlocks: 1,
        singleAttTrials: 10,
        sharedAttTrials: 7,
        categoryTrials: 7
      },
      {
        instHTML: `
          <div style="font-size:20px; line-height:1.6;">
            <p>第 5 部分：正式作答（切換後）</p>
            ${instCommon}
          </div>
        `,
        block: 5,
        miniBlocks: 1,
        singleAttTrials: 0,
        sharedAttTrials: 20,
        categoryTrials: 20
      }
    ];

    /* =========================
       4) 返回 ST-IAT 任務
       ========================= */
    return stiatExtension({

      // 覆蓋默認英文 instruction
      trialsByBlock: trialsByBlockCN,

      category: {
        name: '健康機構', // 會出現在資料欄位
        title: {
          media: { word: '健康機構' }, // 會顯示在任務介面
          css: { color: '#1f77b4', 'font-size': '2em' },
          height: 7
        },
        media: healthInstitutions,
        css: { color: '#1f77b4', 'font-size': '3em' }
      },

      attribute1: {
        name: '可信',
        title: {
          media: { word: '可信' },
          css: { color: '#2ca02c', 'font-size': '2em' },
          height: 7
        },
        media: trustworthyWords,
        css: { color: '#2ca02c', 'font-size': '3em' }
      },

      attribute2: {
        name: '不可信',
        title: {
          media: { word: '不可信' },
          css: { color: '#d62728', 'font-size': '2em' },
          height: 7
        },
        media: untrustworthyWords,
        css: { color: '#d62728', 'font-size': '3em' }
      }

    });
  }
);