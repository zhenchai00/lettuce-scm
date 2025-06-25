This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.



# Query 
```sql
INSERT INTO public."User" (id,email,"role","createdAt","updatedAt",name,"passwordHash") VALUES
	 ('cmcbx4iyv0000vsrs5b2o280p','admin1@test.com','ADMIN'::public."UserRole",'2025-06-25 12:16:04.615','2025-06-25 12:16:04.615','admin1@test.com','$2b$10$SkChZzD7AF.0sI64C6FgWei0hh41/0RCyg/W9vc5SBkmJTgLc21mi');
```

# Process 
1. Farmer plants and records the batch product 
   - Farmer Actions
     - batchProductCreate
     - productEventCreate - eventType: PLANTING - batchId, userId, plantingDate, txhash
2. Farmer harvests the batch product
   - Farmer Actions
	 - batchProductUpdate - havestDate, quantity
	 - productEventCreate - eventType: HARVESTING - batchid, havestDate, quantity, txhash
3.  Distributor requests the batch product from the Farmer
   - Ditributor Actions
	 - shipmentCreate - status: ORDERED, distributorId
4. Farmer approves the shipment request
   - Farmer Actions
	 - shipmentUpdate - status: OUTOFDELIVERY, shipmentId
	 - productEventCreate - eventType: SHIPPED - shipmentId, txhash
5. Distributor receives the batch product
   - Distributor Actions
     - shipmentUpdate - status: RECEIVED, shipmentId
	 - productEventCreate - eventType: DELIVERED - shipmentId, txhash
6. Retailer requests the batch product from the Distributor
   - Retailer Actions
	 - shipmentCreate - status: ORDERED, retailerId
7. Distributor approves the shipment request
   - Distributor Actions
   -  shipmentUpdate - status: OUTOFDELIVERY, shipmentId
   - productEventCreate - eventType: SHIPPED - shipmentId, txhash
8. Retailer receives the batch product
   - Retailer Actions
   - shipmentUpdate - status: RECEIVED, shipmentId
   - productEventCreate - eventType: DELIVERED - shipmentId, txhash

4A Farmer rejects the shipment request
   - Farmer Actions
	 - shipmentUpdate - status: REJECTED, shipmentId
7A Distributor rejects the shipment request
   - Distributor Actions
  - shipmentUpdate - status: REJECTED, shipmentId