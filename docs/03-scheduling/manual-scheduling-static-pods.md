# Kubernetes Scheduler & Static Pods

## Kubernetes Scheduler

The Kubernetes Scheduler automatically assigns Pods to Nodes based on the following criteria:

*   **Resource availability** (CPU, memory).
*   **Taints & Tolerations**.
*   **Affinity/Anti-affinity rules**.

### Manual Scheduling

You can force a Pod to run on a specific node using manual scheduling:

*   **How?** By setting the `nodeName` field in the Pod specification:
    ```yaml
    spec:
      nodeName: my-node-name
    ```

### Key Workflow Steps (for Scheduling/Creation):

1.  **Check Nodes:**
    ```bash
    kubectl get nodes
    ```
2.  **Apply Manifest:**
    ```bash
    kubectl apply -f <file>.yaml
    ```
3.  **Verify Pod Location:**
    ```bash
    kubectl get pods -o wide
    ```

> **Note:** If the node specified by `nodeName` is invalid or unavailable, the Pod will remain in **Pending** status. It might eventually be deleted over time via Kubernetes garbage collection policies. You can manually schedule Pods on **control-plane nodes** (despite their taints) by explicitly setting `.spec.nodeName`.

**Control Plane Nodes Run:**
*   `kubelet` (executes static/manual pods).
*   `kube-proxy` (handles networking).

---

## Static Pods

**Definition:** Pods that are managed directly by the **kubelet** agent on a node and **not** by the Kube API Server.

*   **Use Case:** Primarily used for bootstrapping and running control plane components (e.g., `kube-apiserver`, `etcd`).
*   **Resilience:** They run even if the API server is down.
*   **Defined At:** Manifest files are placed in `/etc/kubernetes/manifests/` on the node.
*   **Managed By:** **kubelet** (the API Server is unaware of them initially).
*   **Immutability:** Cannot be modified or deleted via `kubectl` commands (like `kubectl edit` or `kubectl delete`).

### Mirror Pods

*   **Creation:** `kubelet` creates a **Mirror Pod** object in the API Server to represent the static pod, allowing it to be viewed via `kubectl`.
*   **Status:** Mirror Pods are **Read-only**; you cannot modify or delete them via `kubectl`.
*   **Naming:** Mirror Pods are typically named as: `<pod-name>-<node-hostname>` (for example: `dashboard-proxy-node01`).

### Create Static Pod Example

To create a static pod named `nginx-static-pod` on the node where you execute the command:

```bash
cat <<EOF > /etc/kubernetes/manifests/static-pod.yaml
apiVersion: v1
kind: Pod
metadata:
 name: nginx-static-pod
spec:
 containers:
 - name: nginx-container
   image: nginx
   ports:
   - containerPort: 80
EOF
```

*   **Verify:** After creating the file, `kubelet` will pick it up and create the corresponding Mirror Pod:
    ```bash
    kubectl get pods -A
    ```
*   **To Permanently Delete:** You must **remove the manifest file** itself. Deleting the Mirror Pod via `kubectl delete` will only remove the mirror, and `kubelet` will immediately recreate it.
    ```bash
    rm -f  /etc/kubernetes/manifests/static-pod.yaml
    ```

### Production vs. KIND/Local Access Notes

*   **In Production (or bare-metal/VM setups):** To manage static pods, you typically need to **Access the node via SSH** and directly **Edit/Remove the static pod manifests** located at `/etc/kubernetes/manifests/`.

---