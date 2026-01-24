# Kubernetes - Multi-container Pod Patterns

A Pod is a logical layer to group one or more containers sharing a **common network namespace** and **shared storage**. A multi-container Pod typically has one main/primary container and one or more helper containers.

## Shared Resources in Multi-Container Pods

| Resource | Shared in Pod? | Explanation |
| :--- | :--- | :--- |
| **Network Namespace** | $\checkmark$ Yes | All containers share the same network namespace. Communicate over localhost or the Pod's IP. Example: Helper container accesses the main container on `localhost:<port>`. |
| **Volumes/Storage** | $\checkmark$ Yes | Volumes are defined at the Pod level. Any container mounting the volume can access the data. Example: Sidecar reads logs written by the main container. |
| **PID Namespace** | $\times$ No | Each container has its own process namespace (isolated from others, unless `hostPID: true` is configured). |
| **Filesystem (Root FS)** | $\times$ No | Every container has its own root filesystem. Shared access is only possible via explicitly mounted volumes. |
| **Environment Variables** | $\times$ No | Environment variables are scoped to each container. Can be shared across containers using ConfigMaps or Secrets if needed. |

> **Note:** Setting `shareProcessNamespace: true` allows containers in the same Pod to see each other's processes (e.g., for sending signals using `kill`).

**Example Pod with `shareProcessNamespace: true`:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  shareProcessNamespace: true
  containers:
  - name: nginx
    image: nginx
  - name: shell
    image: busybox:1.28
    command: ["sleep", "3600"]
    securityContext:
      capabilities:
        add:
        - SYS_PTRACE # Example capability for process tracing
      stdin: true
      tty: true
```

---

## TYPES OF MULTI-CONTAINER POD PATTERNS

### 1. INIT CONTAINERS

*   **Lifecycle:** Startup containers designed to run **before** the main application container(s). They **always run to completion** (success or failure).
*   **Order of Execution:** If multiple Init Containers exist, they run **sequentially**, one after the other.
*   **Dependency:** The main/primary container **will not start** unless **all** Init Containers complete successfully (exit code 0).
*   **Use Cases (Preconditions Check):**
    *   Database readiness (verify DB connection or schema migration).
    *   External API health checks.
    *   File or directory initialization.
    *   Fetching secrets/configurations from external systems.
    *   Cleaning up temporary files from a previous run.
*   **Note:** You cannot `exec` into Init Containers as they stop and are removed upon completion.

**Example Init Containers (Checking External API and Internal Service DNS):**
This Pod will only start the `main-app` (nginx) container once the external API is available AND the internal service DNS can be resolved.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-demo-2
  labels:
    app: main-app
spec:
  initContainers:
  - name: check-api
    image: curlimages/curl:latest
    command:
    - sh
    - -c
    - |
      echo 'Checking external API availability...'
      sleep 25
      until curl -s https://kubernetes.io > /dev/null; do
        echo 'Waiting for external API...'
        sleep 5
      done
      echo 'External API is accessible, proceeding to next init container!'
  - name: check-svc
    image: curlimages/curl:latest
    command:
    - sh
    - -c
    - |
      echo 'Checking main-app Service availability...'
      until nslookup main-app-svc.default.svc.cluster.local; do
        echo 'Waiting for Service DNS resolution...'
        sleep 5
      done
      echo 'Service is reachable, proceeding to main-app container!'
  containers:
  - name: main-app
    image: nginx:latest
```

---

### 2. SIDECAR PATTERN

*   **Purpose:** Extend or **complement the functionality** of the main/primary container. They run alongside it and operate independently.
*   **Use Cases:**
    *   **Logging:** Collecting logs and sending them to a central system (like fluentd or fluentbit).
    *   **Monitoring:** Exporting metrics for tools like Prometheus.
    *   **Proxying:** Handling incoming traffic (often managed by the primary container).
    *   **Data Synchronisation.**

**Example Sidecar (Health Logger):**
The sidecar monitors the main app's health on port 80 and reports its status independently.
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: sidecar-logging-demo
spec:
  containers:
  # Main application container
  - name: main-app
    image: nginx:latest
    ports:
    - containerPort: 80
  # Sidecar container
  - name: health-logger
    image: curlimages/curl:latest
    command:
    - sh
    - -c
    - |
      while true; do
        curl -s http://localhost:80 > /dev/null && echo 'Main app is healthy' || echo 'Main app is unhealthy'
        sleep 5
      done
```
*If the main app fails (e.g., you `kill 1` from inside the main-app container), the sidecar logs **'Main app is unhealthy'**.*

---

### 3. AMBASSADOR PATTERN

*   **Involves:** Containers that act as **proxies** between the Pod and **external systems**.
*   **Focus:** Sidecars focus on internal cluster communication; **Ambassadors focus on handling external communication.**
*   **Use Cases:**
    *   **API Gateways:** Proxying external client requests to internal services (routing based on paths or headers).
    *   **Connection Management:** Optimizing and pooling connections to external resources (like databases or APIs).
    *   **Security:** Terminating TLS and handling OAuth token validation before forwarding requests.

| Aspect | Sidecar Pattern | Ambassador Pattern |
| :--- | :--- | :--- |
| **Scope** | Internal cluster communication | External system communication |
| **Primary Use Case** | Enhance the functionality of the main container | Mediate communication between pod and external systems |
| **Example** | Envoy managing traffic *between microservices* | Ambassador proxying requests *to external APIs* |

---

### 4. ADAPTER PATTERN

*   **Involves:** Containers that **transform or normalize** data flowing between the main container and the external system.
*   **Use Cases:**
    *   **Metric Transformation:** Convert custom application metrics into standard formats like Prometheus.
    *   **Log Normalisation:** Process and format logs for external logging systems.

---

## Differences Summary: Init Containers vs. Sidecar/Ambassador/Adapter

| Aspect | Init Containers | Sidecar / Ambassador / Adapter Containers |
| :--- | :--- | :--- |
| **Lifecycle** | Run to completion **before** main container starts. | Run **alongside** the main container, continue as long as the Pod runs. |
| **Order of Execution** | Always run **before** the main container, in sequence if multiple. | Start in **parallel** with the main container. |
| **Dependency on Success** | Main container won't start unless all inits complete successfully. | Main container **can run independently** (but may rely on helper functionality). |
| **Restart Behavior** | Re-run **only if they fail** before completion. | Restart policies apply same as the main container (`Always`, `OnFailure`, etc.). |
| **Purpose** | Setup, preparation, environment bootstrapping, precondition checks. | Enhance, complement, or adapt runtime behavior of the main container. |
| **Resource Consumption**| Consume resources **temporarily**, freed once completed. | Consume resources **throughout the pod's lifetime**. |
| **Common Use-Cases** | Database migrations, Configuration fetch, Waiting for dependencies. | Log collection, Proxying (Service Mesh), External communication handling. |
| **Visibility to Main Container** | Prepare shared volumes or environment; **not visible as active containers**. | Main container and helpers can interact live via **shared network & volumes**. |
| **Fail Impact** | Pod **won't proceed** if an init container fails. | If they fail, the Pod **continues**, but functionality (e.g., logging, proxying) may degrade. |```

---