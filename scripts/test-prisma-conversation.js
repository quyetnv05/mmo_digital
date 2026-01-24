
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        let result = '';
        if (prisma.conversation) {
            result = 'conversation: DEFINED';
        } else {
            result = 'conversation: UNDEFINED';
        }
        fs.writeFileSync('test-result.txt', result);
    } catch (e) {
        fs.writeFileSync('test-result.txt', 'ERROR: ' + e.toString());
    } finally {
        await prisma.$disconnect();
    }
}

main();
