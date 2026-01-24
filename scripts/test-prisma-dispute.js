
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Checking prisma.disputeMessage...');
    if (prisma.disputeMessage) {
        console.log('prisma.disputeMessage is DEFINED.');
        try {
            const count = await prisma.disputeMessage.count();
            console.log('Count:', count);
        } catch (e) {
            console.error('Error querying:', e);
        }
    } else {
        console.error('prisma.disputeMessage is UNDEFINED.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
