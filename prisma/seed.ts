import 'dotenv/config'

import { fileURLToPath } from 'node:url'
import {
  BookingStatus,
  PaymentStatus,
  PrismaClient,
  RewardStatus,
  Role,
} from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from 'better-auth/crypto'

export const defaultSeedPassword = 'CutBookDemo123!'

// =============================================================
// CORE SEED — exports stables consommes par les tests d'integration
// (ne pas renommer / supprimer sans verifier lib/**/*.integration.test.ts)
// =============================================================

export const seedUsers = {
  // role = identite plateforme (CLIENT). Les casquettes orga sont des relations :
  //   owner -> Organization.ownerId (cf. runSeed) ; member -> ligne Member (seedMembers).
  owner: {
    id: 'seed-user-owner',
    email: 'owner@cutbook.test',
    name: 'Nora Benali',
    phone: '+33102030405',
    role: Role.CLIENT,
    loyaltyPoints: 0,
  },
  memberOne: {
    id: 'seed-user-member-1',
    email: 'mila@cutbook.test',
    name: 'Mila Laurent',
    phone: '+33102030406',
    role: Role.CLIENT,
    loyaltyPoints: 0,
  },
  memberTwo: {
    id: 'seed-user-member-2',
    email: 'leo@cutbook.test',
    name: 'Leo Martin',
    phone: '+33102030407',
    role: Role.CLIENT,
    loyaltyPoints: 0,
  },
  clientOne: {
    id: 'seed-user-client-1',
    email: 'client@cutbook.test',
    name: 'Camille Durand',
    phone: '+33601020304',
    role: Role.CLIENT,
    loyaltyPoints: 120,
  },
  clientTwo: {
    id: 'seed-user-client-2',
    email: 'ines@cutbook.test',
    name: 'Ines Robert',
    phone: '+33601020305',
    role: Role.CLIENT,
    loyaltyPoints: 40,
  },
} as const

export const seedOrganization = {
  id: 'seed-org-atelier-nova',
  name: 'Atelier Nova',
  slug: 'atelier-nova',
  address: '18 rue des Martyrs, 75009 Paris',
  phone: '+33142880011',
  description:
    'Salon pilote CutBook pour tester la reservation, le planning equipe et les avis clients.',
  imageUrl:
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
}

export const seedMembers = {
  // Nora cumule owner + member : invariant garanti par la procedure tRPC
  // createOrganization (cf. lib/trpc/routers/organization.ts) qui cree
  // toujours une ligne Member pour le createur de l'orga. Le seed doit
  // refleter cet invariant sinon owner@cutbook.test apparait orphelin
  // dans /atelier-nova et ne peut pas exploiter /member.
  nora: {
    id: 'seed-member-nora',
    userId: seedUsers.owner.id,
    specialties: 'Direction du salon, coupes signature, formations',
    bio: "Fondatrice d'Atelier Nova, je supervise l'equipe et propose les coupes signature.",
    experience: 12,
  },
  mila: {
    id: 'seed-member-mila',
    userId: seedUsers.memberOne.id,
    specialties: 'Coupe femme, balayage, diagnostic couleur',
    bio: 'Specialiste couleur avec une approche precise et naturelle.',
    experience: 7,
  },
  leo: {
    id: 'seed-member-leo',
    userId: seedUsers.memberTwo.id,
    specialties: 'Coupe homme, barbe, entretien express',
    bio: 'Expert coupe courte et finitions propres.',
    experience: 5,
  },
} as const

export const seedServices = {
  cut: {
    id: 'seed-service-cut',
    name: 'Coupe & brushing',
    description: 'Diagnostic rapide, coupe et brushing.',
    duration: 60,
    price: 55,
  },
  color: {
    id: 'seed-service-color',
    name: 'Balayage signature',
    description: 'Balayage naturel avec patine et soin.',
    duration: 120,
    price: 145,
  },
  beard: {
    id: 'seed-service-beard',
    name: 'Coupe homme & barbe',
    description: 'Coupe, taille de barbe et finitions.',
    duration: 45,
    price: 42,
  },
} as const

export function dayFromNow(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(0, 0, 0, 0)
  return date
}

export function buildSeedTimeSlots() {
  return [
    {
      id: 'seed-slot-mila-1',
      memberId: seedMembers.mila.id,
      date: dayFromNow(1),
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: false,
    },
    {
      id: 'seed-slot-mila-2',
      memberId: seedMembers.mila.id,
      date: dayFromNow(1),
      startTime: '10:30',
      endTime: '11:30',
    },
    {
      id: 'seed-slot-mila-3',
      memberId: seedMembers.mila.id,
      date: dayFromNow(2),
      startTime: '14:00',
      endTime: '16:00',
    },
    {
      id: 'seed-slot-leo-1',
      memberId: seedMembers.leo.id,
      date: dayFromNow(1),
      startTime: '11:00',
      endTime: '11:45',
      isAvailable: false,
    },
    {
      id: 'seed-slot-leo-2',
      memberId: seedMembers.leo.id,
      date: dayFromNow(2),
      startTime: '09:30',
      endTime: '10:15',
    },
    {
      id: 'seed-slot-leo-3',
      memberId: seedMembers.leo.id,
      date: dayFromNow(3),
      startTime: '15:00',
      endTime: '15:45',
    },
  ]
}

export function buildSeedBookings() {
  return [
    {
      id: 'seed-booking-confirmed',
      clientId: seedUsers.clientOne.id,
      memberId: seedMembers.mila.id,
      serviceId: seedServices.cut.id,
      timeSlotId: 'seed-slot-mila-1',
      status: BookingStatus.CONFIRMED,
      totalPrice: seedServices.cut.price,
      notes: 'Premiere visite, souhaite garder de la longueur.',
    },
    {
      id: 'seed-booking-completed',
      clientId: seedUsers.clientTwo.id,
      memberId: seedMembers.leo.id,
      serviceId: seedServices.beard.id,
      timeSlotId: 'seed-slot-leo-1',
      status: BookingStatus.COMPLETED,
      totalPrice: seedServices.beard.price,
      completedAt: dayFromNow(-2),
    },
  ]
}

