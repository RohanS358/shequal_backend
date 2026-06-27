import { PrismaClient, UserRole, Province, AreaType, SchoolType, SchoolContactRole, EnrollmentRange, ElectricityAvailability, InternetConnectivity, PreferredLanguage, SchoolStatus, AccessMode } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Seed a super admin user (no school affiliation)
  const adminPassword = await bcrypt.hash('Admin@1234', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@copaila.org' },
    update: {},
    create: {
      email: 'admin@copaila.org',
      password: adminPassword,
      name: 'CoPaila Admin',
      role: UserRole.SUPER_ADMIN,
    },
  })
  console.log('Admin user:', admin.email)

  // Seed a demo school
  const demoSchool = await prisma.school.upsert({
    where: { email: 'demo@greenvalley.edu.np' },
    update: {},
    create: {
      name: 'Green Valley School',
      slug: 'green-valley-school-lalitpur',
      contactName: 'Ram Sharma',
      contactRole: SchoolContactRole.PRINCIPAL,
      email: 'demo@greenvalley.edu.np',
      phone: '+977-1-5552345',
      province: Province.BAGMATI,
      district: 'Lalitpur',
      areaType: AreaType.URBAN,
      schoolType: SchoolType.PRIVATE,
      enrollment: EnrollmentRange.RANGE_100_500,
      electricity: ElectricityAvailability.LOAD_SHEDDING,
      connectivity: InternetConnectivity.INTERMITTENT,
      language: PreferredLanguage.ENGLISH,
      status: SchoolStatus.ACTIVE,
      accessMode: AccessMode.HYBRID,
    },
  })
  console.log('Demo school:', demoSchool.name)

  // Seed a demo school admin user
  const schoolAdminPassword = await bcrypt.hash('School@1234', 12)
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'demo@greenvalley.edu.np' },
    update: {},
    create: {
      email: 'principal@greenvalley.edu.np',
      password: schoolAdminPassword,
      name: 'Ram Sharma',
      role: UserRole.SCHOOL_ADMIN,
      schoolId: demoSchool.id,
    },
  })
  console.log('School admin:', schoolAdmin.email)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
