# 🚀 Voltaire DRep Campaign Platform 🚀

## Description
The DRep Campaign platform was funded by Intersect MBO and originally developed by the Lido Nation team.
The platform is a web3/web2 system that allows DReps to create a profile to facilitate their campaigns,
communicate with prospective and current delegators, and showcase their onchain and off chain activities.

## Table of content:

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Running locally](#running-locally)
- [Running using docker compose](#running-using-docker-compose)

## Introduction

This document serves as a comprehensive guide for setting up the full stack of our application, which includes the backend, frontend, and database components.

## Prerequisites

- Docker installed - [Download link](https://docs.docker.com/engine/install/).


## Tech stack:

**Server:** [Node](https://nodejs.org/en/about/), [Nest.js](https://nestjs.com/)

**Database:** [PostgreSQL](https://www.postgresql.org/)

**Frontend:** [Next.js](https://nextjs.org/)

**Container:** [Docker](https://docs.docker.com/get-started/)

### API Backend

The api backend is powered by nest.js, A progressive Node.js framework for building efficient, reliable and scalable server-side applications.

### Database

For data persistence, we utilize PostgreSQL, known for its robustness, scalability, and reliability. This choice ensures that our application's data layer is secure, efficient, and capable of handling growth.

### Frontend
The frontend is developed with Next.js, a React framework that allows for server-side rendering and static site generation. This choice enables us to create fast, SEO-friendly web pages that integrate seamlessly with our Nest.js backend.

The instructions that follow will guide you through setting up each component of our application stack, ensuring a cohesive development and deployment process.

## Getting started

Before you begin setting up the application, you'll need to clone the repository from GitHub to get a local copy of the code. Follow these steps to clone the repository and start setting up the application components:

1. **Clone the Repository:**

    - Open a terminal on your computer.
    - Navigate to the directory where you want to store the project.
    - Run the following command to clone the repository:
      ```
      git clone https://github.com/lidonation/www.1694.io.git
      ```

2. **Navigate to the Project Directory:**
    - After cloning, change into the project's root directory:
      ```
      cd www.1694.io
      ```
      This directory contains all the files you need to set up the application, including the Docker Compose files and the separate directories for the backend and frontend components.

By cloning the repository, you ensure that you have the latest version of the code and all the necessary files to get started with the application setup.

## Running locally

The app, all of it's dependencies including dev server with hot module reloading all run in docker environments. The only dependency you need on your machine is the docker engine.
Follow these steps:

### Backend setup

1. From the root, run `make backend-install`

### Database configuration

1. **Nothing to do** as both postgres instances, one for the app and one for dbsync is already configure in the docker-compose file.

### Frontend setup

1.  From the root, run `make frontend-install`


### Running the application
**The Next.js server, nest.js backend, cardano node, and postgres databases** are automatically started when you run `make up.`
This shortcut runs `docker-compose up -d`. To view the Next.js server during development you can follow the logs from the **frontend** container
or run `make logs`.


### Accessing the application:**
- With all services running, your application components should be accessible at the following URLs:
    - **Backend:** `http://localhost:8000` – mostly called by Next.js server-side code; not much to see, as it is just an API.
    - **Frontend:** `http://localhost:3000` – the Next.js application.
    - **Queue backend:** `http://localhost:9999` – the BullMQ worker service, including its Bull Board dashboard.
    - **Adminer:** `http://localhost:8080` – a database UI, useful for inspecting the schema.
    - **Database:** not served over HTTP; Postgres is mapped to port `5432` on your host machine, as specified in `docker-compose.yaml`.

### Overview of services in docker compose:

- **Backend service:** runs Nest.js on port `8000` and connects to the PostgreSQL database.

- **Queue backend service:** runs the BullMQ sync workers on port `9999`, backed by Redis.

- **Database service:** runs PostgreSQL, mapped to port `5432` on the host machine.

- **Redis service:** backs the job queues, mapped to port `6379`.

- **Frontend service:** serves the Next.js application on port `3000`, calling the Nest.js backend for content and data.

- **Governance indexer:** indexes Cardano governance data into the shared database.

## Project documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) — how to submit a change
- [GOVERNANCE.md](./GOVERNANCE.md) — roles, decision making, releases
- [MAINTAINERS.md](./MAINTAINERS.md) — who maintains the project
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) — expected conduct
- [SECURITY.md](./SECURITY.md) — how to report a vulnerability privately
- [SUPPORT.md](./SUPPORT.md) — where to ask for help
- [CHANGELOG.md](./CHANGELOG.md) — release history

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE).
