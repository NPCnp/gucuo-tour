/* ============================================================
   05-narrations.js  ·  数字人讲解词库 NARRATIONS / 分组 / SPOT_META
   由原 index.html 内联脚本拆分，文件按序号顺序加载（普通脚本，共享全局作用域）
   ============================================================ */
  /* ========== 数字人讲解词库（按景点） ========== */
  const NARRATIONS = {
    '严复故居': {
      name: '三坊七巷·严复故居',
      duration: '03:24',
      desc: '严复故居位于福州三坊七巷郎官巷，是一座典型的清代传统民居建筑。宅院坐北朝南，保留完整的木构梁架与雕花门窗，燕尾脊、马鞍墙等闽派建筑元素清晰可辨。这里是近代著名思想家、翻译家严复先生的故居，他翻译的《天演论》影响了一代中国人。如今故居已辟为纪念馆，是了解福州古厝文化与近代历史的重要参观点位。',
      script: [
        '各位游客朋友，大家好，我是数字讲解员小厝，欢迎来到严复故居。',
        '这座古厝建于清代，是福州典型的传统民居。大家看这里的燕尾脊，两端高高翘起，是闽派建筑的标志性元素。',
        '严复是中国近代著名的思想家、翻译家，他翻译的《天演论》影响了整整一代中国人。',
        '故居坐北朝南，三进院落，保留了完整的清代木构梁架与雕花门窗。',
        '接下来让我们走进正厅，感受这座百年古厝的历史温度……'
      ]
    },
    '林则徐纪念馆': {
      name: '林则徐纪念馆',
      duration: '04:10',
      desc: '林则徐纪念馆位于福州市澳门路，建于清光绪年间，馆舍为典型清代园林式建筑，系统展示民族英雄林则徐虎门销烟、开眼看世界的生平事迹，是爱国主义教育与了解古厝文化的重要场所。',
      script: [
        '大家好，我是小厝，现在我们在林则徐纪念馆。',
        '林则徐是清代著名政治家，1839 年他在虎门主持销烟，被誉为「开眼看世界第一人」。',
        '纪念馆的仪门、御碑亭、树德堂都是清代原构，青砖灰瓦间透着庄重。',
        '接下来请看御碑亭内的三通圣旨碑，感受这位民族英雄的一生……'
      ]
    },
    '三通桥': {
      name: '上下杭·三通桥',
      duration: '02:58',
      desc: '三通桥位于上下杭历史文化街区，始建于明代，三孔石拱桥横跨三捷河，曾是福州商贸水运的重要节点，见证了「百货随潮船入市」的海丝繁华。',
      script: [
        '大家好，我是小厝，现在我们来到上下杭的三通桥。',
        '这座三孔石桥建于明代，桥下的三捷河曾是福州最繁忙的商贸水道。',
        '当年各地商帮会馆林立两岸，「百货随潮船入市，万家沽酒户垂帘」说的就是这里。',
        '请留意桥身的石刻与两侧的古厝立面，那是海丝商贸留下的印记……'
      ]
    },
    '烟台山': {
      name: '烟台山历史风貌区',
      duration: '03:45',
      desc: '烟台山历史风貌区位于仓山区，曾是 17 国领事馆所在地，留存乐群楼、石厝教堂等百余栋近代西式建筑，被誉为「万国建筑博览」，如今是文艺漫游胜地。',
      script: [
        '大家好，我是小厝，欢迎来到烟台山。',
        '鸦片战争后，先后有 17 个国家在此设立领事馆，百多栋洋楼依山而建。',
        '大家看这栋石厝教堂，全石构哥特式建筑，是烟台山的标志之一。',
        '沿着乐群路慢慢走，老榕树与红砖瓦之间，都是福州开埠的记忆……'
      ]
    },
    '鼓山': {
      name: '鼓山风景区',
      duration: '04:30',
      desc: '鼓山位于福州东郊，海拔 969 米，山腰的涌泉寺始建于五代，是闽刹之冠；沿途 400 余段摩崖题刻汇聚宋元明清名家手迹，堪称「东南碑林」。',
      script: [
        '大家好，我是小厝，现在我们在鼓山脚下。',
        '鼓山因山巅巨石如鼓得名，是福州人最爱的登高去处。',
        '半山腰的涌泉寺始建于五代后梁，寺前两座宋代陶塔举世罕见。',
        '一路上的摩崖石刻有 400 多处，朱熹、蔡襄都留下过题字，请随我细细品味……'
      ]
    },
    '水榭戏台': {
      name: '水榭戏台',
      duration: '02:40',
      desc: '水榭戏台位于三坊七巷衣锦坊，是清代福州民居中罕见的私家戏台，戏台一半建于水池之上，利用水面回声增强音响效果，体现古厝营造智慧。',
      script: [
        '大家好，我是小厝，现在我们看到的是水榭戏台。',
        '它建在衣锦坊的私家园林里，一半凌空于水池之上。',
        '古人利用水面的反射让唱腔更清亮，这是福州古厝里的「声学智慧」。',
        '请看戏台顶部的藻井与雕花，每一处都藏着吉祥寓意……'
      ]
    },
    '严复翰墨馆': {
      name: '严复翰墨馆',
      duration: '02:20',
      desc: '严复翰墨馆位于三坊七巷郎官巷，为清代古厝院落。馆内集中展示严复先生的书信、手稿与墨迹，配合古厝木构、花窗与天井空间，呈现近代思想家的精神世界与闽都书香文脉。',
      script: [
        '大家好，我是小厝，现在带你走进严复翰墨馆。',
        '这里原是一处清代古厝院落，天井、花窗、木构梁架都保留了原有形制。',
        '馆内陈列着严复先生的书信与手稿，可以近距离看到他的笔迹与思想轨迹。',
        '慢慢走一圈，你会感受到福州古厝里特有的书香气息……'
      ]
    },
    '二梅书屋': {
      name: '二梅书屋',
      duration: '02:30',
      desc: '二梅书屋位于郎官巷，是清代翰林林星章故居，因院中两株老梅得名，书屋藏书万卷，是福州书香门第宅院的代表。',
      script: [
        '大家好，我是小厝，现在我们走进二梅书屋。',
        '主人林星章是清代翰林，院中两株老梅树是书屋名字的由来。',
        '这里曾是藏书万卷的私家图书馆，木楼梯与花窗保存完好。',
        '请轻一点，我们一起感受百年前的读书声……'
      ]
    },
    '陈氏五楼': {
      name: '螺洲·陈氏五楼',
      duration: '03:10',
      desc: '陈氏五楼位于螺洲古镇，是清代帝师陈宝琛的故居，由赐书楼、沧趣楼等五座楼组成，中西合璧，是福州规模最大的名人故居之一。',
      script: [
        '大家好，我是小厝，欢迎来到螺洲陈氏五楼。',
        '主人陈宝琛是末代皇帝溥仪的老师，这座宅子由五座楼组成，故称「陈氏五楼」。',
        '沧趣楼前的鱼池与假山，是他晚年归乡后亲手布置的。',
        '接下来我们看看赐书楼，那里曾收藏御赐图书……'
      ]
    },
    '泰山宫': {
      name: '林浦·泰山宫',
      duration: '02:50',
      desc: '泰山宫位于林浦古村，是南宋末帝赵昰的行宫遗址，宫内保留宋代石柱与明清重修格局，林浦村还走出了「七科八进士、三代五尚书」。',
      script: [
        '大家好，我是小厝，现在我们在林浦泰山宫。',
        '南宋末年，小皇帝赵昰曾在此设立行宫，泰山宫因此得名。',
        '大家看这些粗大的石柱，是宋代原物，经历了 700 多年风雨。',
        '林浦村书香传世，「七科八进士」的牌匾就挂在正厅……'
      ]
    },
    '萨镇冰故居': {
      name: '朱紫坊·萨镇冰故居',
      duration: '03:00',
      desc: '萨镇冰故居位于朱紫坊河沿，是近代海军名将萨镇冰的宅邸，院落临水而建，融合中式院落与西式拱窗，见证福州船政文化兴衰。',
      script: [
        '萨镇冰故居坐落于福州朱紫坊历史文化街区，是典型福州闽派古厝。',
        '宅院保留福州古厝马鞍墙、穿斗式木构架特色。',
        '厅内摆放的船模，承载萨镇冰投身近代海防的岁月记忆，也是朱紫坊古厝极具代表性的历史印记。'
      ]
    },
    '南后街': {
      name: '南后街',
      duration: '03:05',
      desc: '南后街是三坊七巷的中轴老街，自宋代起就是福州城的繁华商业街，如今汇聚老字号与非遗手作，是感受坊巷烟火气的必经之地。',
      script: [
        '大家好，我是小厝，现在我们走在南后街上。',
        '这条街自宋代就是福州的中轴商业街，千百年来热闹非凡。',
        '两侧的老字号里，肉燕、鱼丸的香气与油纸伞、软木画的手艺交织在一起。',
        '请随我慢慢走，读懂这条街的坊巷烟火……'
      ]
    },
    '小黄楼': {
      name: '小黄楼',
      duration: '02:45',
      desc: '小黄楼位于黄巷，相传为唐代学者黄璞故居，清代重修后成为中西合璧的私家园林，花厅与雪洞假山颇具特色。',
      script: [
        '大家好，我是小厝，现在我们来到小黄楼。',
        '相传这里是唐代学者黄璞的故居，黄巷也因此得名。',
        '楼内花厅精巧，还有一座用糯米浆砌成的雪洞，夏日清凉宜人。',
        '请看这中西合璧的窗棂，是福州园林的别样风情……'
      ]
    },
    '衣锦坊': {
      name: '衣锦坊',
      duration: '02:20',
      desc: '衣锦坊是三坊七巷之一，宋代称「通潮巷」，明清易名衣锦坊，取「衣锦还乡」之意，坊内水榭戏台最为著名。',
      script: [
        '大家好，我是小厝，现在我们走进衣锦坊。',
        '坊名取自「衣锦还乡」，寄托着古人对功成名就的期盼。',
        '坊中最有名的是水榭戏台，一半凌空于水池之上。',
        '漫步坊巷，白墙黛瓦间尽是明清旧梦……'
      ]
    },
    '沈葆桢故居': {
      name: '沈葆桢故居',
      duration: '03:00',
      desc: '沈葆桢故居位于宫巷，是清代船政大臣沈葆桢的宅邸，三进院落中西合璧，见证了福州船政文化的兴起。',
      script: [
        '大家好，我是小厝，现在我们来到沈葆桢故居。',
        '沈葆桢是船政大臣，主持创办了近代中国第一支海军舰队。',
        '这座三进院落，既有中式厅堂，也有西式拱窗，正像那个时代的缩影。',
        '请随我走进正厅，看看船政风云的起点……'
      ]
    },
    '林觉民故居': {
      name: '林觉民故居',
      duration: '03:00',
      desc: '林觉民故居位于杨桥巷，是黄花岗七十二烈士之一林觉民的故居，《与妻书》的手稿故事在此流传。',
      script: [
        '大家好，我是小厝，现在我们在林觉民故居。',
        '林觉民是黄花岗烈士，他留下的《与妻书》被称为百年最美的情书。',
        '这座小院后来也成为冰心的童年居所，一院两名人。',
        '请看这株老梅树，它见证了一个世纪的家国情怀……'
      ]
    },
    '冰心故居': {
      name: '冰心故居',
      duration: '02:40',
      desc: '冰心故居位于杨桥巷，文学巨匠冰心在此度过童年，故居陈列她的手稿与生平，庭院幽静，书香犹存。',
      script: [
        '大家好，我是小厝，现在我们走进冰心故居。',
        '冰心先生在这里度过童年，她笔下的「小桔灯」温暖了几代读者。',
        '展厅里陈列着手稿与老照片，记录她与爱相伴的一生。',
        '让我们在小院里静静感受这位文学奶奶的温柔……'
      ]
    },
    '泛船浦天主教堂': {
      name: '泛船浦天主教堂',
      duration: '02:30',
      desc: '泛船浦天主教堂位于仓山新民街，始建于清代，是福建最大的天主教堂，哥特式钟楼高耸，被誉为「江南第一堂」。',
      script: [
        '大家好，我是小厝，现在我们来到泛船浦天主教堂。',
        '这座教堂始建于 1864 年，是福建最大的天主教堂。',
        '高耸的哥特式钟楼直插天际，曾是闽江畔最醒目的地标。',
        '请看这彩绘玻璃窗，中西文化在此交汇了百余年……'
      ]
    },
    '福建博物院': {
      name: '福建博物院',
      duration: '03:30',
      desc: '福建博物院位于西湖之畔，馆藏闽地文物十余万件，「福建古代文明之光」通史陈列系统展示闽越文化五千年。',
      script: [
        '大家好，我是小厝，欢迎来到福建博物院。',
        '这里收藏着十余万件闽地文物，是一部立体的福建通史。',
        '从昙石山文化的陶釜，到海上丝绸之路的瓷器，每一件都在讲故事。',
        '接下来请随我走进「古代文明之光」展厅……'
      ]
    },
    '于山': {
      name: '于山风景区',
      duration: '03:00',
      desc: '于山风景区位于福州市中心，为「三山」之一，山上有宋代白塔定光塔与戚公祠，摩崖石刻遍布，古榕参天。',
      script: [
        '大家好，我是小厝，现在我们在于山。',
        '于山与乌山、屏山并称福州「三山」，山顶的白塔建于宋代。',
        '山上有戚公祠，纪念抗倭名将戚继光在福州的功绩。',
        '古榕与石刻相伴，请随我拾级而上……'
      ]
    },
    '西禅寺': {
      name: '西禅寺',
      duration: '03:10',
      desc: '西禅寺位于怡山之麓，始建于唐代，为福州五大丛林之一，寺内宋代荔枝树与五百罗汉堂闻名遐迩。',
      script: [
        '大家好，我是小厝，现在我们来到西禅寺。',
        '这座千年古刹始建于唐代，是福州五大丛林之首。',
        '寺内有一株宋代种下的荔枝树，至今年年结果。',
        '请看五百罗汉堂，神态各异，气象万千……'
      ]
    },
    '华林寺': {
      name: '华林寺',
      duration: '02:30',
      desc: '华林寺大殿建于北宋乾德二年，是长江以南现存最古老的木构建筑，斗拱雄大，古建价值极高。',
      script: [
        '大家好，我是小厝，现在我们在华林寺。',
        '这座大殿建于北宋乾德二年，比《营造法式》颁布还早一百多年。',
        '它是长江以南最古老的木构建筑，斗拱层层如莲花盛开。',
        '请抬头看这些千年前的榫卯，古人的智慧令人叹服……'
      ]
    },
    '福州文庙': {
      name: '福州文庙',
      duration: '02:50',
      desc: '福州文庙始建于唐初，现存建筑为清代重修，大成殿重檐歇山顶，是祭祀孔子与古代儒学教育的重要场所。',
      script: [
        '大家好，我是小厝，欢迎来到福州文庙。',
        '文庙始建于唐初，大成殿的重檐歇山顶庄严肃穆。',
        '古代福州的学子在此祭孔求学，文脉绵延千年。',
        '请看殿前的泮池与棂星门，这是儒学的礼制格局……'
      ]
    },
    '开元寺': {
      name: '开元寺',
      duration: '02:30',
      desc: '开元寺位于鼓东路，始建于南朝，是福州现存最古老的佛寺之一，寺内千年铁铸阿弥陀佛像重达十万斤。',
      script: [
        '大家好，我是小厝，现在我们来到开元寺。',
        '这座古寺始建于南朝，比开元盛世还要早。',
        '寺中最珍贵的是一尊千年铁佛，重达十万斤，铸造工艺至今成谜。',
        '让我们静心感受这座闽都名刹的千年香火……'
      ]
    },
    '闽王祠': {
      name: '闽王祠',
      duration: '02:20',
      desc: '闽王祠位于庆城路，纪念五代闽国开国之君王审知，祠内「恩赐琅琊郡王德政碑」为唐代原物，史料价值极高。',
      script: [
        '大家好，我是小厝，现在我们在闽王祠。',
        '王审知治闽三十年，轻徭薄赋，被尊为「开闽第一人」。',
        '祠内的德政碑立于唐代，记载着他开疆拓土的功绩。',
        '福州城的格局，正是从他手中奠定的……'
      ]
    },
    '梁厝': {
      name: '梁厝特色历史文化街区',
      duration: '03:00',
      desc: '梁厝特色历史文化街区位于仓山城门镇，是朱熹讲学之地，古厝成群，宗祠林立，春有油菜花海环抱古村。',
      script: [
        '大家好，我是小厝，欢迎来到梁厝。',
        '这里曾是朱熹讲学的地方，文风鼎盛，进士辈出。',
        '村中的永盛梁氏宗祠与连片古厝，保存着原汁原味的闽都村落格局。',
        '若是春天来访，油菜花海绵延至三江口，美不胜收……'
      ]
    },
    '船政博物馆': {
      name: '中国船政文化博物馆',
      duration: '03:40',
      desc: '中国船政文化博物馆位于马尾，依托船政学堂旧址而建，展示近代中国造船与海军教育的百年历程，是船政文化核心地标。',
      script: [
        '大家好，我是小厝，现在我们来到中国船政文化博物馆。',
        '1866 年，左宗棠在此创办船政学堂，培养出严复、詹天佑等栋梁。',
        '馆内的舰船模型与图纸，记录着近代中国海军的起步。',
        '这里是中国近代化的一个原点，请随我细看……'
      ]
    },
    '鼓岭': {
      name: '鼓岭旅游度假区',
      duration: '03:20',
      desc: '鼓岭旅游度假区位于东郊鼓山之巅，夏季凉爽宜人，百年前外国人在此建别墅避暑，万国公益社与鼓岭老街故事流传至今。',
      script: [
        '大家好，我是小厝，现在我们来到鼓岭。',
        '一百多年前，在福州的外国人把这里建成避暑胜地，别墅多达三百余栋。',
        '「鼓岭故事」里跨越国界的友谊，至今令人动容。',
        '漫步老街，柳杉王与老街邮局都值得驻足……'
      ]
    }
  };

  // 景点讲解库分组（按片区）
  const NARR_GROUPS = [
    { title: '三坊七巷片区', keys: ['严复故居', '萨镇冰故居', '南后街', '小黄楼', '衣锦坊', '沈葆桢故居', '林觉民故居', '冰心故居'] },
    { title: '城市历史风貌区', keys: ['林则徐纪念馆', '烟台山', '三通桥', '泛船浦天主教堂', '福建博物院'] },
    { title: '闽都古迹点位', keys: ['鼓山', '水榭戏台', '二梅书屋', '陈氏五楼', '泰山宫', '于山', '西禅寺', '华林寺', '福州文庙', '开元寺', '闽王祠', '梁厝', '船政博物馆', '鼓岭'] }
  ];

  // 景点元信息：地址 / 保护级别 / 高德坐标 [lng, lat]
  const SPOT_META = {
    '严复故居':       { address: '鼓楼区三坊七巷郎官巷20号', level: '全国重点文物保护单位', coord: [119.296194, 26.081932] },
    '严复翰墨馆':     { address: '鼓楼区三坊七巷郎官巷',       level: '历史文化展示馆',       coord: [119.296420, 26.081560] },
    '萨镇冰故居':     { address: '鼓楼区朱紫坊河沿',         level: '市级文物保护单位',     coord: [119.298500, 26.078600] },
    '南后街':         { address: '鼓楼区三坊七巷南后街',       level: '历史文化街区',         coord: [119.296388, 26.080511] },
    '小黄楼':         { address: '鼓楼区三坊七巷黄巷',         level: '全国重点文物保护单位', coord: [119.296489, 26.079683] },
    '衣锦坊':         { address: '鼓楼区三坊七巷衣锦坊',       level: '历史文化街区',         coord: [119.295531, 26.081245] },
    '沈葆桢故居':     { address: '鼓楼区三坊七巷宫巷',         level: '全国重点文物保护单位', coord: [119.296122, 26.080013] },
    '林觉民故居':     { address: '鼓楼区杨桥路17号',           level: '省级文物保护单位',     coord: [119.295662, 26.079154] },
    '冰心故居':       { address: '鼓楼区杨桥路17号',           level: '省级文物保护单位',     coord: [119.295186, 26.079215] },
    '林则徐纪念馆':   { address: '鼓楼区澳门路16号',           level: '全国重点文物保护单位', coord: [119.296532, 26.078965] },
    '烟台山':         { address: '仓山区烟台山历史风貌区',     level: '历史风貌保护区',       coord: [119.304935, 26.045598] },
    '三通桥':         { address: '台江区上下杭三捷河',         level: '市级文物保护单位',     coord: [119.302100, 26.056100] },
    '泛船浦天主教堂': { address: '仓山区新民街54号',           level: '省级文物保护单位',     coord: [119.313101, 26.044801] },
    '福建博物院':     { address: '鼓楼区西湖公园内',           level: '国家一级博物馆',       coord: [119.286501, 26.086301] },
    '鼓山':           { address: '晋安区鼓山镇',               level: '国家级风景名胜区',     coord: [119.388423, 26.051131] },
    '水榭戏台':       { address: '鼓楼区三坊七巷衣锦坊',       level: '全国重点文物保护单位', coord: [119.297733, 26.080261] },
    '二梅书屋':       { address: '鼓楼区三坊七巷郎官巷',       level: '全国重点文物保护单位', coord: [119.296911, 26.080654] },
    '陈氏五楼':       { address: '仓山区螺洲镇店前村',         level: '省级文物保护单位',     coord: [119.330101, 26.013701] },
    '泰山宫':         { address: '仓山区城门镇林浦村',         level: '省级文物保护单位',     coord: [119.344701, 26.025801] },
    '于山':           { address: '鼓楼区于山路',               level: '市级风景名胜区',       coord: [119.303512, 26.076401] },
    '西禅寺':         { address: '鼓楼区工业路455号',          level: '省级文物保护单位',     coord: [119.282401, 26.066801] },
    '华林寺':         { address: '鼓楼区华林路78号',           level: '全国重点文物保护单位', coord: [119.289601, 26.085501] },
    '福州文庙':       { address: '鼓楼区圣庙路',               level: '省级文物保护单位',     coord: [119.296952, 26.077855] },
    '开元寺':         { address: '鼓楼区鼓东路',               level: '市级文物保护单位',     coord: [119.302101, 26.083001] },
    '闽王祠':         { address: '鼓楼区庆城路',               level: '省级文物保护单位',     coord: [119.300601, 26.082701] },
    '梁厝':           { address: '仓山区城门镇梁厝村',         level: '历史文化名村',         coord: [119.358601, 25.991201] },
    '船政博物馆':     { address: '马尾区昭忠路7号',            level: '全国重点文物保护单位', coord: [119.453101, 25.994601] },
    '鼓岭':           { address: '晋安区鼓岭旅游度假区',       level: '国家级旅游度假区',     coord: [119.394401, 26.074701] }
  };

  /* ========== 排行榜详情补齐：为榜单内全部景点生成详情数据 ========== */
  // 榜单扩展后新增的景点没有 RANK_DETAIL，这里复用 SPOT_META 地址与 SPOTS 坐标自动补齐
  (function fillRankDetails() {
    const EXTRA_ADDR = {
      '文儒坊': '鼓楼区三坊七巷文儒坊', '光禄坊': '鼓楼区三坊七巷光禄坊',
      '朱紫坊': '鼓楼区朱紫坊历史文化街区', '乌山历史风貌区': '鼓楼区乌山路',
      '西湖公园': '鼓楼区湖滨路70号', '左海公园': '鼓楼区西二环北路',
      '屏山公园': '鼓楼区屏山路', '福道': '鼓楼区金牛山体育公园',
      '闽江公园': '台江区江滨西大道', '上下杭历史文化街区': '台江区上下杭路',
      '闽江夜游': '台江区台江码头', '花海公园': '仓山区南江滨东大道',
      '螺洲古镇': '仓山区螺洲镇', '林浦古村': '仓山区城门镇林浦村',
      '罗星塔公园': '马尾区罗星塔路', '金鸡山公园': '晋安区金鸡山路',
      '温泉公园': '鼓楼区温泉公园路', '福州国家森林公园': '晋安区新店镇赤桥村'
    };
    const META_ALIAS = {
      '烟台山历史风貌区': '烟台山', '鼓山风景区': '鼓山', '于山风景区': '于山',
      '梁厝特色历史文化街区': '梁厝', '中国船政文化博物馆': '船政博物馆',
      '鼓岭旅游度假区': '鼓岭'
    };
    const openOf = name => {
      if (/公园|花海|福道/.test(name)) return '06:00-22:00';
      if (/寺|祠|宫|庙|教堂/.test(name)) return '08:00-17:30';
      if (/博物|纪念馆|故居|书屋/.test(name)) return '09:00-17:00（周一闭馆）';
      return '全天开放';
    };
    RANKING_DATA.scenic.forEach(item => {
      if (RANK_DETAIL[item.name]) return;
      const sp = SPOTS.find(s => s.name === item.name);
      if (!sp) return;
      const meta = SPOT_META[META_ALIAS[item.name] || item.name];
      const narr = NARRATIONS[item.name];
      RANK_DETAIL[item.name] = {
        en: '',
        price: '免费',
        sold: item.stat + '打卡',
        shop: item.name + '游客服务点',
        addr: (meta && meta.address) || EXTRA_ADDR[item.name] || ('福州市' + item.name),
        coord: (meta && meta.coord) || sp.coord,
        open: openOf(item.name),
        desc: (narr && narr.desc) || (sp.desc + '。' + (meta && meta.level ? '现为' + meta.level + '，' : '') + '是福州古城游览与 AI 路线推荐的热门站点。')
      };
    });
  })();

  // 当前现场景点（默认朱紫坊·萨镇冰故居）
  let currentSpotKey = '萨镇冰故居';

  // 名称模糊匹配讲解词库 key
  function getNarrKey(name) {
    if (!name) return null;
    return Object.keys(NARRATIONS).find(k => name.indexOf(k) !== -1 || k.indexOf(name) !== -1) || null;
  }
  // 路线景点但无预置讲解词时，用 SPOTS 数据动态合成
  const extraNarrations = {};
  function currentNarration(key) {
    const k = key || currentSpotKey;
    if (NARRATIONS[k]) return NARRATIONS[k];
    if (extraNarrations[k]) return extraNarrations[k];
    const sp = SPOTS.find(s => s.name === k);
    if (sp) {
      extraNarrations[k] = {
        name: sp.name,
        duration: '03:00',
        desc: sp.desc + '。该点位为 AI 游览路线推荐站点，可在此定位打卡，收集专属景点印记。',
        script: [
          '大家好，我是数字讲解员小厝，现在我们来到' + sp.name + '。',
          sp.desc + '，是本次 AI 游览路线为你推荐的特色站点。',
          '到达点位 50 米范围内即可点击「定位打卡」，收集这枚景点印记。'
        ]
      };
      return extraNarrations[k];
    }
    // 搜索 POI（公厕/小吃等便民地点）：合成简版介绍
    const poi = searchPois.find(q => q.name === k);
    if (poi) {
      const typeText = poi.cat === 'toilet' ? '公共便民设施' : (poi.cat === 'snack' ? '福州特色风味' : '周边景点');
      extraNarrations[k] = {
        name: poi.name,
        duration: '02:00',
        desc: poi.tags.join(' · ') + '。' + typeText + '，可在搜索页查看实时距离并一键地图导航前往。',
        script: [
          '这里是' + poi.name + '，标签：' + poi.tags.join('、') + '。',
          '返回搜索页可查看距您的实时距离，点击「地图导航」即可唤起高德地图步行前往。'
        ]
      };
      return extraNarrations[k];
    }
    return NARRATIONS['严复故居'];
  }

  // 进入某景点详情（联动讲解上下文）
  function gotoDetail(name) {
    // 公厕/小吃等便民 POI 使用自身名称（避免「三通桥旁公厕」被模糊匹配到「三通桥」）
    const poi = searchPois.find(q => q.name === name);
    const key = (!poi || poi.cat === 'near') ? getNarrKey(name) : null;
    currentSpotKey = key || name;
    // 若该景点属于打卡点位，同步当前点位（供详情页打卡按钮使用）
    const pt = checkinPoints.find(p => p.key === currentSpotKey);
    currentPointId = pt ? pt.id : null;
    showScreen('detail');
  }

  // 详情页：按当前景点渲染名称 / 简介 / 讲解面板 / 打卡操作区
  function renderDetail() {
    const n = currentNarration();
    document.getElementById('detailName').textContent = n.name;
    document.getElementById('detailDesc').textContent = n.desc;
    document.getElementById('detailNarrScript').innerHTML = n.script.map(p => `<p>${p}</p>`).join('');
    // 封面：有实景图时替换占位
    setCoverPhoto(
      document.getElementById('detailCoverImg'),
      document.querySelector('#page-detail .detail-cover'),
      spotPhoto(n.name) || spotPhoto(currentSpotKey)
    );
    // 打卡操作区：仅 5 个打卡点位显示
    const area = document.getElementById('detailCheckinArea');
    if (area) {
      const pt = checkinPoints.find(p => p.id === currentPointId);
      if (!pt) {
        area.style.display = 'none';
      } else if (pt.checked) {
        area.style.display = 'flex';
        area.innerHTML = `<button class="btn primary" disabled style="flex:1; opacity:.7;">✓ 已打卡 · ${pt.time || ''}</button>`;
      } else {
        area.style.display = 'flex';
        area.innerHTML = `<button class="btn primary" onclick="gpsCheckin()">📍 定位打卡</button>
                          <button class="btn" onclick="photoCheckin()">📷 拍照打卡</button>`;
      }
    }
  }

  // 景点专属图标（讲解页网格卡片图占位）
  const SPOT_ICONS = {
    '严复故居': '🏠', '萨镇冰故居': '🏡', '南后街': '🏮', '小黄楼': '🏛️',
    '衣锦坊': '🏘️', '沈葆桢故居': '🏠', '林觉民故居': '🏠', '冰心故居': '🏠',
    '林则徐纪念馆': '📜', '烟台山': '⛰️', '三通桥': '🌉', '泛船浦天主教堂': '⛪',
    '福建博物院': '🏺', '鼓山': '🗻', '水榭戏台': '🎭', '二梅书屋': '📚',
    '严复翰墨馆': '📜',
    '陈氏五楼': '🏯', '泰山宫': '⛩️', '于山': '🌄', '西禅寺': '🛕',
    '华林寺': '🏯', '福州文庙': '🏛️', '开元寺': '📿', '闽王祠': '🏮',
    '梁厝': '🏡', '船政博物馆': '⚓', '鼓岭': '🏞️'
  };

  /* ========== 讲解库：搜索 + 兴趣筛选 + 双列卡片网格 ========== */
  const FILTER_TAGS = ['历史文化', '建筑艺术', '名人故居', '民俗风情', '美食打卡'];
  const SPOT_TAGS = {
    '严复故居': ['历史文化', '名人故居'], '萨镇冰故居': ['历史文化', '名人故居'],
    '南后街': ['民俗风情', '美食打卡'],   '小黄楼': ['建筑艺术', '历史文化'],
    '衣锦坊': ['民俗风情', '美食打卡'],   '沈葆桢故居': ['历史文化', '名人故居'],
    '林觉民故居': ['名人故居', '历史文化'], '冰心故居': ['名人故居', '历史文化'],
    '林则徐纪念馆': ['名人故居', '历史文化'], '烟台山': ['历史文化', '民俗风情'],
    '三通桥': ['建筑艺术', '美食打卡'],   '泛船浦天主教堂': ['建筑艺术'],
    '福建博物院': ['历史文化'],           '鼓山': ['历史文化', '民俗风情'],
    '水榭戏台': ['建筑艺术', '民俗风情'], '二梅书屋': ['建筑艺术', '历史文化'],
    '严复翰墨馆': ['历史文化', '名人故居'],
    '陈氏五楼': ['建筑艺术', '名人故居'], '泰山宫': ['历史文化', '民俗风情'],
    '于山': ['历史文化', '民俗风情'],     '西禅寺': ['建筑艺术', '历史文化'],
    '华林寺': ['建筑艺术', '历史文化'],   '福州文庙': ['建筑艺术', '历史文化'],
    '开元寺': ['历史文化', '民俗风情'],   '闽王祠': ['历史文化'],
    '梁厝': ['民俗风情', '历史文化'],     '船政博物馆': ['历史文化'],
    '鼓岭': ['民俗风情', '历史文化']
  };
  let selectedFilterTags = [];

  // 数字人讲解页：渲染筛选栏 + 双列景点网格（默认列表视图）
  function renderNarratorPage() {
    renderNarrFilterChips();
    renderNarrGrid();
    showNarrListView();
  }

  function renderNarrFilterChips() {
    const box = document.getElementById('narrFilterChips');
    box.innerHTML = FILTER_TAGS.map(t =>
      `<button class="nchip ${selectedFilterTags.includes(t) ? 'active' : ''}" onclick="toggleFilterTag('${t}')">${t}</button>`
    ).join('');
  }

  function toggleFilterTag(tag) {
    const i = selectedFilterTags.indexOf(tag);
    if (i >= 0) selectedFilterTags.splice(i, 1); else selectedFilterTags.push(tag);
    renderNarrFilterChips();
    renderNarrGrid();
  }

  // 按关键词 + 选中标签过滤景点，渲染双列卡片网格
  function renderNarrGrid() {
    const grid = document.getElementById('narrGrid');
    const empty = document.getElementById('narrGridEmpty');
    const kw = ((document.getElementById('narrSearchInput') || {}).value || '').trim().toLowerCase();
    const allKeys = NARR_GROUPS.flatMap(g => g.keys);
    const list = allKeys.filter(k => {
      const n = currentNarration(k);
      if (kw && !(n.name.toLowerCase().includes(kw) || n.desc.toLowerCase().includes(kw))) return false;
      if (selectedFilterTags.length) {
        const tags = SPOT_TAGS[k] || [];
        if (!selectedFilterTags.some(t => tags.includes(t))) return false;
      }
      return true;
    });
    empty.style.display = list.length ? 'none' : 'block';
    grid.style.display = list.length ? 'flex' : 'none';
    grid.innerHTML = list.map(k => {
      const n = currentNarration(k);
      const heard = 300 + (k.length * 137) % 1700; // 模拟“N+人听过”
      const photo = spotPhoto(n.name) || spotPhoto(k);
      // 有实景图：用图片铺满卡片图区；无图：保留图标 + 占位提示
      const imgInner = photo
        ? `<span class="narr-card-flag">AI 讲解</span>`
        : `<span class="narr-card-emoji">${SPOT_ICONS[k] || '🏛️'}</span><span class="narr-card-img-note">实景图（占位）</span><span class="narr-card-flag">AI 讲解</span>`;
      return `
        <div class="narr-card" onclick="openNarrDetail('${k}')">
          <div class="narr-card-img"${spotPhotoStyle(n.name) || spotPhotoStyle(k)}>${imgInner}</div>
          <div class="narr-card-info">
            <div class="narr-card-title-row"><span class="narr-card-badge">讲解</span><span class="narr-card-name">${n.name}</span></div>
            <div class="narr-card-meta"><span class="narr-card-price">⏱ ${n.duration}</span><span class="narr-card-sold">${heard}+人听过</span></div>
          </div>
        </div>`;
    }).join('');
  }

  // 点击卡片：进入该景点介绍详情视图
  let narrGridScrollTop = 0; // 记住列表滚动位置，返回时恢复

  function openNarrDetail(key) {
    currentSpotKey = key;
    const grid = document.getElementById('narrGrid');
    narrGridScrollTop = grid.scrollTop;
    // 先显示详情视图（确保 DOM 容器处于可见状态再渲染内容）
    document.getElementById('narrDetailView').style.display = 'block';
    document.getElementById('narrDetailView').scrollTop = 0;
    grid.style.display = 'none';
    document.getElementById('narrGridEmpty').style.display = 'none';
    document.getElementById('narrFilterBar').style.display = 'none';
    // 显示后再填充内容（封面背景、视频标签等依赖容器可见）
    renderNarrIntroPanel();
    renderComments();
    resetNarrIntroCollapse();
  }

  // 返回景点列表（保留筛选条件与搜索词，恢复滚动位置）
  function backToNarrGrid() {
    if (typeof stopNarrSpeak === 'function') stopNarrSpeak();
    document.getElementById('narrDetailView').style.display = 'none';
    document.getElementById('narrFilterBar').style.display = 'block';
    renderNarrGrid();
    const grid = document.getElementById('narrGrid');
    if (grid) grid.scrollTop = narrGridScrollTop;
  }

  // 列表视图态：隐藏详情、显示网格（进入页面时调用）
  function showNarrListView() {
    if (typeof stopNarrSpeak === 'function') stopNarrSpeak();
    document.getElementById('narrDetailView').style.display = 'none';
    document.getElementById('narrFilterBar').style.display = 'block';
    renderNarrGrid();
  }

  // 右栏景点介绍面板：渲染详情卡片（嵌入讲解页右栏，可折叠）
  function renderNarrIntroPanel() {
    const n = currentNarration();
    const meta = SPOT_META[currentSpotKey] || { address: '福州古厝文化街区', level: '文物保护单位' };
    // 顶部标志性景点图：有实景图时替换占位
    setCoverPhoto(
      document.getElementById('spotCoverImg'),
      document.querySelector('#narrDetailView .spot-cover'),
      spotPhoto(n.name) || spotPhoto(currentSpotKey)
    );
    document.getElementById('spotFrameTitle').textContent = n.name;
    document.getElementById('spotMeta').innerHTML =
      `<div><span class="dot">●</span>地址：${meta.address}</div>` +
      `<div><span class="dot">●</span>保护级别：${meta.level}</div>`;
    document.getElementById('spotIntro').textContent = n.desc;
    document.getElementById('spotHistory').innerHTML = n.script.map(p => `<p>${p}</p>`).join('');

    // 视频容器：设置当前古厝实景图作为视频封面背景
    const videoContainer = document.getElementById('spotVideoContainer');
    const videoCover = document.getElementById('spotVideoCover');
    const videoError = document.getElementById('spotVideoError');
    const coverUrl = spotPhoto(n.name) || spotPhoto(currentSpotKey);
    if (videoContainer) {
      // 清理上一景点的播放状态
      videoContainer.classList.remove('video-playing');
      const vEl = document.getElementById('narrSpotVideo');
      if (vEl) { try { vEl.pause(); } catch(e){} vEl.removeAttribute('src'); vEl.load(); }
      // 隐藏之前的错误提示
      if (videoError) videoError.style.display = 'none';
    }
    if (videoCover) {
      if (coverUrl) {
        videoCover.style.backgroundImage = 'url("' + coverUrl + '")';
      } else {
        videoCover.style.backgroundImage = '';
      }
    }
    // 视频标签：统一显示「视频介绍：{古厝名称}」
    const svLabel = document.getElementById('spotVideoLabel');
    if (svLabel) svLabel.textContent = '视频介绍：' + n.name;

    // 切换景点时停止上一景点的朗读
    if (typeof stopNarrSpeak === 'function') stopNarrSpeak();
  }

  /* ========== 景点评论区（评论对应当前选择的景点） ========== */
  const COMMENT_STORE = {
    '严复故居': [
      { user: 'qRx501298184', avatar: '🙂', badge: '到访 3 次', date: '2026.08.28', rate: '⭐ 讲解体验 5 星', text: '讲解很生动，燕尾脊和马鞍墙的细节讲得特别清楚，听完再看故居完全不一样。', likes: 12, liked: false, reply: '谢谢您的认可！欢迎再来听小厝讲更多古厝故事～' },
      { user: '匿名用户', avatar: '😎', badge: '到访 ≥5 次', date: '2026.05.11', rate: '⭐ 讲解体验 5 星', text: '带孩子一起来的，小朋友们围着数字讲解员听得津津有味，《天演论》那段尤其精彩，值得推荐。', likes: 8, liked: false }
    ],
    '萨镇冰故居': [
      { user: '坊巷漫步者', avatar: '🧐', badge: '到访 2 次', date: '2026.09.02', rate: '⭐ 讲解体验 4 星', text: '临水而建的小院很幽静，船模展厅是亮点，讲解把船政文化串了起来。', likes: 6, liked: false, reply: '感谢到访！朱紫坊沿线还有多处古厝值得一并打卡～' }
    ]
  };
  // 未预置评论的景点：按景点名生成一条默认评论
  function spotComments(key) {
    if (!COMMENT_STORE[key]) {
      const name = NARRATIONS[key] ? NARRATIONS[key].name : key;
      COMMENT_STORE[key] = [
        { user: '坊巷小友', avatar: '🙂', badge: '新游客', date: '2026.10.01', rate: '⭐ 讲解体验 5 星', text: '来打卡「' + name + '」，数字讲解员的介绍很有代入感，推荐慢慢逛。', likes: 1, liked: false }
      ];
    }
    return COMMENT_STORE[key];
  }
  function renderComments() {
    const list = document.getElementById('commentList');
    if (!list) return;
    const comments = spotComments(currentSpotKey);
    document.getElementById('commentCount').textContent = comments.length;
    list.innerHTML = comments.map((c, i) => `
      <div class="comment-item">
        <div class="comment-avatar">${c.avatar}</div>
        <div class="comment-body">
          <div class="comment-top">
            <span class="comment-user">${c.user}</span>
            <span class="comment-badge">${c.badge}</span>
            <span class="comment-date">${c.date}</span>
          </div>
          ${c.rate ? `<div class="comment-rate">${c.rate}</div>` : ''}
          <p class="comment-text">${c.text}</p>
          ${c.reply ? `<div class="comment-reply"><strong>小厝回复：</strong>${c.reply}</div>` : ''}
          <button class="comment-like ${c.liked ? 'liked' : ''}" onclick="likeComment(${i})">👍 有用 ${c.likes}</button>
        </div>
      </div>
    `).join('');
  }
  function likeComment(i) {
    const c = spotComments(currentSpotKey)[i];
    if (!c) return;
    c.liked = !c.liked;
    c.likes += c.liked ? 1 : -1;
    renderComments();
  }
  function submitComment() {
    const input = document.getElementById('commentInput');
    const text = (input.value || '').trim();
    if (!text) { showToast('先写点什么再发送吧'); return; }
    spotComments(currentSpotKey).unshift({
      user: '游客', avatar: '🙂', badge: '刚刚发布', date: '刚刚', rate: '',
      text: text, likes: 0, liked: false
    });
    input.value = '';
    renderComments();
    showToast('评论已发布');
  }

  // 导航页：渲染目的地信息
  function renderNavigatePage() {
    const n = currentNarration();
    const meta = SPOT_META[currentSpotKey] || {};
    document.getElementById('navDestName').textContent = n.name;
    document.getElementById('navDestAddr').textContent = meta.address || '福州古厝文化街区';
    document.getElementById('navStatus').textContent = '点击下方按钮，申请获取您的当前位置后开始导航';
    const btn = document.getElementById('navStartBtn');
    btn.disabled = false;
    btn.textContent = '获取当前位置并导航';
  }

  // 申请定位并拉起高德导航
  function startNavigation() {
    const meta = SPOT_META[currentSpotKey] || {};
    const destCoord = meta.coord;
    const n = currentNarration();
    const status = document.getElementById('navStatus');
    const btn = document.getElementById('navStartBtn');

    if (!destCoord) {
      status.textContent = '该景点暂无坐标，无法导航';
      return;
    }
    btn.disabled = true;
    btn.textContent = '正在获取位置…';
    status.textContent = '正在申请获取您的当前位置…';
    locateVisitor(8000).then(res => {
      if (res.coord) {
        status.textContent = '已获取位置，请选择导航方式…';
        openAmapNav(res.coord, destCoord, n.name);
      } else {
        status.textContent = window.isSecureContext === false
          ? '当前网页无法精确定位（需 HTTPS），请手动选择导航方式'
          : '定位失败，请手动选择导航方式';
        openAmapNav(null, destCoord, n.name);
      }
      btn.textContent = '重新导航';
      btn.disabled = false;
    });
  }

  // 打开高德导航：手机端优先唤起高德 App
  function openAmapNav(from, dest, destName) {
    openAmapAppNav(dest, destName, from || null, 'car');
  }
