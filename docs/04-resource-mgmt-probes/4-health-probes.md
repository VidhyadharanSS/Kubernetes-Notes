# Kubernetes - Health Probes - Liveness, Readiness, Startup

## HEALTH PROBES

Health probes are mechanisms managed by the `kubelet` to check the status of containers within a Pod.

### Types of Health Probes

| Probe Type | Checks For | Action on Failure | Runs During | Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **Readiness** | If the container is **ready** to serve traffic. | Marks Pod **Unready** (removes from Service Endpoints). Container is **NOT restarted**. | Continuously throughout the Pod's lifecycle. | DB Connection, Application initialization, Temporary Overload. |
| **Liveness** | If the container is **alive and functioning properly**. | **Restarts** the failed container. Other containers in the Pod remain unaffected. | Continuously throughout the Pod's lifecycle. | Deadlock Detection, Unresponsive States, Memory Leaks (apps stuck in OOM errors). |
| **Startup** | If the container has **enough time to initialize** the application. | Restarts if the probe fails. | Only runs until it succeeds **once**. | Legacy/Slow-Starting Apps, Resource-Intensive Apps, Large Data Loading Jobs. |

*   **Readiness Probes:** If any single container inside the Pod fails its readiness check, the **entire Pod is marked as 'Not Ready'** and removed from Service Endpoints, but the container is **not restarted**.
*   **Liveness Probes:** If a Liveness probe fails, the **particular container is restarted** by the kubelet.
*   **Startup Probes:** **Readiness and Liveness probes only start running *after* the Startup Probe succeeds.**

---

### PROBE TIMER CONFIGURATION PARAMETERS

These properties are common across Readiness, Liveness, and Startup probes.

| Property | Meaning | Default Value | Example |
| :--- | :--- | :--- | :--- |
| `initialDelaySeconds` | Wait time before the first probe starts after the container starts. | 0 seconds | `initialDelaySeconds: 5` $\rightarrow$ starts after 5 sec |
| `periodSeconds` | Time interval between probe attempts. | 10 seconds | `periodSeconds: 10` $\rightarrow$ probes every 10 sec |
| `timeoutSeconds` | Max wait time for probe response. | 1 second | `timeoutSeconds: 2` $\rightarrow$ fail if no reply in 2 sec |
| `successThreshold` | No. of consecutive successes needed to mark probe as successful. | 1 | `successThreshold: 3` $\rightarrow$ pass after 3 successes |
| `failureThreshold` | No. of consecutive failures before marking probe as failed. | 3 | `failureThreshold: 5` $\rightarrow$ fail after 5 failures |

---

## PROBE MECHANISMS

(Supported by RP, LP & SP)

There are three ways to execute a probe:

### 1. HTTP GET Requests:
The `kubelet` sends an HTTP GET request to a specified endpoint.
*   **Success:** Status codes **200–399**.
*   **Failure:** Any other status code (e.g., 404, 500).

**Example (Liveness Probe):**
```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
    httpHeaders:
    - name: Custom-Header
      value: Awesome
  initialDelaySeconds: 3
  periodSeconds: 3
  timeoutSeconds: 1
  failureThreshold: 1
```

### 2. TCP Socket:
The `kubelet` checks if a TCP connection can be established to a specified port.
*   **Success:** Connection is established.
*   **Failure:** Connection cannot be established.
*   **Use Case:** Useful for services like databases that listen on specific ports.

**Example (Startup Probe):**
```yaml
startupProbe:
  tcpSocket:
    port: 9444
  failureThreshold: 15
  periodSeconds: 5
```
*Probe waits until a TCP connection can be established on port 9444. Can be used for legacy/slow-starting applications.*

### 3. Command Execution:
The `kubelet` runs a specified command inside the container.
*   **Success:** Command exits with code **0**.
*   **Failure:** Command exits with a **non-zero code**.

**Example (Readiness Probe):**
```yaml
readinessProbe:
  exec:
    command:
    - cat
    - /tmp/ready
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 1
```
*This runs `cat /tmp/ready`. If the file exists, the command exits 0 (Success); otherwise, it exits non-zero (Failure).*

---

### EXAMPLES

#### 1. Readiness Probe with Command Execution

This Pod creates a file `/tmp/ready` after 3 seconds, making it ready.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readiness-probe-demo
spec:
  containers:
  - name: busybox-app
    image: busybox
    command: ["sh", "-c", "touch /tmp/ready; sleep 3600"] # Creates file then keeps running
    readinessProbe:
      exec:
        command:
        - cat
        - /tmp/ready
      initialDelaySeconds: 5 # Wait 5 seconds before the first probe
      periodSeconds: 5       # Probe runs every 5 seconds
      failureThreshold: 1    # Mark pod as NotReady after 1 failure
```
*   To simulate failure: `kubectl exec -it readiness-probe-demo -- rm /tmp/ready`.

#### 2. Liveness Probe with HTTP Get

This example shows a Liveness probe that checks `/healthz` on port 8080 and sends a custom header. **Crucially, the behavior of the endpoint changes over time:**
*   For the first 10 seconds, the endpoint returns **200 (Success)**.
*   After 10 seconds, it returns **500 (Failure)**, which will cause the container to be **restarted** due to `failureThreshold: 1`.
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: liveness-probe-demo
  labels:
    test: liveness
spec:
  containers:
  - name: liveness
    image: registry.k8s.io/e2e-test-images/agnhost:2.40
    args: ["liveness"]
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
        httpHeaders:
        - name: Custom-Header
          value: Awesome
      initialDelaySeconds: 3 # Wait 3 seconds before starting probes
      periodSeconds: 3       # Run the probe every 3 seconds
      timeoutSeconds: 1      # Wait 1 second for a response before timing out
      failureThreshold: 1    # After 1 failure, restart the container
```

#### 3. Startup Probe with TCP Socket

This probe is designed for slow-starting applications that need a long time before they can even respond to a Liveness or Readiness check.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: startup-probe-demo
spec:
  containers:
  - name: tcp-app
    image: ubuntu:latest
    command:
    - sh
    - -c
    - |
      apt update && \
      apt install -y netcat-openbsd && \
      nc -l -p 9444 && \
      sleep 3600
    startupProbe:
      tcpSocket:
        port: 9444
      failureThreshold: 15   # Allows up to 15 failed attempts (15 * 5s = 75 seconds total initial check time)
      periodSeconds: 5       # Probe runs every 5 seconds
```
*The probe waits until the TCP server (port 9444) is ready, allowing the slow startup commands to complete before Liveness/Readiness checks begin.*

---