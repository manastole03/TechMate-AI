import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const cls = document.documentElement.classList;
    if (dark) cls.add('dark');
    else cls.remove('dark');
  }, [dark]);
  return (
    <button
      className="btn-ghost px-3 py-2 text-sm"
      aria-label="Toggle dark mode"
      onClick={() => setDark((d) => !d)}
    >
      {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}