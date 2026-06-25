-- ================================================================
--  Elite Bloemen — Weddings & Parties landing content
--  Run this in the Supabase SQL Editor.
--  Idempotent: re-running overwrites the content for both pages.
--  Text only (EN / NL / UK). Image fields are left empty — add
--  hero/section/portfolio image URLs later from the admin panel
--  or by editing the JSON below.
-- ================================================================

INSERT INTO public.event_pages (slug, content) VALUES

-- ── WEDDINGS ───────────────────────────────────────────────────
('weddings', $json$
{
  "hero_image": "",
  "hero_title": {
    "en": "Weddings",
    "nl": "Bruiloften",
    "uk": "Весілля"
  },
  "hero_subtitle": {
    "en": "Floral design for your most beautiful day, crafted across the Netherlands.",
    "nl": "Bloemontwerp voor uw mooiste dag, met liefde gemaakt in heel Nederland.",
    "uk": "Флористичний дизайн для вашого найкрасивішого дня — по всій Нідерландах."
  },
  "intro_kicker": {
    "en": "Wedding Floristry",
    "nl": "Bruidsfloristiek",
    "uk": "Весільна флористика"
  },
  "intro_title": {
    "en": "Flowers that tell your love story",
    "nl": "Bloemen die uw liefdesverhaal vertellen",
    "uk": "Квіти, що розповідають вашу історію кохання"
  },
  "intro_text": {
    "en": "From the bridal bouquet to the ceremony arch and table settings, we design fresh seasonal flowers tailored to your venue and style. Whether you celebrate in an Amsterdam canal house, a countryside estate or a coastal venue, Elite Bloemen brings your vision to life with elegance and care.",
    "nl": "Van het bruidsboeket tot de ceremonieboog en de tafelaankleding ontwerpen wij verse seizoensbloemen, afgestemd op uw locatie en stijl. Of u nu viert in een Amsterdams grachtenpand, op een landgoed of aan de kust — Elite Bloemen brengt uw visie tot leven met elegantie en zorg.",
    "uk": "Від весільного букета до весільної арки та сервірування столів ми створюємо свіжі сезонні квіти, що відповідають вашій локації та стилю. Святкуєте ви в амстердамському будинку біля каналу, у заміському маєтку чи на узбережжі — Elite Bloemen втілить вашу мрію з елегантністю та турботою."
  },
  "intro_button": {
    "en": "Request a consultation",
    "nl": "Vraag een adviesgesprek aan",
    "uk": "Замовити консультацію"
  },
  "media_image": "",
  "sections": [
    {
      "image": "",
      "title": {
        "en": "Bridal bouquet & personal flowers",
        "nl": "Bruidsboeket & persoonlijke bloemen",
        "uk": "Весільний букет та персональні квіти"
      },
      "text": {
        "en": "Your bouquet, boutonnières and corsages are designed by hand to match your dress, palette and the season. We work only with fresh flowers from trusted Dutch growers, so every detail looks effortless from the first photo to the last dance.",
        "nl": "Uw boeket, corsages en boutonnières worden met de hand ontworpen, passend bij uw jurk, kleurenpalet en het seizoen. Wij werken uitsluitend met verse bloemen van betrouwbare Nederlandse kwekers, zodat elk detail moeiteloos oogt — van de eerste foto tot de laatste dans.",
        "uk": "Ваш букет, бутоньєрки та корсажі створюються вручну відповідно до вашої сукні, палітри та сезону. Ми працюємо лише зі свіжими квітами від перевірених нідерландських господарств, тож кожна деталь виглядає бездоганно — від першого фото до останнього танцю."
      }
    },
    {
      "image": "",
      "title": {
        "en": "Ceremony & venue styling",
        "nl": "Ceremonie & locatieaankleding",
        "uk": "Оформлення церемонії та локації"
      },
      "text": {
        "en": "Floral arches, aisle arrangements and statement installations set the mood of your ceremony. We visit your venue, plan the logistics and handle delivery and setup across the Netherlands, so you can simply enjoy the moment.",
        "nl": "Bloemenbogen, gangpadarrangementen en sfeervolle installaties bepalen de stemming van uw ceremonie. Wij bezoeken uw locatie, plannen de logistiek en verzorgen levering en opbouw door heel Nederland, zodat u enkel hoeft te genieten.",
        "uk": "Квіткові арки, оформлення проходу та виразні інсталяції задають настрій вашої церемонії. Ми відвідуємо локацію, плануємо логістику та забезпечуємо доставку й монтаж по всій Нідерландах, щоб ви могли просто насолоджуватися моментом."
      }
    },
    {
      "image": "",
      "title": {
        "en": "Reception & table design",
        "nl": "Receptie & tafeldecoratie",
        "uk": "Прийом та оформлення столів"
      },
      "text": {
        "en": "Centrepieces, garlands and candlelit details turn your dinner into an unforgettable evening. We balance colour, height and texture so every table feels intimate and refined, perfectly in tune with your celebration.",
        "nl": "Tafelstukken, slingers en details bij kaarslicht maken van uw diner een onvergetelijke avond. Wij balanceren kleur, hoogte en textuur zodat elke tafel intiem en verfijnd aanvoelt, helemaal in lijn met uw feest.",
        "uk": "Композиції, гірлянди та деталі у світлі свічок перетворять вашу вечерю на незабутній вечір. Ми збалансовуємо колір, висоту й текстуру, щоб кожен стіл був затишним і вишуканим — у повній гармонії з вашим святом."
      }
    }
  ],
  "quote_image": "",
  "quote_kicker": {
    "en": "Our promise",
    "nl": "Onze belofte",
    "uk": "Наша обіцянка"
  },
  "quote_text": {
    "en": "Every wedding deserves flowers that feel personal, fresh and timeless.",
    "nl": "Elke bruiloft verdient bloemen die persoonlijk, vers en tijdloos aanvoelen.",
    "uk": "Кожне весілля заслуговує на квіти, що відчуваються особистими, свіжими та позачасовими."
  },
  "quote_author": {
    "en": "Elite Bloemen Atelier",
    "nl": "Elite Bloemen Atelier",
    "uk": "Майстерня Elite Bloemen"
  },
  "portfolio_kicker": { "en": "", "nl": "", "uk": "" },
  "portfolio_title": { "en": "", "nl": "", "uk": "" },
  "portfolio": [],
  "packages_kicker": { "en": "", "nl": "", "uk": "" },
  "packages_title": { "en": "", "nl": "", "uk": "" },
  "packages": [],
  "decor_kicker": { "en": "", "nl": "", "uk": "" },
  "decor_title": { "en": "", "nl": "", "uk": "" },
  "decor": [],
  "gallery": [],
  "form_title": {
    "en": "Plan your wedding flowers",
    "nl": "Plan uw bruiloftsbloemen",
    "uk": "Сплануйте весільні квіти"
  }
}
$json$::jsonb),

