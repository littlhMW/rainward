// Original Chinese guidance. Factual references: docs/SOURCES.md.
// The real renderer is vendored separately in upstream/; map data loads on demand.
export const DATA_VERSION = '2026-10-12';
const wiki = (page) => `https://rainworld.miraheze.org/wiki/${page.replaceAll(' ', '_')}`;

export const REGIONS = {
  SU: { name: '郊区', english: 'Outskirts', x: 285, y: 335, clue: '先记住身边的食物与休眠处。' },
  HI: { name: '工业区', english: 'Industrial Complex', x: 450, y: 265, clue: '岔路很多，先建立一个可靠落脚点。' },
  DS: { name: '排水系统', english: 'Drainage System', x: 420, y: 445, clue: '水下通道需要预留回头的余地。' },
  GW: { name: '垃圾场', english: 'Garbage Wastes', x: 600, y: 410, clue: '观察其他居民的动作，再决定如何经过。' },
  SH: { name: '阴影城堡', english: 'Shaded Citadel', x: 650, y: 290, clue: '黑暗里，照明会比冒进更有用。' },
  SL: { name: '海岸线', english: 'Shoreline', x: 830, y: 405, clue: '沿水边寻找落脚处，不要一口气游太远。' },
  CC: { name: '烟囱天棚', english: 'Chimney Canopy', x: 475, y: 140, clue: '高处的开阔路段，先观察再起跳。' },
  SI: { name: '天空岛', english: 'Sky Islands', x: 295, y: 140, clue: '地形间的距离，比平面连线看起来更远。' },
  LF: { name: '农场阵列', english: 'Farm Arrays', x: 160, y: 280, clue: '这里的一些路，需要借助环境中的生物。' },
  UW: { name: '外缘', english: 'The Exterior', x: 730, y: 150, clue: '向上探索之前，先确认安全退路。' },
  SS: { name: '五块卵石', english: 'Five Pebbles', x: 890, y: 110, clue: '改变的移动规则，需要慢慢适应。' },
  SB: { name: '地下', english: 'Subterranean', x: 460, y: 570, clue: '长距离探索前，先找到能休息的地方。' },
  VS: { name: '管道场', english: 'Pipeyard', x: 540, y: 345, clue: '纵向支路多，记下刚经过的入口。' },
  OE: { name: '外部扩张区', english: 'Outer Expanse', x: 145, y: 540, clue: '入口有剧情条件，不要把锁门误认为业力不够。' },
  MS: { name: '沉没巨构', english: 'Submerged Superstructure', x: 925, y: 545, clue: '深入前，先评估自己的水下行动能力。' },
  LM: { name: '滨水设施', english: 'Waterfront Facility', x: 810, y: 390, clue: '跨越水域与高处设施时，留意新的休眠点。' },
  LC: { name: '大都会', english: 'Metropolis', x: 925, y: 240, clue: '这里的入口需要先完成一次重要会面。' },
  RM: { name: '腐化之地', english: 'The Rot', x: 890, y: 110, clue: '路线复杂，不要把其他角色的房间路线直接照搬。' },
  DM: { name: '仰望皓月', english: 'Looks to the Moon', x: 930, y: 310, clue: '上行和返程可能经过不同的入口。' },
  UG: { name: '下层丛林', english: 'Undergrowth', x: 420, y: 445, clue: '温度与外面不同，是重新整理行程的机会。' },
  CL: { name: '寂静构造', english: 'Silent Construct', x: 710, y: 225, clue: '寻找高处与通往不同高度的通道。' },
  HR: { name: '卢比孔', english: 'Rubicon', x: 665, y: 600, clue: '仅在本次旅途的条件齐备后再前往。' },
};

// Watcher names are descriptive Chinese labels; the English name / region code
// is authoritative when an in-game translation differs. These are waypoint
// positions, NOT a fabricated map of dynamic warp connections.
const watcherRegions = [
  ['WRFA','珊瑚洞窟','Coral Caves'], ['WSKB','日晒小巷','Sunbaked Alley'],
  ['WSKA','暴雨铁路','Torrential Railways'], ['WARF','以太山脊','Aether Ridge'],
  ['WBLA','荒芜之地','Badlands'], ['WARD','冷藏库','Cold Storage'],
  ['WTDB','荒凉地带','Desolate Tract'], ['WARC','恶臭幽谷','Fetid Glen'],
  ['WVWB','破碎关隘','Fractured Gateways'], ['WARE','热力管道','Heat Ducts'],
  ['WMPA','迁徙之路','Migration Path'], ['WPGA','柱林','Pillar Grove'],
  ['WRRA','锈蚀残骸','Rusted Wrecks'], ['WARB','盐化之地','Salination'],
  ['WSKD','隐蔽高楼','Shrouded Stacks'], ['WPTA','信号尖塔','Signal Spires'],
  ['WSKC','风暴海岸','Stormy Coast'], ['WARG','地表','The Surface'],
  ['WTDA','灼热沙漠','Torrid Desert'], ['WRFB','湍流泵站','Turbulent Pump'],
  ['WVWA','翠绿水道','Verdant Waterways'], ['WSUR','崩毁边缘','Crumbling Fringes'],
  ['WHIR','腐坏工厂','Corrupted Factories'], ['WDSR','衰败隧道','Decaying Tunnels'],
  ['WGWR','侵染废土','Infested Wastes'], ['WARA','破碎露台','Shattered Terrace'],
  ['WRSA','戴蒙','Daemon'], ['WSSR','不幸进化','Unfortunate Evolution'],
  ['WORA','外环','Outer Rim'], ['WAUA','古老城区','Ancient Urban'],
];
watcherRegions.forEach(([id,name,english],i) => {
  REGIONS[id] = { name, english, x: 120 + (i % 6) * 150, y: 125 + Math.floor(i / 6) * 105, clue: '以游戏内传送图与当前能力为准；此处只记录探索路标。', waypoint: true };
});