export function buildSeedMemberServices() {
  return [
    // Nora (gerante) maitrise les 3 prestations du salon.
    { memberId: seedMembers.nora.id, serviceId: seedServices.cut.id },
    { memberId: seedMembers.nora.id, serviceId: seedServices.color.id },
    { memberId: seedMembers.nora.id, serviceId: seedServices.beard.id },
    { memberId: seedMembers.mila.id, serviceId: seedServices.cut.id },
    { memberId: seedMembers.mila.id, serviceId: seedServices.color.id },
    { memberId: seedMembers.leo.id, serviceId: seedServices.beard.id },
  ]
}

export function buildSeedReviews() {
  return [
    {
      id: 'seed-review-mila',
      clientId: seedUsers.clientOne.id,
      memberId: seedMembers.mila.id,
      rating: 5,
      comment: 'Diagnostic clair et resultat tres naturel.',
    },
    {
      id: 'seed-review-leo',
      clientId: seedUsers.clientTwo.id,
      memberId: seedMembers.leo.id,
      rating: 4,
      comment: 'Rapide, propre, exactement ce que je voulais.',
    },
  ]
}

export function buildSeedRewards() {
  return [
    {
      id: 'seed-reward-available',
      clientId: seedUsers.clientOne.id,
      type: 'discount_20',
      status: RewardStatus.AVAILABLE,
      expirationDate: dayFromNow(45),
    },
    {
      id: 'seed-reward-used',
      clientId: seedUsers.clientTwo.id,
      type: 'free_care',
      status: RewardStatus.USED,
      expirationDate: dayFromNow(15),
      usedAt: dayFromNow(-3),
    },
  ]
}

// =============================================================
// RICH SEED — donnees demo realistes (3 orgas, 40 clients, ~150 bookings)
// Genere avec un RNG seede pour rester reproductible entre runs.
// =============================================================

const seedOrgIds = [
  'seed-org-atelier-nova',
  'seed-org-refuge',
  'seed-org-lumiere',
  'seed-org-onyx',
  'seed-org-zenza',
  'seed-org-encre',
] as const

const SEED_RNG_SEED = 20260528

const FIRST_NAMES = [
  'Amelie',
  'Hugo',
  'Sarah',
  'Mehdi',
  'Chloe',
  'Adrien',
  'Ines',
  'Yanis',
  'Lea',
  'Karim',
  'Manon',
  'Lucas',
  'Sofia',
  'Jules',
  'Anais',
  'Theo',
  'Lina',
  'Nathan',
  'Zoe',
  'Rayan',
  'Emma',
  'Antoine',
  'Lou',
  'Samuel',
  'Maya',
  'Gabriel',
  'Aya',
  'Romain',
  'Lena',
  'Maxime',
  'Naila',
  'Tristan',
  'Salome',
  'Enzo',
  'Olivia',
  'Mathis',
  'Eva',
  'Aymeric',
] as const

const LAST_NAMES = [
  'Bernard',
  'Petit',
  'Lambert',
  'Mercier',
  'Garnier',
  'Faure',
  'Roux',
  'Vincent',
  'Fontaine',
  'Chevalier',
  'Boyer',
  'Rousseau',
  'Renaud',
  'Lemoine',
  'Marchand',
  'Dupuis',
  'Guerin',
  'Renard',
  'Brunet',
  'Gauthier',
  'Roy',
  'Morel',
  'Gautier',
  'Aubert',
  'Henry',
  'Lefebvre',
  'Marin',
] as const

const REVIEW_COMMENTS = [
  'Super accueil, je reviendrai sans hesiter.',
  "Tres pro, a l'ecoute et resultat top.",
  'Pile ce que je voulais, merci beaucoup !',
  'Salon agreable, prestation soignee.',
  'Rapide et efficace, prix correct.',
  'Tres bon moment, equipe sympa.',
  "Resultat impeccable, j'adore.",
  'Bon rapport qualite/prix.',
  'Excellent conseil, prestation parfaite.',
  'Cadre chaleureux, je recommande.',
] as const

const SLOT_GRID = [
  { start: '09:00', end: '10:00' },
  { start: '10:15', end: '11:15' },
  { start: '11:30', end: '12:30' },
  { start: '14:00', end: '15:00' },
  { start: '15:15', end: '16:15' },
  { start: '16:30', end: '17:30' },
  { start: '17:45', end: '18:45' },
  { start: '19:00', end: '20:00' },
] as const

type ServiceDef = { suffix: string; name: string; duration: number; price: number; desc: string }
type MemberDef = {
  first: string
  last: string
  specialties: string
  bio: string
  experience: number
}
type OrgMeta = {
  id: string
  slug: string
  name: string
  address: string
  phone: string
  description: string
  imageUrl: string
}

const NOVA_EXTRA_SERVICES: ServiceDef[] = [
  {
    suffix: 'soin',
    name: 'Soin profond Olaplex',
    duration: 45,
    price: 38,
    desc: 'Soin reparateur en profondeur.',
  },
  {
    suffix: 'perm',
    name: 'Permanente vague',
    duration: 90,
    price: 95,
    desc: 'Permanente bouclee naturelle.',
  },
  {
    suffix: 'gloss',
    name: 'Gloss lumiere',
    duration: 45,
    price: 48,
    desc: 'Apport de brillance + ton sur ton.',
  },
  {
    suffix: 'kids',
    name: 'Coupe enfant',
    duration: 30,
    price: 28,
    desc: 'Coupe enfant moins de 12 ans.',
  },
  {
    suffix: 'wedding',
    name: 'Chignon ceremonie',
    duration: 75,
    price: 85,
    desc: 'Coiffure mariage / ceremonie.',
  },
]

