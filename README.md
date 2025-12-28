#  PushFlow

**PushFlow** is a standalone, real-time push notification framework built using a microservice architecture.  
It is designed to demonstrate clear service boundaries, asynchronous communication, and real-time message delivery using WebSockets.

This project was developed as part of a **Distributed Systems** course and focuses on correctness, simplicity, and architectural clarity rather than cloud-scale SaaS complexity.

---

## Overview

PushFlow enables an application to send real-time notifications to connected clients through a clean, event-driven workflow.

At a high level:

- A **Gateway Service** exposes HTTP APIs for sending notifications
- A **Dispatcher Service** manages the notification lifecycle and persistence
- A **Delivery Service** maintains WebSocket connections and delivers messages in real time

The system is intended to be used by a **single application**, not as a multi-tenant cloud service.

---

## Architecture

### Services

#### 1. Gateway Service
- Exposes HTTP APIs  
  - `POST /notifications`
  - `GET /notifications/:id/status`
- Acts as the entry point for the client application
- Delegates all business logic to the Dispatcher
- Does **not** store data or manage WebSocket connections

#### 2. Dispatcher Service
- Core business service
- Generates `notificationId`
- Persists notification state in MongoDB
- Tracks notification lifecycle (e.g. `ACCEPTED`, `DELIVERED`, `FAILED`)
- Publishes delivery events to the Delivery Service

#### 3. Delivery Service
- Hosts the WebSocket server
- Manages client connections
- Receives delivery events from the Dispatcher
- Pushes notifications to connected clients in real time

---

## Communication Flow

### Sending a Notification

1. Client application sends a request to the Gateway  
   `POST /notifications`
2. Gateway forwards the request to the Dispatcher
3. Dispatcher:
   - Generates a `notificationId`
   - Stores the notification in the database
   - Emits a delivery event
4. Dispatcher responds to the Gateway
5. Gateway returns the response to the client

### Delivering a Notification

1. Delivery Service receives the delivery event
2. Delivery Service checks for an active WebSocket connection
3. If connected, the message is pushed to the client
4. Delivery outcome is reported back to the Dispatcher for status update

### Checking Notification Status

1. Client application calls  
   `GET /notifications/{notificationId}/status`
2. Gateway forwards the request to the Dispatcher
3. Dispatcher queries persistence and returns the current status

---

## Technology Stack

- **Language:** TypeScript  
- **Framework:** NestJS  
- **Real-time Transport:** WebSockets  
- **Database:** MongoDB  
- **Messaging / Coordination:** Redis  
- **Containerization:** Docker & Docker Compose  

---

## Project Goals

- Demonstrate microservice-based system design
- Apply event-driven communication patterns
- Implement real-time message delivery
- Maintain clear ownership of responsibilities across services
- Keep the system simple, understandable, and self-hostable

---

## Non-Goals

- Multi-tenant SaaS support
- Mobile push notifications (FCM / APNs)
- Guaranteed delivery or offline buffering
- End-user authentication (handled by the client application)

---

## Running the Project

```bash
docker-compose up --build
```

Each service runs in its own container and communicates over an internal Docker network.

---

## Project Structure

```
pushflow/
├── gateway/
├── dispatcher/
├── delivery/
├── docker-compose.yml
└── README.md
```

Each service is independently deployable and follows the standard NestJS project structure.

---

## License

This project is released under the **MIT License**.