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


ON CONFLICT (slug) DO UPDATE
  SET content    = EXCLUDED.content,
      updated_at = now();
