import type {CommunityEvent,EventCopy} from './model';
import type {Locale} from '@/lib/psylink/i18n';
const copies=(rows:[Locale,string,string,string,string][])=>Object.fromEntries(rows.map(([l,title,description,schedule,venue])=>[l,{title,description,schedule,venue}])) as Partial<Record<Locale,EventCopy>>;
export function communitySeeds():CommunityEvent[]{return [
{id:'new-haven-arts-ideas',version:1,deleted:false,published:true,updated_at:'2026-10-10T17:00:00Z',data:{category:'arts',color:'sage',annual:true,nextDateConfirmed:false,organizer:'International Festival of Arts & Ideas',officialUrl:'https://www.artidea.org/festival',checkedAt:'2026-10-10',copy:copies([
['en-US','International Festival of Arts & Ideas','New Haven’s arts and ideas festival features performances, conversations and neighborhood gatherings. Select family-friendly events from the official program.','2026 season: May–June (ended). Next edition not confirmed.','New Haven, CT · multiple venues'],
['zh-CN','Arts & Ideas 艺术与思想节','纽黑文的艺术与思想节，包含表演、对谈与社区聚会。可从官方节目单选择适合家庭的活动。','2026 年 5–6 月活动已结束；下届时间待公布。','纽黑文 · 多个活动场地'],
['es','International Festival of Arts & Ideas','Festival de artes e ideas de New Haven con espectáculos, conversaciones y encuentros vecinales. Consulta el programa oficial para opciones familiares.','Temporada 2026: mayo–junio (finalizada). Próxima edición sin confirmar.','New Haven, CT · varias sedes'],
['ja','International Festival of Arts & Ideas','ニューヘイブンの芸術と思考のフェスティバル。公演、対話、地域の集まりから、公式プログラムで家族向けの活動を選べます。','2026年5〜6月は終了。次回日程は未発表です。','ニューヘイブン · 複数会場'],
['ko','International Festival of Arts & Ideas','뉴헤이븐의 예술과 아이디어 축제로 공연, 대화, 지역 모임을 만날 수 있어요. 가족 프로그램은 공식 안내에서 확인하세요.','2026년 5~6월 행사는 종료됐어요. 다음 일정은 미확정이에요.','뉴헤이븐 · 여러 행사장']
])}},
{id:'elm-city-freddy-fixer',version:1,deleted:false,published:true,updated_at:'2026-10-10T17:00:00Z',data:{category:'community',color:'clay',annual:true,nextDateConfirmed:false,organizer:'Elm City Freddy Fixer · Arts & Ideas official listing',officialUrl:'https://www.artidea.org/event/2026/5858',checkedAt:'2026-10-10',copy:copies([
['en-US','Elm City Freddy Fixer Weekend','A long-running New Haven community celebration featuring music, culture and family connection. The official 2026 listing identifies the 61st annual edition.','2026 listing: June 6 (ended). Next edition not confirmed.','New Haven, CT · check the next official venue announcement'],
['zh-CN','Elm City Freddy Fixer 社区节','纽黑文延续多年的社区庆典，汇聚音乐、文化与家庭交流。官方 2026 年资料将其标为第 61 届年度活动。','2026 年活动列于 6 月 6 日，已结束；下届待公布。','纽黑文 · 下届地点以主办方公告为准'],
['es','Elm City Freddy Fixer Weekend','Celebración comunitaria de New Haven con música, cultura y convivencia familiar. La ficha oficial de 2026 indica la 61.ª edición anual.','Ficha de 2026: 6 de junio (finalizada). Próxima edición sin confirmar.','New Haven, CT · sede según el próximo anuncio oficial'],
['ja','Elm City Freddy Fixer Weekend','音楽、文化、家族のつながりを祝う歴史ある地域の祭り。2026年の公式案内は第61回の年次開催としています。','2026年の掲載日：6月6日（終了）。次回は未発表。','ニューヘイブン · 次回会場は公式案内をご確認ください'],
['ko','Elm City Freddy Fixer Weekend','음악, 문화, 가족의 연결을 즐기는 오랜 지역 축제예요. 2026년 공식 안내에는 제61회 연례 행사로 소개돼 있어요.','2026년 안내: 6월 6일(종료). 다음 일정은 미확정이에요.','뉴헤이븐 · 다음 장소는 공식 발표를 확인하세요']
])}},
{id:'nhfpl-summer-learning',version:1,deleted:false,published:true,updated_at:'2026-10-10T17:00:00Z',data:{category:'reading',color:'sand',annual:true,nextDateConfirmed:false,organizer:'New Haven Free Public Library',officialUrl:'https://nhfpl.org/',checkedAt:'2026-10-10',copy:copies([
['en-US','NHFPL Summer Learning','The New Haven Free Public Library runs an annual summer learning program for all ages. Explore reading and library activities together through its official announcements.','2026: May 30–August 22 (ended). Next edition not confirmed.','New Haven Free Public Library · participating branches'],
['zh-CN','纽黑文公共图书馆暑期阅读计划','纽黑文公共图书馆面向所有年龄开展年度暑期学习计划。家长和孩子可通过官方公告了解阅读与图书馆活动。','2026 年 5 月 30 日至 8 月 22 日已结束；下届待公布。','纽黑文公共图书馆 · 参与分馆'],
['es','NHFPL Summer Learning','La biblioteca pública de New Haven ofrece un programa anual de aprendizaje de verano para todas las edades. Consulta sus anuncios para lecturas y actividades.','2026: 30 de mayo–22 de agosto (finalizado). Próxima edición sin confirmar.','Biblioteca pública de New Haven · sucursales participantes'],
['ja','NHFPL Summer Learning','ニューヘイブン公共図書館が全年齢向けに開催する年次の夏の学習プログラム。読書や図書館活動の詳細は公式案内をご覧ください。','2026年5月30日〜8月22日は終了。次回は未発表。','ニューヘイブン公共図書館 · 参加分館'],
['ko','NHFPL Summer Learning','뉴헤이븐 공공 도서관에서 모든 연령을 위한 연례 여름 학습 프로그램을 운영해요. 독서와 활동은 공식 안내를 확인하세요.','2026년 5월 30일~8월 22일은 종료됐어요. 다음 일정은 미확정이에요.','뉴헤이븐 공공 도서관 · 참여 분관']
])}}
];}
