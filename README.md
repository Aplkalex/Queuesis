# 🎓 CUHK Course Scheduler

An interactive course planner for CUHK students, inspired by UBC's course scheduler. Drag and drop courses, visualize your timetable, and optimize your schedule with smart conflict detection.

## ✨ Features

- 📅 **Visual Timetable**: See your weekly schedule at a glance
- 🎯 **Drag & Drop**: Easily rearrange course sections
- 🔍 **Smart Search**: Find courses by code, name, or instructor
- ⚡ **Conflict Detection**: Automatically highlights scheduling conflicts
- 🎨 **CUHK Themed**: Clean UI with CUHK purple branding
- 📤 **Export**: Download your schedule as .ics or image

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Aplkalex/cuhk-scheduler.git
cd cuhk-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your MongoDB URI
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
src/
├── app/              # Next.js app router pages
│   ├── api/          # API routes (serverless backend)
│   └── page.tsx      # Main timetable page
├── components/       # React components
│   └── ui/           # Reusable UI components
├── lib/              # Utility functions
├── types/            # TypeScript type definitions
└── data/             # Mock data for development
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Database**: MongoDB Atlas
- **Hosting**: Vercel

## 📊 Data Source

Course data is scraped from CUHK's course catalog and refreshed periodically. 

⚠️ **Disclaimer**: Always verify course information on CUSIS before enrolling.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by [UBC Course Scheduler](https://courses.students.ubc.ca/)
- Built for CUHK students, by CUHK students