// Verified base-game regional adjacency, without Downpour-only passages.
const vanillaEdges = [
  ['SU','HI'],['SU','DS'],['SU','LF'],['HI','GW'],['HI','CC'],['HI','SH'],
  ['DS','GW'],['DS','SB'],['GW','SL'],['SH','SL'],['SH','UW'],['CC','UW'],
  ['CC','SI'],['SI','LF'],['LF','SB'],['SL','SB'],['UW','SS'],
];
const expansionEdges = [...vanillaEdges, ['DS','CC'],['GW','SH'],['HI','VS'],['SI','VS'],['SB','VS'],['SL','VS'],['SL','MS']];
const renameEdges = (edges, names) => edges.map(([a,b]) => [names[a] || a, names[b] || b]);
const stage = (id,title,destination,hints,completion,extra = {}) => ({ id,title,destination,kind:'story',hints,completion,...extra });
const optional = (id,title,destination,hints,completion,extra = {}) => stage(id,title,destination,hints,completion,{kind:'optional',...extra});
const map = (slugcat,region) => `https://rain-world-map.github.io/map.html?slugcat=${slugcat}&region=${region}`;
const basicScope = '基础游戏 12 区的区域连接与推荐故事路线。Downpour 的额外通道和可选结局单独说明；不是逐房间导航。';
const graphNote = '连线仅表示区域可连接，不代表最短、安全或当前可通过。业力、单向落差、角色能力与剧情门槛仍以游戏为准。';

const firstJourney = () => [
  stage('settle','先让自己安顿下来','HI',[
    '这段旅途不需要赶进度。先吃饱、睡稳，再尝试向外探索。',
    '从起点向右上探索。第一次远行可以先到一片管道与厂房密集的区域。',
    '郊区 → 工业区。找到可用休眠处并睡过一次，就可以继续下一段。',
  ],'我已经在起点以外找到休眠处并安全过夜。'),
  stage('first-visit','去见旅途中的第一位访客','SL',[
    '跟随黄色向导；它有时只是在提示食物和住处，不会一直给出方向。',
    '从工业区经过垃圾场，朝更开阔的水域前进；到水边后继续向东。',
    '前往海岸线最东边的设施，直到遇到一位可以停下来观察的居民。先不要拿走或吃掉对方身边的发光物；听不懂并不表示走错。',
  ],'我已经完成东侧设施里的第一次会面。'),
  stage('high-visit','继续向更高的地方走','SS',[
    '第一次会面之后，旅途会把你引向高处。先为黑暗和攀爬准备好。',
    '从海岸线进入阴影城堡，经记忆地窖上到外缘；这条故事路线需要耐心，不是最短路线。',
    '外缘 → 五块卵石。进入内部后向上探索，直到发生完整的会面并得到新的指引。部分内部岔路可以绕开，不必挑战每条危险支路。',
  ],'高处的会面已经结束，我收到下一步的指引。'),
  stage('far-journey','带着新的指引继续旅程','SB',[
    '按照刚刚收到的方向行动。远行前，可以先完成想做的回访。',
    '向西行进，再寻找深入地下的路线。常用区域顺序是外缘 → 烟囱天棚 → 天空岛 → 农场阵列。',
    '从农场阵列前往地下，再进入更深处。先确认刚才的会面已完成；如果深处明确阻挡你，先回去检查成长条件，不必反复硬闯。',
  ],'我已经完成这段旅途的收尾。'),
  optional('return-visit','有空时，回去看看','SL',[
    '经历过高处的会面后，可以重新拜访早先遇见的居民。',
    '沿已走过的路返回东侧水域；不必为此重置存档。',
    '回访海岸线最东端的设施。带上你主动想了解的物品即可；这是补充故事的可选支线。',
  ],'我已完成一次想做的回访。'),
  optional('alternate-journey','另一条旅途，需要先解锁','OE',[
    '开启 Downpour 后，某些较早角色会多出另一条可选旅途。',
    '需要先在同一存档槽完成饕餮的旅途。未解锁时不必围着特殊锁门反复尝试。',
    '解锁后从地下的西侧进入外部扩张区，继续探索至旅途终点。郊区附近看见的连接不能当作进入该区域的捷径。',
  ],'我已在满足解锁条件后完成另一条旅途。',{requiresDlc:true}),
];

