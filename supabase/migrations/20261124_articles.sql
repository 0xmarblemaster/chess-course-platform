-- Articles CMS (/articles pages, landing #articles block, /admin/articles editor, /api/articles).
-- Additive only: two new tables, one trigger function, one storage bucket, seed rows.
-- author holds the RU byline ("Name, role"); author_en / author_kk are its translations
-- (the byline differs per language on the public pages) and fall back to author.

create extension if not exists pgcrypto;

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique constraint articles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  topic text not null constraint articles_topic_check check (topic in ('parents', 'beginners', 'tournaments')),
  author text,
  author_en text,
  author_kk text,
  read_minutes int constraint articles_read_minutes_check check (read_minutes between 1 and 120),
  cover_url text,
  status text not null default 'draft' constraint articles_status_check check (status in ('draft', 'published')),
  featured boolean not null default false,
  sort_order int not null default 0,
  title_ru text not null default '',
  title_en text not null default '',
  title_kk text not null default '',
  teaser_ru text not null default '',
  teaser_en text not null default '',
  teaser_kk text not null default '',
  -- sanitized HTML (allowlist enforced by the API)
  body_ru text not null default '',
  body_en text not null default '',
  body_kk text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_status_order_idx on public.articles (status, featured desc, sort_order, published_at desc);

create or replace function public.articles_set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_set_updated_at before update on public.articles
  for each row execute function public.articles_set_updated_at();

alter table public.articles enable row level security;
create policy "Published articles are public" on public.articles
  for select to anon, authenticated using (status = 'published');

create table if not exists public.article_api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  created_by uuid,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

-- No policies: only the service role (API routes, CLI script) can read or write keys.
alter table public.article_api_keys enable row level security;

-- Covers: public read, writes only through the API (service role bypasses storage RLS).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('article-covers', 'article-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Seed: the six articles that were hard-coded in public/main/articles/{,en/,kk/}index.html.
insert into public.articles (slug, topic, author, author_en, author_kk, read_minutes, cover_url, status, featured, sort_order,
  title_ru, title_en, title_kk, teaser_ru, teaser_en, teaser_kk, body_ru, body_en, body_kk, published_at)
values
  ('age-to-start',
   'parents',
   'Чингис Нургалимов, основатель',
   'Chingis Nurgalimov, founder',
   'Чингис Нургалимов, негізін қалаушы',
   5,
   '/home/assets/chess-pieces.jpg',
   'published',
   true,
   1,
   'С какого возраста отдавать ребёнка в шахматы?',
   'At what age should a child start chess?',
   'Баланы шахматқа қай жастан беру керек?',
   'Почему 5–6 лет — лучшее окно и как понять, что ребёнок готов к первому уроку.',
   'Why 5–6 is the best window and how to tell your child is ready for a first lesson.',
   'Неліктен 5–6 жас — ең қолайлы кезең және бала алғашқы сабаққа дайын екенін қалай білуге болады.',
   '<p>Чаще всего родители спрашивают нас именно об этом. Короткий ответ: большинство детей готовы к регулярным занятиям в 5–6 лет. В этом возрасте ребёнок уже может просидеть за доской 20–30 минут, запоминает правила и с удовольствием играет по ним.</p><p>Начинать можно и раньше — с 4 лет, но в игровой форме: сказки о фигурах, простые задания на клетчатом поле, короткие партии на части доски. Главное — не торопить и не превращать занятие в урок «через силу».</p><p>Как понять, что ребёнок готов? Он различает «право» и «лево», знает цифры и буквы хотя бы до десяти, может спокойно дождаться своей очереди в настольной игре и не расстраивается до слёз от каждого проигрыша.</p><p>Если что-то из этого пока не получается — это не повод откладывать. Первый урок как раз и нужен, чтобы тренер посмотрел на ребёнка в деле и подсказал, с какой группы лучше начать.</p><p>В Chess Empire группы до 10 учеников, а занятия проходят два раза в неделю — этого достаточно, чтобы навык закреплялся, а интерес не пропадал. Приходите на пробный урок вместе, посмотрите, как всё устроено, и решите после.</p>',
   '<p>This is the question parents ask us most. The short answer: most children are ready for regular classes at 5–6. At that age a child can sit at the board for 20–30 minutes, remembers the rules and enjoys playing by them.</p><p>You can start earlier, from 4, but through play: stories about the pieces, simple tasks on a checkered board, short games on part of the board. The key is not to rush and not to turn it into a lesson your child has to sit through.</p><p>How do you know your child is ready? They can tell left from right, know numbers and letters at least up to ten, can wait for their turn in a board game and don''t burst into tears after every loss.</p><p>If some of this doesn''t work yet, that''s no reason to wait. The first lesson is exactly where the coach sees your child in action and suggests which group to start in.</p><p>At Chess Empire groups have up to 10 students and classes run twice a week — enough for skills to stick while keeping the interest alive. Come to a trial lesson together, see how it works, and decide afterwards.</p>',
   '<p>Ата-аналар бізге көбіне дәл осы сұрақты қояды. Қысқа жауап: балалардың көбі тұрақты сабаққа 5–6 жасында дайын болады. Бұл жаста бала тақта алдында 20–30 минут отыра алады, ережелерді есте сақтап, оларды сақтап ойнағанды ұнатады.</p><p>Ертерек те, 4 жастан бастауға болады, бірақ ойын түрінде: фигуралар туралы ертегілер, торлы алаңдағы қарапайым тапсырмалар, тақтаның бір бөлігіндегі қысқа партиялар. Ең бастысы — асықпау және сабақты мәжбүрлеуге айналдырмау.</p><p>Бала дайын екенін қалай білуге болады? Ол оң мен солды ажыратады, оныншыға дейінгі сандар мен әріптерді біледі, үстел ойынында өз кезегін сабырмен күте алады және әр жеңілістен кейін жыламайды.</p><p>Егер бұлардың бірі әзірге шықпаса — бұл кейінге қалдыруға себеп емес. Алғашқы сабақ дәл соған керек: жаттықтырушы баланы іс жүзінде көріп, қай топтан бастаған дұрыс екенін айтады.</p><p>Chess Empire-де топта 10 оқушыға дейін, сабақтар аптасына екі рет өтеді — бұл дағдының бекуіне жеткілікті, ал қызығушылық сөнбейді. Сынақ сабаққа бірге келіп, бәрі қалай ұйымдастырылғанын көріп, содан кейін шешім қабылдаңыз.</p>',
   '2026-11-24T00:00:00Z'),
  ('focus',
   'parents',
   'Наиль Ильдусович, тренер',
   'Nail Ildusovich, coach',
   'Наиль Ильдусович, жаттықтырушы',
   6,
   null,
   'published',
   false,
   2,
   'Как шахматы влияют на учёбу и концентрацию',
   'How chess affects schoolwork and focus',
   'Шахмат оқу мен зейінге қалай әсер етеді',
   'Что говорят исследования и что замечают родители уже через 3 месяца занятий.',
   'What research suggests and what parents notice after three months of classes.',
   'Зерттеулер не дейді және ата-аналар үш айдан кейін нені байқайды.',
   '<p>Шахматная партия — это время, в течение которого ребёнок держит в голове позицию, считает варианты и отвечает за каждое своё решение. Для младшего школьника это хорошая тренировка того самого умения, которое нужно на уроке: удерживать внимание на одной задаче.</p><p>Связь шахмат с учёбой изучают давно, и выводы исследователей осторожные: польза заметнее там, где занятия регулярные и проходят с тренером, а не от случая к случаю. Чуда шахматы не делают, но привычку думать перед ходом воспитывают.</p><p>Родители наших учеников уже через три месяца чаще всего замечают одно и то же: ребёнок дольше сидит над домашним заданием, реже бросает задачу на полпути и спокойнее относится к ошибкам — ведь в шахматах ошибку разбирают, а не ругают.</p><p>Помогает и сама структура урока: короткая теория, потом задачи, потом игра с разбором. Ребёнок учится планировать — «если я пойду сюда, что ответит соперник?» — и переносит этот вопрос в другие дела.</p><p>Чтобы эффект был, важна регулярность: минимум два занятия в неделю и немного практики дома. Одного урока в неделю, по нашему опыту, мало — навык не успевает закрепиться.</p>',
   '<p>A chess game is a stretch of time in which a child keeps the position in mind, calculates options and owns every decision. For a young student it trains exactly the skill they need in class: staying focused on one task.</p><p>The link between chess and schoolwork has been studied for a long time, and researchers are careful in their conclusions: the benefit shows most where classes are regular and led by a coach, not occasional. Chess is no miracle, but it builds the habit of thinking before you move.</p><p>After about three months, the parents of our students tend to notice the same things: their child sits over homework longer, gives up on a problem halfway less often and takes mistakes more calmly — in chess a mistake is analysed, not scolded.</p><p>The structure of the lesson helps too: a short bit of theory, then puzzles, then a game with a review. The child learns to plan — "if I go here, how will my opponent respond?" — and carries that question into other things.</p><p>For it to work, regularity matters: at least two classes a week and a little practice at home. In our experience one lesson a week is too little for the skill to stick.</p>',
   '<p>Шахмат партиясы — бала позицияны есінде ұстап, нұсқаларды есептеп, әр шешіміне жауап беретін уақыт. Кіші сынып оқушысы үшін бұл сабақта қажет дағдыны — бір тапсырмаға зейін қоюды жақсы жаттықтырады.</p><p>Шахмат пен оқудың байланысы бұрыннан зерттеліп келеді, ал зерттеушілердің қорытындылары сақ: пайда сабақ тұрақты және жаттықтырушымен өткенде айқынырақ байқалады. Шахмат ғажайып жасамайды, бірақ жүрер алдында ойлану әдетін қалыптастырады.</p><p>Оқушыларымыздың ата-аналары үш айдан кейін көбіне бірдей өзгерістерді байқайды: бала үй тапсырмасына ұзағырақ отырады, есепті жартылай тастап кетпейді және қателерге сабырлырақ қарайды — шахматта қате ұрысу үшін емес, талдау үшін керек.</p><p>Сабақтың құрылымы да көмектеседі: қысқа теория, содан кейін есептер, содан кейін талдауы бар ойын. Бала жоспарлауды үйренеді — «осылай жүрсем, қарсылас не істейді?» — және бұл сұрақты басқа істерге де көшіреді.</p><p>Нәтиже болуы үшін тұрақтылық маңызды: аптасына кемінде екі сабақ және үйде аздап жаттығу. Біздің тәжірибеміз бойынша аптасына бір сабақ аз — дағды бекіп үлгермейді.</p>',
   '2026-11-24T00:00:00Z'),
  ('first-tournament',
   'tournaments',
   'Асылхан Агбаевич, мастер ФИДЕ',
   'Assylkhan Agbaevich, FIDE Master',
   'Асылхан Агбаевич, ФИДЕ шебері',
   4,
   null,
   'published',
   false,
   3,
   'Первый турнир: как подготовить ребёнка',
   'First tournament: how to prepare your child',
   'Алғашқы турнир: баланы қалай дайындау керек',
   'Как пережить первое поражение и превратить его в мотивацию.',
   'How to get through the first loss and turn it into motivation.',
   'Алғашқы жеңілісті қалай еңсеріп, оны мотивацияға айналдыруға болады.',
   '<p>Первый турнир — большое событие и для ребёнка, и для родителей. В Chess Empire к турнирам допускают после первой ступени обучения и экзамена у тренера, так что к старту ребёнок уверенно знает правила.</p><p>Накануне важно не «натаскивать», а успокоить. Выспаться, позавтракать, взять воду и перекус между турами. Расскажите заранее, что будет происходить: несколько партий, шахматные часы, рукопожатие до и после игры.</p><p>Во время турнира родителям лучше держаться в стороне: подсказки запрещены правилами, а взгляд через плечо только добавляет волнения. Между турами спросите не «выиграл?», а «какая партия была самой интересной?».</p><p>Поражения будут — у всех. Помогите пережить первое: выслушайте, не разбирайте ошибки сразу, дайте остыть. Разбор оставьте тренеру — на следующем занятии он покажет, где был поворотный момент, и превратит проигрыш в понятный урок.</p><p>Турниры в наших филиалах проходят каждые выходные, и в абонемент входит до четырёх бесплатных турниров в месяц. Чем чаще ребёнок играет, тем быстрее турнир становится радостным событием, а не экзаменом.</p>',
   '<p>A first tournament is a big event for the child and the parents alike. At Chess Empire children join tournaments after the first stage of training and a test with their coach, so by the start they know the rules well.</p><p>The day before, the goal is to calm down, not to cram. Sleep well, have breakfast, pack water and a snack for between rounds. Explain in advance what will happen: several games, a chess clock, a handshake before and after each game.</p><p>During the tournament parents are better off staying in the background: hints are against the rules, and a look over the shoulder only adds to the nerves. Between rounds, don''t ask "did you win?" — ask "which game was the most interesting?"</p><p>Losses will happen — to everyone. Help your child through the first one: listen, don''t go over the mistakes right away, let them cool down. Leave the review to the coach — at the next class they will show where the turning point was and turn the loss into a clear lesson.</p><p>Tournaments run at our branches every weekend, and the membership includes up to four free tournaments a month. The more often a child plays, the sooner a tournament becomes a fun event rather than an exam.</p>',
   '<p>Алғашқы турнир бала үшін де, ата-ана үшін де үлкен оқиға. Chess Empire-де турнирге оқудың бірінші сатысынан және жаттықтырушы алдындағы емтиханнан кейін жіберіледі, сондықтан бала ережелерді жақсы біледі.</p><p>Турнир алдында «жаттатудың» емес, тыныштандырудың маңызы зор. Жақсылап ұйықтап, таңғы ас ішіп, турлар арасына су мен жеңіл тамақ алыңыз. Не болатынын алдын ала айтып беріңіз: бірнеше партия, шахмат сағаты, ойын алдында және кейін қол алысу.</p><p>Турнир кезінде ата-аналарға шетте тұрған дұрыс: ереже бойынша кеңес беруге болмайды, ал иық үстінен қарау толқуды ғана күшейтеді. Турлар арасында «жеңдің бе?» деп емес, «қай партия ең қызықты болды?» деп сұраңыз.</p><p>Жеңілістер болады — бәрінде де. Алғашқысын еңсеруге көмектесіңіз: тыңдаңыз, қателерді бірден талдамаңыз, сабасына түсуге уақыт беріңіз. Талдауды жаттықтырушыға қалдырыңыз — келесі сабақта ол шешуші сәтті көрсетіп, жеңілісті түсінікті сабаққа айналдырады.</p><p>Филиалдарымызда турнирлер әр демалыс сайын өтеді, ал абонементке айына төрт тегін турнирге дейін кіреді. Бала неғұрлым жиі ойнаса, турнир соғұрлым тез емтихан емес, қуанышты оқиғаға айналады.</p>',
   '2026-11-24T00:00:00Z'),
  ('fide-rating',
   'tournaments',
   'Василий Михайлович, мастер ФИДЕ',
   'Vasily Mikhaylovich, FIDE Master',
   'Василий Михайлович, ФИДЕ шебері',
   5,
   null,
   'published',
   false,
   4,
   'Рейтинг ФИДЕ: что это и зачем он ребёнку',
   'FIDE rating: what it is and why your child needs it',
   'ФИДЕ рейтингі: бұл не және балаға не үшін керек',
   'Простыми словами — от первой партии до международного рейтинга.',
   'In plain words — from the first game to an international rating.',
   'Қарапайым тілмен — алғашқы партиядан халықаралық рейтингке дейін.',
   '<p>Рейтинг ФИДЕ — это число, которое показывает силу игры шахматиста по системе Международной шахматной федерации. Он растёт после побед над сильными соперниками и снижается после поражений от более слабых.</p><p>Чтобы получить рейтинг, нужно сыграть определённое количество партий в турнирах, которые официально обсчитывает ФИДЕ, причём часть соперников уже должна иметь рейтинг. Правила время от времени меняются — актуальные условия подскажет тренер.</p><p>Зачем это ребёнку? Рейтинг — понятная цель и честное мерило прогресса. Он открывает дорогу на международные турниры и позволяет сравнивать себя не только с одноклассниками, но и с шахматистами по всему миру.</p><p>Торопиться при этом не нужно. Сначала ребёнок играет турниры клуба и городские соревнования, набирается опыта и учится спокойно относиться к результату. Рейтинговые турниры — следующий шаг, когда тренер видит, что ученик готов.</p><p>В Chess Empire путь ученика выстроен ступенями — от первых правил до международного рейтинга ФИДЕ. На каждой ступени тренер объясняет, что осталось освоить, и родители всегда понимают, где сейчас их ребёнок.</p>',
   '<p>A FIDE rating is a number that shows a player''s strength under the system of the International Chess Federation. It goes up after wins against stronger opponents and down after losses to weaker ones.</p><p>To get a rating, a player needs a certain number of games in tournaments officially rated by FIDE, and some of the opponents must already have a rating. The rules change from time to time, so the coach will tell you the current requirements.</p><p>Why does a child need it? A rating is a clear goal and an honest measure of progress. It opens the way to international tournaments and lets a child compare themselves not just with classmates but with players around the world.</p><p>There is no need to rush, though. First a child plays club tournaments and city events, gains experience and learns to take results calmly. Rated tournaments are the next step, once the coach sees the student is ready.</p><p>At Chess Empire the student path is built in stages — from the first rules to an international FIDE rating. At each stage the coach explains what is left to learn, so parents always know where their child stands.</p>',
   '<p>ФИДЕ рейтингі — Халықаралық шахмат федерациясының жүйесі бойынша шахматшының ойын күшін көрсететін сан. Ол күштірек қарсыластарды жеңгенде өседі, ал әлсіздеу қарсыластардан жеңілгенде төмендейді.</p><p>Рейтинг алу үшін ФИДЕ ресми есептейтін турнирлерде белгілі бір мөлшерде партия ойнау керек, әрі қарсыластардың бір бөлігінде рейтинг болуы тиіс. Ережелер мезгіл-мезгіл өзгеріп тұрады, сондықтан өзекті талаптарды жаттықтырушы айтады.</p><p>Бұл балаға не үшін керек? Рейтинг — түсінікті мақсат және прогрестің әділ өлшемі. Ол халықаралық турнирлерге жол ашады және өзін сыныптастарымен ғана емес, бүкіл әлемдегі шахматшылармен салыстыруға мүмкіндік береді.</p><p>Дегенмен асығудың қажеті жоқ. Алдымен бала клуб турнирлері мен қалалық жарыстарда ойнап, тәжірибе жинайды және нәтижеге сабырмен қарауды үйренеді. Рейтингтік турнирлер — жаттықтырушы оқушының дайын екенін көрген кездегі келесі қадам.</p><p>Chess Empire-де оқушы жолы сатылармен құрылған — алғашқы ережелерден халықаралық ФИДЕ рейтингіне дейін. Әр сатыда жаттықтырушы не меңгеру қалғанын түсіндіреді, сондықтан ата-аналар баласының қай деңгейде екенін әрқашан біледі.</p>',
   '2026-11-24T00:00:00Z'),
  ('home-practice',
   'beginners',
   'Александр Олегович, мастер ФИДЕ',
   'Aleksandr Olegovich, FIDE Master',
   'Александр Олегович, ФИДЕ шебері',
   7,
   '/home/assets/trainer-chingis.jpg',
   'published',
   false,
   5,
   'Как заниматься шахматами дома',
   'How to practise chess at home',
   'Үйде шахматпен қалай айналысуға болады',
   'Пятнадцать минут несколько раз в неделю — и урок закрепится, даже если вы сами не играете.',
   'Fifteen minutes a few times a week will make the lesson stick — even if you don''t play yourself.',
   'Аптасына бірнеше рет он бес минут — өзіңіз ойнамасаңыз да, сабақ бекиді.',
   '<p>Многие родители переживают: «Я сам не играю — как я помогу?» Хорошая новость: для домашней практики не нужно быть шахматистом. Ваша задача — помочь ребёнку понемногу и с удовольствием повторять пройденное.</p><p>Лучше всего работают короткие подходы: 15 минут три-четыре раза в неделю дают больше, чем час в воскресенье. Поставьте доску на видное место — к ней проще возвращаться.</p><p>Попросите ребёнка научить вас тому, что он узнал на уроке. Объясняя, как ходит конь или что такое шах, он сам закрепляет материал, а вы получаете повод провести время вместе.</p><p>Используйте задания тренера: задачи «мат в один ход», игры на части доски, например только пешками. Если что-то не получается, не подсказывайте сразу — спросите: «А какие у тебя есть ходы?»</p><p>И не превращайте практику в контроль. Хвалите за старание и интересные идеи, а не только за правильный ответ. Если ребёнок устал — закончите на хорошей ноте и вернитесь к доске завтра.</p>',
   '<p>Many parents worry: "I don''t play — how can I help?" The good news: you don''t need to be a chess player to support practice at home. Your job is to help your child go over what they learned, a little at a time and with pleasure.</p><p>Short sessions work best: 15 minutes three or four times a week does more than an hour on Sunday. Keep the board somewhere visible — it''s easier to come back to.</p><p>Ask your child to teach you what they learned in class. Explaining how the knight moves or what check is helps them remember it, and gives you a reason to spend time together.</p><p>Use the coach''s homework: mate-in-one puzzles, games on part of the board, for example with pawns only. If something doesn''t work, don''t give the answer straight away — ask: "What moves do you have?"</p><p>And don''t turn practice into a check-up. Praise effort and interesting ideas, not just the right answer. If your child is tired, finish on a good note and come back to the board tomorrow.</p>',
   '<p>Көп ата-ана уайымдайды: «Мен өзім ойнамаймын — қалай көмектесемін?» Жақсы жаңалық: үйдегі жаттығу үшін шахматшы болу міндетті емес. Сіздің міндетіңіз — балаға өткенді аздап әрі қызығып қайталауға көмектесу.</p><p>Қысқа жаттығулар жақсы нәтиже береді: аптасына үш-төрт рет 15 минут жексенбідегі бір сағаттан көбірек пайда береді. Тақтаны көзге түсетін жерге қойыңыз — оған қайта оралу оңайырақ.</p><p>Баладан сабақта не үйренгенін сізге үйретуін сұраңыз. Ат қалай жүретінін немесе шах деген не екенін түсіндіре отырып, ол материалды өзі бекітеді, ал сіз бірге уақыт өткізуге себеп табасыз.</p><p>Жаттықтырушының тапсырмаларын пайдаланыңыз: «бір жүрісте мат» есептері, тақтаның бір бөлігіндегі ойындар, мысалы, тек пешкалармен. Бірдеңе шықпаса, бірден айтып жібермеңіз — «Сенде қандай жүрістер бар?» деп сұраңыз.</p><p>Жаттығуды бақылауға айналдырмаңыз. Тек дұрыс жауап үшін емес, талпыныс пен қызықты идеялар үшін де мақтаңыз. Бала шаршаса — жақсы сәтте аяқтап, тақтаға ертең оралыңыз.</p>',
   '2026-11-24T00:00:00Z'),
  ('chess-vs-gadgets',
   'beginners',
   'Чингис Нургалимов, основатель',
   'Chingis Nurgalimov, founder',
   'Чингис Нургалимов, негізін қалаушы',
   5,
   null,
   'published',
   false,
   6,
   'Шахматы вместо гаджетов: как увлечь ребёнка',
   'Chess instead of gadgets: how to get your child hooked',
   'Гаджеттің орнына шахмат: баланы қалай қызықтыруға болады',
   'Не запрет, а живая игра, маленькие цели и друзья по клубу.',
   'Not a ban, but real games, small goals and friends at the club.',
   'Тыйым емес — шынайы ойын, кішкентай мақсаттар және клубтағы достар.',
   '<p>Отобрать планшет и поставить вместо него доску — не самый удачный план. Шахматы выигрывают у гаджетов не запретом, а тем, что дают ребёнку живое общение, азарт и ощущение, что он становится сильнее.</p><p>Начните с совместной игры. Детям важно внимание взрослого: партия с папой или старшим братом ценится больше, чем мультфильм. Пусть сначала правила будут упрощёнными — главное, чтобы было весело.</p><p>Хорошо работают маленькие цели: решить три задачи за вечер, выиграть у бабушки, перейти на новую ступень в клубе. Ребёнок видит свой прогресс — и экран перестаёт быть единственным источником радости.</p><p>Важна и компания сверстников. В группе ребёнок находит друзей с тем же увлечением, а турниры по выходным становятся событием, которого ждут всю неделю.</p><p>Если ребёнок всё же тянется к экрану, это тоже можно использовать: шахматные задачи в приложении в меру — нормальная часть занятий. Договоритесь о правиле: сначала партия на настоящей доске, потом экран.</p>',
   '<p>Taking away the tablet and putting a board in its place is not the best plan. Chess beats gadgets not through bans but by giving a child real company, excitement and the feeling of getting stronger.</p><p>Start by playing together. Children value an adult''s attention: a game with dad or an older brother means more than a cartoon. Let the rules be simplified at first — what matters is that it''s fun.</p><p>Small goals work well: solve three puzzles in an evening, beat grandma, move up a stage at the club. The child sees their own progress, and the screen stops being the only source of fun.</p><p>Friends their own age matter too. In a group a child finds friends with the same hobby, and weekend tournaments become an event they look forward to all week.</p><p>If your child still reaches for a screen, you can use that as well: chess puzzles in an app, in moderation, are a normal part of learning. Agree on a rule: first a game on a real board, then the screen.</p>',
   '<p>Планшетті алып, орнына тақта қою — ең сәтті жоспар емес. Шахмат гаджеттерден тыйым арқылы емес, балаға шынайы қарым-қатынас, қызығушылық және күшейіп келе жатқанын сезіну арқылы ұтады.</p><p>Бірге ойнаудан бастаңыз. Балаларға ересектің назары маңызды: әкесімен немесе ағасымен ойнаған партия мультфильмнен қымбат. Алғашында ережелер жеңілдетілген болсын — ең бастысы, көңілді болсын.</p><p>Кішкентай мақсаттар жақсы жұмыс істейді: кешке үш есеп шығару, әжесін ұту, клубта жаңа сатыға көтерілу. Бала өз прогресін көреді — және экран қуаныштың жалғыз көзі болудан қалады.</p><p>Құрдастарының ортасы да маңызды. Топта бала қызығушылығы ортақ достар табады, ал демалыс күнгі турнирлер апта бойы күтетін оқиғаға айналады.</p><p>Егер бала бәрібір экранға тартылса, мұны да пайдалануға болады: қосымшадағы шахмат есептері шамалы мөлшерде — сабақтың қалыпты бөлігі. Ереже туралы келісіңіз: алдымен нағыз тақтада партия, содан кейін экран.</p>',
   '2026-11-24T00:00:00Z')
on conflict (slug) do nothing;
