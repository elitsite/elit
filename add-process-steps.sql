-- ============================================================
-- SQL: Add process_steps to event_pages content (weddings & parties)
-- Run this in Supabase SQL Editor
-- ============================================================

-- WEDDINGS: Add 3 process steps
UPDATE event_pages
SET content = content || '{
  "process_steps": [
    {
      "title": {"en": "Consultation", "uk": "Консультація", "nl": "Consultatie"},
      "text": {"en": "The bride and groom are the foundation of a unique wedding. We discuss your personal wishes and brainstorm about styling and entertainment.", "uk": "Наречені — основа унікального весілля. Ми обговорюємо ваші побажання та проводимо брейнсторм щодо стилістики та розваг.", "nl": "Het bruidspaar vormt de basis van een unieke bruiloft. Daarom ontdekken we in dit gesprek jullie persoonlijke wensen en brainstormen we over de styling en het entertainment."}
    },
    {
      "title": {"en": "Design & Planning", "uk": "Дизайн і планування", "nl": "Design & Planning"},
      "text": {"en": "We create an exclusive design, tailored to your style in every detail. We select the best vendors and start planning your event.", "uk": "Ми створюємо ексклюзивний дизайн, адаптований до вашого стилю в кожній деталі. Обираємо найкращих постачальників та починаємо планування.", "nl": "Wij maken een exclusief design, tot in detail in jullie stijl gegoten. Daarbij kiezen we de beste leveranciers en starten we met het plannen van jullie event."}
    },
    {
      "title": {"en": "Let''s Create Magic", "uk": "Створимо магію", "nl": "Laten we magie creëren"},
      "text": {"en": "Every wedding receives a personal playbook. Everything is ready, and we welcome the guests. No question is too crazy — we help everyone create the most beautiful memories.", "uk": "Кожне весілля отримує особистий сценарій. Все готово, і ми зустрічаємо гостей. Жодне питання не є зайвим — ми допомагаємо створити найкращі спогади.", "nl": "Elke bruiloft ontvangt een persoonlijk draaiboek. Alles staat klaar en we verwelkomen de gasten. Geen vraag is te gek, we helpen iedereen de mooiste herinneringen te creëren."}
    }
  ]
}'::jsonb
WHERE slug = 'weddings';

-- PARTIES: Add 3 process steps
UPDATE event_pages
SET content = content || '{
  "process_steps": [
    {
      "title": {"en": "Brainstorm", "uk": "Брейнсторм", "nl": "Brainstorm"},
      "text": {"en": "We get to know you better to determine which elements make your event perfect for the guest of honor. After the brainstorm, we present a total concept where everything comes together.", "uk": "Ми краще знайомимось з вами, щоб визначити, які елементи зроблять ваш захід ідеальним. Після брейнсторму ми представляємо загальну концепцію.", "nl": "We leren jullie beter kennen voor welke elementen past dit event perfect bij de feestvierder? Na de brainstorm presenteren wij een totaalconcept waarin alles samenkomt."}
    },
    {
      "title": {"en": "Design & Planning", "uk": "Дизайн і планування", "nl": "Design & Planning"},
      "text": {"en": "From decoration and luxury flowers to catering and entertainment — together with professional vendors we bring the concept to life. Down to the smallest details we plan your event.", "uk": "Від декору та розкішних квітів до кейтерингу та розваг — разом з професійними постачальниками ми втілюємо концепцію в життя. До найменших деталей.", "nl": "Van aankleding en luxe bloemen tot catering en entertainment — samen met professionele leveranciers brengen we het concept tot leven. Tot in de kleinste details plannen we jullie event."}
    },
    {
      "title": {"en": "Showtime", "uk": "Шоу починається", "nl": "Showtime"},
      "text": {"en": "With a personal design book for each party, everyone is ready for a unique event. We coordinate vendors and staff, so you and the guests can enjoy every moment.", "uk": "З особистим дизайн-буком для кожної вечірки все готово для унікального заходу. Ми координуємо постачальників і персонал, щоб ви та гості насолоджувались кожною миттю.", "nl": "Met een persoonlijk draaiboek voor elke party staat iedereen klaar voor een uniek event. Wij coördineren de leveranciers en het personeel, zodat jullie en de gasten niets te kort komen."}
    }
  ]
}'::jsonb
WHERE slug = 'parties';
