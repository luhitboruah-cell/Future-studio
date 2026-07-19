import './globals.css';

export const metadata = {
  title: 'Studio',
  description: 'Novels, series, art, audio & video — published by the author.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">Studio</a>
          <nav>
            <a href="/">Home</a>
            <a href="/login">Login</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