-- ── PARTIES & EVENTS ───────────────────────────────────────────
('parties', $json$
{
  "hero_image": "",
  "hero_title": {
    "en": "Parties & Events",
    "nl": "Feesten & Evenementen",
    "uk": "Вечірки та події"
  },
  "hero_subtitle": {
    "en": "Statement florals for celebrations of every kind, anywhere in the Netherlands.",
    "nl": "Opvallende bloemen voor elk feest, overal in Nederland.",
    "uk": "Виразні флористичні рішення для будь-яких свят — по всій Нідерландах."
  },
  "intro_kicker": {
    "en": "Event Floristry",
    "nl": "Evenementfloristiek",
    "uk": "Подієва флористика"
  },
  "intro_title": {
    "en": "Flowers that make the occasion",
    "nl": "Bloemen die het feest maken",
    "uk": "Квіти, що створюють свято"
  },
  "intro_text": {
    "en": "Birthdays, anniversaries, corporate events and private dinners — we create floral atmospheres that match your theme and space. From a single statement piece to full venue styling, Elite Bloemen delivers fresh, beautifully arranged flowers throughout the Netherlands.",
    "nl": "Verjaardagen, jubilea, zakelijke evenementen en privédiners — wij creëren bloemensferen die passen bij uw thema en ruimte. Van één blikvanger tot volledige aankleding levert Elite Bloemen verse, prachtig gearrangeerde bloemen door heel Nederland.",
    "uk": "Дні народження, ювілеї, корпоративні події та приватні вечері — ми створюємо квіткову атмосферу, що відповідає вашій темі та простору. Від однієї акцентної композиції до повного оформлення Elite Bloemen доставляє свіжі, майстерно оформлені квіти по всій Нідерландах."
  },
  "intro_button": {
    "en": "Request a quote",
    "nl": "Vraag een offerte aan",
    "uk": "Отримати пропозицію"
  },
  "media_image": "",
  "sections": [
    {
      "image": "",
      "title": {
        "en": "Birthdays & private celebrations",
        "nl": "Verjaardagen & privéfeesten",
        "uk": "Дні народження та приватні свята"
      },
      "text": {
        "en": "Make any gathering feel special with bespoke bouquets, table arrangements and welcome flowers. Tell us the occasion, colours and mood — we take care of the rest, with fresh blooms delivered on time.",
        "nl": "Maak elk samenzijn bijzonder met bouquetten op maat, tafelarrangementen en welkomstbloemen. Vertel ons de gelegenheid, kleuren en sfeer — wij regelen de rest, met verse bloemen die op tijd worden bezorgd.",
        "uk": "Зробіть будь-яку зустріч особливою за допомогою букетів на замовлення, оформлення столів та квітів для зустрічі гостей. Розкажіть про привід, кольори й настрій — решту ми беремо на себе, доставляючи свіжі квіти вчасно."
      }
    },
    {
      "image": "",
      "title": {
        "en": "Corporate & brand events",
        "nl": "Zakelijke & merkevenementen",
        "uk": "Корпоративні та бренд-події"
      },
      "text": {
        "en": "Receptions, product launches and office celebrations deserve a polished floral signature. We design arrangements that reflect your brand and scale them to any venue, with reliable delivery and setup across the country.",
        "nl": "Recepties, productlanceringen en kantoorfeesten verdienen een verzorgde bloemensignatuur. Wij ontwerpen arrangementen die uw merk weerspiegelen en schalen ze naar elke locatie, met betrouwbare levering en opbouw door het hele land.",
        "uk": "Прийоми, презентації продуктів та офісні святкування заслуговують на вишуканий флористичний почерк. Ми створюємо композиції, що відображають ваш бренд, і масштабуємо їх під будь-яку локацію — з надійною доставкою та монтажем по всій країні."
      }
    },
    {
      "image": "",
      "title": {
        "en": "Seasonal & themed décor",
        "nl": "Seizoens- & themadecoratie",
        "uk": "Сезонний і тематичний декор"
      },
      "text": {
        "en": "From spring pastels to festive winter greenery, we build floral concepts around your theme. Installations, garlands and accent pieces transform your space into an experience your guests will remember.",
        "nl": "Van lentepastels tot feestelijk wintergroen bouwen wij bloemenconcepten rond uw thema. Installaties, slingers en accentstukken veranderen uw ruimte in een ervaring die uw gasten bijblijft.",
        "uk": "Від весняних пастельних відтінків до святкової зимової зелені ми створюємо квіткові концепції навколо вашої теми. Інсталяції, гірлянди та акцентні елементи перетворять простір на враження, яке запам’ятають гості."
      }
    }
  ],
  "quote_image": "",
  "quote_kicker": {
    "en": "Why Elite Bloemen",
    "nl": "Waarom Elite Bloemen",
    "uk": "Чому Elite Bloemen"
  },
  "quote_text": {
    "en": "The right flowers turn a gathering into a celebration to remember.",
    "nl": "De juiste bloemen maken van een samenzijn een onvergetelijk feest.",
    "uk": "Правильні квіти перетворюють зустріч на свято, яке запам’ятовується."
  },
  "quote_author": {
    "en": "Elite Bloemen Atelier",
    "nl": "Elite Bloemen Atelier",
    "uk": "Майстерня Elite Bloemen"
  },
  "portfolio_kicker": { "en": "", "nl": "", "uk": "" },
  "portfolio_title": { "en": "", "nl": "", "uk": "" },
  "portfolio": [],
  "packages_kicker": { "en": "", "nl": "", "uk": "" },
  "packages_title": { "en": "", "nl": "", "uk": "" },
  "packages": [],
  "decor_kicker": { "en": "", "nl": "", "uk": "" },
  "decor_title": { "en": "", "nl": "", "uk": "" },
  "decor": [],
  "gallery": [],
  "form_title": {
    "en": "Plan your event flowers",
    "nl": "Plan uw evenementbloemen",
    "uk": "Сплануйте квіти для події"
  }
}
$json$::jsonb)

ON CONFLICT (slug) DO UPDATE
  SET content    = EXCLUDED.content,
      updated_at = now();
