# AEY Prime Escapes

A web-based travel and tour management system designed to make trip planning, destination browsing, and reservation management easier and more organized.

## 📌 About the System

**AEY Prime Escapes** is a web application that provides users with a convenient platform for exploring travel destinations and managing their trip reservations.

The system aims to reduce the need for manual booking processes by providing a centralized online platform where users can view available destinations, choose travel packages, manage their bookings, and access relevant trip information.

The system is designed with a simple and user-friendly interface suitable for both customers and administrators.

## Objectives

The main objectives of AEY Prime Escapes are to:

* Provide an online platform for browsing travel destinations and packages.
* Allow users to make and manage travel reservations.
* Organize customer and booking information.
* Help administrators manage destinations, packages, and reservations.
* Reduce manual processing of travel bookings.
* Improve the overall travel planning experience.

## Features

### Customer Features

* User registration and login
* Browse travel destinations
* View travel packages
* View package details
* Make reservations
* Manage booking information
* View reservation status
* View personal account information

### Administrator Features

* Administrator login
* Manage travel destinations
* Manage travel packages
* Manage customer information
* Manage reservations
* Update booking status
* Monitor system activities

## Technologies Used

| Technology   | Purpose                                   |
| ------------ | ----------------------------------------- |
| React        | User interface and application components |
| TypeScript   | Type-safe application development         |
| Vite         | Development server and build tool         |
| Tailwind CSS | User interface styling                    |
| Supabase     | Backend database and authentication       |
| Git          | Version control                           |
| GitHub       | Source code repository                    |

The current frontend project is configured with React 19, TypeScript 5.7, Vite 8, and Tailwind CSS 4.

## Project Structure

```text
AEY-Prime-Escapes/
│
├── .figma/
│   └── make/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
│
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
└── README.md
```

The main React entry point is `src/main.tsx`, which loads the application and global stylesheet. The project also uses the `@` alias for the `src` directory.

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
```

### 2. Open the project

```bash
cd AEY-Prime-Escapes
```

### 3. Install dependencies

Using pnpm:

```bash
pnpm install
```

Or using npm:

```bash
npm install
```

### 4. Configure Supabase

Create a Supabase project and configure the required database and authentication settings.

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Do not upload your `.env` file or expose private keys in GitHub.**

### 5. Start the development server

```bash
pnpm dev
```

or:

```bash
npm run dev
```

The project uses Vite as its development server.

## Database

AEY Prime Escapes uses **Supabase** as its backend service.

The database is intended to store information such as:

* User accounts
* Customer profiles
* Destinations
* Travel packages
* Reservations
* Booking status
* Payment or booking information
* Administrative records

The frontend communicates with Supabase to store and retrieve system data.

## Authentication

The system uses user authentication to separate customer and administrator access.

Example user roles:

```text
User
 ├── Customer
 └── Administrator
```

Customers can access travel and booking functions, while administrators can manage system records and reservations.

## Basic System Flow

```text
User
  ↓
Login / Registration
  ↓
Browse Destinations
  ↓
Select Travel Package
  ↓
View Package Details
  ↓
Make Reservation
  ↓
Reservation Stored in Supabase
  ↓
Administrator Reviews Booking
  ↓
Booking Status Updated
  ↓
Customer Views Reservation Status
```

## Development

To build the project for production:

```bash
pnpm build
```

To preview the production build:

```bash
pnpm preview
```

The available project scripts include development, production build, preview, and formatting commands.

## Code Formatting

The project uses **oxfmt** for formatting.

Run:

```bash
pnpm format
```

## Environment Variables

The following environment variables may be required:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Make sure these values are configured before running features that require Supabase.

## Future Improvements

Possible future improvements include:

* Online payment integration
* Email booking confirmations
* Advanced search and filtering
* Customer reviews and ratings
* Travel package availability tracking
* Automated booking notifications
* Admin dashboard analytics
* Mobile-responsive improvements
* Booking history
* Printable booking receipts

## Developers

**AEY Prime Escapes**

Developed as an Information Systems project.

## License

This project is intended for academic and educational purposes.

---

**AEY Prime Escapes — Explore. Plan. Escape.**