const REFUGE_SERVICES: ServiceDef[] = [
  {
    suffix: 'classic',
    name: 'Coupe homme classique',
    duration: 45,
    price: 32,
    desc: 'Coupe a la tondeuse et aux ciseaux.',
  },
  {
    suffix: 'beard-trim',
    name: 'Taille de barbe',
    duration: 30,
    price: 22,
    desc: 'Sculpture + huile a barbe.',
  },
  {
    suffix: 'combo',
    name: 'Coupe + barbe',
    duration: 60,
    price: 48,
    desc: 'Le classique du barber.',
  },
  {
    suffix: 'shave',
    name: "Rasage a l'ancienne",
    duration: 45,
    price: 35,
    desc: 'Coupe-chou + serviette chaude.',
  },
  {
    suffix: 'kids-cut',
    name: 'Coupe enfant',
    duration: 30,
    price: 22,
    desc: 'Coupe enfant moins de 10 ans.',
  },
  {
    suffix: 'gray',
    name: 'Coloration cheveux gris',
    duration: 50,
    price: 42,
    desc: 'Camouflage des cheveux blancs.',
  },
  {
    suffix: 'massage',
    name: 'Massage cuir chevelu',
    duration: 20,
    price: 18,
    desc: 'Massage relaxant + huile essentielle.',
  },
  {
    suffix: 'student',
    name: 'Forfait etudiant',
    duration: 30,
    price: 22,
    desc: 'Coupe simple, sur carte etudiante.',
  },
]

const LUMIERE_SERVICES: ServiceDef[] = [
  {
    suffix: 'face',
    name: 'Soin du visage hydratant',
    duration: 60,
    price: 75,
    desc: 'Nettoyage, gommage, masque hydratant.',
  },
  {
    suffix: 'massage',
    name: 'Massage relaxant 60 min',
    duration: 60,
    price: 80,
    desc: 'Massage californien aux huiles essentielles.',
  },
  {
    suffix: 'legs',
    name: 'Epilation jambes completes',
    duration: 45,
    price: 38,
    desc: 'Cire tiede sans douleur.',
  },
  {
    suffix: 'manu',
    name: 'Manucure beaute des mains',
    duration: 45,
    price: 35,
    desc: 'Soin + pose de vernis.',
  },
  {
    suffix: 'pedi',
    name: 'Pedicure beaute des pieds',
    duration: 60,
    price: 45,
    desc: 'Soin complet + vernis.',
  },
  {
    suffix: 'makeup',
    name: 'Maquillage soiree',
    duration: 45,
    price: 55,
    desc: 'Maquillage personnalise evenement.',
  },
  {
    suffix: 'antiage',
    name: 'Soin anti-age premium',
    duration: 75,
    price: 110,
    desc: 'Soin liftant + radiofrequence.',
  },
  {
    suffix: 'lymph',
    name: 'Drainage lymphatique',
    duration: 60,
    price: 90,
    desc: 'Drainage manuel jambes lourdes.',
  },
]

const ONYX_SERVICES: ServiceDef[] = [
  {
    suffix: 'gel',
    name: 'Pose ongles en gel',
    duration: 75,
    price: 55,
    desc: 'Pose gel UV avec renforcement.',
  },
  {
    suffix: 'french',
    name: 'French manucure',
    duration: 45,
    price: 38,
    desc: 'La french classique, ligne nette.',
  },
  {
    suffix: 'art',
    name: 'Nail art creatif',
    duration: 90,
    price: 75,
    desc: 'Decors personnalises au choix.',
  },
  {
    suffix: 'capsules',
    name: 'Pose capsules',
    duration: 90,
    price: 65,
    desc: 'Allongement avec capsules + gel.',
  },
  {
    suffix: 'semi',
    name: 'Vernis semi-permanent',
    duration: 45,
    price: 32,
    desc: 'Tenue 3 semaines, finition brillante.',
  },
  {
    suffix: 'pedi',
    name: 'Beaute des pieds',
    duration: 60,
    price: 42,
    desc: 'Gommage, hydratation, pose vernis.',
  },
  {
    suffix: 'repair',
    name: 'Reparation ongle casse',
    duration: 20,
    price: 12,
    desc: 'Reparation rapide a la fibre.',
  },
  {
    suffix: 'remove',
    name: 'Depose complete',
    duration: 30,
    price: 18,
    desc: 'Depose gel + soin reparateur.',
  },
]

const ZENZA_SERVICES: ServiceDef[] = [
  {
    suffix: 'swed60',
    name: 'Massage suedois 60 min',
    duration: 60,
    price: 85,
    desc: 'Massage tonifiant musculaire.',
  },
  {
    suffix: 'thai90',
    name: 'Massage thai 90 min',
    duration: 90,
    price: 120,
    desc: 'Etirements et pression sur tatami.',
  },
  {
    suffix: 'stones',
    name: 'Massage pierres chaudes',
    duration: 75,
    price: 105,
    desc: 'Pierres volcaniques basaltiques.',
  },
  {
    suffix: 'prenat',
    name: 'Massage prenatal',
    duration: 60,
    price: 95,
    desc: 'Adapte aux futures mamans 2e/3e trim.',
  },
  {
    suffix: 'reflex',
    name: 'Reflexologie plantaire',
    duration: 45,
    price: 65,
    desc: 'Stimulation points reflexes.',
  },
  {
    suffix: 'duo',
    name: 'Massage duo 60 min',
    duration: 60,
    price: 160,
    desc: 'Massage en cabine partagee.',
  },
  {
    suffix: 'bain',
    name: 'Bain japonais ofuro',
    duration: 30,
    price: 45,
    desc: 'Bain chaud aromatique.',
  },
  {
    suffix: 'signature',
    name: 'Soin signature Zenza 2h',
    duration: 120,
    price: 195,
    desc: 'Rituel complet visage + corps.',
  },
]

