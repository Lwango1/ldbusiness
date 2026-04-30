import { Product } from '../types';

export const products: Product[] = [
  {
    id: 1,
    name: "Robe de Soirée Bordeaux",
    description: "Magnifique robe de soirée en bordeaux avec drapé sophistiqué et ornements délicats. Parfaite pour les galas et événements prestigieux.",
    price: 450000,
    currency: "CDF",
    image: "/images/img_1.png",
    category: "Robes de Soirée",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Bordeaux", "Noir", "Or"]
  },
  {
    id: 2,
    name: "Costume Homme Brodé",
    description: "Costume homme de luxe inspiré de l'élégance africaine avec broderies dorées sur tissu bleu nuit. Design contemporain rencontre tradition.",
    price: 380000,
    currency: "CDF",
    image: "/images/img_2.png",
    category: "Costumes Homme",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Bleu Nuit", "Noir", "Gris"]
  },
  {
    id: 3,
    name: "Robe de Mariée Royale",
    description: "Robe de mariée somptueuse en blanc avec détails en dentelle dorée et perles. Traîne longue pour une allure royale le jour J.",
    price: 850000,
    currency: "CDF",
    image: "/images/img_3.png",
    category: "Mariage",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Blanc", "Ivoire"]
  },
  {
    id: 4,
    name: "Robe Cocktail Émeraude",
    description: "Robe cocktail en satin émeraude avec cristaux raffinés. Longueur genou, design élégant pour cocktails et réceptions.",
    price: 280000,
    currency: "CDF",
    image: "/images/img_4.png",
    category: "Robes de Soirée",
    sizes: ["XS", "S", "M", "L"],
    colors: ["Émeraude", "Rouge", "Noir"]
  },
  {
    id: 5,
    name: "Ensemble Ankara Moderne",
    description: "Tenue traditionnelle africaine revisitée avec tissu wax coloré et coupe moderne. Accessoires dorés inclus.",
    price: 320000,
    currency: "CDF",
    image: "/images/img.png",
    category: "Traditionnel",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Multicolore", "Bleu", "Orange"]
  },
  {
    id: 6,
    name: "Décoration Événementielle Premium",
    description: "Service complet de décoration événementielle luxueuse. Arrangements floraux, nappes dorées, chandeliers et mise en scène complète.",
    price: 1200000,
    currency: "CDF",
    image: "/images/logo.png",
    category: "Événements",
    sizes: ["Standard"],
    colors: ["Or", "Argent", "Cristal"]
  }
];

export const categories = [
  "Tous",
  "Robes de Soirée",
  "Costumes Homme",
  "Mariage",
  "Traditionnel",
  "Événements"
];