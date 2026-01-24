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

## Horizontal Pod Autoscaler (HPA)

*   Adjusts Pod **replicas** based on observed metrics.
*   The HPA Controller runs a control loop checking metrics every **15 seconds**.
*   Works with `Deployment`, `StatefulSet`, `ReplicaSet`, and `ReplicationController`.

### Resource Requests Requirement

*   **HPA needs CPU/memory requests** defined on the Pods to calculate the utilization percentage.
*   Without requests, HPA has no baseline for scaling.

### Metrics Flow (Default: CPU/Memory)

1.  cAdvisor collects usage on node.
2.  kubelet exposes metrics.
3.  Metrics Server aggregates metrics.
4.  HPA queries Metrics Server and makes scaling decisions.

#### Custom Metrics Categories:

| Type | Description | API Used |
| :--- | :--- | :--- |
| **Internal Custom Metrics** | Metrics tied to Kubernetes objects (like pods or deployments). | Custom Metrics API |
| **External Metrics** | Metrics not related to Kubernetes objects (external systems, APIs, etc.). | External Metrics API |

**Flow with Custom Metrics (Requires Prometheus + Adapter):**
`Internal/External Systems` $\rightarrow$ `Prometheus Server` $\rightarrow$ `Prometheus Adapter` $\rightarrow$ Exposes via `Custom Metrics API` or `External Metrics API` $\rightarrow$ **HPA Controller** $\rightarrow$ Scales IN or OUT.

Configuration:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nginx-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hpa-deploy
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50 
```

### HPA Demo Summary (CPU Scaling)

1.  **Create Deployment** (`nginx-deploy`) with CPU requests/limits:
    ```yaml
    # ... snippet from deployment manifest
    resources:
      requests:
        cpu: "100m"
      limits:
        cpu: "200m"
    ```
2.  **Expose with ClusterIP Service** (`nginx-svc`).
3.  **Create HPA:** Set target utilization to 50% of requests, with min 1 pod, max 5 pods.
    ```bash
    kubectl autoscale deployment nginx-deploy --cpu-percent=50 --min=1 --max=5
    ```
4.  **Behavior:**
    *   If average CPU usage **$> 50\%$**, HPA scales out (adds pods, up to max 5).
    *   If average CPU usage **$< 50\%$**, HPA scales in (removes pods, but maintains minimum 1).

**Load Generation Example:**
```bash
kubectl run -it --rm load-generator --image=busybox /bin/sh -- while true; do wget -q -O- http://nginx-svc; done
```
*   **Note:** Kubernetes defaults to targeting **80% CPU usage** if `--cpu-percent` is not specified.

---

## Vertical Pod Autoscaler (VPA)

*   **Function:** Automatically adjusts **CPU/memory requests** (and optionally limits) for Pods based on historical usage.
*   **Behavior:** Restarts Pods to apply changes (unless in a specific mode).
*   Useful when manual tuning of resource requests is difficult.

### VPA Modes

| Mode | Behavior |
| :--- | :--- |
| **Off** | Only provides recommendations. Safe for production. |
| **Initial** | Sets values at pod creation only. No updates afterward. |
| **Auto** | Continuously updates resources and **restarts pods** as needed. |

*   **Note:** In **`Auto`** mode with 1 replica, VPA may be configured to avoid restarts to prevent downtime.

### VPA Components
1.  **Recommender:** Analyzes and suggests optimal values.
2.  **Updater:** Evicts pods when needed (respects Pod Disruption Budgets).
3.  **Admission Controller:** Modifies Pod specs upon creation if a VPA applies to the namespace.

### VPA Demo Summary (Using Auto Mode)

1.  Create NGINX Deployment with 2 replicas.
2.  Apply VPA object configured for `updateMode: Auto`.

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: nginx-vpa
spec:
  targetRef:
    apiVersion: "apps/v1"
    kind: Deployment
    name: nginx-deploy
  updatePolicy:
    updateMode: "Auto" # VPA automatically updates resources and restarts pods as needed.
```
*   Observe recommendations: `kubectl describe vpa`

### HPA vs VPA Comparison

| Feature | HPA (Horizontal Pod Autoscaler) | VPA (Vertical Pod Autoscaler) |
| :--- | :--- | :--- |
| **Type of scaling** | Number of **replicas** (Pods) | CPU/memory of **a pod** |
| **Resources monitored**| CPU, memory, **custom metrics** | CPU, memory |
| **Resource adjusted** | Number of pods | CPU/memory requests/limits |
| **Pod restart required** | **No** | **Yes** (for changes to take effect) |
| **Components required** | Metrics Server | VPA Recommender, Updater, Admission Controller |
| **Ideal use case** | Variable workloads, web APIs, microservices | Batch jobs, ML workloads, stable workloads with hard-to-tune requests |
| **Compatibility** | Combination possible with Caution | Combination possible with Caution |

---