const ENCRE_SERVICES: ServiceDef[] = [
  {
    suffix: 'consult',
    name: 'Consultation projet',
    duration: 30,
    price: 0,
    desc: 'Echange artiste + maquette.',
  },
  {
    suffix: 'mini',
    name: 'Tatouage mini (<5cm)',
    duration: 45,
    price: 80,
    desc: 'Petit tatouage simple, ligne fine.',
  },
  {
    suffix: 'medium',
    name: 'Tatouage moyen (1h)',
    duration: 60,
    price: 150,
    desc: 'Tatouage avant-bras / mollet.',
  },
  {
    suffix: 'large',
    name: 'Tatouage grand format',
    duration: 240,
    price: 480,
    desc: 'Sleeve ou piece dorsale (4h).',
  },
  {
    suffix: 'retouche',
    name: 'Retouche',
    duration: 30,
    price: 0,
    desc: 'Retouche gratuite dans les 6 mois.',
  },
  {
    suffix: 'cover',
    name: 'Cover-up',
    duration: 180,
    price: 380,
    desc: "Recouvrement d'un ancien tatouage.",
  },
  {
    suffix: 'flash',
    name: 'Tatouage flash',
    duration: 45,
    price: 110,
    desc: 'Modeles pre-dessines a la carte.',
  },
  {
    suffix: 'pierce',
    name: 'Piercing oreille',
    duration: 20,
    price: 35,
    desc: 'Lobe ou cartilage (bijou inclus).',
  },
]

const NOVA_EXTRA_MEMBERS: MemberDef[] = [
  {
    first: 'Yasmine',
    last: 'Petit',
    specialties: 'Coloration, balayage',
    bio: 'Coloriste creative.',
    experience: 6,
  },
  {
    first: 'Hugo',
    last: 'Faure',
    specialties: 'Coupe homme, barbe',
    bio: 'Coupe homme moderne.',
    experience: 4,
  },
]

const REFUGE_MEMBERS: MemberDef[] = [
  {
    first: 'Anthony',
    last: 'Moreau',
    specialties: 'Coupe homme classique, degrade americain',
    bio: 'Maitrise rasoir et degrades nets.',
    experience: 9,
  },
  {
    first: 'Bilal',
    last: 'Mansouri',
    specialties: 'Coupe + barbe, soin',
    bio: 'Barber depuis 2014, forme a Londres.',
    experience: 11,
  },
  {
    first: 'Jonathan',
    last: 'Rey',
    specialties: "Rasage a l'ancienne, taille de barbe",
    bio: 'Specialiste rasage traditionnel.',
    experience: 6,
  },
  {
    first: 'Reda',
    last: 'Khaldi',
    specialties: 'Coupe homme, coloration',
    bio: 'Coloriste homme et coupe creative.',
    experience: 4,
  },
]

const LUMIERE_MEMBERS: MemberDef[] = [
  {
    first: 'Emilie',
    last: 'Garnier',
    specialties: 'Soins visage, anti-age',
    bio: 'Estheticienne certifiee Sothys.',
    experience: 8,
  },
  {
    first: 'Aurelie',
    last: 'Da Silva',
    specialties: 'Massages, drainage lymphatique',
    bio: 'Masseuse formee en methodes manuelles.',
    experience: 6,
  },
  {
    first: 'Fatou',
    last: 'Ndiaye',
    specialties: 'Manucure, pedicure, nail art',
    bio: 'Prothesiste ongulaire passionnee.',
    experience: 5,
  },
  {
    first: 'Lea',
    last: 'Brunet',
    specialties: 'Maquillage, epilations',
    bio: 'Make-up artist + esthetique generale.',
    experience: 4,
  },
]

const ONYX_MEMBERS: MemberDef[] = [
  {
    first: 'Soraya',
    last: 'Belkacem',
    specialties: 'Gel, nail art',
    bio: 'Prothesiste ongulaire 6 ans, certifiee OPI.',
    experience: 6,
  },
  {
    first: 'Justine',
    last: 'Roy',
    specialties: 'French manucure, semi-permanent',
    bio: 'Specialiste finitions impeccables.',
    experience: 4,
  },
  {
    first: 'Priscilla',
    last: 'Da Costa',
    specialties: 'Capsules, allongement',
    bio: 'Maitrise de toutes les techniques de pose.',
    experience: 7,
  },
]

const ZENZA_MEMBERS: MemberDef[] = [
  {
    first: 'Akira',
    last: 'Yamamoto',
    specialties: 'Massage shiatsu, thai',
    bio: "Forme au Japon et en Thailande, 12 ans d'experience.",
    experience: 12,
  },
  {
    first: 'Camille',
    last: 'Berger',
    specialties: 'Massage prenatal, reflexologie',
    bio: 'Reflexologue diplomee FFR.',
    experience: 7,
  },
  {
    first: 'Mathieu',
    last: 'Olivier',
    specialties: 'Massage suedois, pierres chaudes',
    bio: 'Kinesitherapeute reconverti en masseur bien-etre.',
    experience: 9,
  },
  {
    first: 'Nadia',
    last: 'Boucher',
    specialties: 'Soins signature, rituels',
    bio: 'Praticienne spa formee chez Cinq Mondes.',
    experience: 5,
  },
]

const ENCRE_MEMBERS: MemberDef[] = [
  {
    first: 'Theo',
    last: 'Maillard',
    specialties: 'Realisme, portrait',
    bio: 'Tatoueur 10 ans, conventions internationales.',
    experience: 10,
  },
  {
    first: 'Manon',
    last: 'Lemoine',
    specialties: 'Fine line, botanique',
    bio: 'Style delicat, fleurs et lignes fines.',
    experience: 5,
  },
  {
    first: 'Soren',
    last: 'Karlsen',
    specialties: 'Old school, traditional',
    bio: 'Tatouage americain traditionnel, couleurs franches.',
    experience: 8,
  },
]

const ORG_REFUGE: OrgMeta = {
  id: 'seed-org-refuge',
  slug: 'barbershop-le-refuge',
  name: 'Barbershop Le Refuge',
  address: '7 rue de Bretagne, 75003 Paris',
  phone: '+33145220033',
  description: 'Barbershop traditionnel : coupe au rasoir, soin barbe, rasage chaud.',
  imageUrl:
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
}

const ORG_LUMIERE: OrgMeta = {
  id: 'seed-org-lumiere',
  slug: 'institut-lumiere',
  name: 'Institut Lumiere',
  address: '34 bd Beaumarchais, 75011 Paris',
  phone: '+33148720055',
  description: 'Institut de beaute : soins visage, massages, manucure et epilation.',
  imageUrl:
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
}