const hunterStages = [
  stage('high-stop-1','先规划沿途的停留','SI',[
    '这位旅者的时间有限。先保管好开局携带的物品，把重要停留与行程一起规划。',
    '从农场阵列向天空岛走，留意接近高处时出现的特殊环境信号。',
    '天空岛靠近农场阵列连接的高处有一次可提升上限的会面。猎手不用先来一次激活，但仍需足够当前业力；完成后检查上限是否变化。',
  ],'我已完成天空岛的特殊会面，或已有等效的成长进度。'),
  stage('high-stop-2','高处的第二次停留','CC',[
    '沿途的特殊停留会为之后节省折返。保持状态，再继续前进。',
    '从天空岛进入烟囱天棚，在两区连接附近向上寻找。',
    '烟囱天棚最高处有另一处可提升上限的会面。不要把普通休眠带来的当前业力提升与上限提升混为一谈。',
  ],'我已完成烟囱天棚的特殊会面，或已有等效进度。'),
  stage('high-stop-3','登上外侧的高墙','UW',[
    '再向上走，可以把另一处重要停留安排在同一条行程里。',
    '从烟囱天棚进入外缘，沿墙向高处探索。',
    '外缘的墙顶附近有第三处可提升上限的会面。抵达后确认上限已经提高，再准备进入相邻设施。',
  ],'我已完成墙顶的特殊会面，或已有等效进度。'),
  stage('extra-time','争取一点额外时间','SS',[
    '此行不是必须，但一位高处的居民可以让余下的旅途更从容。',
    '先保管好开局携带的物品，再进入高处设施。不要用进食操作处理任务物。',
    '在五块卵石完成会面。默认会获得额外 5 周期；这里只提升一次上限，不能照搬幸存者的成长条件。',
  ],'我已完成高处会面，并确认剩余周期与上限。'),
  stage('delivery','完成手中的委托','SL',[
    '开局随身的东西有去处。先不要为了腾出手而遗弃它。',
    '从高处回到外缘，经阴影城堡走向东侧的海岸线。',
    '前往海岸线最东端设施，放开随身的绿色物品，让会面完整进行；胃里原有的珍珠也可交给对方。完成交付后再离开。',
  ],'我已经交付开局携带的任务物，并等会面结束。'),
  stage('hunter-close','在余下时间里继续前进','SB',[
    '委托完成后，你仍可以为自己安排旅途的收尾。',
    '可以从海岸线进入地下。先确认已获得足够上限；低于目标时，途中其他特殊会面仍有帮助。',
    '进入地下深处前，最大业力需达到 10。上面的三次特殊停留加高处会面可满足条件；默认周期归零后继续行动会有严重风险。',
  ],'我已在自己的时间安排内完成收尾。'),
];

