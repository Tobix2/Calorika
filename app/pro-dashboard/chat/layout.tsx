
import ChatSidebar from '@/components/pro-dashboard/chat-sidebar';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex h-screen w-full bg-muted/40">
      <ChatSidebar />
      <main className="flex flex-col flex-1">
        {children}
      </main>
    </div>
  );
}