const ORG_ONYX: OrgMeta = {
  id: 'seed-org-onyx',
  slug: 'onyx-nail-bar',
  name: 'Onyx Nail Bar',
  address: '12 rue Tholoze, 75018 Paris',
  phone: '+33144920088',
  description: 'Nail bar contemporain : gel, capsules, nail art sur-mesure.',
  imageUrl:
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80',
}

const ORG_ZENZA: OrgMeta = {
  id: 'seed-org-zenza',
  slug: 'maison-zenza',
  name: 'Maison Zenza',
  address: '88 rue Oberkampf, 75011 Paris',
  phone: '+33147770099',
  description: 'Spa massage : suedois, thai, pierres chaudes, rituels signature.',
  imageUrl:
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
}

const ORG_ENCRE: OrgMeta = {
  id: 'seed-org-encre',
  slug: 'encre-noire',
  name: 'Encre Noire Tatouage',
  address: '23 rue de Clery, 75002 Paris',
  phone: '+33142360044',
  description: 'Studio tatouage : realisme, fine line, traditional, cover-up.',
  imageUrl:
    'https://images.unsplash.com/photo-1568515045052-f9a854d70bfd?auto=format&fit=crop&w=1200&q=80',
}

// Mulberry32 : PRNG seede pour generer un seed reproductible run apres run.
function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rand: () => number, arr: readonly T[]): T {
  const item = arr[Math.floor(rand() * arr.length)]
  if (item === undefined) throw new Error('pick() called on empty array')
  return item
}

function shuffle<T>(rand: () => number, arr: readonly T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = out[i] as T
    out[i] = out[j] as T
    out[j] = tmp
  }
  return out
}

// =============================================================
// HELPERS — clear + creation user demo
// =============================================================

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to seed the database')
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

// Capture aussi les enregistrements crees dynamiquement par les tests
// (membres rattaches aux orgas seed, invitations acceptees, paiements Stripe).
async function clearSeedData(prisma: PrismaClient) {
  const userRows = await prisma.user.findMany({
    where: { email: { endsWith: '@cutbook.test' } },
    select: { id: true },
  })
  const userIds = userRows.map((u) => u.id)

  const memberRows = await prisma.member.findMany({
    where: { OR: [{ orgId: { in: [...seedOrgIds] } }, { userId: { in: userIds } }] },
    select: { id: true },
  })
  const memberIds = memberRows.map((m) => m.id)

  const serviceRows = await prisma.service.findMany({
    where: { orgId: { in: [...seedOrgIds] } },
    select: { id: true },
  })
  const serviceIds = serviceRows.map((s) => s.id)

  const bookingRows = await prisma.booking.findMany({
    where: {
      OR: [
        { clientId: { in: userIds } },
        { memberId: { in: memberIds } },
        { serviceId: { in: serviceIds } },
      ],
    },
    select: { id: true },
  })
  const bookingIds = bookingRows.map((b) => b.id)

  // Ordre des deletes : enfants → parents pour respecter les FK.
  await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } })
  await prisma.memberInvitation.deleteMany({
    where: { OR: [{ orgId: { in: [...seedOrgIds] } }, { invitedById: { in: userIds } }] },
  })
  await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } })
  await prisma.review.deleteMany({
    where: { OR: [{ clientId: { in: userIds } }, { memberId: { in: memberIds } }] },
  })
  await prisma.reward.deleteMany({ where: { clientId: { in: userIds } } })
  await prisma.memberService.deleteMany({
    where: { OR: [{ memberId: { in: memberIds } }, { serviceId: { in: serviceIds } }] },
  })
  await prisma.timeSlot.deleteMany({ where: { memberId: { in: memberIds } } })
  await prisma.service.deleteMany({ where: { id: { in: serviceIds } } })
  await prisma.member.deleteMany({ where: { id: { in: memberIds } } })
  await prisma.organization.deleteMany({ where: { id: { in: [...seedOrgIds] } } })
  await prisma.account.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
}

type DemoUser = {
  id: string
  email: string
  name: string
  phone: string
  role: Role
  loyaltyPoints: number
}

async function createDemoUser(prisma: PrismaClient, user: DemoUser, passwordHash: string) {
  await prisma.user.create({
    data: { ...user, emailVerified: true },
  })

  await prisma.account.create({
    data: {
      id: `seed-account-${user.id}`,
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: passwordHash,
    },
  })
}

// =============================================================
// SEED ENRICHISSEMENT
// =============================================================

type OrgPlan = {
  org: OrgMeta
  ownerUser: DemoUser
  members: Array<{
    id: string
    userId: string
    email: string
    name: string
    specialties: string
    bio: string
    experience: number
  }>
  services: Array<{
    id: string
    name: string
    duration: number
    price: number
    description: string
  }>
}

function buildOrgPlan(
  orgMeta: OrgMeta,
  ownerDef: { first: string; last: string; phoneSuffix: string; userId: string },
  servicePool: ServiceDef[],
  memberSeeds: MemberDef[],
): OrgPlan {
  const orgKey = orgMeta.slug.split('-')[0] ?? orgMeta.slug

  return {
    org: orgMeta,
    ownerUser: {
      id: ownerDef.userId,
      email: `${ownerDef.first.toLowerCase()}@cutbook.test`,
      name: `${ownerDef.first} ${ownerDef.last}`,
      phone: ownerDef.phoneSuffix,
      role: Role.CLIENT,
      loyaltyPoints: 0,
    },
    services: servicePool.map((s) => ({
      id: `seed-service-${orgMeta.slug}-${s.suffix}`,
      name: s.name,
      duration: s.duration,
      price: s.price,
      description: s.desc,
    })),
    members: memberSeeds.map((m, i) => ({
      id: `seed-member-${orgMeta.slug}-${i + 1}`,
      userId: `seed-user-${orgMeta.slug}-member-${i + 1}`,
      email: `${m.first.toLowerCase()}.${orgKey}@cutbook.test`,
      name: `${m.first} ${m.last}`,
      specialties: m.specialties,
      bio: m.bio,
      experience: m.experience,
    })),
  }
}