export const CAMPAIGNS = [
  { id:'survivor', name:'幸存者', english:'SURVIVOR', dlc:'原版', color:'#e9eadf', start:'SU', mapUrl:map('white','SU'), scope:basicScope, graphNote, routeMode:'graph', edges:vanillaEdges, dlcEdges:expansionEdges, directedEdges:[], warning:'适合第一次游玩。普通死亡不会删除整段存档，先学会稳定过夜。', food:'4 格休眠 / 最多 7 格', stages:firstJourney() },
  { id:'monk', name:'僧侣', english:'MONK', dlc:'原版', color:'#e5c96d', start:'SU', mapUrl:map('yellow','SU'), scope:basicScope, graphNote, routeMode:'graph', edges:vanillaEdges, dlcEdges:expansionEdges, directedEdges:[], warning:'较温和的旅途。通过一次的业力门会免除之后的业力要求，但同一周期仍不能反复通过。', food:'3 格休眠 / 最多 5 格', stages:firstJourney() },
  { id:'hunter', name:'猎手', english:'HUNTER', dlc:'原版', color:'#db8078', start:'LF', mapUrl:map('red','LF'), scope:basicScope, graphNote, routeMode:'graph', edges:vanillaEdges, dlcEdges:expansionEdges, warning:'默认只有 20 个周期；Remix 可改。周期归零及以下的失败可能结束整个周目。开局任务物要保留；没有 Passage 传送令牌。', food:'6 格休眠 / 最多 9 格', stages:hunterStages },
  { id:'gourmand', name:'饕餮', english:'GOURMAND', dlc:'Downpour', color:'#d8b18a', start:'SH', mapUrl:map('gourmand','SH'), scope:'Downpour 主线、区域连接、食物清单与回访分支。食物清单不是普通结局的必需条件。', graphNote:graphNote+' 通往外部扩张区的入口需先完成高处会面；外部扩张区 → 郊区为单向。', routeMode:'graph', edges:[...expansionEdges,['SB','OE']], directedEdges:[['OE','SU']], conditionalEdges:[{from:'SB',to:'OE',requires:'gourmand-visit'}], warning:'连续跳跃和投矛会让你疲惫；先歇一会儿再行动。食物清单可以沿途完成，不必一开始强迫自己集齐。', food:'7 格休眠 / 最多 11 格', stages:[
    stage('gourmand-visit','先去高处拜访','SS',['先建立补给点，体力恢复后再考虑长距离攀爬。','从阴影城堡经记忆地窖进入外缘，再探索高处设施。','在五块卵石完成会面，听完新的方向提示。这次会面会关系到下一处入口，不能只走到区域边界就勾选。'],'我已完成高处会面并收到新的方向。'),
    stage('gourmand-west','向远处的出口旅行','OE',['按刚得到的指引走，可以开始穿过熟悉世界的边缘。','向西，找到地下区域最西侧的特殊入口。','从地下进入外部扩张区，然后继续向西寻找旅途终点。入口条件是先完成高处会面；食物清单不必先全部完成。'],'我已抵达外侧区域，并完成这段旅途。'),
    optional('gourmand-food','把沿途的味道记下来','OE',['休眠界面的食物记录是额外目标，可以一路慢慢收集。','先按清单补齐已见过的食物；最后几种需要外侧区域，没见到不等于遗漏。','共有 22 类食物要求；完整清单会揭示生物与地点，此处不默认展开。若想完成清单分支，先补齐再抵达外部扩张区的终点。'],'我选择完成食物清单，并在收尾前确认齐全。'),
    optional('gourmand-coast','沿途的一次探望','SL',['旅行中可以给另一位居民留些时间。','从阴影城堡或垃圾场走向东侧水域。','海岸线最东侧设施可进行额外会面；它不是打开西侧出口的条件。'],'我完成了这次可选探望。'),
  ] },
  { id:'artificer', name:'工匠', english:'ARTIFICER', dlc:'Downpour', color:'#b96865', start:'GW', mapUrl:map('artificer','GW'), scope:'Downpour 主要故事路线及另一种收尾的条件提醒；不提供击败关键角色的剧情说明。', graphNote:graphNote+' 大都会入口需要高处会面；滨水设施并不通向另一位可会面的居民。', routeMode:'graph', edges:[...renameEdges(expansionEdges.filter(e=>!e.includes('MS')),{SL:'LM'}),['UW','LM'],['UW','LC']], conditionalEdges:[{from:'UW',to:'LC',requires:'artificer-visit'}], warning:'你的过门方式不同；可携带拾荒者尸体满足门槛。爆炸行动会积累过热，短暂潜水也很危险。', food:'6 格休眠 / 最多 9 格', stages:[
    stage('artificer-visit','让旅途有一个方向','SS',['先掌握自己的移动能力，再把目标放到高处。','垃圾场 → 工业区 → 烟囱天棚 → 外缘是一条区域路线；也可从阴影城堡攀升。','前往五块卵石完成会面，等随行装置相关互动结束。不能直接从起点奔向特殊锁门。'],'我已完成高处会面，随行装置已经可以继续引路。'),
    stage('artificer-city','穿过为你开启的门','LC',['会面之后，一条此前无法使用的入口有了意义。','回到高处的外侧通道，寻找需要随行装置的特殊门。','从外缘进入大都会，继续在城内向上、向深处探索。重要会面与区域内的最后行动由你亲自决定。'],'我已完成城内这条旅途的收尾。'),
    optional('artificer-choice','在最后行动前，给自己留一个选择','SB',['这次旅途有另一种走法。若想保留选择，先不要仓促进行明确的最终行动。','沿途特殊会面可以提高上限；你的初始上限和其他角色不同，低上限时还有额外出现条件。','另一条收尾在地下深处。需要先研究工匠的回响出现条件；低于 5 上限时要在最高当前业力并带花保护的状态加载对应区域。城内最终行动会改变之后的选择。'],'我已了解另一种选择的条件，并自行决定是否走这条路。'),
  ] },
  { id:'rivulet', name:'溪流', english:'RIVULET', dlc:'Downpour', color:'#90cedc', start:'DS', mapUrl:map('rivulet','DS'), scope:'Downpour 角色主线；按会面、任务物、目的设施、回访顺序提供渐进提示。', graphNote, routeMode:'graph', edges:renameEdges(expansionEdges,{SS:'RM'}), warning:'开局周期明显更短。游泳很强，但并不能无限呼吸；连续水下冲刺会更快耗气。', food:'5 格休眠 / 最多 6 格', stages:[
    stage('rivulet-coast','先去东边拜访','SL',['随身物品可以为你的旅途提供线索，先不要随意丢弃。','从排水系统经垃圾场走向东侧水域。','前往海岸线最东侧设施，与居民会面；可带上开局携带的珍珠。这是理解路线的推荐步骤，并非强制开门条件。'],'我已完成东边的会面并记下指引。'),
    stage('rivulet-high','到高处确认下一步','RM',['下一段要向更高的设施前进，途中优先找近一些的休眠点。','从海岸线经阴影城堡上外缘，或经工业区与烟囱天棚向上。','外缘 → 腐化之地。找到区域内能交流的居民，听完会面；不要把其他角色的五块卵石房间路线直接照搬。'],'我已经在高处完成会面，知道接下来要带走什么。'),
    stage('rivulet-carry','带好这次旅途需要的东西','RM',['先等当前会面结束，再确认任务物真的在手；区域入口不等于任务完成。','按刚才的指引继续探索同一设施，取得明确交代给你的物件。','仍在腐化之地：找到并带上稀疏电池，再准备返程。若丢失，先在已开启的关键物品追踪中寻找；不要空手去下一处深水设施。'],'我已经带上这次任务所需的物件。'),
    stage('rivulet-deep','让它抵达该去的地方','MS',['沿原先的方向回到水边，这次要比第一次走得更深入。','带着任务物抵达海岸线，再寻找深入水下结构的入口。','海岸线 → 沉没巨构。前往其中的心脏区域，按现场交互安置任务物；单纯跨过区域门还不算完成。'],'我已在深处设施完成任务物的安置。'),
    stage('rivulet-return','完成之后，再去见一面','SL',['事情办妥后，还有一次值得停下来听完的回访。','沿深处设施的后续通道返回东侧曾拜访过的地方。','回到海岸线最东侧设施，完成安置任务物后的会面。不要在任务物仍未安置时提前勾选。'],'我已经完成任务后的回访。'),
  ] },
  { id:'spearmaster', name:'矛大师', english:'SPEARMASTER', dlc:'Downpour', color:'#b596d1', start:'SU', mapUrl:map('spear','SU'), scope:'Downpour 送信主线；先进行一次可选理解性会面，再完成主线往返。重要携带物单独提醒。', graphNote, routeMode:'graph', edges:[...renameEdges(expansionEdges.filter(e=>!e.includes('MS')),{SL:'LM'}),['UW','LM'],['LM','DM']], warning:'只有新生成、仍与身体相连的针矛命中可供进食的活物时才能取食。后半程的关键物品需亲手携带，不能假定 Passage 自动带走。', food:'5 格休眠 / 最多 10 格', stages:[
    stage('spear-high','跟随向导，完成来时的委托','SS',['留意红色向导给的方向。先把生存补给安排好，再去高处。','从郊区经工业区、烟囱天棚进入外缘；另一位居民的提前拜访属于可选分支。','在五块卵石完成会面。离开前务必检查现场留下的重要珍珠，将它带好；不要误当普通杂物。'],'我完成高处会面，并已带上重要物件。'),
    stage('spear-deliver','把留下的东西交到另一处','DM',['接下来是一次送达。不要为了腾出一只手而遗失刚拿到的物件。','从外缘经仍完整的桥路进入滨水设施，再寻找向另一座设施上行的入口。','滨水设施 → 仰望皓月。带着重要珍珠完成会面；等待物品相关互动全部结束，再拿上它离开。'],'我已经带着重要物件完成第二处会面。'),
    stage('spear-final','把新的指引带向远方','SI',['最后一程需要带上刚才处理过的物件。出发前再检查一次。','目的地在西侧高处。可以经外缘、烟囱天棚去天空岛。','带着已被处理过的珍珠前往天空岛的通讯阵列，抵达顶部并完成现场交互。这里需要的是这件任务物，不是任意珍珠。'],'我已把正确的任务物带到最后的指定位置。'),
    optional('spear-early','出发前，也可以先去听一听','DM',['如果你想更好理解此行，可以先去拜访另一位居民，再完成高处的委托。','先从郊区走向工业区、垃圾场、滨水设施，寻找上行入口。','在初访五块卵石之前拜访仰望皓月，可以获得理解对话的帮助。之后主线仍需在五块卵石取得物品，再回来一次。'],'我选择完成了这次提前拜访。'),
  ] },
  { id:'saint', name:'圣徒', english:'SAINT', dlc:'Downpour', color:'#9eba83', start:'SI', mapUrl:map('saint','SI'), scope:'Downpour 七次成长会面与主线终点。所列次序是一次可行的巡访安排，可以按已完成项目调整。', graphNote:graphNote+' 地下 → 卢比孔是具备条件后才能进入的单向终点；已按此角色替换区域与连接。', routeMode:'graph', regionNames:{SU:'郊区雪原',HI:'冰封纪念碑',CC:'孤寂高塔',GW:'冰川废土',VS:'荒芜管线',SL:'寒冷海岸',SI:'风吹群塔',LF:'荒芜田野',SB:'原始地底'}, edges:[...renameEdges(expansionEdges.filter(e=>!e.includes('SS')&&!e.includes('UW')),{DS:'UG',SH:'CL'})], directedEdges:[['SB','HR']], warning:'主要食用植物，投矛无法照搬其他角色。室外要留意体温；提灯等热源有帮助。没有 Passage 传送令牌。', food:'4 格休眠 / 最多 5 格', stages:[
    stage('saint-one','从第一处停留开始','SI',['这次的方向来自沿途的特殊停留。先安全度过开场，再留意环境变化。','在起点所在区域，寻找靠近西侧连接的较高位置。','风吹群塔（天空岛）高处有第一处成长会面。开场第 0 周期不会出现；先正常休眠一次。会面条件不要求你先把当前业力刷满。'],'我在起点区域完成了一次成长会面。'),
    stage('saint-two','沿高处继续巡访','CC',['沿途特殊信号出现时，值得停下来寻找。','走向起点以东的高塔区域，并向最高处探索。','孤寂高塔（烟囱天棚）最高处，靠近天空岛连接附近，完成一次成长会面。'],'我已完成高塔区域的成长会面。'),
    stage('saint-three','到另一片遗构去','CL',['地形已经不同于旧旅途，先把熟悉的名字暂时放下。','经工业区方向前往东侧的巨构遗址，寻找右侧高处。','寂静构造最右侧、昔日外缘支腿上方有一处成长会面。按照本角色的地形找路。'],'我已经完成遗构高处的成长会面。'),
    stage('saint-four','水边也有值得停留的地方','SL',['拜访水边的旧地时，别急着原路离开。','沿东侧海岸走，在最东设施的上部寻找继续向上的路径。','寒冷海岸（海岸线）东端设施上方的墙顶有一次成长会面。这里的重力变化可帮助进入上部通路。'],'我已完成东侧海岸高处的成长会面。'),
    stage('saint-five','寻找一处较温暖的停留','UG',['在严寒里，改变环境也是调整旅途的好方法。','向西进入温暖的地下植被区域，留意靠近地下连接的一侧。','下层丛林最西侧、接近原始地底的入口附近有一次成长会面。'],'我已完成较温暖区域的成长会面。'),
    stage('saint-six','回到西侧的田野','LF',['继续补齐没有完成的会面即可，不需要按照唯一顺序行走。','可以经郊区雪原进入西侧田野，留意靠近来路的高处。','荒芜田野（农场阵列）靠近郊区入口的高处有一次成长会面。'],'我已完成西侧田野的成长会面。'),
    stage('saint-seven','进入深处之前的停留','SB',['最后一次巡访可以与前往深处的行程放在一起。','由西侧田野进入地下，留意入口附近右侧的洞窟。','原始地底（地下）靠近农场阵列入口的右侧洞窟有一次成长会面。通常完成七次不同会面后，上限由 2 到 10。'],'我已完成所需成长，并确认上限达到要求。'),
    stage('saint-close','准备好后，走向深处','HR',['先完成仍想进行的回访，再继续这次旅途。','检查成长条件已经齐备，再从地下向更深处探索。','最大业力达到 10 后，进入原始地底深处，再前往卢比孔。此前的其他居民回访是可选分支，不应被当成强制前置。'],'我已经完成深处的旅途。'),
    optional('saint-extra','一次更难的额外巡访','MS',['仍有一处额外停留，但它不必成为阻挡主线的清单。','东侧水下设施内有更远的高处，行动能力充足后再去。','沉没巨构的苦涩雪峰、辅助通讯阵列附近有额外会面。常规七处已足够达成上限，不必为了通关强行潜水。'],'我选择完成了这处额外巡访。'),
  ] },
  { id:'watcher', name:'观望者', english:'WATCHER', dlc:'The Watcher', color:'#9599c2', start:'HI', mapUrl:'https://alduris.github.io/watcher-map/map.html?region=HI', scope:'按 Watcher 1.5 后的四条结局条件整理。提供序章连接、成长会面、动态路标和分支提醒；不把随机或会关闭的传送路径当成固定路线。', graphNote:'序章连线可参考；进入传送阶段后，以你存档中的传送图为准。虚线可能是单向或动态通路。30 个新区域仅提供路标，不计算跨区最短路。', routeMode:'waypoints', edges:[['HI','SU'],['HI','CC'],['HI','SH'],['SU','LF']], regions:['HI','SU','CC','SH','LF',...watcherRegions.map(r=>r[0])], warning:'传送后的疲劳不会因为雨计时重置就消失，仍需要休眠。后期两条分支会相互影响；想同档体验全部路线，先读当前阶段的分支提醒。', food:'4 格休眠 / 最多 7 格', stages:[
    stage('watcher-prologue','完成序章里的三次停留','CC',['先在能够到达的区域里寻找异常环境信号，不必强闯封住的通路。','序章的三次停留分布在高塔、阴影中的城堡和西侧田野；顺序可以调整。','依次找到烟囱天棚最高处、阴影城堡东侧入口下方洞窟、农场阵列东部的特殊会面。需要完成三次后再跟随后续新通路；不是只去其中一个。'],'我已完成序章三次会面，并进入新的旅行方式。'),
    stage('watcher-explore','在新区域里继续相遇','WARF',['新的旅行方式没有固定走法。每到一处，留意熟悉的环境信号。','沿当前存档中的传送图探索不同区域。停留会带来成长，连续传送后要先休息。','需要在不同新区域完成 8 次有效成长会面，把涟漪上限升到 9。可选地点包括以太山脊、荒凉地带、荒芜之地、湍流泵站、灼热沙漠、热力管道、风暴海岸、翠绿水道、信号尖塔、恶臭幽谷、盐化之地与破碎关隘；不要求固定顺序。'],'我的新能力上限已经达到 9。',{destinations:['WARF','WTDB','WBLA','WRFB','WTDA','WARE','WSKC','WVWA','WPTA','WARC','WARB','WVWB']}),
    stage('watcher-old-friend','按约定，去完成一次会面','WAUA',['当新能力足够稳定时，早先的相遇还有后续。','先用已经掌握的完整能力寻找平时看不到的会面；完成后再沿新出现的通路前进。','当前涟漪达到 9 时，在破碎露台进入涟漪空间完成会面，再走出现的新通路至古老城区。完成当地连续会面后，醒来还需回到最初的房间，才能完整结束这一支。'],'我已完成这一条会面的收尾，并在醒来后完成回访。'),
    stage('watcher-outer','留意另一处反复变化的地方','WORA',['有些地方需要在能力成长后再次造访，第一次来没有后续并不代表走错。','抵达这条线索指向的区域后，留意中央设施上部的对话和新开的侧室。','在外环上部设施完成首次探访；之后分别在上限至少 3、5、7 时返回并完整触发上部对话。四个出口房间全部开放后，再与出现的居民完成至少一次会面。'],'我已开放四处出口，并在此之后完成一次会面。'),
    stage('watcher-feathers','跟随金色的痕迹','WRSA',['新的痕迹可能只会出现在曾经走过、后来发生变化的通路旁。先查看下面的可选分支，再进行第四次相遇。','在休眠地图上观察区域图标旁的金色羽毛，返回相应区域调查已关闭的自建通路。','让镜头看到已封闭、仍可触发相遇的动态传送点，再跟随涟漪空间中的丝线与光迹。累计完成四次相遇后，按照新指引处理所有应关闭的传送点；外环及涟漪专用通路不计入普通清单。完成该分支后会返回戴蒙。'],'我已完成金色痕迹这一支的收尾。'),
    stage('watcher-final','确认各条线索已经汇合','WRSA',['这一步需要此前不止一条旅途的进展。没有触发时，先检查遗漏的会面。','确认早先约定的会面一支、金色痕迹的一支都已收尾，并已在另一处设施变化完成后拜访其居民。','前往戴蒙，检查三座方碑。条件是已完成古老城区分支、已完成金色痕迹分支、并在外环居民出现后至少交谈一次；可选的扩散分支不是必要条件。'],'我已在条件齐备后完成最后的旅途。'),
    optional('watcher-other','保留同一存档里的另一种选择','WORA',['如果你想同一存档体验全部路线，这个提醒应在金色痕迹的第四次相遇之前查看。','两条后期目标会相互影响。先完成涉及扩散的可选目标，再进行第四次金色相遇，会更容易保留全部选择。','可选分支要求把特殊侵染传播至所有可感染区域，再回外环居民处完成会面。第四次与金色痕迹对应居民相遇后，能力会阻碍继续扩散；此支不是最终主线的必需条件。'],'我已决定是否完成这条可选分支，并安排了先后顺序。',{before:'watcher-feathers'}),
  ] },
];

