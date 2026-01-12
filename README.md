# Next.js Admin Template con TypeScript & Shadcn UI


## Features

- Built with Next.js 16, TypeScript, Tailwind CSS v4, and Shadcn UI  
- Responsive and mobile-friendly  
- Customizable theme presets (light/dark modes with color schemes like Tangerine, Brutalist, and more)  
- Flexible layouts (collapsible sidebar, variable content widths)  
- Authentication flows and screens  
- Prebuilt dashboards (Default, CRM, Finance) with more coming soon  
- Role-Based Access Control (RBAC) with config-driven UI and multi-tenant support *(planned)*  

> [!NOTE]
> The default dashboard uses the **shadcn neutral** theme.  
> It also includes additional color presets inspired by [Tweakcn](https://tweakcn.com):  
>
> - Tangerine  
> - Neo Brutalism  
> - Soft Pop  
>
> You can create more presets by following the same structure as the existing ones.

> Looking for the **Next.js 15** version?  
> Check out the [`archive/next15`](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/tree/archive/next15) branch.  
> This branch contains the setup prior to upgrading to Next 16 and the React Compiler.

> Looking for the **Next.js 14 + Tailwind CSS v3** version?  
> Check out the [`archive/next14-tailwindv3`](https://github.com/arhamkhnz/next-shadcn-admin-dashboard/tree/archive/next14-tailwindv3) branch.  
> It has a different color theme and is not actively maintained, but I try to keep it updated with major changes.  

## Tech Stack

- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4  
- **UI Components**: Shadcn UI  
- **Validation**: Zod  
- **Forms & State Management**: React Hook Form, Zustand  
- **Tables & Data Handling**: TanStack Table  
- **Tooling & DX**: Biome, Husky  


## Colocation File System Architecture

This project follows a **colocation-based architecture** each feature keeps its own pages, components, and logic inside its route folder.  
Shared UI, hooks, and configuration live at the top level, making the codebase modular, scalable, and easier to maintain as the app grows.

For a full breakdown of the structure with examples, see the [Next Colocation Template](https://github.com/arhamkhnz/next-colocation-template).

### Run locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/arhamkhnz/next-shadcn-admin-dashboard.git
   ```
   
2. **Navigate into the project**
   ```bash
    cd next-shadcn-admin-dashboard
   ```
   
3. **Install dependencies**
   ```bash
    npm install
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

Your app will be running at [http://localhost:3000](http://localhost:3000)