FROM node:24-alpine

WORKDIR /workspace

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY . .

RUN npm run build --workspace @devfolio/shared
WORKDIR /workspace/apps/web
EXPOSE 5173
CMD ["npm", "run", "dev"]
