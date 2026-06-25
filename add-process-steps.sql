-- ============================================================
-- FULL CONTENT SEED for event_pages (weddings & parties)
-- Replaces entire content JSON with complete data
-- Run this in Supabase SQL Editor
-- ============================================================

-- ═══════════════════════════════════════════
-- WEDDINGS — full content
-- ═══════════════════════════════════════════
INSERT INTO event_pages (slug, content) VALUES ('weddings', '{
  "hero_image": "",
  "hero_title": {
    "en": "Your Dream Wedding",
    "uk": "Весілля вашої мрії",
    "nl": "Jullie droombruiloft"
  },
  "hero_subtitle": {
    "en": "Luxury floral design for the most important day of your life",
    "uk": "Розкішний квітковий дизайн для найважливішого дня вашого життя",
    "nl": "Luxe bloemdesign voor de belangrijkste dag van jullie leven"
  },
  "intro_kicker": {
    "en": "Elite Bloemen Weddings",
    "uk": "Elite Bloemen Весілля",
    "nl": "Elite Bloemen Bruiloften"
  },
  "intro_title": {
    "en": "Flowers that tell your love story",
    "uk": "Квіти, що розповідають вашу історію кохання",
    "nl": "Bloemen die jullie liefdesverhaal vertellen"
  },
  "intro_text": {
    "en": "Every wedding is unique, and so should be the flowers. We work closely with each couple to create bespoke floral arrangements that reflect their personal style — from romantic garden arches to minimalist boutonnieres. Our team handles everything from the bridal bouquet to the last table centerpiece, ensuring every petal is perfect.",
    "uk": "Кожне весілля унікальне, і таким мають бути квіти. Ми тісно співпрацюємо з кожною парою, створюючи індивідуальні квіткові композиції, що відображають їхній стиль — від романтичних садових арок до мінімалістичних бутоньєрок. Наша команда займається всім: від букета нареченої до останньої композиції на столі.",
    "nl": "Elke bruiloft is uniek, en dat moeten de bloemen ook zijn. We werken nauw samen met elk stel om op maat gemaakte bloemstukken te creëren die hun persoonlijke stijl weerspiegelen — van romantische tuinbogen tot minimalistische corsages. Ons team regelt alles, van het bruidsboeket tot het laatste tafelmiddenstuk."
  },
  "intro_button": {
    "en": "Get in Touch",
    "uk": "Зв''яжіться з нами",
    "nl": "Neem contact op"
  },
  "media_image": "",
  "sections": [
    {
      "image": "",
      "title": {
        "en": "Bridal Bouquets",
        "uk": "Букети нареченої",
        "nl": "Bruidsboeketten"
      },
      "text": {
        "en": "Your bouquet is the centerpiece of your bridal look. We design each one from scratch, selecting the finest seasonal blooms and pairing them with lush greenery or delicate ribbons. Whether you envision a cascading garden bouquet or a tight peony arrangement, we bring your vision to life.",
        "uk": "Ваш букет — центральний елемент образу нареченої. Ми створюємо кожен з нуля, обираючи найкращі сезонні квіти та поєднуючи їх з пишною зеленню або ніжними стрічками. Чи мрієте ви про каскадний садовий букет чи компактну композицію з піоній — ми втілимо вашу мрію.",
        "nl": "Je boeket is het middelpunt van je bruidslook. We ontwerpen elk boeket vanaf nul, selecteren de mooiste seizoensbloemen en combineren ze met weelderig groen of delicate linten. Of je nu droomt van een cascadeboeket of een strak pioenrozen-arrangement — wij brengen je visie tot leven."
      }
    },
    {
      "image": "",
      "title": {
        "en": "Ceremony Decoration",
        "uk": "Декор церемонії",
        "nl": "Ceremoniedecoratie"
      },
      "text": {
        "en": "Transform your ceremony space into a floral wonderland. From grand arches and altar arrangements to aisle runners adorned with petals, we create breathtaking settings that set the mood for your vows. Every element is carefully designed to complement your venue and theme.",
        "uk": "Перетворіть простір вашої церемонії на квіткову казку. Від величних арок та алтарних композицій до доріжок, прикрашених пелюстками — ми створюємо захоплюючі декорації, що задають настрій вашим клятвам. Кожен елемент ретельно продуманий.",
        "nl": "Verander je ceremonieruimte in een bloemenparadijs. Van grootse bogen en altaarstukken tot gangpaddecoraties met bloemblaadjes — we creëren adembenemende settings die de toon zetten voor jullie geloften. Elk element is zorgvuldig ontworpen."
      }
    },
    {
      "image": "",
      "title": {
        "en": "Reception & Table Design",
        "uk": "Дизайн прийому та столів",
        "nl": "Receptie & Tafeldesign"
      },
      "text": {
        "en": "The reception is where the magic continues. Our team creates stunning tablescapes with custom centerpieces, garlands, and floral installations that wow your guests. From intimate dinners to grand ballroom affairs, we tailor every detail to your celebration.",
        "uk": "Прийом — це місце, де магія продовжується. Наша команда створює приголомшливі столові композиції з індивідуальними центральними елементами, гірляндами та квітковими інсталяціями, що вражають гостей. Від камерних вечерь до грандіозних банкетів.",
        "nl": "De receptie is waar de magie doorgaat. Ons team creëert prachtige tafellandschappen met op maat gemaakte middenstukken, slingers en bloemeninstallaties die jullie gasten verrassen. Van intieme diners tot grote balzaalavonden."
      }
    }
  ],
  "quote_image": "",
  "quote_kicker": {
    "en": "What Our Couples Say",
    "uk": "Що кажуть наші пари",
    "nl": "Wat onze stellen zeggen"
  },
  "quote_text": {
    "en": "The flowers were beyond anything we imagined. Every arrangement was a work of art, and the arch took our breath away. Elite Bloemen made our wedding absolutely magical.",
    "uk": "Квіти перевершили все, що ми могли уявити. Кожна композиція була витвором мистецтва, а арка просто захоплювала подих. Elite Bloemen зробили наше весілля по-справжньому чарівним.",
    "nl": "De bloemen overtroffen alles wat we ons hadden voorgesteld. Elk arrangement was een kunstwerk en de boog nam onze adem weg. Elite Bloemen maakte onze bruiloft absoluut magisch."
  },
  "quote_author": {
    "en": "Sophie & Thomas",
    "uk": "Софі та Томас",
    "nl": "Sophie & Thomas"
  },
  "process_steps": [
    {
      "title": {"en": "Consultation", "uk": "Консультація", "nl": "Consultatie"},
      "text": {"en": "The bride and groom are the foundation of a unique wedding. We discuss your personal wishes and brainstorm about styling and entertainment.", "uk": "Наречені — основа унікального весілля. Ми обговорюємо ваші побажання та проводимо брейнсторм щодо стилістики та розваг.", "nl": "Het bruidspaar vormt de basis van een unieke bruiloft. Daarom ontdekken we in dit gesprek jullie persoonlijke wensen en brainstormen we over de styling en het entertainment."}
    },
    {
      "title": {"en": "Design & Planning", "uk": "Дизайн і планування", "nl": "Design & Planning"},
      "text": {"en": "We create an exclusive design, tailored to your style in every detail. We select the best vendors and start planning your event.", "uk": "Ми створюємо ексклюзивний дизайн, адаптований до вашого стилю. Обираємо найкращих постачальників та починаємо планування.", "nl": "Wij maken een exclusief design, tot in detail in jullie stijl gegoten. Daarbij kiezen we de beste leveranciers en starten we met het plannen van jullie event."}
    },
    {
      "title": {"en": "Let''s Create Magic", "uk": "Створимо магію", "nl": "Laten we magie creëren"},
      "text": {"en": "Every wedding receives a personal playbook. Everything is ready and we welcome the guests. No question is too crazy — we create the most beautiful memories.", "uk": "Кожне весілля отримує особистий сценарій. Все готово, і ми зустрічаємо гостей. Ми допомагаємо створити найкращі спогади.", "nl": "Elke bruiloft ontvangt een persoonlijk draaiboek. Alles staat klaar en we verwelkomen de gasten. Geen vraag is te gek, we helpen de mooiste herinneringen te creëren."}
    }
  ],
  "portfolio_kicker": {"en": "Our Experience", "uk": "Наш досвід", "nl": "Onze ervaring"},
  "portfolio_title": {"en": "Portfolio", "uk": "Портфоліо", "nl": "Portfolio"},
  "portfolio": [],
  "packages_kicker": {"en": "What We Offer", "uk": "Що ми пропонуємо", "nl": "Wat wij bieden"},
  "packages_title": {"en": "Wedding Packages", "uk": "Весільні пакети", "nl": "Trouwpakketten"},
  "packages": [],
  "decor_kicker": {"en": "Our Style", "uk": "Наш стиль", "nl": "Onze stijl"},
  "decor_title": {"en": "Decoration Gallery", "uk": "Галерея декору", "nl": "Decoratie galerij"},
  "decor": [],
  "gallery": [],
  "form_title": {
    "en": "Plan Your Dream Wedding",
    "uk": "Заплануйте весілля мрії",
    "nl": "Plan jullie droombruiloft"
  }
}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content;


