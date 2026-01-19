# Cineclub

Une web app pour regarder des films ensemble, noter et organiser des salons privés ou publics avec vos amis.

# Deployement

Here is a sample docker file to deploy the app. Don't forget to change all variable tagged "changeme". Some changes will be done to improve the deployement (JWT )

```
version: "3.9"

services:
  app:
    image: fmaxv60/cineclub-dev:latest
    container_name: cine-club
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      POSTGRES_HOST: db
      POSTGRES_PORT: 5432
      POSTGRES_DB: cinedb
      POSTGRES_USER: changeme
      POSTGRES_PASSWORD: changeme
      POSTGRES_POOL_MAX: 20
      JWT_SECRET: changeme
      NODE_ENV: production
    depends_on:
      - db

  db:
    image: postgres:16
    container_name: cine-club-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: cinedb
      POSTGRES_USER: changeme
      POSTGRES_PASSWORD: changeme
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:

```