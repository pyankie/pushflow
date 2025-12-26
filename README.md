# Standalone Real-Time Push Notification Framework

## Overview

A distributed, event-driven, real-time push notification framework built using microservices, Redis Pub/Sub, and WebSocket-based delivery.

## Architecture

- API Gateway
- Dispatcher Service
- Delivery Service
- Redis (Pub/Sub)
- MongoDB (Persistence)

## Tech Stack

- TypeScript / NestJS
- Redis
- MongoDB
- Docker & Docker Compose

## Getting Started

1. Prerequisites: Docker and Docker Compose installed.
2. Start all services:
```bash
cd infra
docker compose up --build
```
3. Access:
- API Gateway: http://localhost:3000 (Swagger at /api/docs)
- Dispatcher: http://localhost:3001
- Delivery (WebSocket): ws://localhost:3002
4. Send a notification via API:
```bash
curl -X POST http://localhost:3000/notifications \
  -H 'Content-Type: application/json' \
  -d '{"receiverId":"user-123","channel":"socket","message":"Hello"}'
```
5. Optional: Run test client to receive notifications:
```bash
node test-client/test-client.js user-123 http://localhost:3002
```