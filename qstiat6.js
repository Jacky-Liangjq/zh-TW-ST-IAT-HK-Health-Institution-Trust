console.log("LOADED qstiat6-desktop.js VERSION = 2026-03-06-DESKTOP");

define(['pipAPI','pipScorer','underscore'], function(APIConstructor, Scorer, _) {

	function stiatExtension(options)
	{
		var API = new APIConstructor();
		var scorer = new Scorer();
		var piCurrent = API.getCurrent();

		var stiatObj =
		{
			canvas : {
				maxWidth: 725,
				proportions : 0.7,
				background: '#ffffff',
				borderWidth: 5,
				canvasBackground: '#ffffff',
				borderColor: 'lightblue'
			},

			category : {
				name : '目標對象',
				title : {
					media : {word : '目標對象'},
					css : {color:'#31b404','font-size':'2em'},
					height : 4
				},
				media : [],
				css : {color:'#31b404','font-size':'2em'}
			},

			nonCategory : {
				name : '生活服務機構',
				title : {
					media : {word : '生活服務機構'},
					css : {color:'#31b404','font-size':'2em'},
					height : 4
				},
				media : [],
				css : {color:'#31b404','font-size':'2em'}
			},

			attribute1 : {
				name : '正向',
				title : {
					media : {word : '正面'},
					css : {color:'#31b404','font-size':'2em'},
					height : 4
				},
				media : [],
				css : {color:'#31b404','font-size':'2em'}
			},

			attribute2 : {
				name : '負向',
				title : {
					media : {word : '負面'},
					css : {color:'#31b404','font-size':'2em'},
					height : 4
				},
				media : [],
				css : {color:'#31b404','font-size':'2em'}
			},

			// 这里只是默认值；wrapper 里传入的会覆盖
			trialsByBlock : [
				{ instHTML:'', block:1, miniBlocks:1, singleAttTrials:13, sharedAttTrials:12, categoryTrials:0 },
				{ instHTML:'', block:2, miniBlocks:1, singleAttTrials:13, sharedAttTrials:12, categoryTrials:0 },
				{ instHTML:'', block:3, miniBlocks:1, singleAttTrials:9,  sharedAttTrials:9,  categoryTrials:7 },
				{ instHTML:'', block:4, miniBlocks:1, singleAttTrials:9,  sharedAttTrials:9,  categoryTrials:7 }
			],

			ITIDuration : 250,
			fontColor : '#000000',

			leftKeyText : '按 E 鍵',
			rightKeyText : '按 I 鍵',
			keysCss : {'font-size':'1.3em','font-family':'monospace',color:'#000000'},

			orText : '或',
			orCss : {'font-size':'1.4em',color:'#000000'},

			remindErrorText :
				'<p style="text-align:center;font-size:1.5em">' +
				'如果按錯，畫面會顯示紅色 <b style="color:red">X</b>。<br/>' +
				'請即時改按正確按鍵以繼續。</p>',

			finalText : '任務已完成。<br/><br/>請按空格鍵繼續。',

			fb_strongAssociationWithAttribute2 : '你的反應顯示，你對 thecategory 的自動反應非常正面。',
			fb_moderateAssociationWithAttribute2 : '你的反應顯示，你對 thecategory 的自動反應較為正面。',
			fb_weakAssociationWithAttribute2 : '你的反應顯示，你對 thecategory 的自動反應略為正面。',
			fb_neutralAssociation : '你的反應顯示，你對 thecategory 並無明顯的自動反應傾向。',
			fb_weakAssociationWithAttribute1 : '你的反應顯示，你對 thecategory 的自動反應略為負面。',
			fb_moderateAssociationWithAttribute1 : '你的反應顯示，你對 thecategory 的自動反應較為負面。',
			fb_strongAssociationWithAttribute1 : '你的反應顯示，你對 thecategory 的自動反應非常負面。',

			manyErrors : '',
			tooFast : '',
			notEnough : ''
		};

		_.extend(piCurrent, _.defaults(options, stiatObj));

		API.addSettings('onEnd', window.minnoJS.onEnd);

		API.addSettings('logger', {
			onRow: function(logName, log, settings, ctx){
				if (!ctx.logs) ctx.logs = [];
				ctx.logs.push(log);
			},
			onEnd: function(name, settings, ctx){
				return ctx.logs;
			},
			serialize: function (name, logs) {
				var headers = ['block', 'trial', 'cond', 'type', 'cat', 'stim', 'resp', 'err', 'rt', 'd', 'bOrd'];
				var myLogs = [];
				var iLog;

				for (iLog = 0; iLog < logs.length; iLog++)
				{
					if(!hasProperties(logs[iLog], ['trial_id', 'name', 'responseHandle', 'stimuli', 'media', 'latency'])){
						// skip
					}
					else if(!hasProperties(logs[iLog].data, ['block', 'condition', 'score']))
					{
						// skip
					}
					else
					{
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

				content.push([
				  9,
				  999,
				  'end',
				  '',
				  '',
				  '',
				  '',
				  '',
				  '',
				  piCurrent.d,
				  block2Condition
				]);

				content.unshift(headers);
				return toCsv(content);

				function hasProperties(obj, props) {
					var iProp;
					for (iProp = 0; iProp < props.length; iProp++)
					{
						if (!obj.hasOwnProperty(props[iProp])) return false;
					}
					return true;
				}
				function toCsv(matrix) { return matrix.map(buildRow).join('\n'); }
				function buildRow(arr) { return arr.map(normalize).join(','); }
				function normalize(val) {
					var quotableRgx = /(\n|,|")/;
					if (quotableRgx.test(val)) return '"' + val.replace(/"/g, '""') + '"';
					return val;
				}
			},
			send: function(name, serialized){
				window.minnoJS.logger(serialized);
			}
		});

		/***********************************************************************************
		 *
		 * Main script
		 *
		 ************************************************************************************/

		var attribute1 = piCurrent.attribute1.name;
		var attribute2 = piCurrent.attribute2.name;
		var category = piCurrent.category.name;
		var nonCategory = piCurrent.nonCategory && piCurrent.nonCategory.name;

		var block2Condition = 'positive_first';

		var catVsNonCatLayout = [
			{location:{left:6,top:1}, media:{word:piCurrent.leftKeyText},  css:piCurrent.keysCss},
			{location:{right:6,top:1},media:{word:piCurrent.rightKeyText}, css:piCurrent.keysCss},
			{location:{left:6,top:4}, media:piCurrent.category.title.media,    css:piCurrent.category.title.css},
			{location:{right:6,top:4},media:piCurrent.nonCategory.title.media, css:piCurrent.nonCategory.title.css}
		];

		var attOnlyLayout = [
			{location:{left:6,top:1}, media:{word:piCurrent.leftKeyText},  css:piCurrent.keysCss},
			{location:{right:6,top:1},media:{word:piCurrent.rightKeyText}, css:piCurrent.keysCss},
			{location:{left:6,top:4}, media:piCurrent.attribute1.title.media, css:piCurrent.attribute1.title.css},
			{location:{right:6,top:4},media:piCurrent.attribute2.title.media, css:piCurrent.attribute2.title.css}
		];

		var comboLayout_pos_catLeft = [
			{location:{left:6,top:1},  media:{word:piCurrent.leftKeyText},  css:piCurrent.keysCss},
			{location:{right:6,top:1}, media:{word:piCurrent.rightKeyText}, css:piCurrent.keysCss},

			{location:{left:6,top:4}, media:piCurrent.attribute1.title.media, css:piCurrent.attribute1.title.css},
			{location:{left:6,top:4+(piCurrent.attribute1.title.height|4)+4}, media:{word:piCurrent.orText}, css:piCurrent.orCss},
			{location:{left:6,top:11+(piCurrent.attribute1.title.height|4)}, media:piCurrent.category.title.media, css:piCurrent.category.title.css},

			{location:{right:6,top:4}, media:piCurrent.attribute2.title.media, css:piCurrent.attribute2.title.css}
		];

		var comboLayout_neg_catRight = [
			{location:{left:6,top:1},  media:{word:piCurrent.leftKeyText},  css:piCurrent.keysCss},
			{location:{right:6,top:1}, media:{word:piCurrent.rightKeyText}, css:piCurrent.keysCss},

			{location:{left:6,top:4}, media:piCurrent.attribute1.title.media, css:piCurrent.attribute1.title.css},

			{location:{right:6,top:4}, media:piCurrent.attribute2.title.media, css:piCurrent.attribute2.title.css},
			{location:{right:6,top:4+(piCurrent.attribute2.title.height|4)+4}, media:{word:piCurrent.orText}, css:piCurrent.orCss},
			{location:{right:6,top:11+(piCurrent.attribute2.title.height|4)}, media:piCurrent.category.title.media, css:piCurrent.category.title.css}
		];

		var instructionLayout = [];
		var reminderStimulus = {
			location:{bottom:1},
			css:{color:piCurrent.fontColor,'font-size':'1em'},
			media:{html: piCurrent.remindErrorText}
		};

		API.addSettings('canvas',piCurrent.canvas);
		API.addSettings('base_url',piCurrent.base_url);

		API.addTrialSets('sort',{
			data: {score:0, parcel:'first'},
			input: [
				{handle:'skip1', on:'keypressed', key:27},
				{handle:'left',  on:'keypressed', key:'e'},
				{handle:'right', on:'keypressed', key:'i'}
			],
			interactions: [
				{
					conditions: [{ type:'begin' }],
					actions: [{ type:'showStim', handle:'targetStim' }]
				},
				{
					conditions: [
						{type:'inputEqualsTrial', property:'corResp', negate:true},
						{type:'inputEquals', value:['right','left']}
					],
					actions: [
						{type:'showStim', handle:'error'},
						{type:'setTrialAttr', setter:{score:1}}
					]
				},
				{
					conditions: [{type:'inputEqualsTrial', property:'corResp'}],
					actions: [
						{type:'removeInput', handle:['left','right']},
						{type:'hideStim', handle:'All'},
						{type:'log'},
						{type:'setInput', input:{handle:'end', on:'timeout', duration:piCurrent.ITIDuration}}
					]
				},
				{
					conditions: [{type:'inputEquals', value:'end'}],
					actions: [{type:'endTrial'}]
				},
				{
					conditions: [{type:'inputEquals', value:'skip1'}],
					actions: [{type:'setInput', input:{handle:'skip2', on:'enter'}}]
				},
				{
					conditions: [{type:'inputEquals', value:'skip2'}],
					actions: [
						{type:'goto', destination:'nextWhere', properties:{blockStart:true}},
						{type:'endTrial'}
					]
				}
			]
		});

		API.addTrialSets('instructions', [{
			data: {blockStart:true, block:0, condition:'inst', score:0},
			input: [{handle:'space', on:'space'}],
			interactions: [
				{
					conditions: [{type:'begin'}],
					actions: [{type:'showStim', handle:'All'}]
				},
				{
					conditions: [{type:'inputEquals', value:'space'}],
					actions: [
						{type:'hideStim', handle:'All'},
						{type:'log'},
						{type:'trigger', handle:'endTrial', duration:500}
					]
				},
				{
					conditions: [{type:'inputEquals', value:'endTrial'}],
					actions: [{type:'endTrial'}]
				}
			]
		}]);

		API.addTrialSets({
			leftAtt1_only: [{
				inherit : 'sort',
				data : {corResp : 'left'},
				stimuli : [
					{inherit:{type:'exRandom', set:'attribute1'}},
					{inherit:{set:'error'}}
				]
			}],
			rightAtt2_only: [{
				inherit : 'sort',
				data : {corResp : 'right'},
				stimuli : [
					{inherit:{type:'exRandom', set:'attribute2'}},
					{inherit:{set:'error'}}
				]
			}],
			leftCat_only: [{
				inherit : 'sort',
				data : {corResp : 'left'},
				stimuli : [
					{inherit:{type:'exRandom', set:'category'}},
					{inherit:{set:'error'}}
				]
			}],
			rightNonCat_only: [{
				inherit : 'sort',
				data : {corResp : 'right'},
				stimuli : [
					{inherit:{type:'exRandom', set:'nonCategory'}},
					{inherit:{set:'error'}}
				]
			}],
			leftCat: [{
				inherit : 'sort',
				data : {corResp : 'left'},
				stimuli : [
					{inherit:{type:'exRandom', set:'category'}},
					{inherit:{set:'error'}}
				]
			}],
			rightCat: [{
				inherit : 'sort',
				data : {corResp : 'right'},
				stimuli : [
					{inherit:{type:'exRandom', set:'category'}},
					{inherit:{set:'error'}}
				]
			}]
		});

		API.addStimulusSets({
			Default: [{
				css:{
					color:'#000000',
					'font-size':'3em',
					background:'#ffffff',
					padding:'0.4em 0.8em',
					'border-radius':'8px',
					display:'inline-block'
				}
			}],
			instructions: [
				{css:{'font-size':'1.4em', color:'black', lineHeight:1.2}, nolog:true, location:{bottom:1}}
			],
			attribute1: [{
				data:{alias:attribute1, handle:'targetStim'},
				inherit:'Default',
				css:piCurrent.attribute1.css,
				media:{inherit:{type:'exRandom', set:'attribute1'}}
			}],
			attribute2: [{
				data:{alias:attribute2, handle:'targetStim'},
				inherit:'Default',
				css:piCurrent.attribute2.css,
				media:{inherit:{type:'exRandom', set:'attribute2'}}
			}],
			category: [{
				data:{alias:category, handle:'targetStim'},
				inherit:'Default',
				css:piCurrent.category.css,
				media:{inherit:{type:'exRandom', set:'category'}}
			}],
			nonCategory: [{
				data:{alias:nonCategory, handle:'targetStim'},
				inherit:'Default',
				css:piCurrent.nonCategory.css,
				media:{inherit:{type:'exRandom', set:'nonCategory'}}
			}],
			error: [{
				data:{handle:'error'},
				location:{top:70},
				css:{color:'red','font-size':'4em'},
				media:{word:'X'},
				nolog:true
			}],
			dummyForLog: [{
				data:{name:'dummyForLog', alias:'dummyForLog'},
				location:{left:99},
				media:{word:' '}
			}]
		});

		API.addMediaSets({
			attribute1 : piCurrent.attribute1.media,
			attribute2 : piCurrent.attribute2.media,
			category   : piCurrent.category.media,
			nonCategory: (piCurrent.nonCategory && piCurrent.nonCategory.media) || []
		});

		function getDesktopInstHTML(iBlock, nBlocks)
		{
			if (iBlock === 1){
				return '<div style="font-size:20px;line-height:1.6">' +
					'<p style="text-align:center"><u>第 ' + iBlock + ' 部分（共 ' + nBlocks + ' 部分）</u></p>' +
					'<p>當畫面出現屬於 <b>' + category + '</b> 的詞語，請按 <b>E</b> 鍵。<br/>' +
					'當畫面出現屬於 <b>' + nonCategory + '</b> 的詞語，請按 <b>I</b> 鍵。<br/><br/>' +
					'請盡量快速而準確地作答。<br/><br/>' +
					'準備好後，請按 <b>空格鍵</b> 開始。</p></div>';
			}
			else if (iBlock === 2){
				return '<div style="font-size:20px;line-height:1.6">' +
					'<p style="text-align:center"><u>第 ' + iBlock + ' 部分（共 ' + nBlocks + ' 部分）</u></p>' +
					'<p>當畫面出現屬於 <b>' + attribute1 + '</b> 的詞語，請按 <b>E</b> 鍵。<br/>' +
					'當畫面出現屬於 <b>' + attribute2 + '</b> 的詞語，請按 <b>I</b> 鍵。<br/><br/>' +
					'請盡量快速而準確地作答。<br/><br/>' +
					'準備好後，請按 <b>空格鍵</b> 開始。</p></div>';
			}
			else if (iBlock === 3){
				return '<div style="font-size:20px;line-height:1.6">' +
					'<p style="text-align:center"><u>第 ' + iBlock + ' 部分（共 ' + nBlocks + ' 部分）</u></p>' +
					'<p>屬於 <b>' + attribute1 + '</b> 或 <b>' + category + '</b> 的詞語，請按 <b>E</b> 鍵。<br/>' +
					'屬於 <b>' + attribute2 + '</b> 的詞語，請按 <b>I</b> 鍵。<br/><br/>' +
					'請盡量快速而準確地作答。<br/><br/>' +
					'準備好後，請按 <b>空格鍵</b> 開始。</p></div>';
			}
			else {
				return '<div style="font-size:20px;line-height:1.6">' +
					'<p style="text-align:center"><u>第 ' + iBlock + ' 部分（共 ' + nBlocks + ' 部分）</u></p>' +
					'<p>屬於 <b>' + attribute1 + '</b> 的詞語，請按 <b>E</b> 鍵。<br/>' +
					'屬於 <b>' + attribute2 + '</b> 或 <b>' + category + '</b> 的詞語，請按 <b>I</b> 鍵。<br/><br/>' +
					'請盡量快速而準確地作答。<br/><br/>' +
					'準備好後，請按 <b>空格鍵</b> 開始。</p></div>';
			}
		}

		var trialSequence = [];

		for (var iBlock = 1; iBlock <= piCurrent.trialsByBlock.length; iBlock++)
		{
			var currentCondition = '';
			var blockLayout;

			if (iBlock === 1){
				blockLayout = catVsNonCatLayout;
				currentCondition = 'CAT_ONLY';
			}
			else if (iBlock === 2){
				blockLayout = attOnlyLayout;
				currentCondition = 'ATT_ONLY';
			}
			else if (iBlock === 3){
				blockLayout = comboLayout_pos_catLeft;
				currentCondition = 'POS';
			}
			else if (iBlock === 4){
				blockLayout = comboLayout_neg_catRight;
				currentCondition = 'NEG';
			}



			var instHTML = piCurrent.trialsByBlock[iBlock-1].instHTML;
			if (instHTML === '') {
				instHTML = getDesktopInstHTML(iBlock, piCurrent.trialsByBlock.length);
			}

			trialSequence.push({
				inherit : 'instructions',
				data: {blockStart:true},
				layout : instructionLayout,
				stimuli : [
					{
						inherit : 'instructions',
						media : {html : instHTML}
					},
					{
						data : {handle:'dummy', alias:'dummy'},
						media : {word:' '},
						location : {top:1}
					}
				]
			});

			for (var iMini = 1; iMini <= piCurrent.trialsByBlock[iBlock-1].miniBlocks; iMini++)
			{
				var mixer = {
					mixer : 'random',
					data : [
						{
							mixer : 'repeat',
							times : piCurrent.trialsByBlock[iBlock-1].singleAttTrials,
							data : [{
								inherit : (
									iBlock===1 ? 'leftCat_only' :
									iBlock===2 ? 'leftAtt1_only' :
									iBlock===3 ? 'leftAtt1_only' :
									iBlock===4 ? 'leftAtt1_only' : 'leftAtt1_only'
								),
								data : {condition : currentCondition, block : iBlock},
								layout : blockLayout.concat(reminderStimulus)
							}]
						},
						{
							mixer : 'repeat',
							times : piCurrent.trialsByBlock[iBlock-1].sharedAttTrials,
							data : [{
								inherit : (
									iBlock===1 ? 'rightNonCat_only' :
									iBlock===2 ? 'rightAtt2_only' :
									iBlock===3 ? 'rightAtt2_only' :
									iBlock===4 ? 'rightAtt2_only' : 'rightAtt2_only'
								),
								data : {condition : currentCondition, block : iBlock},
								layout : blockLayout.concat(reminderStimulus)
							}]
						}
					]
				};

				if (iBlock === 3){
					mixer.data.push({
						mixer : 'repeat',
						times : piCurrent.trialsByBlock[iBlock-1].categoryTrials,
						data : [{
							inherit : 'leftCat',
							data : {condition : currentCondition, block : iBlock},
							layout : blockLayout.concat(reminderStimulus)
						}]
					});
				}
				else if (iBlock === 4){
					mixer.data.push({
						mixer : 'repeat',
						times : piCurrent.trialsByBlock[iBlock-1].categoryTrials,
						data : [{
							inherit : 'rightCat',
							data : {condition : currentCondition, block : iBlock},
							layout : blockLayout.concat(reminderStimulus)
						}]
					});
				}

				trialSequence.push(mixer);
			}
		}

		trialSequence.push({
			inherit : 'instructions',
			data: {blockStart:true},
			layout : [{media:{word:''}}],
			stimuli : [
				{
					inherit : 'instructions',
					media : {html : piCurrent.finalText}
				},
				{
					data : {handle:'dummy', alias:'dummy'},
					media : {word:' '},
					location : {top:1}
				}
			]
		});

		API.addSequence(trialSequence);

		scorer.addSettings('compute',{
			ErrorVar:'score',
			condVar:'condition',
			cond1VarValues: ['POS'],
			cond2VarValues: ['NEG'],
			parcelVar : "parcel",
			parcelValue : ['first'],
			fastRT : 150,
			maxFastTrialsRate : 0.1,
			minRT : 400,
			maxRT : 10000,
			errorLatency : {use:"latency", penalty:600, useForSTD:true},
			postSettings : {score:"score", msg:"feedback", url:"/implicit/scorer"}
		});

		function getFBFromTemplate(inText)
		{
			var retText = inText.replace(/attribute1/g, attribute1);
			retText = retText.replace(/attribute2/g, attribute2);
			retText = retText.replace(/thecategory/g, category);
			return retText;
		}

		var messageDef = [
			{ cut:'-0.65', message : getFBFromTemplate(piCurrent.fb_strongAssociationWithAttribute1) },
			{ cut:'-0.35', message : getFBFromTemplate(piCurrent.fb_moderateAssociationWithAttribute1) },
			{ cut:'-0.15', message : getFBFromTemplate(piCurrent.fb_weakAssociationWithAttribute1) },
			{ cut:'0.15',  message : getFBFromTemplate(piCurrent.fb_neutralAssociation) },
			{ cut:'0.35',  message : getFBFromTemplate(piCurrent.fb_weakAssociationWithAttribute2) },
			{ cut:'0.65',  message : getFBFromTemplate(piCurrent.fb_moderateAssociationWithAttribute2) },
			{ cut:'5',     message : getFBFromTemplate(piCurrent.fb_strongAssociationWithAttribute2) }
		];

		var scoreMessageObject = { MessageDef : messageDef };
		if (piCurrent.manyErrors !== '') scoreMessageObject.manyErrors = piCurrent.manyErrors;
		if (piCurrent.tooFast !== '') scoreMessageObject.tooFast = piCurrent.tooFast;
		if (piCurrent.notEnough !== '') scoreMessageObject.notEnough = piCurrent.notEnough;

		scorer.addSettings('message', scoreMessageObject);

		API.addSettings('hooks',{
			endTask: function(){
				var DScoreObj = scorer.computeD();
				piCurrent.feedback = '';
				piCurrent.d = DScoreObj.DScore;
				window.minnoJS.onEnd();
			}
		});

		return API.script;
	}

	return stiatExtension;
});
