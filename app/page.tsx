// app/page.tsx
import { ChatInterface } from '@/components/ChatInterface';

export default function Home() {
  return (
    // Use flex layout to center chat and add footer
    <div className="flex flex-col min-h-screen items-center justify-between p-0 md:p-4">
      {/* ChatInterface takes up most space */}
      <main className="w-full flex-grow flex items-center justify-center">
          <ChatInterface />
      </main>
      {/* Simple Footer */}
      <footer className="text-center text-xs text-gray-500 dark:text-gray-400 py-3">
            Developed by Jose Espinosa
      </footer>
    </div>
  );
}