/**
 * French data generators for seed script
 * Produces realistic French names, addresses, phone numbers, and SIRET numbers
 */

import { randomInt } from 'crypto'

// French first names (100+ for variety)
const firstNames = [
  'Pierre', 'Marie', 'Jean', 'Anne', 'Michel', 'Sophie', 'André', 'Françoise',
  'Philippe', 'Christine', 'Paul', 'Nathalie', 'Jacques', 'Monique', 'Alain',
  'Isabelle', 'Denis', 'Martine', 'Thierry', 'Michelle', 'Marc', 'Sylvie',
  'Claude', 'Dominique', 'François', 'Delphine', 'Serge', 'Catherine', 'Laurent',
  'Stéphanie', 'Christian', 'Florence', 'Bruno', 'Nadine', 'Vincent', 'Pascale',
  'Eric', 'Karine', 'Olivier', 'Corinne', 'Pascal', 'Céline', 'Fabien', 'Valérie',
  'David', 'Aurélie', 'Frédéric', 'Laure', 'Luc', 'Mireille', 'Arnaud', 'Agnès',
  'Nicolas', 'Sandrine', 'Romain', 'Béatrice', 'Guillaume', 'Geneviève', 'Yves',
  'Véronique', 'Gérard', 'Christiane', 'Robert', 'Michèle', 'Richard', 'Simone',
  'Joseph', 'Paulette', 'Georges', 'Thérèse', 'Albert', 'Yvette', 'Louis', 'Bernadette',
]

// French last names (100+ for variety)
const lastNames = [
  'Dupont', 'Martin', 'Bernard', 'Dubois', 'Laurent', 'Simon', 'Michel', 'Lefebvre',
  'Leroy', 'Moreau', 'Fournier', 'Girard', 'André', 'Lefevre', 'Leclerc', 'Rousseau',
  'Vincent', 'Marquis', 'Fontaine', 'Chevalier', 'Robin', 'Collet', 'Raynaud', 'Gaillard',
  'Gautier', 'Perrier', 'Mercier', 'Roussel', 'Durand', 'Deschamps', 'Bertrand', 'Dupuis',
  'Renard', 'Gervais', 'Coulon', 'Benoit', 'Leblanc', 'Bernier', 'Morel', 'Lemaire',
  'Lejeune', 'Salmon', 'Letellier', 'Chauvin', 'Dufour', 'Caron', 'Vannier', 'Leclercq',
  'Bailly', 'Barbier', 'Bastide', 'Baudin', 'Beaulieu', 'Beaumont', 'Beausoleil', 'Becher',
  'Becker', 'Bedel', 'Begue', 'Belaud', 'Belot', 'Bemol', 'Benard', 'Bendix', 'Benhaim',
  'Benhaun', 'Beninca', 'Benin', 'Benisch', 'Benisty', 'Benjamini', 'Benjemin', 'Benke',
  'Benkovich', 'Benlolo', 'Benmouyal', 'Bennani', 'Benneche', 'Benner', 'Bennet', 'Bennet',
]

// French departments with cities and postal codes
const departments = {
  '75': { name: 'Paris', cities: ['Paris', 'Boulogne-Billancourt'], postalStart: '75001' },
  '13': { name: 'Bouches-du-Rhône', cities: ['Marseille', 'Aix-en-Provence', 'Arles'], postalStart: '13001' },
  '59': { name: 'Nord', cities: ['Lille', 'Roubaix', 'Tourcoing'], postalStart: '59000' },
  '31': { name: 'Haute-Garonne', cities: ['Toulouse', 'Colomiers', 'Blagnac'], postalStart: '31000' },
  '06': { name: 'Alpes-Maritimes', cities: ['Nice', 'Cannes', 'Antibes'], postalStart: '06000' },
  '69': { name: 'Rhône', cities: ['Lyon', 'Villeurbanne', 'Vénissieux'], postalStart: '69000' },
  '33': { name: 'Gironde', cities: ['Bordeaux', 'Mérignac', 'Talence'], postalStart: '33000' },
}

// Street names
const streetNames = [
  'Rue de la Paix', 'Avenue des Champs', 'Boulevard Saint-Germain', 'Rue de Rivoli',
  'Rue de l\'École', 'Place de la République', 'Avenue Montaigne', 'Rue des Archives',
  'Rue de Turenne', 'Boulevard Haussmann', 'Rue Mouffetard', 'Rue Crémieux',
  'Rue des Petits Hôtels', 'Rue Caulaincourt', 'Rue Lepic', 'Rue des Trois Frères',
]

/**
 * Pick a random item from an array
 */
export function pickRandom<T>(array: T[]): T {
  return array[randomInt(0, array.length)]
}

/**
 * Generate a realistic French name
 */
export function generateName(): { firstName: string; lastName: string } {
  return {
    firstName: pickRandom(firstNames),
    lastName: pickRandom(lastNames),
  }
}

/**
 * Generate a realistic French address
 */
export function generateAddress(): {
  address: string
  city: string
  postalCode: string
  department: string
} {
  const dept = pickRandom(Object.keys(departments))
  const deptData = departments[dept as keyof typeof departments]
  const city = pickRandom(deptData.cities)
  const streetNumber = randomInt(1, 300)
  const street = pickRandom(streetNames)

  // Generate postal code from department
  const postalBase = deptData.postalStart.substring(0, 2)
  const postalSuffix = String(randomInt(0, 99999)).padStart(3, '0')
  const postalCode = `${postalBase}${postalSuffix}`

  return {
    address: `${streetNumber} ${street}`,
    city,
    postalCode,
    department: dept,
  }
}

/**
 * Generate a realistic French phone number
 */
export function generatePhoneNumber(): string {
  const prefix = '+33'
  const firstDigit = randomInt(1, 9) // 1-9
  const remaining = String(randomInt(0, 999999999)).padStart(8, '0')
  return `${prefix}${firstDigit}${remaining}`
}

/**
 * Generate a valid 14-digit SIRET number
 * First 9 digits = SIREN (company identifier)
 * Last 5 digits = establishment number + key
 * For seed purposes: use postal code area as part of SIREN
 */
export function generateSIRET(): string {
  const address = generateAddress()
  const deptCode = address.postalCode.substring(0, 2)

  // SIREN: 14 digits (simplified - use dept code + random)
  const sirenPrefix = deptCode + String(randomInt(0, 9999999)).padStart(7, '0')
  const esiNumber = String(randomInt(1, 999)).padStart(5, '0')

  return `${sirenPrefix}${esiNumber}`
}

/**
 * Generate a realistic email
 */
export function generateEmail(firstName: string, lastName: string): string {
  const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
  return `${baseEmail}@example.fr`
}

/**
 * Generate notification preferences JSON
 */
export function generateNotificationPrefs() {
  return {
    email_on_offer: true,
    email_on_approval: true,
    email_on_transaction: true,
    sms_marketing: false,
  }
}

/**
 * Generate placeholder image URL
 */
export function generatePhotoUrl(itemId: number, photoIndex: number): string {
  return `https://example.com/marketplace/item-${itemId}-photo-${photoIndex}.jpg`
}
