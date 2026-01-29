/**
 * Schools database - centralized list of all schools
 * Used by ProfileForm and SchoolsStep
 */

import { School } from '@/types'

export const SCHOOLS_DATABASE: School[] = [
  {
    id: '1',
    name: 'Stanford University',
    tier: 'Reach',
    satRange: [1470, 1570],
    actRange: [33, 35],
    admissionRate: 3.4,
    majorOfferingsCount: 275,
  },
  {
    id: '2',
    name: 'Harvard University',
    tier: 'Reach',
    satRange: [1480, 1570],
    actRange: [33, 35],
    admissionRate: 3.2,
    majorOfferingsCount: 86,
  },
  {
    id: '3',
    name: 'MIT',
    tier: 'Reach',
    satRange: [1500, 1570],
    actRange: [34, 35],
    admissionRate: 2.7,
    majorOfferingsCount: 30,
  },
  {
    id: '4',
    name: 'University of Pennsylvania',
    tier: 'Reach',
    satRange: [1450, 1560],
    actRange: [33, 35],
    admissionRate: 3.2,
    majorOfferingsCount: 280,
  },
  {
    id: '5',
    name: 'Northwestern University',
    tier: 'Reach',
    satRange: [1440, 1550],
    actRange: [32, 35],
    admissionRate: 5.6,
    majorOfferingsCount: 220,
  },
  {
    id: '6',
    name: 'UC Berkeley',
    tier: 'Target',
    satRange: [1320, 1540],
    actRange: [29, 35],
    admissionRate: 8.7,
    majorOfferingsCount: 350,
  },
  {
    id: '7',
    name: 'Michigan State University',
    tier: 'Target',
    satRange: [1140, 1340],
    actRange: [24, 31],
    admissionRate: 64.2,
    majorOfferingsCount: 200,
  },
  {
    id: '8',
    name: 'State University of New York',
    tier: 'Safety',
    satRange: [1000, 1200],
    actRange: [20, 27],
    admissionRate: 41.2,
    majorOfferingsCount: 250,
  },
]
