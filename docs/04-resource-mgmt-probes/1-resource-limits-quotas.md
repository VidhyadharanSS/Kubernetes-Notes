# Resource Management - Resource Limits, Limit Ranges, Resource Quotas.

---

## RESOURCE REQUIREMENTS AND LIMITS

**Purpose:** Define CPU/Memory **guarantees (Requests)** and **ceilings (Limits)** for Pods.

### Representations

#### 1. CPU Units
*   **1 CPU** = 1 vCPU/core (AWS/Azure/GCP) = 1 Hyperthread (Intel).
*   **Millicores (`m`):** Used to express fractions of a CPU.
    *   `1000m` = 1 CPU.
    *   `500m` = 0.5 CPU.

#### 2. Memory Units
Memory is measured in powers of 1024 (binary prefixes, Ki, Mi, Gi).

| Unit | Equivalent | Example |
| :--- | :--- | :--- |
| **Gi** | 1 Gibibyte = 1024 Mi | `2Gi = 2048Mi` |
| **Mi** | 1 Mebibyte = 1024 Ki | `512Mi` |
| **Ki** | 1 Kibibyte = 1024 bytes | `256Ki` |
| **G** | 1 Gigabyte = 1000 MB | *(Avoid: Use Gi)* |
| **M** | 1 Megabyte = 1000 KB | *(Avoid: Use Mi)* |

### Key Concepts

*   **Requests:** **Minimum resources guaranteed** to a container inside a Pod. This is used by the **Scheduler** for making the placement decision.
*   **Limits:** **Maximum resources** a container inside a Pod can use. This is **enforced by the kubelet** on the node.

### CPU vs Memory Behaviour (Exceeding Values)

| Resource | Exceeding Request | Exceeding Limit |
| :--- | :--- | :--- |
| **CPU** | Throttled (not killed) | Throttled to the limit |
| **Memory** | May be evicted if the node is under pressure (low priority) | **OOMKilled** (container restarts) |

### Pod Resource Manifest Example

If a Pod specifies limits but no requests, Kubernetes defaults the **Requests** to equal the **Limits**.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: complex-pod
spec:
  containers:
  - name: main
    image: nginx
    resources:
      limits:
        cpu: "200m"
        memory: "512Mi"
  - name: sidecar
    image: alpine
    command: ["sh", "-c", "sleep 3600"]
    resources:
      requests:
        cpu: "100m"
        memory: "128Mi"
```
*   **Total Requests:** `main` (0 CPU) + `sidecar` (100m CPU) = **100m CPU** request (Note: The example text says total limits are 300m, but based on the manifest above, the actual total request is 100m, and total limit is 300m). **For predictable scheduling, Requests should ideally match Limits.**

### How Kubernetes Collects Metrics (`kubectl top`)

Metrics are collected for monitoring usage, not for scheduling decisions (that's what Requests are for).

**Metrics Flow (Default - CPU/Memory):**
`Pods/Nodes` $\rightarrow$ **kubelet** (with **cAdvisor**) $\rightarrow$ **Metrics Server** $\rightarrow$ **API Server** $\rightarrow$ **User** (`kubectl top`)

*   **cAdvisor:** A built-in component of the `kubelet` binary that collects raw resource usage statistics (CPU, memory, filesystem, network) for containers on its node.
*   **Metrics Server:** A cluster-wide aggregator that collects data from all `kubelet`s and exposes it via the standard `metrics.k8s.io` API, which HPA and `kubectl top` use. It stores only short-term metrics.

**`kubectl top nodes` Output Columns:**

| Column | Meaning |
| :--- | :--- |
| `NAME` | The node name or IP address. |
| `CPU(cores)` | Current CPU usage in **millicores (m)**. (`1000m = 1 CPU core`). |
| `CPU(%)` | Percentage of total allocatable CPU currently in use. |
| `MEMORY(bytes)` | Current memory usage in **MiB (Mebibytes)**. |
| `MEMORY(%)` | Percentage of total allocatable memory currently in use. |

**Commands for Resource Checks:**
*   Check Pod resource usage: `kubectl top pod <pod-name>`
*   Describe node resources and check allocatable amount: `kubectl describe nodes | grep -A 10 "Allocated resources"`

---

## LIMITRANGE (NAMESPACE-LEVEL DEFAULTS)

**Purpose:** Enforce **default/min/max resources** for Pods/Containers within a specific namespace.

**What It Does:**
*   Sets **default** requests/limits if they are omitted in a Pod spec.
*   **Rejects** Pods that try to set requests or limits outside the namespace's defined **min/max rules**.
*   Prevents resource starvation or creation of excessively large Pods in shared clusters.

**Example LimitRange YAML:**
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: my-limits
spec:
  limits:
  - type: Container
    min: { cpu: "100m", memory: "100Mi" } # Minimum allowed
    max: { cpu: "2", memory: "2Gi" }     # Maximum allowed
    default: { cpu: "500m", memory: "512Mi" } # Default limits if omitted
```

