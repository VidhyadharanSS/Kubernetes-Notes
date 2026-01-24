# Scheduling - Taints, Tolerations, Node Selectors, Node Affinity


## TAINTS

**1. Purpose:** Prevent Pods from scheduling on specific nodes unless the Pod explicitly tolerates the taint. Taints act as a **repellant** for pods that don't have a matching toleration.

**2. Use Cases:**
*   Dedicate nodes for specific workloads (e.g., marking nodes with GPUs or large memory for specialized Pods).
*   Mark nodes as "unhealthy" or for maintenance, preventing new Pods from being scheduled there.

**3. Key Points:**
*   Taints are **applied to nodes** using `kubectl taint`.
*   Taints have **three effects** which determine how they interact with Pods lacking toleration:
    *   **`NoSchedule`**: Pods **won't schedule** unless they have a matching toleration. Existing Pods remain unaffected.
    *   **`PreferNoSchedule`**: Kubernetes **avoids** scheduling Pods without a toleration, but it is only a **preference** and can be overridden.
    *   **`NoExecute`**: Pods **won't schedule** without a toleration. **Crucially, it also evicts existing Pods** that are already running on the node and do not tolerate the new taint.

**4. Commands:**

*   **Add a taint to a node:**
    ```bash
    kubectl taint nodes <node-name> key=value:effect
    ```
    **Example (Taint a node for GPU workloads):**
    ```bash
    kubectl taint nodes gpu-node1 hardware=gpu:NoSchedule
    ```
*   **Remove a taint:**
    ```bash
    kubectl taint nodes <node-name> key:effect-
    ```
    **Example (To remove the `NoSchedule` taint from the control-plane node, even if you don't know the value):**
    ```bash
    kubectl taint nodes controlplane node-role.kubernetes.io/control-plane- --overwrite
    ```

---

## TOLERATIONS

**1. Purpose:** Allow Pods to schedule on nodes that have one or more Taints. Tolerations are the **mechanism for a Pod to ignore a Taint**.

**2. Key Points:**
*   Defined in the Pod specification under `spec.tolerations`.
*   A toleration must generally **match the taint's key, value, and effect** exactly.
*   **Operator Special Case:** If `operator: Exists` is used, the toleration only needs to match the taint's **key and effect** (the `value` is ignored, or effectively matches anything).

**3. Example (Pod YAML):**

This Pod will only land on nodes tainted with `hardware=gpu:NoSchedule`.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  containers:
  - name: nvidia
    image: nvidia/cuda
  tolerations:
  - key: "hardware"
    operator: "Equal" # Same as omitting the operator, but explicit
    value: "gpu"
    effect: "NoSchedule"
```

*   **`operator: "Exists"`:** Tolerates any taint with the matching key (ignores the value).

**4. Commands (for verification):**

*   **Check node taints:**
    ```bash
    kubectl describe node <node-name> | grep Taints
    ```
*   **Verify Pod tolerations:**
    ```bash
    kubectl describe pod <pod-name> | grep Tolerations
    ```

> **Note:** Taints and Tolerations only **prevent/allow** scheduling based on node conditions. They do **not control *which* node** the Pod ultimately lands on if multiple suitable nodes exist. For explicit node placement based on labels, we use **Node Selectors** or **Node Affinity**.

---

## NODE SELECTORS

**1. Purpose:** Schedule Pods onto specific nodes using **simple exact label matching**. This is a **hard requirement** for placement.

**2. Key Points:**
*   Works only with **exact label matches** (no advanced logical expressions like OR/NOT).
*   Defined in `spec.nodeSelector` within the Pod or Deployment YAML.

**3. Example (Pod YAML):**

This Pod will *only* run on nodes that possess the exact label `disk: ssd`.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx
  nodeSelector:
    disk: ssd # Pod will only run on nodes with label `disk=ssd`
```

**Commands:**

*   **Label a node:**
    ```bash
    kubectl label nodes <node-name> disk=ssd
    ```
*   **Verify node labels:**
    ```bash
    kubectl get nodes --show-labels
    ```
*   **Find Pods with a specific NodeSelector:** (By checking the node they were scheduled on)
    ```bash
    kubectl get pods -o wide | grep <node-name>
    ```

> **Note:** To provide **advanced expressions** like OR, NOT, or weighted preferences, you should use **Node Affinity** instead of `nodeSelector`.

---

## NODE AFFINITY

**1. Purpose:** Provides **advanced, flexible rules** to attract or repel Pods from nodes based on node labels.

**2. Types (Rule Strength):**

*   **`requiredDuringSchedulingIgnoredDuringExecution` (Hard rule):** A **hard requirement**. The Pod will only be scheduled if at least one node matches the rule. If the node labels change *after* scheduling to violate this rule, the Pod stays on the node (Ignored During Execution).
*   **`preferredDuringSchedulingIgnoredDuringExecution` (Soft rule):** A **preference**. The scheduler attempts to place the Pod on a node that satisfies the rule, assigning a **weight** (1-100) to indicate preference strength, but it is not guaranteed. Existing Pods are unaffected if node labels change.

**3. Operators (Used within `matchExpressions`):**
*   `In`, `NotIn`, `Exists`, `DoesNotExist`, `Gt` (Greater Than), `Lt` (Less Than).

### Example - Hard rule:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-pod
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: hardware
            operator: In
            values: [gpu]
  containers:
  - name: nginx
    image: nginx
```

### Example - Hard rule + Soft rule (Combined in Deployment):

This example shows a Deployment that **must** run on nodes with storage label `ssd` **OR** `hdd` (Hard Rule), and **prefers** nodes with storage label `ssd` (Soft Rule, weighted higher).

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: preferred-na-deploy
spec:
  replicas: 5
  selector:
    matchLabels:
      app: app1
  template:
    metadata:
      labels:
        app: app1
    spec:
      affinity:
        nodeAffinity:
          # HARD RULE: Must satisfy one of these terms
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: storage
                operator: In
                values:
                - ssd
                - hdd
          # SOFT RULE: Tries to satisfy these terms, weighted by preference
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 10
            preference:
              matchExpressions:
              - key: storage
                operator: In
                values:
                - ssd
          - weight: 5
            preference:
              matchExpressions:
              - key: storage
                operator: In
                values:
                - hdd
      containers:
      - name: nginx
        image: nginx
```

**Commands (for verification):**

*   **Check node labels:**
    ```bash
    kubectl get nodes --show-labels
    ```
*   **Describe node affinity** (check the scheduler decision in the Pod description):
    ```bash
    kubectl describe pod <pod-name> | grep -A 10 Affinity
    ```
---