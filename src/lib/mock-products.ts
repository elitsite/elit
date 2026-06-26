/**
 * Placeholder products shown when the Supabase DB returns no results.
 * Replace these once real products are added to the database.
 */
import type { Product } from "@/lib/supabase";

function stub(
  id: string,
  name: string,
  price: number,
  image_url: string,
  category: string,
  name_nl?: string,
  name_uk?: string,
): Product {
  return {
    id,
    name,
    name_nl: name_nl ?? name,
    name_uk: name_uk ?? name,
    description: "",
    price,
    discount: 0,
    image_url,
    in_stock: true,
    category,
    created_at: "2025-01-01T00:00:00Z",
  };
}

const PEXELS = "https://images.pexels.com/photos";

export const MOCK_BOUQUETS: Product[] = [
  stub("mock-b1", "Rose", 100, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "mono-bouquets", "Roos", "Троянда"),
  stub("mock-b2", "White Elegance", 95, `${PEXELS}/931179/pexels-photo-931179.jpeg`, "mixed-bouquets", "Witte Elegantie", "Біла Елегантність"),
  stub("mock-b3", "Blush Peonies", 110, `${PEXELS}/56866/pexels-photo-56866.jpeg`, "author-bouquets", "Roze Pioenen", "Рожеві Піони"),
  stub("mock-b4", "Pastel Charm", 90, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "mixed-bouquets", "Pastel Charme", "Пастельний Шарм"),
  stub("mock-b5", "Lilac Dream", 105, `${PEXELS}/931179/pexels-photo-931179.jpeg`, "premium-bouquets", "Lila Droom", "Бузковий Сон"),
  stub("mock-b6", "Sunny Day", 85, `${PEXELS}/56866/pexels-photo-56866.jpeg`, "mini-bouquets", "Zonnige Dag", "Сонячний День"),
  stub("mock-b7", "Garden Mix", 95, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "mixed-bouquets", "Tuinmix", "Садовий Мікс"),
  stub("mock-b8", "Spring Bloom", 120, `${PEXELS}/56866/pexels-photo-56866.jpeg`, "premium-bouquets", "Lentebloei", "Весняний Цвіт"),
];

export const MOCK_BASKETS: Product[] = [
  stub("mock-k1", "Garden Basket", 120, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "basket-arrangements", "Tuinmand", "Садовий Кошик"),
  stub("mock-k2", "Spring Basket", 130, `${PEXELS}/931179/pexels-photo-931179.jpeg`, "basket-arrangements", "Lentемand", "Весняний Кошик"),
  stub("mock-k3", "Pink Basket", 125, `${PEXELS}/56866/pexels-photo-56866.jpeg`, "basket-arrangements", "Roze Mand", "Рожевий Кошик"),
  stub("mock-k4", "White Basket", 115, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "basket-arrangements", "Witte Mand", "Білий Кошик"),
  stub("mock-k5", "Lavender Basket", 135, `${PEXELS}/931179/pexels-photo-931179.jpeg`, "basket-arrangements", "Lavendelmand", "Лавандовий Кошик"),
];

export const MOCK_DECOR: Product[] = [
  stub("mock-d1", "Flower Stand", 75, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "hall-table-decor", "Bloemenstandaard", "Підставка для квітів"),
  stub("mock-d2", "Vase Arrangement", 60, `${PEXELS}/931179/pexels-photo-931179.jpeg`, "interior-arrangements", "Vaasarrangement", "Ваза з квітами"),
  stub("mock-d3", "Candle & Flowers", 55, `${PEXELS}/56866/pexels-photo-56866.jpeg`, "table-arrangements", "Kaars & Bloemen", "Свічки та квіти"),
  stub("mock-d4", "Table Decor", 65, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "hall-table-decor", "Tafeldecor", "Декор столу"),
  stub("mock-d5", "Lantern Decor", 50, `${PEXELS}/931179/pexels-photo-931179.jpeg`, "interior-arrangements", "Lantaarndecor", "Декор з ліхтарем"),
];

export const MOCK_FUNERAL: Product[] = [
  stub("mock-f1", "White Tribute", 130, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "funeral-arrangement", "Witte Eer", "Білий Вінок"),
  stub("mock-f2", "Eternal Peace", 135, `${PEXELS}/931179/pexels-photo-931179.jpeg`, "funeral-arrangement", "Eeuwige Vrede", "Вічний Спокій"),
  stub("mock-f3", "Lily & Roses", 125, `${PEXELS}/56866/pexels-photo-56866.jpeg`, "funeral-bouquet", "Lelie & Rozen", "Лілії та Троянди"),
  stub("mock-f4", "Peaceful Heart", 145, `${PEXELS}/931177/pexels-photo-931177.jpeg`, "funeral-arrangement", "Vredig Hart", "Мирне Серце"),
  stub("mock-f5", "Loving Memory", 120, `${PEXELS}/931179/pexels-photo-931179.jpeg`, "funeral-bouquet", "Liefdevolle Herinnering", "Пам'ять Кохання"),
];