async function seedRichContent(prisma: PrismaClient, passwordHash: string) {
  const rand = createRandom(SEED_RNG_SEED)

  const extraPlans: OrgPlan[] = [
    buildOrgPlan(
      ORG_REFUGE,
      { first: 'Karim', last: 'Aziz', phoneSuffix: '+33102030410', userId: 'seed-user-owner-2' },
      REFUGE_SERVICES,
      REFUGE_MEMBERS,
    ),
    buildOrgPlan(
      ORG_LUMIERE,
      {
        first: 'Sophie',
        last: 'Lambert',
        phoneSuffix: '+33102030411',
        userId: 'seed-user-owner-3',
      },
      LUMIERE_SERVICES,
      LUMIERE_MEMBERS,
    ),
    buildOrgPlan(
      ORG_ONYX,
      { first: 'Lena', last: 'Vidal', phoneSuffix: '+33102030412', userId: 'seed-user-owner-4' },
      ONYX_SERVICES,
      ONYX_MEMBERS,
    ),
    buildOrgPlan(
      ORG_ZENZA,
      {
        first: 'Thomas',
        last: 'Riviere',
        phoneSuffix: '+33102030413',
        userId: 'seed-user-owner-5',
      },
      ZENZA_SERVICES,
      ZENZA_MEMBERS,
    ),
    buildOrgPlan(
      ORG_ENCRE,
      {
        first: 'Mathilde',
        last: 'Vernet',
        phoneSuffix: '+33102030414',
        userId: 'seed-user-owner-6',
      },
      ENCRE_SERVICES,
      ENCRE_MEMBERS,
    ),
  ]

  for (const plan of extraPlans) {
    await createDemoUser(prisma, plan.ownerUser, passwordHash)
    for (const m of plan.members) {
      await createDemoUser(
        prisma,
        {
          id: m.userId,
          email: m.email,
          name: m.name,
          phone: '+33700000000',
          role: Role.CLIENT,
          loyaltyPoints: 0,
        },
        passwordHash,
      )
    }
  }

  // 2 membres en plus dans Atelier Nova (en plus de mila + leo)
  const novaExtraMembers = NOVA_EXTRA_MEMBERS.map((m, i) => ({
    id: `seed-member-nova-extra-${i + 1}`,
    userId: `seed-user-nova-extra-${i + 1}`,
    email: `${m.first.toLowerCase()}.nova@cutbook.test`,
    name: `${m.first} ${m.last}`,
    specialties: m.specialties,
    bio: m.bio,
    experience: m.experience,
  }))

  for (const m of novaExtraMembers) {
    await createDemoUser(
      prisma,
      {
        id: m.userId,
        email: m.email,
        name: m.name,
        phone: '+33700000001',
        role: Role.CLIENT,
        loyaltyPoints: 0,
      },
      passwordHash,
    )
  }

  // Orgas + membres + services pour chaque plan supplementaire
  for (const plan of extraPlans) {
    await prisma.organization.create({
      data: { ...plan.org, ownerId: plan.ownerUser.id },
    })
    await prisma.member.createMany({
      data: plan.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        orgId: plan.org.id,
        specialties: m.specialties,
        bio: m.bio,
        experience: m.experience,
      })),
    })
    await prisma.service.createMany({
      data: plan.services.map((s) => ({
        id: s.id,
        orgId: plan.org.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: s.price,
      })),
    })
  }

  // Extension catalogue Atelier Nova
  await prisma.member.createMany({
    data: novaExtraMembers.map((m) => ({
      id: m.id,
      userId: m.userId,
      orgId: seedOrganization.id,
      specialties: m.specialties,
      bio: m.bio,
      experience: m.experience,
    })),
  })
  const novaExtraServices = NOVA_EXTRA_SERVICES.map((s) => ({
    id: `seed-service-nova-${s.suffix}`,
    orgId: seedOrganization.id,
    name: s.name,
    description: s.desc,
    duration: s.duration,
    price: s.price,
  }))
  await prisma.service.createMany({ data: novaExtraServices })

  // MemberService : chaque membre a son catalogue specialise (plus realiste
  // qu'un salon ou tout le monde fait tout), et indispensable pour preserver
  // l'invariant intra-org utilise par les tests d'integration
  // ("service non propose par le membre") :
  //   - Nora       : 3 prestations historiques (geante polyvalente, cumule owner+member)
  //   - Mila       : cut + color uniquement (specialiste femme/couleur)
  //   - Leo        : beard uniquement (specialiste homme/barbe)
  //   - Hugo/Yasmine (extras) : portent les nouvelles prestations Nova (Olaplex, Permanente, etc.)
  type MemberCatalog = { id: string; orgId: string; serviceIds: string[] }
  const novaExtraServiceIds = novaExtraServices.map((s) => s.id)
  const memberCatalogs: MemberCatalog[] = [
    {
      id: seedMembers.nora.id,
      orgId: seedOrganization.id,
      serviceIds: [seedServices.cut.id, seedServices.color.id, seedServices.beard.id],
    },
    {
      id: seedMembers.mila.id,
      orgId: seedOrganization.id,
      serviceIds: [seedServices.cut.id, seedServices.color.id],
    },
    {
      id: seedMembers.leo.id,
      orgId: seedOrganization.id,
      serviceIds: [seedServices.beard.id],
    },
    ...novaExtraMembers.map((m) => ({
      id: m.id,
      orgId: seedOrganization.id,
      serviceIds: novaExtraServiceIds,
    })),
    ...extraPlans.flatMap((plan) =>
      plan.members.map((m) => ({
        id: m.id,
        orgId: plan.org.id,
        serviceIds: plan.services.map((s) => s.id),
      })),
    ),
  ]

  const memberServiceRows: Array<{ memberId: string; serviceId: string }> = []
  for (const m of memberCatalogs) {
    for (const sid of m.serviceIds) {
      memberServiceRows.push({ memberId: m.id, serviceId: sid })
    }
  }
  // skipDuplicates : les memberService du core seed (mila/leo) sont deja inseres
  // avant cette fonction par runSeed().
  await prisma.memberService.createMany({ data: memberServiceRows, skipDuplicates: true })

  // 38 clients supplementaires pour atteindre 40 au total
  const shuffledFirstNames = shuffle(rand, FIRST_NAMES)
  const additionalClients: DemoUser[] = []
  for (let i = 0; i < 38; i++) {
    const firstName = shuffledFirstNames[i % shuffledFirstNames.length] ?? 'Anon'
    const lastName = pick(rand, LAST_NAMES)
    const emailSlug = firstName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z]/g, '')
    additionalClients.push({
      id: `seed-user-client-${i + 3}`,
      email: `${emailSlug}-${i + 3}@cutbook.test`,
      name: `${firstName} ${lastName}`,
      phone: `+336${String(Math.floor(10000000 + rand() * 89999999)).padStart(8, '0')}`,
      role: Role.CLIENT,
      loyaltyPoints: 0,
    })
  }
  for (const c of additionalClients) {
    await createDemoUser(prisma, c, passwordHash)
  }

  // Catalogue prix/duree pour calcul totalPrice booking
  const priceLookup = new Map<string, { price: number; duration: number }>()
  priceLookup.set(seedServices.cut.id, {
    price: seedServices.cut.price,
    duration: seedServices.cut.duration,
  })
  priceLookup.set(seedServices.color.id, {
    price: seedServices.color.price,
    duration: seedServices.color.duration,
  })
  priceLookup.set(seedServices.beard.id, {
    price: seedServices.beard.price,
    duration: seedServices.beard.duration,
  })
  for (const s of novaExtraServices) {
    priceLookup.set(s.id, { price: s.price, duration: s.duration })
  }
  for (const plan of extraPlans) {
    for (const s of plan.services) {
      priceLookup.set(s.id, { price: s.price, duration: s.duration })
    }
  }

  // Slots du core seed deja inseres avant : on les enregistre dans usedSlots
  // pour eviter une collision (memberId, date, startTime) avec le rich seed.
  const usedSlots = new Set<string>()
  for (const s of buildSeedTimeSlots()) {
    usedSlots.add(`${s.memberId}|${s.date.toISOString().slice(0, 10)}|${s.startTime}`)
  }

  const allClients: DemoUser[] = [seedUsers.clientOne, seedUsers.clientTwo, ...additionalClients]
  const completedCountByClient = new Map<string, number>()

  type SlotRow = {
    id: string
    memberId: string
    date: Date
    startTime: string
    endTime: string
    isAvailable: boolean
  }
  type BookingRow = {
    id: string
    clientId: string
    memberId: string
    serviceId: string
    timeSlotId: string
    status: BookingStatus
    totalPrice: number
    completedAt?: Date
    createdAt: Date
  }
  type PaymentRow = {
    id: string
    bookingId: string
    amount: number
    currency: string
    status: PaymentStatus
    stripePaymentIntentId: string
    receiptUrl?: string
    paidAt?: Date
    createdAt: Date
  }
  type ReviewRow = {
    id: string
    clientId: string
    memberId: string
    rating: number
    comment: string
    createdAt: Date
  }

  const slotsToCreate: SlotRow[] = []
  const bookingsToCreate: BookingRow[] = []
  const paymentsToCreate: PaymentRow[] = []
  const reviewsToCreate: ReviewRow[] = []

  const TARGET_BOOKINGS = 150
  let bookingCounter = 0
  let attempts = 0

  while (bookingCounter < TARGET_BOOKINGS && attempts < TARGET_BOOKINGS * 4) {
    attempts++
    const member = pick(rand, memberCatalogs)
    const serviceId = pick(rand, member.serviceIds)
    const meta = priceLookup.get(serviceId)
    if (!meta) continue

    // Fenetre temporelle : -90 jours a +30 jours
    const dayOffset = Math.floor(rand() * 120) - 90
    const candidate = dayFromNow(dayOffset)
    // Pas de RDV le dimanche (orgas fermees)
    if (candidate.getDay() === 0) continue

    const slot = pick(rand, SLOT_GRID)
    const slotKey = `${member.id}|${candidate.toISOString().slice(0, 10)}|${slot.start}`
    if (usedSlots.has(slotKey)) continue
    usedSlots.add(slotKey)

    const isPast = dayOffset < 0
    let status: BookingStatus
    if (isPast) {
      status = rand() < 0.9 ? BookingStatus.COMPLETED : BookingStatus.CANCELLED
    } else {
      const r = rand()
      if (r < 0.85) status = BookingStatus.CONFIRMED
      else if (r < 0.95) status = BookingStatus.PENDING
      else status = BookingStatus.CANCELLED
    }

    const client = pick(rand, allClients)
    const slotId = `seed-slot-rich-${bookingCounter}`
    const bookingId = `seed-booking-rich-${bookingCounter}`

    const createdAt = new Date(candidate)
    createdAt.setDate(createdAt.getDate() - Math.floor(rand() * 14) - 1)

    slotsToCreate.push({
      id: slotId,
      memberId: member.id,
      date: candidate,
      startTime: slot.start,
      endTime: slot.end,
      // Annulation : slot redevient libre
      isAvailable: status === BookingStatus.CANCELLED,
    })

    bookingsToCreate.push({
      id: bookingId,
      clientId: client.id,
      memberId: member.id,
      serviceId,
      timeSlotId: slotId,
      status,
      totalPrice: meta.price,
      completedAt: status === BookingStatus.COMPLETED ? candidate : undefined,
      createdAt,
    })

    // Paiement Stripe : 60% des completed payes, 30% des confirmed payes
    const willPay =
      (status === BookingStatus.COMPLETED && rand() < 0.6) ||
      (status === BookingStatus.CONFIRMED && rand() < 0.3)
    if (willPay) {
      paymentsToCreate.push({
        id: `seed-payment-${bookingCounter}`,
        bookingId,
        amount: meta.price,
        currency: 'eur',
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: `pi_seed_${bookingCounter}`,
        receiptUrl: `https://pay.stripe.com/receipts/seed/${bookingCounter}`,
        paidAt: status === BookingStatus.COMPLETED ? candidate : createdAt,
        createdAt,
      })
    }

    // Avis : 70% des completed laissent un avis
    if (status === BookingStatus.COMPLETED && rand() < 0.7) {
      const r = rand()
      const rating = r < 0.7 ? 5 : r < 0.9 ? 4 : 3
      reviewsToCreate.push({
        id: `seed-review-rich-${bookingCounter}`,
        clientId: client.id,
        memberId: member.id,
        rating,
        comment: pick(rand, REVIEW_COMMENTS),
        createdAt: new Date(candidate.getTime() + 24 * 60 * 60 * 1000),
      })
    }

    if (status === BookingStatus.COMPLETED) {
      completedCountByClient.set(client.id, (completedCountByClient.get(client.id) ?? 0) + 1)
    }

    bookingCounter++
  }

  // Slots libres futurs : remplit le planning visible (3 prochaines semaines)
  // pour donner un effet "calendrier vivant" cote owner/membre.
  let freeSlotCounter = 0
  for (const member of memberCatalogs) {
    for (let d = 0; d <= 21; d++) {
      const date = dayFromNow(d)
      if (date.getDay() === 0) continue
      for (const slot of SLOT_GRID) {
        const key = `${member.id}|${date.toISOString().slice(0, 10)}|${slot.start}`
        if (usedSlots.has(key)) continue
        // Densite ~50% : un planning charge mais avec des creneaux dispos
        if (rand() > 0.5) continue
        usedSlots.add(key)
        slotsToCreate.push({
          id: `seed-slot-free-${freeSlotCounter++}`,
          memberId: member.id,
          date,
          startTime: slot.start,
          endTime: slot.end,
          isAvailable: true,
        })
      }
    }
  }

  await prisma.timeSlot.createMany({ data: slotsToCreate })
  await prisma.booking.createMany({ data: bookingsToCreate })
  await prisma.payment.createMany({ data: paymentsToCreate })
  await prisma.review.createMany({ data: reviewsToCreate })

  // Rewards : 30% des clients additionnels ont au moins une carte de fidelite
  const rewardTypes = ['discount_20', 'discount_10', 'free_care', 'free_haircut'] as const
  const rewardsToCreate: Array<{
    id: string
    clientId: string
    type: string
    status: RewardStatus
    expirationDate: Date
    usedAt?: Date
  }> = []
  let rewardCounter = 0
  for (const client of additionalClients) {
    if (rand() > 0.3) continue
    const status = rand() < 0.7 ? RewardStatus.AVAILABLE : RewardStatus.USED
    rewardsToCreate.push({
      id: `seed-reward-rich-${rewardCounter++}`,
      clientId: client.id,
      type: pick(rand, rewardTypes),
      status,
      expirationDate: dayFromNow(30 + Math.floor(rand() * 60)),
      usedAt: status === RewardStatus.USED ? dayFromNow(-Math.floor(rand() * 30) - 1) : undefined,
    })
  }
  await prisma.reward.createMany({ data: rewardsToCreate })

  // Loyalty points = 10 pts par RDV completed
  // (les clients nominatifs clientOne/clientTwo gardent leur valeur deja seedee)
  for (const [clientId, count] of completedCountByClient.entries()) {
    if (clientId === seedUsers.clientOne.id || clientId === seedUsers.clientTwo.id) continue
    await prisma.user.update({
      where: { id: clientId },
      data: { loyaltyPoints: count * 10 },
    })
  }

  const extraMembersCount = extraPlans.reduce((acc, p) => acc + p.members.length, 0)
  const extraServicesCount = extraPlans.reduce((acc, p) => acc + p.services.length, 0)

  return {
    orgs: 1 + extraPlans.length,
    members: 2 + novaExtraMembers.length + extraMembersCount,
    clients: 2 + additionalClients.length,
    services: 3 + novaExtraServices.length + extraServicesCount,
    slots: slotsToCreate.length,
    bookings: bookingsToCreate.length,
    payments: paymentsToCreate.length,
    reviews: reviewsToCreate.length,
    rewards: rewardsToCreate.length,
  }
}

