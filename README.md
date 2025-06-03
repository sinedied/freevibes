# FreeVibes

A modern web dashboard for RSS feeds and notes, inspired by the classic NetVibes interface.

![FreeVibes Screenshot](./data/netvibes.png)

## ✨ Features

- 📰 **RSS Feed Reader** - Stay updated with your favorite feeds
- 📝 **Sticky Notes** - Quick note-taking with clickable links  
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 📱 **Responsive Design** - Works great on desktop and mobile
- 💾 **Local Storage** - Your data persists in your browser
- 🎨 **Customizable** - Fully themeable with CSS variables

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Tech Stack

- **Frontend**: TypeScript + Lit Web Components
- **Build Tool**: Vite
- **Styling**: Modern CSS with custom properties
- **Deployment**: GitHub Pages via GitHub Actions
- **Data**: JSON file + localStorage for persistence

## 📊 Data Structure

The dashboard configuration is stored in `public/data.json`:

```json
{
  "settings": {
    "columns": 3,
    "darkMode": false
  },
  "widgets": [
    {
      "id": "rss-1",
      "type": "rss",
      "title": "Tech News",
      "feedUrl": "https://hnrss.org/frontpage",
      "position": { "row": 1, "col": 1 }
    },
    {
      "id": "note-1", 
      "type": "note",
      "title": "Quick Notes",
      "content": "Your note content here...",
      "color": "yellow",
      "position": { "row": 1, "col": 2 }
    }
  ]
}
```

## 🎨 Customization

The theme uses CSS custom properties with the `--fv-` prefix:

```css
:root {
  --fv-bg-primary: #f8f9fa;
  --fv-text-primary: #212529;
  --fv-accent-primary: #007bff;
  /* ... */
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the classic NetVibes dashboard
- Built with [Lit](https://lit.dev/) web components
- Powered by [Vite](https://vitejs.dev/)