-- ═══════════════════════════════════════════
-- PARTIES — full content
-- ═══════════════════════════════════════════
INSERT INTO event_pages (slug, content) VALUES ('parties', '{
  "hero_image": "",
  "hero_title": {
    "en": "Unforgettable Events",
    "uk": "Незабутні заходи",
    "nl": "Onvergetelijke evenementen"
  },
  "hero_subtitle": {
    "en": "From luxury floral installations to full event design — we make it extraordinary",
    "uk": "Від розкішних квіткових інсталяцій до повного дизайну заходу — ми робимо це екстраординарним",
    "nl": "Van luxe bloemeninstallaties tot volledig eventdesign — wij maken het buitengewoon"
  },
  "intro_kicker": {
    "en": "Elite Bloemen Events",
    "uk": "Elite Bloemen Заходи",
    "nl": "Elite Bloemen Evenementen"
  },
  "intro_title": {
    "en": "Create moments that last forever",
    "uk": "Створюйте моменти, що залишаються назавжди",
    "nl": "Creëer momenten die voor altijd blijven"
  },
  "intro_text": {
    "en": "Whether it''s a milestone birthday, an anniversary celebration, a corporate gala, or an intimate gathering — we transform every occasion into a breathtaking experience. Our team of designers and florists craft bespoke concepts with luxury flowers, stunning decor, and meticulous attention to detail. From concept to execution, we handle everything so you can focus on enjoying the moment.",
    "uk": "Чи це ювілей, річниця, корпоративний гала-вечір або камерна зустріч — ми перетворюємо кожну подію на захоплюючий досвід. Наша команда дизайнерів і флористів створює індивідуальні концепції з розкішними квітами, вражаючим декором та ретельною увагою до деталей. Від концепції до втілення — ми беремо все на себе.",
    "nl": "Of het nu een jubileum, een bedrijfsgala of een intiem feest is — wij transformeren elke gelegenheid tot een adembenemende ervaring. Ons team van designers en bloemisten creëert op maat gemaakte concepten met luxe bloemen, prachtig decor en oog voor detail. Van concept tot uitvoering regelen wij alles."
  },
  "intro_button": {
    "en": "Plan Your Event",
    "uk": "Заплануйте захід",
    "nl": "Plan uw evenement"
  },
  "media_image": "",
  "sections": [
    {
      "image": "",
      "title": {
        "en": "Birthday Celebrations",
        "uk": "Святкування днів народження",
        "nl": "Verjaardagsfeesten"
      },
      "text": {
        "en": "Every birthday deserves to be celebrated in style. We design everything from intimate garden parties with lush floral garlands to grand ballroom events with towering flower installations. Our team creates an atmosphere that perfectly matches the personality of the guest of honor.",
        "uk": "Кожен день народження заслуговує на святкування зі стилем. Ми оформлюємо все — від камерних садових вечірок з пишними квітковими гірляндами до грандіозних банкетів з високими квітковими інсталяціями. Наша команда створює атмосферу, що ідеально відповідає характеру іменинника.",
        "nl": "Elke verjaardag verdient een stijlvolle viering. We ontwerpen alles van intieme tuinfeesten met weelderige bloemslingers tot grootse evenementen met torenhoge bloemeninstallaties. Ons team creëert een sfeer die perfect past bij de persoonlijkheid van de jarige."
      }
    },
    {
      "image": "",
      "title": {
        "en": "Corporate Events",
        "uk": "Корпоративні заходи",
        "nl": "Zakelijke evenementen"
      },
      "text": {
        "en": "Elevate your corporate events with sophisticated floral design. From product launches and award ceremonies to annual galas, we create elegant atmospheres that align with your brand identity. Our designs make a lasting impression on clients and partners.",
        "uk": "Підніміть рівень ваших корпоративних заходів завдяки витонченому квітковому дизайну. Від презентацій продуктів і нагороджень до щорічних гала-вечорів — ми створюємо елегантну атмосферу, що відповідає ідентичності вашого бренду.",
        "nl": "Til uw bedrijfsevenementen naar een hoger niveau met verfijnd bloemdesign. Van productlanceringen en prijsuitreikingen tot jaarlijkse galavonden — we creëren elegante sferen die aansluiten bij uw merkidentiteit."
      }
    },
    {
      "image": "",
      "title": {
        "en": "Private Celebrations",
        "uk": "Приватні святкування",
        "nl": "Privéfeesten"
      },
      "text": {
        "en": "Anniversaries, baby showers, engagement parties — every milestone matters. We design intimate yet luxurious settings with carefully curated floral palettes, candle arrangements, and decorative elements that make your private celebration truly special.",
        "uk": "Річниці, baby shower, вечірки на честь заручин — кожна подія важлива. Ми створюємо камерні, але розкішні декорації з ретельно підібраною квітковою палітрою, свічками та декоративними елементами, що роблять ваше святкування по-справжньому особливим.",
        "nl": "Jubilea, babyshowers, verlovingsfeestjes — elke mijlpaal telt. We ontwerpen intieme maar luxueuze settings met zorgvuldig samengestelde bloemenpaletten, kaarsenarrangementen en decoratieve elementen die uw privéfeest echt bijzonder maken."
      }
    }
  ],
  "quote_image": "",
  "quote_kicker": {
    "en": "Client Feedback",
    "uk": "Відгуки клієнтів",
    "nl": "Klantfeedback"
  },
  "quote_text": {
    "en": "Elite Bloemen transformed our anniversary into a magical evening. The flower arrangements were breathtaking, and every detail was perfect. Our guests are still talking about it!",
    "uk": "Elite Bloemen перетворили нашу річницю на чарівний вечір. Квіткові композиції були захоплюючими, і кожна деталь була досконалою. Наші гості досі згадують це!",
    "nl": "Elite Bloemen transformeerde ons jubileum in een magische avond. De bloemstukken waren adembenemend en elk detail was perfect. Onze gasten hebben het er nog steeds over!"
  },
  "quote_author": {
    "en": "Anna & Michael",
    "uk": "Анна та Михайло",
    "nl": "Anna & Michael"
  },
  "process_steps": [
    {
      "title": {"en": "Brainstorm", "uk": "Брейнсторм", "nl": "Brainstorm"},
      "text": {"en": "We get to know you better to determine which elements make your event perfect for the guest of honor. After the brainstorm we present a total concept where everything comes together.", "uk": "Ми краще знайомимось з вами, щоб визначити ідеальні елементи вашого заходу. Після брейнсторму представляємо загальну концепцію, де все складається воєдино.", "nl": "We leren jullie beter kennen voor welke elementen past dit event perfect bij de feestvierder. Na de brainstorm presenteren wij een totaalconcept waarin alles samenkomt."}
    },
    {
      "title": {"en": "Design & Planning", "uk": "Дизайн і планування", "nl": "Design & Planning"},
      "text": {"en": "From decoration and luxury flowers to catering and entertainment — together with professional vendors we bring the concept to life. Down to the smallest details we plan your event.", "uk": "Від декору та розкішних квітів до кейтерингу та розваг — разом з професійними постачальниками втілюємо концепцію в життя. До найменших деталей плануємо ваш захід.", "nl": "Van aankleding en luxe bloemen tot catering en entertainment — samen met professionele leveranciers brengen we het concept tot leven. Tot in de kleinste details plannen we jullie event."}
    },
    {
      "title": {"en": "Showtime", "uk": "Шоу починається", "nl": "Showtime"},
      "text": {"en": "With a personal design book for each party, everyone is ready for a unique event. We coordinate vendors and staff so you and the guests can enjoy every moment.", "uk": "З особистим дизайн-буком для кожної вечірки все готово для унікального заходу. Ми координуємо постачальників і персонал, щоб ви та гості насолоджувались кожною миттю.", "nl": "Met een persoonlijk draaiboek voor elke party staat iedereen klaar voor een uniek event. Wij coördineren de leveranciers en het personeel, zodat jullie en de gasten niets te kort komen."}
    }
  ],
  "portfolio_kicker": {"en": "Our Memories", "uk": "Наші спогади", "nl": "Onze herinneringen"},
  "portfolio_title": {"en": "Portfolio", "uk": "Портфоліо", "nl": "Portfolio"},
  "portfolio": [],
  "packages_kicker": {"en": "What We Offer", "uk": "Що ми пропонуємо", "nl": "Wat wij bieden"},
  "packages_title": {"en": "Event Packages", "uk": "Пакети заходів", "nl": "Evenementpakketten"},
  "packages": [],
  "decor_kicker": {"en": "Event Styling", "uk": "Стилізація подій", "nl": "Event styling"},
  "decor_title": {"en": "Decoration Gallery", "uk": "Галерея декору", "nl": "Decoratie galerij"},
  "decor": [],
  "gallery": [],
  "form_title": {
    "en": "Plan Your Event",
    "uk": "Заплануйте подію",
    "nl": "Plan uw evenement"
  }
}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content;
