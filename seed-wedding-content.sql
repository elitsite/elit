-- ================================================================
-- Elite Bloemen — Default Wedding Page Content
-- Run this in your Supabase SQL editor to populate the weddings
-- landing page with default Dutch/English content.
-- All fields can be overridden from the admin panel afterwards.
-- ================================================================

INSERT INTO public.event_pages (slug, content)
VALUES (
  'weddings',
  jsonb_build_object(
    -- Hero
    'hero_image',    '',
    'hero_kicker',   jsonb_build_object('nl','A touch of magic','en','A touch of magic','uk','Магічний дотик'),
    'hero_title',    jsonb_build_object('nl','elegant & luxury weddings','en','elegant & luxury weddings','uk','елегантні та розкішні весілля'),
    'hero_subtitle', jsonb_build_object(
        'nl','Met een magische touch maken we van elke high-end bruiloft een unieke ervaring.',
        'en','With a magical touch we make every high-end wedding a unique experience.',
        'uk','З магічним дотиком ми перетворюємо кожне весілля на неповторну подію.'),
    'hero_button',   jsonb_build_object('nl','Onze betoverende huwelijken','en','Our enchanting weddings','uk','Наші весілля'),

    -- What to expect
    'intro_kicker',    jsonb_build_object('nl','What to expect','en','What to expect','uk','Чого очікувати'),
    'intro_title',     jsonb_build_object('nl','Complete planning & design','en','Complete planning & design','uk','Повне планування та дизайн'),
    'intro_text',      jsonb_build_object(
        'nl','Een high-end bruiloft geeft een schatkamer aan herinneringen. Met luxe styling, een gedetailleerde planning en een betrokken team organiseren we jullie bruiloft met een gouden randje. Van begin tot eind.'||chr(10)||chr(10)||'Een feest der herkenning voor jullie gasten: de styling, de uitnodigingen, de sfeer en het entertainment ademen wie jullie zijn als bruidspaar. Samen creëren we een unieke bruiloft. Dat begint bij het kiezen van de locatie en het uitzetten van de grote lijnen. Wij maken uitgebreide stylingconcepten, 3D- en schetstekeningen. Vervolgens zoeken wij naar de beste leveranciers van over de hele wereld, die onze ideeën tot in de puntjes waarmaken.',
        'en','A high-end wedding creates a treasure trove of memories. With luxury styling, detailed planning and a dedicated team we organise your wedding with a golden edge. From beginning to end.',
        'uk','Розкішне весілля — це скарбниця спогадів. Із розкішним стайлінгом, детальним плануванням та відданою командою ми організуємо ваше весілля з золотим відтінком.'),
    'intro_text_col2', jsonb_build_object(
        'nl','Ruim voor de grote dag begint, is het hele team op de hoogte van de laatste details. Een exclusieve bruiloft vraagt om een goede samenwerking. Daarom vormen wij één team met alle leveranciers, met een vast aanspreekpunt voor het bruidspaar. Van de jongste gast tot de oudste generatie: op jullie bruiloft beleeft iedereen een ervaring om nooit te vergeten.',
        'en','Well before the big day, the entire team is up to date on the latest details. An exclusive wedding requires good collaboration. That is why we form one team with all suppliers, with a single point of contact for the couple.',
        'uk','Задовго до великого дня вся команда знає останні деталі. Ексклюзивне весілля вимагає доброї співпраці.'),
    'intro_button',    jsonb_build_object('nl','Bekijk ons portfolio','en','View our portfolio','uk','Переглянути портфоліо'),
    'intro_image',     '',

    -- Full service
    'full_service_image',          '',
    'full_service_title',          jsonb_build_object('nl','Full service','en','Full service','uk','Повний сервіс'),
    'full_service_text',           jsonb_build_object(
        'nl','Het organiseren van een bruiloft gaat verder dan concept, design en planning. Ook op het moment suprême nemen we jullie alles uit handen. We ontvangen de gasten in een perfect gestylede ruimte: aan elk detail is gedacht. En als iedereen het feest met een glimlach verlaat, laten wij de locatie netjes achter.',
        'en','Organising a wedding goes further than concept, design and planning. On the big day itself we take everything off your hands. We welcome guests in a perfectly styled space where every detail has been considered.',
        'uk','Організація весілля виходить за рамки концепції, дизайну та планування.'),
    'full_service_included_label', jsonb_build_object('nl','Included','en','Included','uk','Включено'),
    'full_service_included',       jsonb_build_object(
        'nl','+ Locatiemanagement'||chr(10)||'+ Totaalconcept in 3D-ontwerp'||chr(10)||'+ Design, styling & wedding stationery'||chr(10)||'+ Catering & entertainment'||chr(10)||'+ Technische productie, security & staff'||chr(10)||'+ Gastenmanagement'||chr(10)||'+ Foto- en videografie',
        'en','+ Location management'||chr(10)||'+ Total concept in 3D design'||chr(10)||'+ Design, styling & wedding stationery'||chr(10)||'+ Catering & entertainment'||chr(10)||'+ Technical production, security & staff'||chr(10)||'+ Guest management'||chr(10)||'+ Photo & videography',
        'uk','+ Управління локацією'||chr(10)||'+ Повна концепція в 3D'||chr(10)||'+ Дизайн, стайлінг та весільна поліграфія'||chr(10)||'+ Кейтеринг та розваги'||chr(10)||'+ Технічне виробництво, охорона та персонал'||chr(10)||'+ Управління гостями'||chr(10)||'+ Фото та відеографія'),

    -- Other services
    'other_services_kicker', jsonb_build_object('nl','Other services','en','Other services','uk','Інші послуги'),
    'other_services_image',  '',
    'service1_title',  jsonb_build_object('nl','Destination Weddings','en','Destination Weddings','uk','Весілля за кордоном'),
    'service1_text',   jsonb_build_object(
        'nl','Van Italië tot Curaçao en van Frankrijk tot Zuid-Afrika: high-end bruiloften organiseren we over de hele wereld. We plannen de volledige bruiloft: van leveranciers die het beste bij jullie wensen passen tot het vervoer van de gasten.',
        'en','From Italy to Curaçao and from France to South Africa: we organise high-end weddings all over the world.',
        'uk','Від Італії до Кюрасао та від Франції до Південної Африки: ми організовуємо весілля по всьому світу.'),
    'service1_italic', jsonb_build_object('nl','Wij zijn benieuwd naar jullie ideale trouwlocatie.','en','We are curious about your ideal wedding location.','uk','Нам цікаво дізнатися про вашу ідеальну локацію.'),
    'service1_cta',    jsonb_build_object('nl','Laat het ons weten','en','Let us know','uk','Повідомте нас'),
    'service2_title',  jsonb_build_object('nl','Private Events','en','Private Events','uk','Приватні заходи'),
    'service2_text',   jsonb_build_object(
        'nl','Het leven is er om te vieren. Daarom organiseren we ook voor andere gelegenheden exclusieve events. Denk aan een gouden bruiloft, het feest van Sara of Abraham, een 21-diner of een genderrevealparty.',
        'en','Life is meant to be celebrated. That is why we also organise exclusive events for other occasions.',
        'uk','Життя створене для святкування. Тому ми також організовуємо ексклюзивні заходи для інших нагод.'),
    'service2_italic', jsonb_build_object('nl','Schakel ons in voor een stijlvolle totaalbeleving.','en','Engage us for a stylish total experience.','uk','Залучіть нас для стильного тотального досвіду.'),
    'service2_cta',    jsonb_build_object('nl','Neem contact op','en','Contact us','uk','Зв''яжіться з нами'),

    -- Final choices
    'final_choices_title', jsonb_build_object('nl','Final choices','en','Final choices','uk','Фінальний вибір'),
    'final_choices_text',  jsonb_build_object(
        'nl','Tijdens het hele proces houden jullie de eindregie. Wij maken de financiële stand van zaken voor jullie inzichtelijk; contracten tekenen jullie zelf. Verder kunnen jullie de recente documenten altijd inzien. Denk aan checklists, budgetbewaking en gastenlijsten. De planning van een huwelijk is maatwerk. Aan de hand van jullie persoonlijke verhaal ontwerpen en plannen we jullie exclusieve bruiloft. Daarom werken we met een startbudget vanaf € 80.000,-.',
        'en','Throughout the entire process you retain final control. We make the financial situation transparent for you; contracts are signed by you.',
        'uk','Протягом усього процесу ви зберігаєте кінцевий контроль.'),
    'final_choices_link',  jsonb_build_object('nl','Zo verloopt het proces','en','How the process works','uk','Як відбувається процес'),

    -- Quote / Love letters
    'quote_image',  '',
    'quote_kicker', jsonb_build_object('nl','Love letters','en','Love letters','uk','Листи кохання'),
    'quote_text',   jsonb_build_object(
        'nl','Our answer to the brides wishes: a fairytale garden wedding in a monumental building in the middle of Amsterdam.',
        'en','Our answer to the brides wishes: a fairytale garden wedding in a monumental building in the middle of Amsterdam.',
        'uk','Наша відповідь на побажання нареченої: казкове весілля в саду в монументальній будівлі в центрі Амстердама.'),
    'quote_author', jsonb_build_object('nl','Bettina & Guillermo','en','Bettina & Guillermo','uk','Bettina & Guillermo'),

    -- Portfolio
    'portfolio_kicker',       jsonb_build_object('nl','Bekijk ons portfolio','en','View our portfolio','uk','Переглянути портфоліо'),
    'portfolio_title',        jsonb_build_object('nl','Portfolio','en','Portfolio','uk','Портфоліо'),
    'portfolio_sidebar_text', jsonb_build_object(
        'nl','Onze designs kwamen tot leven bij tientallen intieme bruiloften.',
        'en','Our designs came to life at dozens of intimate weddings.',
        'uk','Наші дизайни ожили на десятках інтимних весіль.'),
    'portfolio', '[]'::jsonb,

    -- Bloom with us
    'bloom_image',  '',
    'bloom_kicker', jsonb_build_object('nl','Let''s plan together','en','Let''s plan together','uk','Плануємо разом'),
    'bloom_title',  jsonb_build_object('nl','BLOOM WITH US','en','BLOOM WITH US','uk','РОЗКВІТНИ З НАМИ'),
    'bloom_text',   jsonb_build_object(
        'nl','Een droombruiloft ontstaat wanneer alles samenkomt: jullie verhaal en onze expertise. Daarom werken we het liefst samen met jullie als bruidspaar. Op professionele, persoonlijke en exclusieve wijze organiseren we de high-end wedding die bij jullie past. Samen gaan we voor het hoogst haalbare.',
        'en','A dream wedding comes together when everything aligns: your story and our expertise. In a professional, personal and exclusive way we organise the high-end wedding that suits you.',
        'uk','Весілля мрії виникає, коли все поєднується: ваша історія та наша експертиза.'),
    'bloom_button', jsonb_build_object('nl','Ontdek onze werkwijze','en','Discover our approach','uk','Дізнатися більше'),

    -- CTA
    'cta_title',  jsonb_build_object('nl','Let''s create magic together','en','Let''s create magic together','uk','Створимо магію разом'),
    'cta_text',   jsonb_build_object(
        'nl','Samen maken we van jullie wensen en dromen liefdevolle herinneringen. Neem vrijblijvend contact op en ontdek wat we voor jullie kunnen betekenen.',
        'en','Together we turn your wishes and dreams into loving memories. Contact us without obligation and discover what we can do for you.',
        'uk','Разом ми перетворимо ваші мрії на незабутні спогади.'),
    'cta_button', jsonb_build_object('nl','Neem contact op','en','Contact us','uk','Зв''яжіться з нами'),

    -- Process steps
    'process_steps', jsonb_build_array(
        jsonb_build_object(
            'title', jsonb_build_object('nl','Consultation','en','Consultation','uk','Консультація'),
            'text',  jsonb_build_object(
                'nl','Het bruidspaar vormt de basis van een unieke bruiloft. Daarom ontdekken we in dit gesprek jullie persoonlijke wensen en brainstormen we over de styling en het entertainment.',
                'en','The couple forms the basis of a unique wedding. In this conversation we discover your personal wishes and brainstorm about styling and entertainment.',
                'uk','Пара є основою унікального весілля. У цій розмові ми дізнаємося ваші особисті побажання.')),
        jsonb_build_object(
            'title', jsonb_build_object('nl','Design & planning','en','Design & planning','uk','Дизайн та планування'),
            'text',  jsonb_build_object(
                'nl','Wij maken een exclusief design, tot in detail in jullie stijl gegoten. Daarbij kiezen we de beste leveranciers en starten we met het plannen van jullie event.',
                'en','We create an exclusive design, cast in detail in your style. We choose the best suppliers and start planning your event.',
                'uk','Ми створюємо ексклюзивний дизайн у вашому стилі та обираємо найкращих постачальників.')),
        jsonb_build_object(
            'title', jsonb_build_object('nl','Let''s create magic','en','Let''s create magic','uk','Створимо магію'),
            'text',  jsonb_build_object(
                'nl','Elke partij ontvangt een persoonlijk draaiboek, alles staat klaar en we verwelkomen de gasten. Geen vraag is te gek, we helpen iedereen. Jullie creëren intussen de mooiste herinneringen.',
                'en','Every party receives a personal script, everything is ready and we welcome the guests. No question is too much. Meanwhile you create the most beautiful memories.',
                'uk','Кожен отримує особистий сценарій, все готово і ми вітаємо гостей.'))),

    -- Gallery (Instagram strip) - empty until admin adds
    'gallery',    '[]'::jsonb,
    'media_image','',
    'sections',   '[]'::jsonb,
    'packages_kicker', jsonb_build_object('nl','','en','','uk',''),
    'packages_title',  jsonb_build_object('nl','','en','','uk',''),
    'packages',        '[]'::jsonb,
    'decor_kicker',    jsonb_build_object('nl','','en','','uk',''),
    'decor_title',     jsonb_build_object('nl','','en','','uk',''),
    'decor',           '[]'::jsonb,
    'form_title',      jsonb_build_object('nl','Plan een afspraak','en','Book an appointment','uk','Записатися на зустріч')
  )
)
ON CONFLICT (slug) DO UPDATE
  SET content    = EXCLUDED.content,
      updated_at = now();
