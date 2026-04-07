# WEC Project Expo - 2026

# Orbis

Orbis is a sophisticated event management platform designed to simplify and elevate the experience of organizing, hosting, and participating in events at NITK.

## Table of contents

- [The Problem](#the-problem)
- [Our solution](#our-solution)
- [Features](#features)
  - [User profiles and authentication](#user-profiles-and-authentication)
  - [Event creation and management](#event-creation-and-management)
  - [Community module](#community-module)
  - [Project showcase](#project-showcase)
  - [Form creation](#form-creation)
- [Setup and Development Guidelines](#setup-and-development-guidelines)
- [Deployment](#deployment)
- [Team Members](#team-members)

## The Problem

- Currently, information regarding events has to be spammed on WhatsApp groups, leading to inefficiencies in tracking. Forms have to be created by organisers using google forms or similar websites. Maintaining oversight of events, deadlines, and numerous registration forms is challenging. Also, there is no dedicated project showcase website. Projects are primarily hosted on individual club websites. There exists no community module, restricting interactions with campus peers on alternative platforms.

## Our Solution

- Orbis provides a centralized platform that streamlines event discovery, registration, and management. Instead of relying on scattered WhatsApp messages and multiple external links, all event-related information—including details, deadlines, and application forms—is organized in one place.

- Enables organizers to create and manage events, handle applications, track participants and maintain structured workflows. For participants, it simplifies discovering events, applying individually or in teams, and monitoring application status in real time.

- Beyond events, Orbis introduces a community-driven ecosystem, allowing users to interact through posts, comments, friend connections, and private messaging—fostering stronger campus engagement within a single platform.

- It also serves as a dedicated project showcase, where clubs can present their work, making projects more accessible across the institute.

- Additionally, the platform allows form creation, enabling organizers to create and manage custom forms with ease, eliminating dependency on external tools.

- Overall, Orbis transforms fragmented workflows into a unified, scalable, and user-friendly ecosystem.

## Features

### User profiles and authentication

- Uses Auth0.
- Users can enter required details, create their profiles, login and navigate the app.

### Event creation and management

- Organisers can create event, accept/reject applications and update participants' attendance.
- Users can apply for an event individually or in a team and track the status of application.

### Community module

- Users can create public posts, react and comment on an existing post, discover people and add friends.
- Messages allow users to chat with their friends privately.

### Project showcase

- Has a list of clubs across the campus.
- Conveners can add projects to their respective clubs along with a short description, contributors, and the links to GitHub repo and live demo.
- Users can view projects and participate in discussions.

### Form creation

- Organisers can create forms with custom questions and retrieve responses. The question can be of the type: short-answer/paragraph/MCQ/rating/drop-down.
- Users can access all the active forms, fill and submit.

## Database Schema

[View Prisma Schema](./backend/prisma/schema.prisma)

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Auth0

## Setup and Development Guidelines

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Project Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/orbis.git
   cd orbis
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   ```

3. **Backend Environment Configuration**
   Create a `.env` file in the backend directory with the following variables:

   ```
   DATABASE_URL="your-supabase-postgres-connection-string"
   PORT=4000
   NODE_ENV=development

   # Use your frontend deployment URL in production
   CORS_ORIGIN="https://your-frontend-domain.com"
   # For local development
   # CORS_ORIGIN="http://localhost:3000"

   AUTH0_ISSUER_BASE_URL="your-auth0-issuer-url"
   AUTH0_AUDIENCE="your-auth0-audience"
   AUTH0_CLIENT_SECRET="your-auth0-client-secret"
   ```

4. **Prisma Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema changes to database (development only)
   npx prisma db push
   ```

5. **Start the Backend Server**

   ```bash
   npm run dev
   ```

   The backend will run on http://localhost:4000 in development

6. **Frontend Setup** (in a new terminal)

   ```bash
   cd ../frontend
   npm install
   ```

7. **Frontend Environment Configuration**
   Create a `.env` file in the frontend directory with the following variables:

   ```
   # Use your backend deployment URL in production
   VITE_API_URL="https://your-backend-domain.com"
   # For local development
   # VITE_API_URL="http://localhost:4000"

   # Supabase
   VITE_SUPABASE_URL="your-supabase-url"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   VITE_SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

   # Auth0
   VITE_AUTH0_DOMAIN="your-auth0-domain"
   VITE_AUTH0_CLIENT_ID="your-auth0-client-id"
   VITE_AUTH0_AUDIENCE="your-auth0-audience"
   VITE_AUTH0_SCOPE="openid profile email"
   VITE_AUTH0_REDIRECT_URI="https://your-frontend-domain.com"
   ```

8. **Start the Frontend Server**
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:3000 in development

## Deployment Configuration

When deploying to production:

1. Update all environment variables to use your production URLs
2. Make sure your Auth0 application has the correct:
   - Allowed Callback URLs
   - Allowed Logout URLs
   - Allowed Web Origins
   - Set to your production domain

## Working with Prisma

Prisma simplifies database operations through its type-safe client. Here are some common commands:

### Useful Prisma Commands

```bash
# Update Prisma client after schema changes
npx prisma generate

# Create a migration (in development)
npx prisma migrate dev --name descriptive_name

# Apply migrations to production
npx prisma migrate deploy

# Reset the database (WARNING: Deletes all data)
npx prisma migrate reset

# Launch Prisma Studio (visual database explorer)
npx prisma studio
```

Prisma Studio will be available at http://localhost:5555 when running the `npx prisma studio` command.

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. This file defines:

- Data models
- Relationships between models
- Default values
- Indexes and constraints

Always run `npx prisma generate` after making changes to the schema to update the Prisma client.

## API Documentation

The backend provides RESTful API endpoints for various features:

- **Auth**: User registration, login, profile management
- **Events**: Create, update, list, and manage events
- **Teams**: Form teams and manage team members
- **Projects**: Submit and manage project details
- **Profiles**: Manage user profiles

## Code Practices

### Comments

- Use clear and concise comments to explain complex code blocks
- Use JSDoc style comments for functions and components

### Code Style

- Follow the Airbnb JavaScript Style Guide
- Use 2 spaces for indentation
- Prefer `const` and `let` over `var`
- Use arrow functions for anonymous functions
- Use single quotes for strings
- Place opening braces on the same line as the statement

### Variable Style

- Use camelCase for variable and function names
- Use PascalCase for React components and class names
- Use UPPER_SNAKE_CASE for constants
- Choose meaningful and descriptive names

### Commit Style

- Write clear and concise commit messages
- Use present tense and imperative mood
- Capitalize the first letter
- Include a brief description of changes
- Reference relevant issue numbers
- Use prefixes like `fix:`, `feat:`, `frontend:`, `backend:`, `misc:`

### Development Style

- Use feature branches for new features and bug fixes
- Keep the `main` branch in a deployable state
- Regularly pull changes from `main`
- Perform code reviews and seek feedback

## Deployment

- **Frontend**:
- **Backend**:

## Team Members

- <a href="https://github.com/StackedUpAman/" target="_blank">Aman Nagpal</a>
- <a href="https://github.com/ace0807/" target="_blank">Chinmayee M</a>
- <a href="https://github.com/Ritvik-17/" target="_blank">Ritvik Gampa</a>
