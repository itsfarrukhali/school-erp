
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking prisma.studentAdmission...');
  if (prisma.studentAdmission) {
    console.log('prisma.studentAdmission EXISTS');
  } else {
    console.log('prisma.studentAdmission DOES NOT EXIST');
    console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
