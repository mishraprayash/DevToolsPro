import Link from 'next/link';

const footerLinks = [
  {
    title: 'Tools',
    links: [
      { name: 'JSON Beautifier', href: '/tools/json' },
      { name: 'Base64 Encoder', href: '/tools/base64' },
      { name: 'JWT Decoder', href: '/tools/jwt' },
      { name: 'Hash Generator', href: '/tools/hash' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'GitHub', href: 'https://github.com/mishraprayash/web-tools' },
      { name: 'Changelog', href: '#' },
      { name: 'Privacy Policy', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-viol-500 flex items-center justify-center">
                <span className="text-bg-primary font-bold text-sm">D</span>
              </div>
              <span className="font-outfit font-semibold text-lg">DevTools Pro</span>
            </Link>
            <p className="mt-4 text-sm text-text-secondary">
              Production-grade developer utilities in one beautiful platform.
            </p>
          </div>
          
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-medium text-text-primary mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} DevTools Pro. All rights reserved.
          </p>
          <p className="text-sm text-text-muted">
            Crafted with ❤️ by{' '}
            <a
              href="https://github.com/mishraprayash"
              className="text-accent hover:text-accent-hover transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Prayash Mishra
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}