**Memory Limit Enforcement Detail:**
A container exceeding its memory **Limit** gets terminated by the Linux Kernel's **cgroup OOM Killer**, independently of the node's overall memory status.

**Commands:**
*   Apply LimitRange: `kubectl apply -f limitrange.yaml`
*   Verify setup: `kubectl describe limitrange my-limitrange`

---

## RESOURCEQUOTA

**Purpose:** Restrict **total resource consumption** per namespace.

**Example ResourceQuota YAML:**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: my-quota
spec:
  hard:
    requests.cpu: "10"        # Max 10 CPU requests in namespace
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"                # Max 50 Pods in namespace
```
*   A quota of `"0"` pods effectively locks the namespace from running any workloads.

**Key Differences: LimitRange vs. ResourceQuota**

| Feature | LimitRange | ResourceQuota |
| :--- | :--- | :--- |
| **Scope** | Per-container/Pod in a namespace | Aggregated per namespace |
| **Enforces** | Min/max/default resources | Total resource caps |
| **Use Case** | Prevent tiny/huge Pods; Set defaults | Prevent namespace resource abuse |

**Notes on Resource Management:**
1.  **Always set requests $\approx$ limits** for predictable scheduling (avoid the "noisy neighbor" problem).
2.  **Monitor OOMKills:** Adjust memory limits if frequent restarts occur.
3.  Use **LimitRange** to enforce defaults (e.g., for `dev` vs. `prod` namespaces).
4.  Combine with **HorizontalPodAutoscaler (HPA)** for dynamic scaling.
5.  **Pro Tip:** Use `kubectl describe nodes` to debug scheduling failures (e.g., "Insufficient cpu/memory").

---

# Resource Management - HPA, VPA

### 1. What is Scaling?

*   **Scaling** adjusts application resources based on load.
*   **Goal:** Meet demand without over-provisioning.
*   **Elastic scaling:** Scale up on high load, scale down on low load.

#### Scaling Types:

*   **Horizontal Scaling:** Changing the **Number of replicas** (Pods/VMs).
    *   **Scaling Out:** Adding more instances/pods.
    *   **Scaling In:** Removing instances/pods when load decreases.
*   **Vertical Scaling:** Changing the **CPU/Memory resources** of the **existing** Pod or VM.
    *   Often requires the Pod/VM to **restart** for new resource requests to take effect.

#### Scaling Approaches:

| Scaling Type | For Worker Nodes | For Pods (Automatic) | For Pods (Manual) |
| :--- | :--- | :--- | :--- |
| **Horizontal** | Cluster Autoscaler, Karpenter | **HPA** (Horizontal Pod Autoscaler) | Use `kubectl scale deploy/my-deploy --replicas=2` |
| **Vertical** | (Disruptive, generally avoided) | **VPA** (Vertical Pod Autoscaler) | Changing the `requests` & `limits` in the manifest |

---
