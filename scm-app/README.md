## Getting Started
Run the following commands to get started with the project:
```bash
# docker compose
docker compose up -d       # start the database and other services

# install dependencies
cd scm-app
npm install                # or yarn install, pnpm install, bun install

# run the NextJS application
npm run build              # build the application
npm run start              # start the application in production mode

# or use 
npm run dev                # start the application in development mode
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Query 
```sql
-- create first admin user

INSERT INTO public."User" (id,email,"role","createdAt","updatedAt",name,"passwordHash") VALUES
	 ('cmcbx4iyv0000vsrs5b2o280p','admin1@test.com','ADMIN'::public."UserRole",'2025-06-25 12:16:04.615','2025-06-25 12:16:04.615','admin1@test.com','$2b$10$SkChZzD7AF.0sI64C6FgWei0hh41/0RCyg/W9vc5SBkmJTgLc21mi');
```