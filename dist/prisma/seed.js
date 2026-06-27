"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const adminPassword = await bcrypt.hash('Admin@1234', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@copaila.org' },
        update: {},
        create: {
            email: 'admin@copaila.org',
            password: adminPassword,
            name: 'CoPaila Admin',
            role: client_1.UserRole.SUPER_ADMIN,
        },
    });
    console.log('Admin user:', admin.email);
    const demoSchool = await prisma.school.upsert({
        where: { email: 'demo@greenvalley.edu.np' },
        update: {},
        create: {
            name: 'Green Valley School',
            slug: 'green-valley-school-lalitpur',
            contactName: 'Ram Sharma',
            contactRole: client_1.SchoolContactRole.PRINCIPAL,
            email: 'demo@greenvalley.edu.np',
            phone: '+977-1-5552345',
            province: client_1.Province.BAGMATI,
            district: 'Lalitpur',
            areaType: client_1.AreaType.URBAN,
            schoolType: client_1.SchoolType.PRIVATE,
            enrollment: client_1.EnrollmentRange.RANGE_100_500,
            electricity: client_1.ElectricityAvailability.LOAD_SHEDDING,
            connectivity: client_1.InternetConnectivity.INTERMITTENT,
            language: client_1.PreferredLanguage.ENGLISH,
            status: client_1.SchoolStatus.ACTIVE,
            accessMode: client_1.AccessMode.HYBRID,
        },
    });
    console.log('Demo school:', demoSchool.name);
    const schoolAdminPassword = await bcrypt.hash('School@1234', 12);
    const schoolAdmin = await prisma.user.upsert({
        where: { email: 'demo@greenvalley.edu.np' },
        update: {},
        create: {
            email: 'principal@greenvalley.edu.np',
            password: schoolAdminPassword,
            name: 'Ram Sharma',
            role: client_1.UserRole.SCHOOL_ADMIN,
            schoolId: demoSchool.id,
        },
    });
    console.log('School admin:', schoolAdmin.email);
    console.log('Seed complete.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map