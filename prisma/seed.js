const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const empPassword = await bcrypt.hash('Employee@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password: empPassword,
      role: 'employee',
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: empPassword,
      role: 'employee',
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Setup project environment',
        description: 'Configure development environment and install all required dependencies',
        assignedTo: employee1.id,
        status: 'completed',
        dueDate: new Date('2025-06-30'),
      },
      {
        title: 'Design database schema',
        description: 'Create ER diagram and finalize the MySQL schema for all modules',
        assignedTo: employee1.id,
        status: 'in_progress',
        dueDate: new Date('2025-07-15'),
      },
      {
        title: 'Build REST API endpoints',
        description: 'Implement all required CRUD API endpoints with proper validation',
        assignedTo: employee2.id,
        status: 'pending',
        dueDate: new Date('2025-07-31'),
      },
      {
        title: 'Write unit tests',
        description: 'Cover all service-layer functions with unit tests',
        assignedTo: employee2.id,
        status: 'pending',
        dueDate: new Date('2025-08-15'),
      },
    ],
    skipDuplicates: true,
  });

  console.log('\nSeed completed successfully!');
  console.log('------------------------------------------');
  console.log('Admin     : admin@example.com  / Admin@123');
  console.log('Employee 1: john@example.com   / Employee@123');
  console.log('Employee 2: jane@example.com   / Employee@123');
  console.log('------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
