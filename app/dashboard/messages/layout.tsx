import ConversationList from "@/components/messages/ConversationList";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-[calc(100vh-theme(spacing.20))] overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
            {/* Sidebar (Conversations) - Hidden on mobile if viewing chat? 
                For simplicity in MVP, we keep it visible on desktop, potentially toggle on mobile.
                Let's use responsive classes: w-full md:w-80. 
                But wait, if on mobile we click a chat, we want to see full chat.
                Let's assume standard split view for Desktop first.
            */}
            <div className="hidden md:flex w-80 flex-col border-r border-slate-800">
                <ConversationList />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
                {children}
            </div>
        </div>
    );
}
