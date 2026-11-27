/* ============================================================
   pondverse.js — the pond's name and a two-line poem made from the
   therapist's name (the one typed on the name screen), for the koi
   pond page.

   It is a hidden-name poem (折句, oriku): line 1 starts with the first
   character of her name, line 2 with the second. Where a kanji of her
   name itself begins a natural phrase about water or koi (桜 → 桜影うつす…,
   庭 → 庭の錦鯉…), the line starts with that kanji; otherwise it starts
   with the first syllable of that character's reading (佐藤 → さ, と), as
   classical oriku does. Voiced syllables count as plain ones (ど as と,
   が as か): old written kana had no voicing marks, so oriku never
   counted them. Small kana, ん, ー, っ and a vowel that only lengthens the
   one before (ゆうこ → ゆ, こ) are skipped.

   The pond's name: a kana pair of her name that begins a real word
   (かな → かなでの池), else her first kanji's own pond name (桜 → 桜影の池),
   else a pond word starting with her first syllable (さ → さざなみの池).

   Only Japanese characters are typed (the user's rule): hiragana,
   katakana and kanji. A kanji with no known reading and no line of its
   own gets a plain line (no vermilion).

   PondVerse.make(name) → {
     name,                  her name, honorific taken off
     seal,                  the first character, as typed (her seal)
     title:  [{ ch, red }], the pond's name, character by character
     cols:   [[{ ch, red }] × 4], the two lines, each split at its comma
                            into two columns (right to left: line 1 a,
                            line 1 b, line 2 a, line 2 b)
     units:  [{ ch, kana, from }]  what was taken from her name (checks)
   }
   ============================================================ */
