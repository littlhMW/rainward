// Region-name classification from the Official Rain World Wiki's RegionNavbox.
// The Regions gallery itself is NOT spoiler-filtered. Region groups follow the Wiki navigation template.
// `major` is this app's hide-by-default flag, not a severity claimed by the Wiki.
const source = 'https://rainworld.miraheze.org/wiki/Template:RegionNavbox?oldid=324754';

export const SPOILER_POLICY = Object.freeze({
  checkedAt: '2026-10-12',
  source,
  revision: 324754,
  regionsSource: 'https://rainworld.miraheze.org/wiki/Regions?oldid=337548',
  styleGuideSource: 'https://rainworld.miraheze.org/wiki/Rain_World_Wiki:Style_Guide?oldid=310048#Spoiler_Tagging',
  rule: '普通地名正常显示；Wiki 区域导航框的 Spoilers 分组内地名默认隐藏，可主动显示。',
  scope: '基础游戏、Downpour 与 Watcher 的 52 个正式区域名称；不覆盖房间图像、子区域、剧情文字或第三方新增区域。',
  defaultUnknown: 'show',
});

const spoiler = (group) => Object.freeze({
  level: 'major',
  group,
  reason: `Wiki 的区域导航框将此区域列于默认折叠的 ${group} 分组。`,
  source,
});

export const REGION_SPOILERS = Object.freeze({
  SS: spoiler('Vanilla Spoilers'),
  MS: spoiler('Downpour Spoilers'),
  OE: spoiler('Downpour Spoilers'),
  LC: spoiler('Downpour Spoilers'),
  RM: spoiler('Downpour Spoilers'),
  DM: spoiler('Downpour Spoilers'),
  CL: spoiler('Downpour Spoilers'),
  HR: spoiler('Downpour Spoilers'),
  WSUR: spoiler('Watcher Spoilers'),
  WHIR: spoiler('Watcher Spoilers'),
  WDSR: spoiler('Watcher Spoilers'),
  WGWR: spoiler('Watcher Spoilers'),
  WARA: spoiler('Watcher Spoilers'),
  WRSA: spoiler('Watcher Spoilers'),
  WAUA: spoiler('Watcher Spoilers'),
  WSSR: spoiler('Watcher Spoilers'),
  WORA: spoiler('Watcher Spoilers'),
});
