# Snap

![WhatsApp Image 2025-03-31 at 5 53 59 AM](https://github.com/user-attachments/assets/02a8a3bd-9dde-4817-a909-2a49d46bccd8)


A **privacy-focused menubar app** for capturing and organizing anything you paste—text, links, images, or mixed content. Snap automatically generates **tags and titles** using an LLM and stores everything **locally** in SQLite, providing a fast and private way to retrieve your saved content.

## Features

- **Quick Capture**: Open Snap via a click or keyboard shortcut and paste content instantly.
- **AI-Generated Tags & Titles**: An LLM analyzes pasted content to create meaningful metadata.
- **Local Storage**: Everything is saved in SQLite, ensuring **full privacy**—no cloud, no tracking.
- **Powerful Search**: Retrieve saved content with **keyword filtering, sorting, and semantic search**.

## Why Snap?

Tired of losing ideas in messy notes or struggling to find old bookmarks? Snap provides an **instant, organized**, and **local-first** solution for saving and retrieving content efficiently.

## Installation

### Requirements

- macOS / Linux / Windows
- Tauri (for building from source)
- Rust (if compiling manually)

### Download

[Releases](https://github.com/yourusername/snap/releases)

Or build from source:

```sh
git clone https://github.com/skyash-dev/snap.git
cd snap
pnpm install
pnpm tauri build
```

## Usage

1. **Open Snap** from the system tray or using a ctrl+alt+s keyboard shortcut.
2. **Paste** any text, link, or idea.
3. Snap will **auto-generate** a title and tags.
4. **Search & retrieve** saved content via keyword filters, sorting, and semantic search.

## Development

### Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Rust (Tauri)
- **Database**: SQLite
- **AI Processing**: Langchain-powered LLM integration

### Running in Development Mode

```sh
pnpm dev
pnpm tauri dev
```

## To-Do

- [ ] Configuration settings for database directory.
- [ ] Integration of image snaps.

## Contributing

Contributions are welcome! Open an issue or submit a PR if you have ideas or improvements.

## License

MIT License

---

