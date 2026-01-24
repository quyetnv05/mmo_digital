import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// 1. Auth Helper
async function getUserId(): Promise<number | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        return decoded.userId;
    } catch {
        return null;
    }
}

// 2. Define Tools (Functions) for AI
const tools = {
    getBalance: async (userId: number) => {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true, pendingBalance: true }
        });
        return user ? {
            balance: Number(user.balance),
            pendingBalance: Number(user.pendingBalance),
            currency: 'VND'
        } : null;
    },
    getRecentTransactions: async (userId: number) => {
        const txs = await prisma.transaction.findMany({
            where: { userId, type: 'DEPOSIT' },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                amount: true,
                status: true,
                referenceCode: true,
                createdAt: true
            }
        });
        return txs.map((t: any) => ({
            ...t,
            amount: Number(t.amount),
            createdAt: t.createdAt.toISOString()
        }));
    },
    searchProducts: async (query: string) => {
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { category: { name: { contains: query, mode: 'insensitive' } } }
                ],
                status: 'ACTIVE'
            },
            take: 5,
            select: {
                id: true,
                name: true,
                price: true,
                category: { select: { name: true } },
                _count: { select: { items: { where: { isSold: false } } } }
            }
        });
        return products.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category.name,
            stock: p._count.items,
            link: `https://mmo-digital.vercel.app/products/${p.id}`
        }));
    },
    checkTransactionStatus: async (code: string) => {
        const tx = await prisma.transaction.findFirst({
            where: { referenceCode: { contains: code, mode: 'insensitive' } },
            select: { status: true, amount: true, createdAt: true }
        });
        return tx ? {
            status: tx.status,
            amount: Number(tx.amount),
            createdAt: tx.createdAt.toISOString()
        } : { status: 'NOT_FOUND', message: 'Transaction not found with this code.' };
    }
};

// 3. Main Chat Route
export async function POST(req: NextRequest) {
    try {
        // Auth Check
        const userId = await getUserId();
        // Allow unauthenticated chat for general product queries, but limit personal data
        // For simplicity, we keep it authenticated for now as per original design, 
        // but could relax this if requested. Sticking to auth for safety.
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, history } = await req.json();

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // System Prompt
        const systemPrompt = `You are the Professional Sales Assistant of 'MMO Digital Marketplace'.
        
        Your Goal: Help customers find products, check order status, and resolve payment issues. 
        Your tone: Professional, friendly, and helpful. Use emojis 🚀, 💰, ✅, 📦 to make messages engaging.
        
        CAPABILITIES:
        1. **Check Balance**: Use 'getBalance' if asked about money/wallet.
        2. **Check Transactions**: Use 'getRecentTransactions' for recent history.
        3. **Search Products**: Use 'searchProducts' when user looks for items (e.g., "Netflix", "Gmail", "cheap accounts").
        4. **Check Payment**: Use 'checkTransactionStatus' if user pastes a transaction code or content (e.g., "MMO123...").

        RULES FOR RESPONSES:
        - **Product Links**: ALWAYS format product links as: [Mua ngay 🚀](https://mmo-digital.vercel.app/products/[id]) along with the price formatted nicely (e.g., **50.0000 VND**).
        - **Upselling**: If a product is out of stock (stock: 0), apologize and immediately suggest searching for alternatives or similar categories.
        - **Payment Recovery**: If 'checkTransactionStatus' returns PENDING, reassure the user to wait 1-2 mins. If SUCCESS, tell them money is in. If NOT_FOUND, ask to check the code again or contact Admin.
        - **Contact Admin**: link is https://t.me/your_admin_username

        IMPORTANT: Data Retrieval Protocol
        - To call a function, output EXACTLY one of these patterns (and nothing else):
          - "FUNCTION_CALL: getBalance"
          - "FUNCTION_CALL: getRecentTransactions"
          - "FUNCTION_CALL: searchProducts(query='USER_QUERY')"
          - "FUNCTION_CALL: checkTransactionStatus(code='CODE')"
        
        Example:
        User: "Find me netflix"
        AI: "FUNCTION_CALL: searchProducts(query='netflix')"
        `;

        const chat = model.startChat({
            history: [
                { role: "user", parts: [{ text: systemPrompt }] },
                { role: "model", parts: [{ text: "Chào bạn! Tôi là trợ lý bán hàng của MMO Digital 🚀. Tôi có thể giúp bạn tìm kiếm sản phẩm, kiểm tra đơn hàng hay hỗ trợ nạp tiền ngay hôm nay!" }] },
                ...history.map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }))
            ],
            generationConfig: {
                maxOutputTokens: 500, // Limit token usage
            }
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        let text = response.text();

        // 4. Robust Function Calling Parser
        // Regex to match "FUNCTION_CALL: funcName" or "FUNCTION_CALL: funcName(arg='val')"
        const functionRegex = /FUNCTION_CALL: (\w+)(?:\((.*)\))?/;
        const match = text.match(functionRegex);

        if (match) {
            const functionName = match[1];
            const argsString = match[2]; // e.g., "query='netflix'" or undefined

            let toolResult: any = null;
            let finalResponseNeeded = true;

            console.log(`[Chat] Function Call: ${functionName}, Args: ${argsString}`);

            try {
                if (functionName === 'getBalance') {
                    toolResult = await tools.getBalance(userId);
                } else if (functionName === 'getRecentTransactions') {
                    toolResult = await tools.getRecentTransactions(userId);
                } else if (functionName === 'searchProducts') {
                    // Extract query value
                    const queryMatch = argsString?.match(/query=['"](.*)['"]/);
                    const query = queryMatch ? queryMatch[1] : argsString; // Fallback
                    toolResult = await tools.searchProducts(query || '');
                } else if (functionName === 'checkTransactionStatus') {
                    // Extract code value
                    const codeMatch = argsString?.match(/code=['"](.*)['"]/);
                    const code = codeMatch ? codeMatch[1] : argsString;
                    toolResult = await tools.checkTransactionStatus(code || '');
                }

                if (toolResult) {
                    // Send result back to AI to generate natural language response
                    const nextResult = await chat.sendMessage(
                        `Function ${functionName} returned: ${JSON.stringify(toolResult)}. 
                        Please format this for the user following the RULES (bold prices, markdown links, emojis).`
                    );
                    text = nextResult.response.text();
                } else {
                    text = "Xin lỗi, hiện tại tôi không thể lấy dữ liệu này. 😔";
                }
            } catch (err) {
                console.error("Tool Execution Error:", err);
                text = "Đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";
            }
        }

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error('Chat Error:', error);
        return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
    }
}
