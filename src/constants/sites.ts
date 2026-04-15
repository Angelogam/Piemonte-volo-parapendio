// constants/sites.ts

export interface LaunchSite {
  id: string;
  name: string;
  region: "CN" | "TO" | "VB" | "VC" | "AL";
  zone: string;
  altitude: number;
  orientation: string;
  maxWindKmh: number;
  coordinates: { lat: number; lng: number };
  icon: string;
  difficulty: "beginner" | "intermediate" | "expert";
}

// DATI REALI ESTRATTI DAL FILE KML - PIEMONTE
export const SITES: LaunchSite[] = [
  {
    id: "malanotte",
    name: "Malanotte",
    region: "CN",
    zone: "Valle Po",
    altitude: 1740,
    orientation: "N-NE",
    maxWindKmh: 25,
    coordinates: { lat: 44.25874571728482, lng: 7.794304664370852 },
    icon: "🏔️",
    difficulty: "intermediate"
  },
  {
    id: "colle-tenda",
    name: "Colle di Tenda",
    region: "CN",
    zone: "Valle Vermenagna",
    altitude: 1871,
    orientation: "S-SE",
    maxWindKmh: 30,
    coordinates: { lat: 44.15093973937469, lng: 7.569262924652476 },
    icon: "⛰️",
    difficulty: "expert"
  },
  {
    id: "boves",
    name: "Boves",
    region: "CN",
    zone: "Valle Stura",
    altitude: 850,
    orientation: "S-SW",
    maxWindKmh: 20,
    coordinates: { lat: 44.32113720462757, lng: 7.544697617792515 },
    icon: "🏞️",
    difficulty: "beginner"
  },
  {
    id: "monte-male-dronero",
    name: "Monte Male di Dronero",
    region: "CN",
    zone: "Valle Maira",
    altitude: 1620,
    orientation: "SE",
    maxWindKmh: 28,
    coordinates: { lat: 44.43163071064606, lng: 7.362886778152897 },
    icon: "🏔️",
    difficulty: "intermediate"
  },
  {
    id: "iretta",
    name: "Iretta",
    region: "CN",
    zone: "Valle Maira",
    altitude: 1600,
    orientation: "S",
    maxWindKmh: 25,
    coordinates: { lat: 44.49893744007536, lng: 7.382036612070795 },
    icon: "⛰️",
    difficulty: "intermediate"
  },
  {
    id: "pratoni-val-mala",
    name: "Pratoni di Val Mala",
    region: "CN",
    zone: "Valle Maira",
    altitude: 1750,
    orientation: "SE",
    maxWindKmh: 25,
    coordinates: { lat: 44.50780117336976, lng: 7.346618978966227 },
    icon: "🏞️",
    difficulty: "intermediate"
  },
  {
    id: "monte-birrone",
    name: "Monte Birrone",
    region: "CN",
    zone: "Valle Maira",
    altitude: 2100,
    orientation: "S",
    maxWindKmh: 35,
    coordinates: { lat: 44.5398927839592, lng: 7.25293945830122 },
    icon: "🏔️",
    difficulty: "expert"
  },
  {
    id: "colle-agnello",
    name: "Colle dell'Agnello",
    region: "CN",
    zone: "Valle Varaita",
    altitude: 2744,
    orientation: "S",
    maxWindKmh: 40,
    coordinates: { lat: 44.68282592463814, lng: 6.978200601250462 },
    icon: "🏔️",
    difficulty: "expert"
  },
  {
    id: "pian-mune",
    name: "Pian Munè - Seggiovia",
    region: "CN",
    zone: "Valle Varaita",
    altitude: 1850,
    orientation: "SE",
    maxWindKmh: 28,
    coordinates: { lat: 44.63861029121272, lng: 7.230889474766025 },
    icon: "🚠",
    difficulty: "intermediate"
  },
  {
    id: "bricco-lombatera",
    name: "Bricco Lombatera",
    region: "CN",
    zone: "Valle Varaita",
    altitude: 1950,
    orientation: "S",
    maxWindKmh: 30,
    coordinates: { lat: 44.65736521807557, lng: 7.260017009542715 },
    icon: "⛰️",
    difficulty: "intermediate"
  },
  {
    id: "martiniana-po",
    name: "Martiniana Po",
    region: "CN",
    zone: "Valle Po",
    altitude: 700,
    orientation: "S",
    maxWindKmh: 18,
    coordinates: { lat: 44.60695265332723, lng: 7.38322612877631 },
    icon: "🏞️",
    difficulty: "beginner"
  },
  {
    id: "rucas-alto",
    name: "Rucas Alto",
    region: "CN",
    zone: "Valle Varaita",
    altitude: 1950,
    orientation: "SE",
    maxWindKmh: 30,
    coordinates: { lat: 44.74213930591463, lng: 7.220118689737356 },
    icon: "🏔️",
    difficulty: "intermediate"
  },
  {
    id: "montoso-basso",
    name: "Montoso Basso",
    region: "CN",
    zone: "Valle Po",
    altitude: 1200,
    orientation: "S",
    maxWindKmh: 22,
    coordinates: { lat: 44.7643723437882, lng: 7.249757926713178 },
    icon: "🏞️",
    difficulty: "beginner"
  },
  {
    id: "monte-vandalino",
    name: "Monte Vandalino",
    region: "TO",
    zone: "Val Susa",
    altitude: 1800,
    orientation: "S",
    maxWindKmh: 28,
    coordinates: { lat: 44.83671231480542, lng: 7.173866924055591 },
    icon: "🏔️",
    difficulty: "intermediate"
  },
  {
    id: "pian-dell-alpe",
    name: "Pian dell'Alpe",
    region: "TO",
    zone: "Val Susa",
    altitude: 1600,
    orientation: "SE",
    maxWindKmh: 25,
    coordinates: { lat: 45.06396153999711, lng: 7.028266530872771 },
    icon: "🏞️",
    difficulty: "intermediate"
  },
  {
    id: "roletto-piggi",
    name: "Roletto (Piggi)",
    region: "TO",
    zone: "Pinerolese",
    altitude: 750,
    orientation: "S",
    maxWindKmh: 20,
    coordinates: { lat: 44.93249288285819, lng: 7.310959031722244 },
    icon: "🏞️",
    difficulty: "beginner"
  },
  {
    id: "piossasco-s-giorgio",
    name: "Piossasco - Monte S.Giorgio",
    region: "TO",
    zone: "Pinerolese",
    altitude: 850,
    orientation: "S",
    maxWindKmh: 22,
    coordinates: { lat: 44.99671840144012, lng: 7.44800217882953 },
    icon: "⛰️",
    difficulty: "beginner"
  },
  {
    id: "truccetti",
    name: "Truccetti",
    region: "TO",
    zone: "Val Susa",
    altitude: 1400,
    orientation: "SE",
    maxWindKmh: 25,
    coordinates: { lat: 45.07973511679036, lng: 7.342018342463826 },
    icon: "🏞️",
    difficulty: "intermediate"
  },
  {
    id: "val-della-torre",
    name: "Val della Torre",
    region: "TO",
    zone: "Torino Nord",
    altitude: 600,
    orientation: "S",
    maxWindKmh: 18,
    coordinates: { lat: 45.16262748864921, lng: 7.463716167415302 },
    icon: "🏞️",
    difficulty: "beginner"
  },
  {
    id: "rocca-canavese",
    name: "Rocca Canavese - M.della Neve",
    region: "TO",
    zone: "Canavese",
    altitude: 1200,
    orientation: "S",
    maxWindKmh: 25,
    coordinates: { lat: 45.32757754837493, lng: 7.572793582322621 },
    icon: "🏔️",
    difficulty: "intermediate"
  },
  {
    id: "santa-elisabetta",
    name: "Santa Elisabetta",
    region: "TO",
    zone: "Canavese",
    altitude: 1100,
    orientation: "S",
    maxWindKmh: 22,
    coordinates: { lat: 45.4182733880574, lng: 7.641945041749434 },
    icon: "🏞️",
    difficulty: "beginner"
  },
  {
    id: "santa-elisabetta-alto",
    name: "Santa Elisabetta Alto",
    region: "TO",
    zone: "Canavese",
    altitude: 1500,
    orientation: "SE",
    maxWindKmh: 28,
    coordinates: { lat: 45.44019393073506, lng: 7.648025947229948 },
    icon: "🏔️",
    difficulty: "intermediate"
  },
  {
    id: "monte-cavallaria",
    name: "Monte Cavallaria",
    region: "TO",
    zone: "Canavese",
    altitude: 1760,
    orientation: "S",
    maxWindKmh: 30,
    coordinates: { lat: 45.51729363773779, lng: 7.798808327293107 },
    icon: "🏔️",
    difficulty: "intermediate"
  },
  {
    id: "andrate",
    name: "Andrate",
    region: "TO",
    zone: "Canavese",
    altitude: 850,
    orientation: "S",
    maxWindKmh: 20,
    coordinates: { lat: 45.55063933418272, lng: 7.880775591143394 },
    icon: "🏞️",
    difficulty: "beginner"
  }
];