export const SURVIVAL_TIPS = [
  { id:'shelter', category:'生存', title:'先找到下一张床', summary:'探索的目标可以只是找到一个新休眠处。', body:'吃够食物后，进入可用休眠处并保持安静即可过夜。休眠会保存进度；仅仅走进新区域不会保存这一周期。食物够了也可以提前休息，不必等到最后一刻。', source:wiki('Hibernation') },
  { id:'food', category:'生存', title:'看分隔线，不必每次填满', summary:'休眠需要多少食物，取决于当前角色。', body:'食物条上的分隔线是本次安全休眠所需数量，右侧通常可留给下一周期。幸存者 4、僧侣 3、猎手 6、饕餮 7、工匠 6、溪流 5、矛大师 5、圣徒 4、观望者 4。角色的食谱也不同。', source:wiki('Slugcat') },
  { id:'rain', category:'生存', title:'回程也要算进雨计时', summary:'看到屏幕晃动再找住处，通常太迟。', body:'查看地图时留意周期计时。给返程和躲避生物留出余量；有些区域的周期末规则不同，不能把上个角色的时长当成固定标准。溪流尤其需要更早规划休眠，圣徒要关注体温。', source:wiki('Rain') },
  { id:'karma', category:'卡住了', title:'门不开，先看哪一边的符号', summary:'当前业力和业力上限是两回事。', body:'通常，吃够并成功休眠会提高当前业力，死亡会降低它；门需要你达到面前这一侧显示的等级。两边门槛可以不同，站稳等待开门。同一扇门通常每周期只能用一次，僧侣已经解锁的门也不例外。', source:wiki('Karma Gate') },
  { id:'death', category:'安心玩', title:'普通死亡不等于全部重来', summary:'先把一次探索看作收集经验。', body:'多数角色死亡后会回到上一次成功休眠的进度，探索过的地图通常会保留。可以用某个周期练习路线，不必每次都推进故事。猎手的周期限制是重要例外；不要把这条建议套用到负周期的猎手。', source:wiki('Hibernation') },
  { id:'starving', category:'生存', title:'饥饿休眠不是普通存档', summary:'不够食物时强行休眠，会留下额外风险。', body:'至少有一格食物时可以在休眠处按住下尝试饥饿休眠，但进度并未正常保存，下一周期还会虚弱并要求吃满整条食物。失败会回滚到前一次正常存档。新手优先找食物，不把它当作免费的存档方式。', source:wiki('Hibernation#Starvation') },
  { id:'swim', category:'操作', title:'水下冲刺会更快耗气', summary:'先确认出口，再进入长水道。', body:'平稳游动并尽量规划换气点；频繁按跳跃做水下加速会快速耗尽空气。溪流也只是肺活量更大，并非无限呼吸。原路返回有时比勉强去不确定的出口更安全。', source:wiki('Rivulet') },
  { id:'guide', category:'探索', title:'向导暂时没指路，不代表卡关', summary:'它也会提示食物、住处和危险。', body:'可以继续寻找相邻可通行区域，或先吃饱过夜。向导不是每个房间都给出导航；如果刚遇见安静的居民，先观察，不要为了试效果随便攻击、抓走或吃掉对方身边的物件。', source:wiki('Yellow Overseer') },
  { id:'visitors', category:'探索', title:'会面时，先放下攻击的习惯', summary:'安静等互动结束，往往比反复按键更有用。', body:'不是所有看见的东西都是敌人或食物。遇到明显特殊的房间或居民时，先站稳观察；看不懂当下的表达也可能是正常进度。发现对方对抓取行为明显抗拒，及时松开。', source:wiki('Plot') },
  { id:'scavs', category:'生存', title:'路上遇到一群居民，先观察', summary:'蹲低、放慢，留意对方是否允许你过去。', body:'部分路口有拾荒者收取通行物，珍珠通常是有价值的交换物。把它放下，等待对方接纳和挥手，再通行。不要因为一次过路顺利，就假定以后所有路口都免费；工匠的关系规则也不同。', source:wiki('Scavenger#Tolls') },
  { id:'light', category:'探索', title:'黑暗里先解决看不清的问题', summary:'照明本身也是路线准备。', body:'看到携带提灯的居民时，可以尝试交换。没有照明就走进黑暗，不代表游戏要求你完全摸黑。先找光源或暂时选择别的可达路线，不必通过伤害特殊居民来取得发光效果。', source:wiki('Lantern') },
  { id:'movement', category:'操作', title:'先练三件常用动作', summary:'蓄力跳、墙跳、投掷，比复杂连招更早派上用场。', body:'在安全平地练习蹲下蓄力跳；靠墙时练习朝另一侧起跳；再试着用石块制造短暂逃跑机会。不同角色的速度、疲劳和投掷能力不同，过不了的跳跃不一定是路线错误。', source:wiki('Controls') },
  { id:'hands', category:'操作', title:'腾出手之前，检查你带着什么', summary:'重要物品不一定会自动随你传送。', body:'普通角色可用胃暂存某些小物件，但并非所有角色、所有物件都可以。矛大师后半程尤其要保留任务物。使用 Passage 前，先检查 Remix 的关键物品追踪和携带设置；不要默认手上所有东西都会同行。', source:wiki('Passages') },
  { id:'passage', category:'探索', title:'长途折返也有另一种办法', summary:'已赚到的 Passage，可以回到去过的休眠处。', body:'有可用令牌的角色，可在休眠界面使用 Passage，选择本次战役去过的休眠处。令牌会消耗，先确认落点；猎手、圣徒和观望者不会获得这种传送令牌。关键物品是否同行取决于设置。', source:wiki('Passages') },
  { id:'remix', category:'安心玩', title:'需要帮助，可以先看看 Remix', summary:'辅助设置不必等到受挫很久才考虑。', body:'在游戏的 Remix 配置里，可以寻找额外教程、呼吸显示等辅助选项；具体名称取决于语言和版本。猎手周期数与奖励周期也可调整。先改你确实需要的选项，并记下改动，之后随时恢复。', source:wiki('Remix/Rain World Remix') },
  { id:'wrong-route', category:'卡住了', title:'连着，不等于现在就能走过去', summary:'平面关系图不能代替房间地形。', body:'遇到特殊锁门、过高落差或封闭桥段时，先检查角色、DLC 和阶段。有些连接是单向，有些仅通往孤立支区。这个工具给区域方向，不会保证图上最少几条边就是最容易的路线。', source:wiki('Regions') },
  { id:'watcher-rest', category:'观望者', title:'传送之后，也记得休息', summary:'雨计时重置，不代表传送疲劳消失。', body:'同一周期多次传送会累积疲劳，减少能力可用时间并可能使路线偏离预期。以自己存档中的传送图为准；实体线通常表示固定双向连接，虚线可能是单向或动态连接。', source:wiki('Warp Point') },
  { id:'spoiler-controls', category:'安心玩', title:'只打开你此刻需要的提示', summary:'地名也可能是一种剧透，可以逐层解锁。', body:'先看温和提示，再看方向，最后才打开明确地点。外部完整地图、Wiki 和来源页可能直接显示后续区域、生物或故事。保存自己的探索记录，可以减少为确认一件小事而反复搜索。', source:wiki('Regions') },
];