// =============================================================
// RUN
// =============================================================

export async function runSeed() {
  const prisma = createPrismaClient()

  try {
    console.log('Seeding...')

    await clearSeedData(prisma)

    const seedPassword = process.env.SEED_USER_PASSWORD ?? defaultSeedPassword
    const passwordHash = await hashPassword(seedPassword)

    for (const user of Object.values(seedUsers)) {
      await createDemoUser(prisma, user, passwordHash)
    }

    await prisma.organization.create({
      data: {
        ...seedOrganization,
        ownerId: seedUsers.owner.id,
      },
    })

    await prisma.member.createMany({
      data: [
        { ...seedMembers.nora, orgId: seedOrganization.id },
        { ...seedMembers.mila, orgId: seedOrganization.id },
        { ...seedMembers.leo, orgId: seedOrganization.id },
      ],
    })

    await prisma.service.createMany({
      data: Object.values(seedServices).map((service) => ({
        ...service,
        orgId: seedOrganization.id,
      })),
    })

    await prisma.timeSlot.createMany({ data: buildSeedTimeSlots() })
    await prisma.memberService.createMany({ data: buildSeedMemberServices() })
    await prisma.booking.createMany({ data: buildSeedBookings() })
    await prisma.review.createMany({ data: buildSeedReviews() })
    await prisma.reward.createMany({ data: buildSeedRewards() })

    const stats = await seedRichContent(prisma, passwordHash)

    console.log('Seed termine')
    console.log(
      `Stats : ${stats.orgs} orgas / ${stats.members} membres / ${stats.clients} clients / ${stats.services} services / ${stats.slots} slots / ${stats.bookings} bookings / ${stats.payments} paiements / ${stats.reviews} avis / ${stats.rewards} rewards`,
    )
    console.log('Identifiants complets : voir docs/seed-credentials.md')
    console.log(`Mot de passe demo : variable SEED_USER_PASSWORD ou ${defaultSeedPassword}`)
  } finally {
    await prisma.$disconnect()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed().catch((e: unknown) => {
    console.error('Seed echec :', e)
    process.exit(1)
  })
}