var PondVerse = (function () {
  'use strict';

  /* ---------- the lines for each syllable ----------
     line 1: the water and the light; line 2: the koi, and her unwinding.
     Each starts with its syllable and is "first half、second half". */
  var L1 = {
    'あ': 'あわい光が、水面にゆれて',
    'い': 'いけのほとりに、そよ風わたり',
    'う': 'うつろう雲を、水面にうつし',
    'え': 'えがく波紋が、静かにひろがり',
    'お': 'おだやかな水、竹の音ひびき',
    'か': 'かすかな波紋、静かにひろがり',
    'き': 'きらめく雫、水面におちて',
    'く': 'くもを映して、水面はしずか',
    'け': 'けしきを映す、澄んだ水面',
    'こ': 'こもれびゆれる、静かな水面',
    'さ': 'さざなみゆれる、静かな水面',
    'し': 'しずくがおちて、波紋がひろがり',
    'す': 'すみわたる水、光がこぼれ',
    'せ': 'せせらぎの音、やさしくひびき',
    'そ': 'そよ風わたり、水面がゆれて',
    'た': 'たけの雫が、水面にほどけ',
    'ち': 'ちいさな波紋、まるくひろがり',
    'つ': 'つゆのしずくが、水面におちて',
    'て': 'てらす光が、水面にゆれて',
    'と': 'とうめいな水、光がとけて',
    'な': 'なぎの水面に、光がゆれて',
    'に': 'にじむ光が、水面にとけて',
    'ぬ': 'ぬれた石から、雫がおちて',
    'ね': 'ねむるような、静かな水面',
    'の': 'のどかな池に、光がさして',
    'は': 'はもんひろがる、静かな水面',
    'ひ': 'ひかりをやどす、澄んだ水面',
    'ふ': 'ふわりと風が、水面をなでて',
    'へ': 'へりの石まで、さざなみとどき',
    'ほ': 'ほのかな光、水面にゆれて',
    'ま': 'まるい波紋が、静かにひろがり',
    'み': 'みなもにゆれる、やわらかな光',
    'む': 'むこう岸まで、波紋がとどき',
    'め': 'めぐる水音、静かにひびき',
    'も': 'もれる光が、水面にゆれて',
    'や': 'やさしい水音、竹からこぼれ',
    'ゆ': 'ゆらめく水面に、光がとけて',
    'よ': 'よせては消える、小さな波紋',
    'ら': 'らでんのように、水面がきらめき',
    'り': 'りんと澄んだ、静かな水面',
    'る': 'るりいろの空、水面にうつり',
    'れ': 'れんげのように、波紋がひらき',
    'ろ': 'ろじの奥なる、静かな池に',
    'わ': 'わをえがくよう、波紋がひろがり'
  };
  var L2 = {
    'あ': 'あそぶ鯉たち、時をわすれて',
    'い': 'いろとりどりの、鯉がゆきかう',
    'う': 'うかぶ鯉たち、ゆったりめぐる',
    'え': 'えさをもとめて、鯉がよりそう',
    'お': 'およぐ錦鯉、心なごんで',
    'か': 'かろやかに泳ぐ、鯉とひと息',
    'き': 'きままな鯉と、ひと息ついて',
    'く': 'くつろぐ鯉が、ゆったりめぐる',
    'け': 'けしきにとけて、鯉がたゆたう',
    'こ': 'こころほどける、鯉のひととき',
    'さ': 'さそいあうよう、鯉がよりそう',
    'し': 'しずかに泳ぐ、鯉とひと息',
    'す': 'すいすい泳ぐ、鯉にいやされ',
    'せ': 'せわしさわすれ、鯉とひと息',
    'そ': 'そっと尾をふる、鯉にいやされ',
    'た': 'たゆたう鯉と、ひと息ついて',
    'ち': 'ちかづく鯉に、笑みがこぼれて',
    'つ': 'つれだつ鯉が、ゆったりめぐる',
    'て': 'てらされた鯉、きらりとひかる',
    'と': 'ときをわすれて、鯉とたゆたう',
    'な': 'ながれる時を、鯉とゆだねて',
    'に': 'にしきの鯉が、ゆったり泳ぐ',
    'ぬ': 'ぬくもる心、鯉とひと息',
    'ね': 'ねがいをのせて、鯉がたゆたう',
    'の': 'のんびり泳ぐ、鯉とひと息',
    'は': 'はなやぐ鯉が、ゆったりめぐる',
    'ひ': 'ひと息ついて、鯉をながめて',
    'ふ': 'ふわりとひらく、鯉の尾びれ',
    'へ': 'へだてなく寄る、鯉のやさしさ',
    'ほ': 'ほっとひと息、鯉をながめて',
    'ま': 'まどろむように、鯉がたゆたう',
    'み': 'みとれるほどに、鯉がたゆたう',
    'む': 'むれをなす鯉、ゆったりめぐる',
    'め': 'めぐりあう鯉、ゆったり泳ぐ',
    'も': 'もの思いほどけ、鯉とひと息',
    'や': 'やすらぐ心、鯉がたゆたう',
    'ゆ': 'ゆったり泳ぐ、鯉とひと息',
    'よ': 'よりそう鯉に、心なごんで',
    'ら': 'らくに息つき、鯉をながめて',
    'り': 'りんとした鯉、静かにめぐる',
    'る': 'るりの空の下、鯉がたゆたう',
    'れ': 'れつをなす鯉、ゆったりめぐる',
    'ろ': 'ろじのかたすみ、鯉とひと息',
    'わ': 'わずらい忘れ、鯉とひと息'
  };

  /* ---------- second choices ----------
     Used when the first choice would repeat a word of the pond's name or
     of the other line (選び方: pick in `make`). Same rules: each starts with
     its syllable or kanji; line 1 is the water, the light and the garden;
     line 2 is the koi and her unwinding, and never names the water itself
     (水, 水面, 水辺, 池), unless that is her own kanji. */
  var L1B = {
    'あ': 'あおぞら映す、おだやかな池', 'い': 'いしのあいだを、清水がつたい', 'う': 'うすべにの花、ほとりに咲いて',
    'え': 'えんがわの先、庭がひろがり', 'お': 'おとなき庭に、そよ風ふいて', 'か': 'かぜのささやき、苔をなでて',
    'き': 'きよらかな水、石をつたって', 'く': 'くさの葉ずれ、かすかにひびき', 'け': 'けむるもやに、庭がやすらぎ',
    'こ': 'こけむす石、しっとりぬれて', 'さ': 'さらさらと、竹の葉ずれの音', 'し': 'しげる木々が、池をかこんで',
    'す': 'すずしい風が、庭をわたり', 'せ': 'せきれいが、石にとまって', 'そ': 'そらの青、池にうつって',
    'た': 'たいらな石に、苔がむして', 'ち': 'ちる花びらが、ふわりとうかび', 'つ': 'つたう清水が、石をぬらし',
    'て': 'てんに浮く雲、ゆっくりながれ', 'と': 'とおくの山、うっすらかすみ', 'な': 'なだらかな庭、苔がひろがり',
    'に': 'にわの木々、そっと見まもり', 'ぬ': 'ぬくもりあふれる、庭の陽ざし', 'ね': 'ねいろやさしく、竹の音ひびき',
    'の': 'のきばの風鈴、ちりんとなって', 'は': 'はなびらひとつ、ふわりとうかび', 'ひ': 'ひなたの石が、ぬくもりおびて',
    'ふ': 'ふかみどりの、苔がしっとり', 'へ': 'へいの向こう、竹がそよいで', 'ほ': 'ほそい竹の、葉ずれの音',
    'ま': 'まつのみどり、庭にしずまり', 'み': 'みどりの苔、しっとりぬれて', 'む': 'むらさきの花、ほとりに咲いて',
    'め': 'めじろが、枝にとまって', 'も': 'もやのむこう、山がかすんで', 'や': 'やわらかな苔、石をつつみ',
    'ゆ': 'ゆるやかな風、庭をわたり', 'よ': 'よしの葉ずれ、さらさらひびき', 'ら': 'らんかんの影、池にうつって',
    'り': 'りょくいんふかく、庭がしずまり', 'る': 'るりいろの鳥、枝にとまって', 'れ': 'れいろうと、空が澄みわたり',
    'ろ': 'ろぼうの石、苔におおわれ', 'わ': 'わかたけの、葉ずれがひびき'
  };
  var L2B = {
    'あ': 'あかい鯉が、ひらりと泳ぐ', 'い': 'いきをひそめ、鯉をみつめて', 'う': 'うろこきらめき、鯉がおよぐ',
    'え': 'えがおがこぼれる、鯉のしぐさ', 'お': 'おびれをふって、鯉がよりそう', 'か': 'かさなるように、鯉がよりそう',
    'き': 'きんの鯉が、ゆらりとおよぐ', 'く': 'くちをひらいて、鯉がえさをまつ', 'け': 'けなげな鯉が、えさをもとめて',
    'こ': 'こいのむれが、ふわりとうかび', 'さ': 'さっと尾をふり、鯉がよりそう', 'し': 'しなやかに、鯉が身をくねらせ',
    'す': 'すこしずつ、鯉に心ほどけて', 'せ': 'せなかを見せて、鯉がおよぐ', 'そ': 'そっとのぞけば、鯉がよりそう',
    'た': 'たのしげに、鯉がおよぐ', 'ち': 'ちいさな鯉も、ならんでおよぐ', 'つ': 'つかのまの、鯉とのひととき',
    'て': 'てを休めつつ、鯉をながめて', 'と': 'ともにおよぐ、鯉のむれ', 'な': 'なかよく鯉が、ならんでおよぐ',
    'に': 'にぎやかに、鯉がえさをまつ', 'ぬ': 'ぬくぬくと、鯉がまどろむ', 'ね': 'ねむたげに、鯉がうかんで',
    'の': 'のびやかに、鯉がひれをひらき', 'は': 'はねる鯉に、笑みがこぼれて', 'ひ': 'ひれをゆらし、鯉がよりそう',
    'ふ': 'ふれあうように、鯉がならんで', 'へ': 'へいおんな時、鯉とすごして', 'ほ': 'ほほえむように、鯉がよりそう',
    'ま': 'まあるい口で、鯉がえさをまつ', 'み': 'みまもるように、鯉がよりそう', 'む': 'むねがほどける、鯉のひととき',
    'め': 'めでたい鯉が、ならんでおよぐ', 'も': 'もようさまざま、鯉がならんで', 'や': 'やわらかに、鯉がひれをふって',
    'ゆ': 'ゆらりと尾をふり、鯉がよりそう', 'よ': 'よろこぶように、鯉がはねて', 'ら': 'らくらくと、鯉が身をかえし',
    'り': 'りっぱな鯉が、ゆうゆうおよぐ', 'れ': 'れいめいの光、鯉がめざめて',
    'ろ': 'ろうかにすわり、鯉とひと息', 'わ': 'わになるように、鯉があつまり'
  };
  // kanji whose own lines repeat their own pond name (桜影の池 / 桜影うつす …): a second line
  var KB = {
    '桜': { l1: '桜ひとひら、ふわりとうかび' },
    '鈴': { l1: '鈴のような、ちいさな波紋' },
    '山': { l1: '山なみ遠く、空にかすんで' },
    '木': { l1: '木々のみどり、庭にしずまり' },
    '松': { l1: '松のみどり、しずかにしげり' },
    '藤': { l1: '藤の花房、そよ風にゆれ' },
    '島': { l1: '島の松が、しずかにたたずみ' },
    '花': { l1: '花びらひとつ、ふわりとうかび' },
    '梅': { l1: '梅のひと枝、ほとりに咲いて' },
    '月': { l1: '月のひかり、水面をてらし' },
    '星': { l1: '星のまたたき、水面にゆれて' },
    '陽': { l1: '陽のひかり、水面にこぼれ' },
    '清': { l1: '清らかな風、竹をゆらし' },
    '若': { l1: '若草もえる、ほとりのみどり', l2: '若々しく、鯉がはねて' },
    '春': { l2: '春のひざし、鯉がたゆたう' },
    '涼': { l2: '涼やかに、鯉がすべって' },
    '楓': { l2: '楓の葉うけ、鯉がたゆたう' },
    '椿': { l2: '椿の花に、鯉がよりそう' }
  };
  var PLAIN1 = 'やわらかな光、水面にゆれて';
  var PLAIN2 = 'ゆったり泳ぐ、鯉とひと息';
  var PLAIN_TITLE = 'やすらぎの池';

  /* ---------- the pond's name for each first syllable ---------- */
  var T1 = {
    'あ': 'あさなぎの池', 'い': 'いろどりの池', 'う': 'うららの池', 'え': 'えにしの池', 'お': 'おぼろの池',
    'か': 'かなでの池', 'き': 'きらめきの池', 'く': 'くもかげの池', 'け': 'けやきかげの池', 'こ': 'こもれびの池',
    'さ': 'さざなみの池', 'し': 'しずくの池', 'す': 'すずかぜの池', 'せ': 'せせらぎの池', 'そ': 'そよかぜの池',
    'た': 'たまゆらの池', 'ち': 'ちとせの池', 'つ': 'つきかげの池', 'て': 'てりはの池', 'と': 'ときわの池',
    'な': 'なごみの池', 'に': 'にしきの池', 'ぬ': 'ぬくもりの池', 'ね': 'ねいろの池', 'の': 'のぞみの池',
    'は': 'はもんの池', 'ひ': 'ひだまりの池', 'ふ': 'ふじなみの池', 'へ': 'へきすいの池', 'ほ': 'ほたるの池',
    'ま': 'まどかの池', 'み': 'みずかがみの池', 'む': 'むすびの池', 'め': 'めぐみの池', 'も': 'もみじの池',
    'や': 'やすらぎの池', 'ゆ': 'ゆうなぎの池', 'よ': 'よつゆの池',
    'ら': 'らでんの池', 'り': 'りんどうの池', 'る': 'るりの池', 'れ': 'れんげの池', 'ろ': 'ろじの池',
    'わ': 'わかばの池'
  };
  /* her first two kana, when they begin a real word (kana names only) */
  var PAIRS = {
    'かな': 'かなでの池', 'しず': 'しずくの池', 'あや': 'あやなみの池', 'ひな': 'ひなたの池',
    'すず': 'すずかぜの池', 'ゆら': 'ゆらぎの池', 'あか': 'あかねの池', 'ゆう': 'ゆうなぎの池', 'あさ': 'あさなぎの池',
    'なぎ': 'なぎさの池', 'まど': 'まどかの池', 'めぐ': 'めぐみの池', 'ひか': 'ひかりの池', 'かす': 'かすみの池',
    'つき': 'つきかげの池', 'かえ': 'かえでの池', 'みお': 'みおの池', 'さく': 'さくらの池', 'のぞ': 'のぞみの池',
    'うら': 'うららの池', 'しお': 'しおさいの池', 'ひよ': 'ひよりの池', 'つば': 'つばきの池', 'ほし': 'ほしかげの池',
    'そら': 'そらいろの池', 'ここ': 'こころの池', 'あお': 'あおばの池', 'たま': 'たまゆらの池', 'みず': 'みずかがみの池', 'みづ': 'みずかがみの池',
    'ゆき': 'ゆきみの池', 'はな': 'はなかげの池', 'あい': 'あいいろの池', 'かお': 'かおりの池', 'もも': 'ももいろの池',
    'わか': 'わかばの池', 'さざ': 'さざなみの池', 'こも': 'こもれびの池', 'せせ': 'せせらぎの池', 'そよ': 'そよかぜの池',
    'ほた': 'ほたるの池', 'もみ': 'もみじの池', 'れん': 'れんげの池', 'るり': 'るりの池', 'りん': 'りんどうの池',
    'えに': 'えにしの池', 'ちと': 'ちとせの池', 'とき': 'ときわの池', 'にし': 'にしきの池',
    'はる': 'はるかぜの池', 'なご': 'なごみの池'
  };

  /* ---------- kanji that begin a phrase themselves ----------
     t: the pond's name; l1 / l2: the lines (each starts with the kanji).
     Any of the three may be missing; the syllable's own is used then. */
  var K = {
    '桜': { t: '桜影の池', l1: '桜影うつす、静かな水面', l2: '桜色の鯉、ゆったり泳ぐ' },
    '庭': { l1: '庭の静けさ、水面にうつし', l2: '庭の錦鯉、ゆったりと舞う' },
    '鈴': { t: '鈴音の池', l1: '鈴の音ひびく、静かな水辺', l2: '鈴の音きいて、鯉がよりそう' },
    '山': { t: '山影の池', l1: '山影うつす、静かな水面', l2: '山のしずけさ、鯉とひと息' },
    '川': { l1: '川のせせらぎ、池にそそいで', l2: '川をのぼるよう、鯉が泳ぐ' },
    '木': { t: '木漏れ日の池', l1: '木漏れ日ゆれる、静かな水面', l2: '木かげの鯉、ゆったりめぐる' },
    '林': { l1: '林をぬける、風が水面に', l2: '林の風うけ、鯉がたゆたう' },
    '森': { t: '森影の池', l1: '森のしずけさ、水面にうつり', l2: '森の風うけ、鯉がたゆたう' },
    '松': { t: '松風の池', l1: '松風わたる、静かな水面', l2: '松の木かげを、鯉がめぐる' },
    '竹': { l1: '竹の雫が、水面にほどけ', l2: '竹の音きいて、鯉とひと息' },
    '藤': { t: '藤波の池', l1: '藤波ゆれる、静かな水面', l2: '藤のかげにて、鯉がたゆたう' },
    '石': { l1: '石をつたう、雫の音色', l2: '石のあいだを、鯉がすりぬけ' },
    '岩': { l1: '岩をつたう、清らかな水', l2: '岩のあいだを、鯉がすりぬけ' },
    '水': { t: '水鏡の池', l1: '水面にゆれる、やわらかな光', l2: '水をわけて、鯉がゆったり' },
    '池': { l1: '池のおもてに、光がゆれて', l2: '池の鯉たち、ゆったりめぐる' },
    '橋': { l1: '橋のたもと、水面がゆれて', l2: '橋の下を、鯉がくぐって' },
    '島': { t: '島影の池', l1: '島影うつす、静かな水面', l2: '島をめぐって、鯉がたゆたう' },
    '野': { l1: '野の花うつす、静かな水面', l2: '野の風うけて、鯉がたゆたう' },
    '花': { t: '花影の池', l1: '花影うつす、静かな水面', l2: '花のように、鯉がひらりと' },
    '梅': { t: '梅香の池', l1: '梅の香ただよう、静かな水辺', l2: '梅の木かげを、鯉がめぐる' },
    '月': { t: '月影の池', l1: '月影やどす、静かな水面', l2: '月あかりうけ、鯉がたゆたう' },
    '星': { t: '星影の池', l1: '星影うつす、澄んだ水面', l2: '星のように、鯉がきらめく' },
    '空': { l1: '空をうつした、鏡の水面', l2: '空を泳ぐよう、鯉がゆく' },
    '雪': { t: '雪見の池', l1: '雪あかり、水面をてらし', l2: '雪のような、白い鯉がゆく' },
    '春': { t: '春風の池', l1: '春の陽だまり、水面にゆれて', l2: '春風うけて、鯉がたゆたう' },
    '夏': { l1: '夏の木漏れ日、水面にゆれて', l2: '夏の日ざしに、鯉がきらめく' },
    '秋': { l1: '秋の空うつす、澄んだ水面', l2: '秋風うけて、鯉がたゆたう' },
    '冬': { l1: '冬の陽だまり、水面にゆれて', l2: '冬のぬくもり、鯉とひと息' },
    '美': { l1: '美しい水面、光がとけて', l2: '美しい鯉と、ひと息ついて' },
    '優': { l1: '優しい水音、竹からこぼれ', l2: '優雅な鯉と、心をほどいて' },
    '心': { t: '心字池', l1: '心しずめる、澄んだ水面', l2: '心ほどける、鯉のひととき' },
    '愛': { l1: '愛おしい時、水面にうつし', l2: '愛らしい鯉が、そっとよりそう' },
    '光': { l1: '光をやどす、澄んだ水面', l2: '光あつめて、鯉がきらめく' },
    '陽': { t: '陽だまりの池', l1: '陽だまりうつす、穏やかな水面', l2: '陽をあびて、鯉がきらめく' },
    '海': { l1: '海のように、澄んだ水面', l2: '海をゆくよう、鯉がのびやかに' },
    '清': { t: '清水の池', l1: '清らかな水、竹からこぼれ', l2: '清らかな鯉、ゆったり泳ぐ' },
    '静': { t: '静寂の池', l1: '静かな池に、雫がおちて', l2: '静かに泳ぐ、鯉とひと息' },
    '和': { t: '和みの池', l1: '和やかな風、水面にそよぎ', l2: '和むひととき、鯉とやすらぐ' },
    '千': { t: '千歳の池', l1: '千の光が、水面にゆれて' },
    '風': { l1: '風がわたる、静かな水面', l2: '風をうけて、鯉がたゆたう' },
    '白': { l1: '白雲うつす、静かな水面', l2: '白い鯉が、ゆったりめぐる' },
    '青': { l1: '青い空うつす、澄んだ水面', l2: '青葉のかげを、鯉がめぐる' },
    '緑': { l1: '緑をうつす、静かな水面', l2: '緑のかげを、鯉がめぐる' },
    '金': { l1: '金の光が、水面にゆれて', l2: '金色の鯉、きらりとひかる' },
    '葉': { l1: '葉ずれの音に、水面がゆれて', l2: '葉かげの鯉、ゆったりめぐる' },
    '音': { l1: '音もなく、雫が水面に', l2: '音にさそわれ、鯉がよりそう' },
    '香': { l1: '香りはこぶ風、水面にそよぎ', l2: '香る風に、鯉がたゆたう' },
    '彩': { t: '彩雲の池', l1: '彩る光、水面にひろがり', l2: '彩りの鯉、ふわりと泳ぐ' },
    '結': { l1: '結ぶ波紋が、静かにひろがり', l2: '結ばれた縁、鯉がよりそう' },
    '咲': { l1: '咲く花うつす、静かな水面', l2: '咲く花のよう、鯉がひらりと' },
    '凪': { t: '凪の池', l1: '凪いだ水面に、雫がおちて', l2: '凪のひととき、鯉とすごして' },
    '澄': { l1: '澄みわたる池、波紋がひろがり', l2: '澄んだひとみで、鯉がみあげる' },
    '楓': { t: '楓影の池', l1: '楓をうつす、静かな水面', l2: '楓のかげを、鯉がめぐる' },
    '椿': { t: '椿影の池', l1: '椿をうつす、静かな水面', l2: '椿のかげを、鯉がめぐる' },
    '涼': { t: '涼風の池', l1: '涼やかな水、竹からおちて', l2: '涼風うけて、鯉がたゆたう' },
    '舞': { l1: '舞いおちる葉、水面にうかび', l2: '舞うように、鯉がひらりと' },
    '恵': { t: '恵みの池', l1: '恵みの雫、水面におちて', l2: '恵みをうけて、鯉がたゆたう' },
    '晴': { l1: '晴れやかな日、水面がきらめき', l2: '晴れやかに、鯉がきらめく' },
    '明': { l1: '明るい光、水面にゆれて', l2: '明るい陽に、鯉がきらめく' },
    '朝': { t: '朝凪の池', l1: '朝の光が、水面にさして', l2: '朝のしずけさ、鯉とひと息' },
    '夕': { t: '夕凪の池', l1: '夕陽をうつす、静かな水面', l2: '夕風うけて、鯉がたゆたう' },
    '雅': { l1: '雅な庭の、静かな水面', l2: '雅な鯉が、ゆったり泳ぐ' },
    '泉': { l1: '泉のように、澄んだ水面', l2: '泉のほとり、鯉がよりそう' },
    '葵': { l1: '葵の葉かげ、静かな水面', l2: '葵のかげを、鯉がめぐる' },
    '凛': { l1: '凛と澄んだ、静かな水面', l2: '凛とした鯉、ゆったり泳ぐ' },
    '蓮': { l1: '蓮の葉うかぶ、静かな水面', l2: '蓮のかげを、鯉がめぐる' },
    '若': { t: '若葉の池', l1: '若葉をうつす、静かな水面', l2: '若葉のかげを、鯉がめぐる' },
    '錦': { t: '錦の池', l1: '錦をうつす、静かな水面', l2: '錦の鯉が、ゆったり泳ぐ' },
    '波': { l1: '波紋ひろがる、静かな水面', l2: '波にゆられて、鯉がたゆたう' },
    '雨': { l1: '雨のしずくが、水面におちて', l2: '雨あがり、鯉がよりそう' },
    '滝': { l1: '滝の音ひびく、静かな水辺', l2: '滝をのぼるよう、鯉が泳ぐ' },
    '沢': { l1: '沢のせせらぎ、池にそそいで', l2: '沢の音きいて、鯉がたゆたう' },
    '澤': { l1: '澤のせせらぎ、池にそそいで', l2: '澤の音きいて、鯉がたゆたう' }
  };

  /* ---------- the first syllable of each name kanji's reading ----------
     "字かな" or "字かな/かな": the second is used when the kanji is not the
     first of the name (藤 ふじ at the start: 藤田; とう after: 佐藤). Voiced
     syllables need not be written voiced (they count as plain). */
  var R = {};
  ('佐さ 早さ 藤ふ/と 鈴す 木き 高た 橋は 田た 中な 伊い 渡わ 辺な 山や 本ほ/も 村む 小こ 林は 加か 吉よ 口く ' +
   '松ま 井い 上う/か 斎さ 斉さ 齋さ 清し 水み 崎さ 森も 池い 阿あ 部へ 石い 下し 島し 嶋し 前ま 岡お 長な 谷た ' +
   '川か 後こ 近こ 遠え 青あ 坂さ 阪さ 福ふ 太お/た 西に 金か 子こ 原は 野の 三み 浦う 竹た 内う 和わ 柴し 酒さ ' +
   '工く 横よ 宮み 安あ 大お 丸ま 今い 河か 杉す 増ま 塚つ 平ひ 菅す 久く 保ほ 千ち 葉は 岩い 桜さ 尾お ' +
   '菊き 地ち 新あ 古ふ 秋あ 東ひ 北き 南み 片か 永な 荒あ 星ほ 市い 関せ 堀ほ 浅あ 早は 黒く 白し 赤あ ' +
   '緑み 富と 豊と 広ひ 廣ひ 熊く 飯い 須す 江え 沢さ 澤さ 服は 樋ひ 根ね 宇う 矢や 細ほ 武た 栗く 梅う ' +
   '桑く 柳や 畑は 戸と 門か 津つ 渕ふ 淵ふ 浜は 濱は 奥お 篠し 牧ま 岸き 間ま 越こ 辻つ 稲い 植う 梶か ' +
   '椎し 宗む 立た 寺て 庭に 城し 屋や 瀬せ 沼ぬ 湯ゆ 角か 国く 國く 春は 夏な 冬ふ 雪ゆ 花は 美み 咲さ ' +
   '恵め/え 愛あ 優ゆ 結ゆ 陽よ/ひ 葵あ 凛り 彩あ 真ま 由ゆ 奈な 菜な 里さ/り 理り 香か 佳か 沙さ 紗さ ' +
   '智と/ち 知と/ち 明あ 亜あ 絵え 舞ま 麻あ/ま 未み 実み 桃も 月つ 空そ 海う 涼す 晴は 光ひ 心こ 静し ' +
   '純す 直な 幸さ/ゆ 京き 裕ゆ 友と 有あ/ゆ 悠ゆ 遥は 瑞み 綾あ 文ふ 弘ひ 博ひ 宏ひ 洋よ/ひ 浩こ/ひ ' +
   '健け 誠ま 正ま 雅ま 貴た/き 敬け 孝た 信の 順す 恭き 礼れ 律り 玲れ 怜れ 麗れ 蘭ら 瑠る 留る 琉る ' +
   '璃り 莉り 梨り 利り 音お/ね 乃の 穂ほ 帆ほ 歩あ/ほ 芽め 萌も 菫す 薫か 霞か 楓か 椿つ 蓮れ 柚ゆ ' +
   '杏あ 梓あ 樹き 茜あ 晶あ 瞳ひ 環た 栞し 詩し 歌う/か 唯ゆ 依い 衣い/え 枝え 代よ 世よ 夜よ 希き ' +
   '紀き 喜き 季き 朋と 智と 千ち 百も 万ま 八や 五い 四よ 二に/じ 一か 九く 十と 六む 七な 恋こ 華は/か ' +
   '舞ま 紅べ 朱あ 藍あ 碧み 翠み 虹に 光ひ 輝て 照て 灯あ 燈と 晃あ 昌ま 秀ひ 英え 栄え 恭き 康や ' +
   '泰や 安や 寛ひ 裕ひ 啓け 慶け 景け 鶴つ 亀か 鷹た 鳥と 鳩は 鹿し 熊く 犬い 猪い 馬ま 牛う 羽は ' +
   '翼つ 澄す 泉い 滝た 浦う 湖み 潮し 岬み 嶺み 峰み 谷や 坂さ 丘お 野の 畠は 苑そ 園そ 菊き 萩は ' +
   '桂か 椿つ 檜ひ 杉す 桐き 柏か 楠く 欅け 芦あ 葦あ 稲い 麦む 米よ 粟あ 豆ま 竜た 龍た 辰た 寅と ' +
   '卯う 巳み 午う 申さ 酉と 戌い 亥い 吾あ 我わ 成な 新し 元も 正ま 則の 典の 法の 道み 達た 勇い ' +
   '雄お 男お 夫お 郎ろ 太た 次じ 二じ 助す 介す 輔す 彦ひ 人ひ 仁ひ 也な 哉や 斗と 翔し 蒼あ 颯は ' +
   '湊み 陸り 碧あ 凪な 澪み 雫し 萌め 恋れ 叶か 望の 希の 夢ゆ 祈い 祐ゆ 侑ゆ 宥ゆ 佑ゆ 優ゆ 柊ひ ' +
   '椋む 麗れ 鞠ま 毬ま 鈴す 琴こ 笛ふ 舟ふ 船ふ 渚な 汐し 浪な 波な 雨あ 霧き 露つ 霜し 氷こ 岳た ' +
   '朝あ 夕ゆ 昼ひ 晩ば 宵よ 暁あ 曙あ 錦に 若わ 老お 古ふ 今い 宮み 社や 神か 寿こ 福ふ 吉き 喜よ ' +
   '覚さ 聡さ 悟さ 哲て 修お 治は 政ま 久ひ/く 永な 恒つ 常つ 尚な 直な 紘ひ 広ひ 拓た 開ひ 進す ' +
   '登の 昇の 隆た 崇た 尊た 貴た 宝た 玉た 珠た 環た 円ま 丸ま 方か 角す 菱ひ 鶴つ 勝か 克か 剛つ ' +
   '強つ 力ち 功い 恵え 慧け 賢け 謙け 研け 究き 学ま 文ぶ 章あ 詞し 史ふ 志し 士し 師も 匠た ' +
   '足あ 合あ 堤つ 目め 織お 飼か 場は 垣か 妻つ 央お 尋ひ 重え 緒お 良ら 苗な 耶や 摘つ')
    .split(' ').forEach(function (tok) {
      if (!tok) return;
      var ch = tok.charAt(0), v = tok.slice(1).split('/');
      if (!(ch in R)) R[ch] = { first: v[0], later: v[1] || v[0] };
    });

  /* whole names whose syllables the table above gets wrong, or names of
     one kanji (two syllables of its reading): the two syllables */
  var NAMES = {
    '小川': 'おか', '小野': 'おの', '小野寺': 'おの', '小田': 'おた', '小沢': 'おさ', '小澤': 'おさ',
    '井上': 'いう', '村上': 'むか', '川上': 'かか', '坂上': 'さか', '三上': 'みか', '野上': 'のか',
    '長谷川': 'はせ', '長谷': 'はせ', '服部': 'はと', '渡部': 'わな', '阿部': 'あへ', '安部': 'あへ',
    '日下部': 'くか', '五十嵐': 'いか', '一ノ瀬': 'いせ', '一之瀬': 'いせ',
    '河野': 'この', '大和': 'やま', '大河内': 'おこ', '神田': 'かた', '神戸': 'かと',
    '今野': 'この', '紺野': 'この', '日高': 'ひた', '日野': 'ひの', '日向': 'ひな',
    '春日': 'かす', '飛鳥': 'あす', '明日香': 'あす', '大塚': 'おつ', '大谷': 'おた', '熊谷': 'くか',
    '新井': 'あい', '新田': 'にた', '荒井': 'あい', '浅井': 'あい', '今井': 'いい', '白井': 'しい',
    '東': 'あす', '西': 'にし', '南': 'みな', '北': 'きた', '林': 'はや', '森': 'もり', '原': 'はら',
    '堀': 'ほり', '関': 'せき', '岸': 'きし', '辻': 'つし', '泉': 'いす', '岡': 'おか', '谷': 'たに',
    '桜': 'さく', '恵': 'めく', '愛': 'あい', '薫': 'かお', '栞': 'しお', '葵': 'あお', '凛': 'りん',
    '舞': 'まい', '彩': 'あや', '雫': 'しず', '澪': 'みお', '楓': 'かえ', '椿': 'つば', '茜': 'あか',
    '梓': 'あず', '環': 'たま', '瞳': 'ひと', '遥': 'はる', '萌': 'もえ', '静': 'しず', '幸': 'さち',
    '翼': 'つば', '蓮': 'れん', '光': 'ひか', '翔': 'しよ', '渚': 'なぎ', '恋': 'れん', '望': 'のぞ',
    '幸子': 'さこ', '幸恵': 'ゆえ', '恵子': 'けこ', '恵美': 'えみ', '智子': 'とこ', '知子': 'とこ',
    '陽子': 'よこ', '陽菜': 'ひな', '陽向': 'ひな', '花子': 'はこ', '美花': 'みか', '春花': 'はか',
    '裕子': 'ゆこ', '洋子': 'よこ', '久美子': 'くみ', '由美子': 'ゆみ', '真由美': 'まゆ', '麻衣': 'まい',
    '麻美': 'あみ', '亜美': 'あみ', '歩美': 'あみ', '有希': 'ゆき', '有紀': 'ゆき', '友美': 'とみ',
    '河合': 'かい', '百合': 'ゆり', '桐生': 'きゆ', '足立': 'あた',
    '紅葉': 'もみ', '早川': 'はか', '馬場': 'はは', '一花': 'いか', '五月': 'さつ', '波留': 'はる',
    // names of one kanji: the first two syllables of its reading
    '杏': 'あん', '唯': 'ゆい', '詩': 'うた', '柚': 'ゆず', '夢': 'ゆめ', '碧': 'あお', '翠': 'みど', '虹': 'にじ',
    '藍': 'あい', '灯': 'あか', '曙': 'あけ', '凪': 'なぎ', '錦': 'にし', '侑': 'ゆう', '柊': 'ひい', '椋': 'むく',
    '鈴': 'すず', '咲': 'さき', '晴': 'はる', '心': 'ここ', '花': 'はな', '華': 'はな', '歩': 'あゆ', '蘭': 'らん',
    '怜': 'れい', '麗': 'れい', '菫': 'すみ', '霞': 'かす', '楠': 'くす', '桂': 'かつ', '岬': 'みさ', '峰': 'みね',
    '丘': 'おか', '星': 'ほし', '勇': 'いさ', '堤': 'つつ', '雪': 'ゆき', '月': 'つき', '空': 'そら', '海': 'うみ',
    '泉': 'いず', '茜': 'あか', '縁': 'ゆか', '結': 'ゆい', '優': 'ゆう', '光': 'ひか', '輝': 'てる', '雅': 'みや', '祈': 'いの'
  };

  var SMALL = /[ぁぃぅぇぉゃゅょゎっゕゖー〜ん]/;
  function toHira(s) {
    return String(s).replace(/[ァ-ヶ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); });
  }
  function plain(k) {   // voiced → plain: が → か, ぱ → は, ゔ → う
    return k ? k.normalize('NFD').replace(/[゙゚]/g, '').normalize('NFC').charAt(0) : k;
  }
  function isKana(c) { return /[ぁ-ゖァ-ヺー]/.test(c); }
  function isKanji(c) { return /[㐀-鿿豈-﫿々]/.test(c); }
  var VOWEL = {};
  'あかさたなはまやらわがざだばぱ:あ いきしちにひみりぎじぢびぴ:い うくすつぬふむゆるぐずづぶぷ:う えけせてねへめれげぜでべぺ:え おこそとのほもよろをごぞどぼぽ:お'
    .split(' ').forEach(function (g) { var p = g.split(':'); for (var i = 0; i < p[0].length; i++) VOWEL[p[0][i]] = p[1]; });

  function clean(raw) {
    return String(raw || '').replace(/[\s　]+/g, '')
      .replace(/(さん|さま|様|ちゃん|くん|君|先生|殿)$/, '');
  }

  // the characters of her name that the poem takes, with their syllables
  function units(name) {
    var chars = Array.from(name), out = [], i;
    if (NAMES[name]) {
      var two = Array.from(NAMES[name]), used = chars.filter(function (c) { return c !== '々' && c !== 'ノ' && c !== 'ヶ' && c !== 'ケ' && c !== '之'; });
      if (used.length < 2) return two.map(function (k, j) { return { ch: j === 0 ? used[0] : '', kana: plain(k), from: name }; });
      return [{ ch: used[0], kana: plain(two[0]), from: name }, { ch: used[1], kana: plain(two[1]), from: name }];
    }
    var prevVowel = '';
    for (i = 0; i < chars.length && out.length < 2; i++) {
      var c = chars[i], h = toHira(c);
      // 々 repeats the character before it: skipped (佐々木 → 佐, 木), unless it ends
      // the name and only one syllable has been taken (奈々 → な, な)
      if (c === '々') { if (i === chars.length - 1 && out.length === 1) out.push({ ch: c, kana: out[0].kana, from: 'repeat' }); continue; }
      if (isKana(c)) {
        if (SMALL.test(h)) { if (h !== 'ん' && h !== 'っ') prevVowel = ({ 'ゃ': 'あ', 'ゅ': 'う', 'ょ': 'お' })[h] || prevVowel; continue; }
        // a vowel that only lengthens the one before (ゆう, けい, おお) is skipped
        // (but not the name's last character: めい, れい, ゆう keep their second syllable)
        if (i < chars.length - 1 &&
            ((h === 'う' && (prevVowel === 'う' || prevVowel === 'お')) || (h === 'い' && prevVowel === 'え') || (h === 'お' && prevVowel === 'お'))) { prevVowel = ''; continue; }
        prevVowel = VOWEL[h] || '';
        out.push({ ch: c, kana: plain(h), from: 'kana' });
      } else if (isKanji(c)) {
        var r = R[c], k = r ? (out.length === 0 && i === 0 ? r.first : r.later) : '';
        out.push({ ch: c, kana: plain(k), from: r ? 'table' : 'unknown' });
        prevVowel = '';
      }
    }
    return out;
  }

  function cells(text, redFirst) {
    return Array.from(text).map(function (c, j) { return { ch: c, red: j < redFirst }; });
  }
  function split(line) {
    var p = line.indexOf('、');
    return p < 0 ? [line, ''] : [line.slice(0, p + 1), line.slice(p + 1)];
  }

  /* ---------- repeats ----------
     Two texts "clash" when they share a content kanji (other than 鯉 and the
     characters of her own name) or one of a few key words; kana spellings of
     the common words are read as their kanji first (みなも → 水面, ひかり → 光 …). */
  var KANA_AS = [['みなも', '水面'], ['みずべ', '水辺'], ['みず', '水'], ['ひかり', '光'], ['しずか', '静'],
    ['しずけさ', '静'], ['しずく', '雫'], ['かげ', '影'], ['かぜ', '風'], ['はもん', '波紋'], ['さざなみ', '波'],
    ['なみ', '波'], ['いけ', '池'], ['こころ', '心'], ['くも', '雲'], ['めぐ', '恵'], ['こけ', '苔'], ['そら', '空'], ['つき', '月'], ['はな', '花'], ['にわ', '庭']];
  var KEYWORDS = ['ゆったり', 'ひと息', 'たゆた', 'めぐ', 'きらめ', 'ゆれ', 'ひろが', 'よりそ', 'おちて', 'うつ', 'こぼれ', 'ひらり', 'ふわり'];
  function asKanji(t) {
    var s = String(t);
    KANA_AS.forEach(function (p) { s = s.split(p[0]).join(p[1]); });
    return s;
  }
  // the content kanji of a text (鯉 left out)
  function content(t) {
    var out = [];
    Array.from(asKanji(t)).forEach(function (c) { if (isKanji(c) && c !== '鯉' && out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  // a shared kanji of her own name is let off only when both texts open with
  // it (陽だまりの池 + 陽のひかり: the line is made from her kanji); written in
  // kana inside a line it is a repeat (心字池 + こころほどける)
  function clash(a, b, own) {
    var B = content(b), ra = Array.from(String(a))[0], rb = Array.from(String(b))[0];
    var out = content(a).filter(function (c) { return B.indexOf(c) >= 0 && !(own && own[c] && ra === c && rb === c); });
    var sa = asKanji(a), sb = asKanji(b);
    KEYWORDS.forEach(function (w) { if (sa.indexOf(w) >= 0 && sb.indexOf(w) >= 0) out.push(w); });
    return out;
  }
  /* the pond's name said again in a line: the first two characters of its
     word (written as typed, and with kana words read as their kanji) found in
     the line; after a kanji a kana of the same row counts as the same word
     (和み / 和む, 恵み / 恵ま): こもれびの池 + こもれびゆれる, くもかげの池 +
     くもを映して, 恵みの池 + 恵みの雫 */
  var ROWS = ['あいうえおぁぃぅぇぉ', 'かきくけこがぎぐげご', 'さしすせそざじずぜぞ', 'たちつてとだぢづでどっ',
    'なにぬねの', 'はひふへほばびぶべぼぱぴぷぺぽ', 'まみむめも', 'やゆよゃゅょ', 'らりるれろ', 'わをん'];
  function row(c) { for (var i = 0; i < ROWS.length; i++) if (c && ROWS[i].indexOf(c) >= 0) return i + 1; return 0; }
  function echo(word, line) {
    var out = [];
    [word, asKanji(word)].forEach(function (w) {
      var W = Array.from(w); if (W.length < 2 || out.length) return;
      [line, asKanji(line)].forEach(function (l) {
        var L = Array.from(l); if (out.length) return;
        for (var i = 0; i + 1 < L.length; i++) {
          if (L[i] !== W[0]) continue;
          if (L[i + 1] === W[1] || (isKanji(W[0]) && row(W[1]) && row(W[1]) === row(L[i + 1]))) { out.push(W[0] + W[1]); return; }
        }
      });
    });
    return out;
  }

  function make(raw) {
    var name = clean(raw), U = units(name), hira = toHira(name);
    var u1 = U[0] || null, u2 = U[1] || null;

    // the pond's name
    var title = '', red = 0, pair = '';
    if (/^[ぁ-ゖァ-ヺ]+$/.test(name)) {
      for (var n = Math.min(3, hira.length); n >= 2 && !title; n--) {
        pair = hira.slice(0, n);
        if (PAIRS[pair]) title = PAIRS[pair];
      }
    }
    if (!title && u1 && K[u1.ch] && K[u1.ch].t) title = K[u1.ch].t;
    // (else her second kanji's own: 美月 → 月影の池)
    if (!title && u2 && K[u2.ch] && K[u2.ch].t) title = K[u2.ch].t;
    if (!title && u1 && T1[u1.kana]) title = T1[u1.kana];
    if (!title) title = PLAIN_TITLE;
    if (title !== PLAIN_TITLE) {
      // red: as many first characters as come from her name
      var tc = Array.from(title), nc = Array.from(hira.replace(/づ/g, 'ず').replace(/ぢ/g, 'じ'));
      while (red < tc.length && red < nc.length && tc[red] === nc[red]) red++;
      if (!red) red = 1;
    }

    // the two lines: for each, its choices in order (her kanji's own first, then
    // her syllable's); the first that repeats no word of the pond's name or of
    // the other line is taken (else the one that repeats least)
    var own = {}; Array.from(name).forEach(function (c) { own[c] = 1; });
    function choices(u, which, alsoKanji) {
      var out = [], kk = alsoKanji || (u && u.ch);
      var Kk = kk && K[kk], Kb = kk && KB[kk];
      if (Kk && Kk[which]) out.push(Kk[which]);
      if (Kb && Kb[which]) out.push(Kb[which]);
      var tab = which === 'l1' ? [L1, L1B] : [L2, L2B];
      if (u && !alsoKanji) tab.forEach(function (T) { if (T[u.kana]) out.push(T[u.kana]); });
      return out;
    }
    function pick(list, against) {
      var best = null, bestN = 1e9;
      for (var i = 0; i < list.length; i++) {
        var n = echo(titleWords, list[i]).length;
        against.forEach(function (t) { n += clash(list[i], t, own).length; });
        if (n < bestN) { best = list[i]; bestN = n; if (!n) break; }
      }
      return best;
    }
    var titleWords = title.replace(/の?池$/, '');
    var t1 = pick(choices(u1, 'l1'), [titleWords]);
    var a = t1 ? { text: t1, red: 1 } : { text: PLAIN1, red: 0 };
    // (a one-kanji name whose second syllable cannot begin a line, 凛, 蓮, 杏:
    // りん, れん, あん: line 2 is the plain koi line, not the kanji again)
    var c2 = choices(u2, 'l2');
    var t2 = pick(c2, [titleWords, a.text]);
    var b = t2 ? { text: t2, red: 1 } : { text: PLAIN2, red: 0 };
    var A = split(a.text), B = split(b.text);
    return {
      name: name,
      seal: Array.from(name)[0] || '',
      title: cells(title, red),
      cols: [cells(A[0], a.red), cells(A[1], 0), cells(B[0], b.red), cells(B[1], 0)],
      lines: [a.text, b.text],
      units: U,
      repeats: echo(titleWords, a.text).concat(clash(a.text, titleWords, own), echo(titleWords, b.text),
        clash(b.text, titleWords, own), clash(b.text, a.text, own))
    };
  }

  return { make: make, units: units, clash: clash, echo: echo, L1: L1, L2: L2, K: K, L1B: L1B, L2B: L2B, KB: KB, T1: T1, PAIRS: PAIRS };
})();
if (typeof module !== 'undefined') module.exports = PondVerse;
