import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import RightSidebar from './components/RightSidebar.jsx';
import DarkModeToggle from './components/DarkModeToggle';
import { ChatProvider } from './state/chatStore.jsx';

export default function App() {
  return (
    <ChatProvider>
      <div className="h-screen w-screen p-2 sm:p-4 bg-gradient-to-b from-[#0b1020] to-[#0f1530] relative overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] bg-brand-500/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-brand-300/10 blur-2xl rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr,320px] gap-2 sm:gap-4 h-full relative">
          <div className="hidden lg:block h-full overflow-hidden">
            <Sidebar />
          </div>
          <main className="min-h-0 flex flex-col gap-3 sm:gap-4 h-full overflow-hidden">
            <div className="flex items-center justify-end px-2 sm:px-0 shrink-0">
              <DarkModeToggle />
            </div>
            <div className="flex-1 min-h-0 h-full overflow-hidden">
              <ChatWindow />
            </div>
          </main>
          <div className="hidden lg:block h-full overflow-hidden">
            <RightSidebar />
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}