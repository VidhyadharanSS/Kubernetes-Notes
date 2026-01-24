# Kubernetes - Design patterns, Microservices

## MICROSERVICES & 3-TIER ARCHITECTURE

### Monolithic Architecture:

A single codebase containing UI, business logic, and database where all the components will be tightly coupled. Simple to start, but hard to scale, update, and maintain.

**Challenges:**

*   Tightly coupled components.
*   Downtime during upgrades.
*   Inefficient scaling.
*   Slower development due to cross-dependencies.

### Three-Tier Architecture Overview

![Microservices diagram](../static/images/01-architecture-workflow/1752147526443.png)

This is a common architectural pattern that logically separates the application into presentation, business logic, and data layers.

| Tier | Description | Technologies |
| :--- | :--- | :--- |
| **Frontend (Web Tier)** | User interface | HTML, CSS, JS, React, Angular, Vue.js |
| **Middleware tier** | Manages APIs, logging, authentication, service coordination | Express.js, Nginx, Kafka, RabbitMQ |
| **Backend (App Tier)** | Business logic, data processing | Java, Python, Node.js, Go, .NET |
| **Database (Data Tier)** | Storing, processing and retrieving unstructured and structured data. | MySQL, PostgreSQL, MongoDB, Redis |

*(Diagram notes the flow: User interacts with Web Tier $\rightarrow$ Middleware handles Auth/API/Coordination $\rightarrow$ Backend handles business logic $\rightarrow$ Data Tier stores data)*

### Deployment Models (Evolution from 3-Tier)

1.  **Single-Server Model**
    *   All tiers run on one machine.
    *   **Pros and cons:** Simple but **not scalable or fault-tolerant**.
2.  **Three-Server Model**
    *   Each tier on separate physical servers.
    *   **Pros and cons:** Better performance and fault isolation, but **costly**.
3.  **Virtualized Deployment**
    *   Tiers run in VMs on a single machine.
    *   **Pros and cons:** More affordable, **scalable, and isolated**.
4.  **Cloud and Kubernetes**
    *   Apps run in containers orchestrated by Kubernetes.
    *   Frontend, backend, and services are deployed independently (stateless services).
    *   **Pros and cons:** Databases often remain outside Kubernetes in managed services (e.g., AWS RDS).

#### Challenges with 3-Tier Architecture (that Microservices/K8s aim to solve)

*   Inefficient tier-level scaling (scaling must be done for the whole tier).
*   **Single point of failure (SPOF)**, which can cause the entire system to stop working if a tier fails.
*   Tight coupling *within* tiers.
*   Slower deployment cycles.
*   Tech stack limitations *within* a tier (hard to introduce new languages/frameworks).

> **Note:** This 3-tier architecture can be run as a monolith (MVC framework) or deployed as microservices. It is just a design pattern.

---

## INTRODUCTION TO MICROSERVICES

### Why Microservices?

*   Breaks down a monolithic app into **independent services** where each service can be **scaled and updated independently**.

#### Example Services in E-Commerce:

*   User Service
*   Product Service
*   Order Service
*   Wishlist Service

#### Advantages:

*   **Independent scaling** (only scale the service under load).
*   **Fault isolation** (failure in one service doesn't necessarily bring down others).
*   **Faster deployments** (smaller codebases deploy quicker).
*   **Polyglot architecture** (different services can use the best-suited technology stack).
*   Easier maintenance.

### Microservices in Kubernetes

*   Each service runs in its own **Deployment** workload object.
*   They can be **auto-scaled** via **HPA** (Horizontal Pod Autoscaler).

### Databases in Kubernetes (Stateful Workloads)

Databases are often hosted **outside** Kubernetes due to:

*   **Stateful complexity** (managing persistent state is harder than stateless).
*   Performance needs.
*   Easier HA and backup via managed services (AWS RDS, GCP SQL).

#### When to run DB in K8s:

*   Testing or development environments.
*   Using **operators** (e.g., MySQL/PostgreSQL Operator) to manage complexity.
*   Small-scale self-managed setups.

> **StatefulSets** are the primary Kubernetes object used to manage **stateful workloads** like databases inside Kubernetes, ensuring unique network identities and ordered deployment/scaling/deletion.

![Microservices diagram](../static/images/01-architecture-workflow/1752147545184.png)
*(Diagram notes for DB Pods: Not strictly replicas, one often acts as Master, others as Slaves. Requires ordered creation & deletion with Unique Names.)*

---