export const SOURCES = [
  { title:'Rain World Map', url:'https://rain-world-map.github.io/', note:'用户指定的参考项目；覆盖基础三位及 Downpour 五位角色。外部完整地图会剧透。' },
  { title:'Rain World Map · GitHub / CC0', url:'https://github.com/rain-world-map/rain-world-map.github.io', note:'直接复用并调整其开源前端，许可与改动见 upstream/UPSTREAM.md；地形数据按需读取。' },
  { title:'Henpemaz 原始地图 · MIT', url:'https://github.com/henpemaz/Rain-World-Interactive-Map', note:'原始项目作者 Henrique Maziero。下游地图的来源及原始声明保留于 upstream/。' },
  { title:'Official Rain World Wiki · 区域', url:wiki('Regions'), note:'区域名单、DLC 范围、区域关系；页面和图片可能剧透。' },
  { title:'Official Rain World Wiki · 角色', url:wiki('Slugcat'), note:'角色能力、食物与剧情模式边界。常规剧情角色共 9 位；秘密额外角色未纳入本工具。' },
  { title:'Official Rain World Wiki · 故事进度依据', url:wiki('Plot'), note:'用于核对基础角色会面与推荐方向；链接包含严重剧情剧透，默认不嵌入。' },
  { title:'Official Rain World Wiki · 结局条件依据', url:wiki('Endings'), note:'用于核对不同角色的收尾前置；链接包含严重剧透。本站提示为独立撰写的渐进文案。' },
  { title:'Official Rain World Wiki · 休眠', url:wiki('Hibernation'), note:'存档、饥饿休眠、物品留存与失败行为。' },
  { title:'Official Rain World Wiki · 业力门', url:wiki('Karma Gate'), note:'双向不同门槛、每周期一次与僧侣例外。' },
  { title:'Official Rain World Wiki · 传送', url:wiki('Passages'), note:'令牌限制、可用角色与关键物品设置。' },
  { title:'Watcher Map · Alduris', url:'https://alduris.github.io/watcher-map/', note:'通过公开接口按需读取其真实地图数据与瓦片；未复制新增源码或离线打包瓦片。' },
  { title:'Official Rain World Wiki · 观望者', url:wiki('Watcher'), note:'角色机制与当前版本能力；链接含剧透。' },
  { title:'Official Rain World Wiki · 观望者成长', url:wiki('Ripple'), note:'序章三次会面、成长上限、实际能力等级。' },
  { title:'Official Rain World Wiki · 观望者通路', url:wiki('Warp Point'), note:'固定、单向和动态传送的区别；不为未知存档伪造实时路线。' },
];
