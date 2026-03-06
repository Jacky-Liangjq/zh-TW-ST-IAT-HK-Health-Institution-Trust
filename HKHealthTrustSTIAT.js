define(
  [
    'pipAPI',
    'https://cdn.jsdelivr.net/gh/Jacky-Liangjq/zh-TW-ST-IAT-HK-Health-Institution-Trust@5184f5c4a874a281646bf42ba98544d4e7472d3a/qstiat6.js'
  ],
  function (APIConstructor, stiatExtension) {

    var API = new APIConstructor();

    /* =====================================================
       目標類別：Health Institutions（香港／繁體；全部中文）
       ===================================================== */
    var healthInstitutionsAllCN = [
      { word: '醫管局' },
      { word: '衛生署' },
      { word: '衛生防護中心' },
      { word: '政府醫院' },
      { word: '公立醫院' },
      { word: '公共醫療體系' },
      { word: '基層醫療系統' },
      { word: '社區健康中心' },
      { word: '胸肺科診所' },
      { word: '兒童體能智力測驗中心' },
      { word: '醫學遺傳服務中心' },
      { word: '牙科街症服務診所' },
      { word: '長者健康中心' },
      { word: '綜合治療中心' },
      { word: '母嬰健康院' },
      { word: '美沙酮診所' },
      { word: '學童牙科診所' },
      { word: '社會衛生科診所' },
      { word: '學生健康服務中心' },
      { word: '學生健康評估中心' },
      { word: '旅遊健康中心' },
      { word: '婦女健康中心' },
      { word: '公營醫院' },
      { word: '普通科診所' },
      { word: '專科診所' },
      { word: '中醫診所' },
      { word: '公共醫療機構' }
    ];

    /* =====================================================
       對照類別：生活服務機構
       ===================================================== */
    var nonHealthInstitutionsCN = [
      { word: '超市' },
      { word: '銀行' },
      { word: '地鐵站' },
      { word: '餐廳' },
      { word: '郵局' },
      { word: '書店' },
      { word: '電影院' },
      { word: '健身中心' },
      { word: '旅行社' },
      { word: '保險公司' },
      { word: '百貨公司' },
      { word: '商場' },
      { word: '學校' }
    ];

    /* =====================================================
       屬性詞（可信 / 不可信）
       ===================================================== */
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

    /* =====================================================
       桌面版說明文字
       ===================================================== */
    var instHTML = `
      <div style="font-size:16px; line-height:1.75;">
        <p><b>請在保持準確的情況下，盡量快速地將詞語歸類。</b></p>

        <p>詞語會逐一出現，請根據畫面上方的分類提示作答。</p>

        <p>請使用鍵盤作答：左側分類按 <b>E</b> 鍵，右側分類按 <b>I</b> 鍵。</p>

        <p>如按錯，畫面會顯示紅色「X」，請改按正確的鍵後繼續。</p>

        <p>準備好後，請按 <b>空格鍵</b> 開始。</p>
      </div>
    `;

    /* =====================================================
       統一視覺設定
       ===================================================== */
    var uniformCss = {
      color: '#000000',
      'font-size': '3em'
    };

    return stiatExtension({

      trialsByBlock: [
        // Block1: 健康機構 vs 生活服務機構
        { instHTML: instHTML, block:1, miniBlocks:4, singleAttTrials:7, sharedAttTrials:5, categoryTrials:0 },

        // Block2: 可信 vs 不可信
        { instHTML: instHTML, block:2, miniBlocks:4, singleAttTrials:6, sharedAttTrials:6, categoryTrials:0 },

        // Block3: 正面聯想
        { instHTML: instHTML, block:3, miniBlocks:3, singleAttTrials:3, sharedAttTrials:3, categoryTrials:3 },

        // Block4: 負面聯想
        { instHTML: instHTML, block:4, miniBlocks:3, singleAttTrials:3, sharedAttTrials:3, categoryTrials:3 }
      ],

      category: {
        name: '健康機構',
        title: {
          media: { word: '健康機構' },
          css: uniformCss,
          height: 7
        },
        media: healthInstitutionsAllCN,
        css: uniformCss
      },

      nonCategory: {
        name: '生活服務機構',
        title: {
          media: { word: '生活服務機構' },
          css: uniformCss,
          height: 7
        },
        media: nonHealthInstitutionsCN,
        css: uniformCss
      },

      attribute1: {
        name: '可信',
        title: {
          media: { word: '可信' },
          css: uniformCss,
          height: 7
        },
        media: trustworthyWords,
        css: uniformCss
      },

      attribute2: {
        name: '不可信',
        title: {
          media: { word: '不可信' },
          css: uniformCss,
          height: 7
        },
        media: untrustworthyWords,
        css: uniformCss
      }
    });
  }
);
