export const AGE_CATEGORIES = [
  { value: "0-3-months", label: "0-3 Aylık", labelShort: "0-3 Ay" },
  { value: "3-6-months", label: "3-6 Aylık", labelShort: "3-6 Ay" },
  { value: "6-12-months", label: "6-12 Aylık", labelShort: "6-12 Ay" },
  { value: "1-2-years", label: "1-2 Yaş", labelShort: "1-2 Yaş" },
  { value: "2-5-years", label: "2-5 Yaş", labelShort: "2-5 Yaş" },
  { value: "5-plus-years", label: "5+ Yaş", labelShort: "5+ Yaş" },
] as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Dişi" },
] as const;

export const HEALTH_STATUS_OPTIONS = [
  { value: "healthy", label: "Sağlıklı" },
  { value: "treated", label: "Tedavi Altında" },
  { value: "special-needs", label: "Özel Bakım Gerektirir" },
  { value: "senior-care", label: "Yaşlı Bakımı Gerektirir" },
] as const;

export const CHARACTER_TRAITS = [
  { value: "friendly", label: "Sevecen" },
  { value: "playful", label: "Oyuncu" },
  { value: "calm", label: "Sakin" },
  { value: "energetic", label: "Enerjik" },
  { value: "protective", label: "Koruyucu" },
  { value: "independent", label: "Bağımsız" },
  { value: "loyal", label: "Sadık" },
  { value: "social", label: "Sosyal" },
  { value: "shy", label: "Utangaç" },
  { value: "intelligent", label: "Zeki" },
  { value: "trained", label: "Eğitimli" },
  { value: "child-friendly", label: "Çocuklarla İyi" },
  { value: "pet-friendly", label: "Diğer Hayvanlarla İyi" },
  { value: "apartment-suitable", label: "Apartman İçin Uygun" },
  { value: "garden-needed", label: "Bahçe Gerektirir" },
] as const;

export const DOG_BREEDS = [
  "Golden Retriever", "Labrador Retriever", "Alman Çoban Köpeği", "Bulldog",
  "Poodle", "Beagle", "Rottweiler", "Yorkshire Terrier", "Boxer", "Dachshund",
  "Siberian Husky", "Doberman", "Great Dane", "Cavalier King Charles", "Shih Tzu",
  "Boston Terrier", "Pomeranian", "Havanese", "Maltese", "Chihuahua",
  "Kangal", "Akbaş", "Malaklı", "Tazi", "Çatalburun",
  "Cocker Spaniel", "Bichon Frise", "Chow Chow", "Shar Pei", "Akita",
  "Border Collie", "Jack Russell Terrier", "Pug", "Samoyed", "Weimaraner",
  "Melez",
] as const;

export const CAT_BREEDS = [
  "British Shorthair", "Scottish Fold", "İran (Persian)", "Maine Coon",
  "Ragdoll", "Siamese", "Bengal", "Sphynx", "Russian Blue", "Birman",
  "Abyssinian", "Norwegian Forest", "Turkish Angora", "Turkish Van",
  "British Longhair", "Exotic Shorthair", "Himalayan", "Burmese", "Devon Rex",
  "Chartreux", "Cornish Rex", "Somali", "Tonkinese", "American Shorthair",
  "Sokak Kedisi", "Melez",
] as const;

export const BIRD_BREEDS = [
  "Muhabbet Kuşu", "Sultan Papağanı", "Jako (Afrika Gri Papağanı)",
  "Amazon Papağanı", "Kakadü", "Cennet Papağanı", "Love Bird", "Kanarya",
  "Saka", "Florya", "Bülbül", "İspinoz", "Zebra Finch", "Hint Bülbülü",
  "Macaw", "Eclectus", "Forpus", "Ringneck Papağanı", "Güvercin",
] as const;

export const FISH_TYPES = [
  "Japon Balığı", "Beta", "Guppy", "Moli", "Plati", "Tetra", "Oscar",
  "Diskus", "Melek Balığı", "Çöpçü Balık", "Lepistes", "Kılıçkuyruk",
  "Pacu", "Akvaryum Karidesi", "Koi", "Çiklet", "Vatoz", "Köpekbalığı",
] as const;

export const FARM_ANIMAL_TYPES = [
  "Dana", "Düve", "İnek", "Boğa", "Manda",
  "Kuzu", "Koyun", "Koç", "Keçi", "Teke", "Oğlak",
  "Tavuk", "Horoz", "Civciv", "Hindi", "Kaz", "Ördek",
  "At", "Tay", "Eşek", "Katır",
] as const;

export const VACCINATION_STATUS = [
  { value: "fully", label: "Tam Aşılı" },
  { value: "partial", label: "Kısmi Aşılı" },
  { value: "none", label: "Aşısız" },
  { value: "unknown", label: "Bilinmiyor" },
] as const;

export type AgeCategory = typeof AGE_CATEGORIES[number]["value"];
export type Gender = typeof GENDER_OPTIONS[number]["value"];
export type HealthStatus = typeof HEALTH_STATUS_OPTIONS[number]["value"];
export type CharacterTrait = typeof CHARACTER_TRAITS[number]["value"];
