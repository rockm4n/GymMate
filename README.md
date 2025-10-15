# GymMate

[![Project Status: MVP](https://img.shields.io/badge/status-MVP-green.svg)](https://shields.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MVP web application to streamline class scheduling and booking management for fitness clubs.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

GymMate is a Minimum Viable Product (MVP) web application designed to streamline class scheduling and booking management for fitness clubs. It aims to solve the problem of manual booking management, which often leads to errors and frustration for both club members and staff.

The application serves two main user groups:
- **Fitness club members** who need a simple, 24/7 accessible tool to view schedules, book classes, and manage their reservations.
- **Fitness club staff** (administrators, receptionists) who need an efficient tool to manage class schedules and monitor key operational metrics.

The core value of GymMate is the automation and digitization of the booking process, which saves time, reduces administrative errors, increases class attendance, and improves overall member satisfaction.

## Tech Stack

The project is built with a modern tech stack, ensuring a high-quality, scalable, and maintainable application.

### Frontend
- **[Astro 5](https://astro.build/)**: For building fast, content-focused websites.
- **[React 19](https://react.dev/)**: For creating interactive UI components.
- **[TypeScript 5](https://www.typescriptlang.org/)**: For strong typing and improved developer experience.
- **[Tailwind CSS 4](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
- **[Shadcn/ui](https://ui.shadcn.com/)**: A collection of accessible and reusable UI components.

### Backend
- **[Supabase](https://supabase.io/)**: An open-source Firebase alternative providing:
    - PostgreSQL Database
    - Backend-as-a-Service (BaaS) SDK
    - User Authentication

### CI/CD & Hosting
- **[GitHub Actions](https://github.com/features/actions)**: For continuous integration and deployment pipelines.
- **[DigitalOcean](https://www.digitalocean.com/)**: For hosting the application via Docker images.

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

- **Node.js**: Version `22.14.0` is required. We recommend using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) to manage Node.js versions.
- **Package Manager**: `npm`, `yarn`, or `pnpm`. This guide uses `npm`.
- **Supabase Account**: You will need a Supabase project to connect the application to a database and authentication service. You can create one for free at [supabase.com](https://supabase.com).

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/gymmate.git
    cd gymmate
    ```

2.  **Set up the Node.js version:**
    If you are using `nvm`, run the following command to use the correct Node.js version:
    ```sh
    nvm use
    ```

3.  **Install dependencies:**
    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```sh
    cp .env.example .env
    ```
    You will need to add your Supabase project URL and Anon Key to the `.env` file. You can find these in your Supabase project settings.

    ```env
    PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

In the project directory, you can run the following commands:

-   `npm run dev`: Runs the app in development mode.
-   `npm run build`: Builds the app for production to the `dist/` folder.
-   `npm run preview`: Serves the production build locally for preview.
-   `npm run lint`: Lints the code using ESLint to find and fix problems.
-   `npm run format`: Formats the code using Prettier.

## Project Scope

### Key Features (MVP)

-   **Weekly Class Schedule**: A timeline-style view of the weekly class schedule.
-   **24/7 Online Booking**: Members can book classes at any time.
-   **Class Types**: Support for both open-access classes and classes with limited spots.
-   **User Accounts**: Basic user accounts for managing bookings.
-   **Email Reminders**: Automatic email reminders for upcoming classes.
-   **Waiting Lists**: Members can join a waiting list for full classes and get notified when a spot opens up.
-   **Booking Cancellation**: Self-service cancellation up to 8 hours before a class.
-   **Admin Panel**: A basic dashboard for staff to manage the schedule.
-   **Single Membership Type**: Support for one universal membership type.

### Future Features (Post-MVP)

-   **Online Payments**: Integration with a payment gateway.
-   **Native Mobile App**: Dedicated mobile apps for iOS and Android.
-   **Wearables Integration**: Connect with fitness trackers and wearables.
-   **Loyalty & Gamification**: Loyalty programs, achievements, and referral systems.
-   **Advanced Analytics**: In-depth reports and analytics for administrators.
-   **Personal Training Module**: A system for booking and managing personal training sessions.
-   **Internal Chat**: A messaging system for communication within the app.
-   **Rating System**: Allow members to rate instructors and classes.
-   **Multi-Location Support**: Manage schedules for multiple gym locations.
-   **Customizable Notifications**: More control over notification preferences.

## Project Status

This project is currently in the **Minimum Viable Product (MVP)** development phase. The primary goal is to deliver the core functionalities outlined in the MVP scope.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
