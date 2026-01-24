# Kubernetes Workflow

This detailed workflow describes the steps taken when a user submits a workload definition (e.g., a Deployment YAML) using `kubectl`.

![Advanced Kubernetes Workflow Diagram](../static/images/01-architecture-workflow/image%20copy.png)
---

#### Step 1: User Sends Request (`kubectl` → `kube-apiserver`)

You run a command like:

```bash
kubectl apply -f my-deploy.yaml
```

1.  `kubectl` sends an **HTTPS request** (e.g., a `POST` request for a new resource) to the `kube-apiserver` with the YAML payload (e.g., a Deployment resource).
2.  **`kube-apiserver`** performs:
    *   **Validation** of the schema.
    *   **Authentication** and **Authorization**.
    *   **Serialization** of the deployment object to JSON.
    *   **Persistence** of the object into etcd under a path like `/registry/deployments/default/my-deploy`.

| Method | Purpose in REST | `kubectl` equivalent | Explanation |
| :--- | :--- | :--- | :--- |
| `GET` | Retrieve a resource | `kubectl get` | Reads info from the cluster (e.g., `kubectl get pods`) |
| `POST` | Create a new resource | `kubectl apply` / `kubectl create` | Sends a new object definition to the cluster |
| `PUT` | Replace an existing resource | `kubectl replace` | Completely overwrites an existing object |
| `PATCH` | Modify part of a resource | `kubectl patch` | Changes only specified fields of an object |
| `DELETE` | Remove a resource | `kubectl delete` | Deletes the object from etcd |

#### Step 2: `kube-apiserver` Writes to etcd

1.  `kube-apiserver` serializes the Deployment object to **JSON** and stores it in etcd using **gRPC v3 API**.
2.  `etcd` assigns a version and revision number, and sends an acknowledgment.
3.  `kube-apiserver` responds to `kubectl` with a `201 Created` status.

#### Step 3: Deployment Controller (in `kube-controller-manager`) Watches

1.  `kube-controller-manager` uses an informers or **watches** on Deployments via `kube-apiserver`.
2.  It sees the new Deployment object and creates the appropriate number of **ReplicaSets** with matching labels and desired replicas.
3.  It writes the ReplicaSet object back to the API server, which stores it in etcd.

#### Step 4: ReplicaSet Controller Reacts

1.  The `kube-controller-manager` also runs the **ReplicaSet Controller**.
2.  It watches ReplicaSets, sees the new ReplicaSet, and creates the required number of **Pod objects**.
3.  It sends the Pod objects to the API server, where they are stored in etcd.
4.  At this point, the Pod objects exist in etcd but are in a **Pending** state and **not assigned to a node**.

#### Step 5: `kube-scheduler` Watches for Unscheduled Pods

1.  `kube-scheduler` watches the API server for Pods without `.spec.nodeName` (i.e., unscheduled Pods).
2.  It sees the unscheduled Pod and uses the 4-step scheduling process:
    *   **Filters eligible nodes:** (Based on taints, resources, affinity).
    *   **Scores and ranks nodes:** Assigns a score (0-10) to eligible nodes.
    *   **Selects the best node:** The highest scoring node.
    *   **Sends a Bind request to API server:** A `POST /bind` request with the Pod name and the selected node.

#### Step 6: `kube-apiserver` Updates `.spec.nodeName`

1.  The API server updates the Pod object with the chosen `.spec.nodeName = node-X`.
2.  This update triggers an etcd write and an **event for all watchers** (including the `kubelet` on `node-X`).

#### Step 7: `kubelet` on `node-X` Watches Pods

1.  The `kubelet` on `node-X` runs a watch on the API server for Pods assigned to its node.
2.  It sees the new Pod with `nodeName = node-X`.

#### Step 8: `kubelet` Pulls Image & Prepares Environment

1.  `kubelet`: Verifies the Pod specification and creates sandboxes (namespaces, cgroups) for the Pod.
2.  It calls the Container Runtime (**containerd** or another CRI) via **gRPC** to:
    *   Pull the container image.
    *   Start the container.
3.  It uses a **CNI plugin** (e.g., Calico, Flannel) to assign an IP and set up networking for the Pod.

#### Step 9: `kubelet` Sends Pod Status Updates

1.  `kubelet` continuously monitors the Pod/container.
2.  It sends regular `POST /status` calls to the API server with the status update (e.g., `Pending` → `Running` → `Terminated`), IP addresses, and Probe results.

#### Step 10: `kubelet` Runs Health Checks

`kubelet` performs continuous health checks on the running container:

*   **Liveness Probes:** If failing, it **restarts the container**.
*   **Readiness Probes:** If failing, it **removes the Pod from the service load balancer** (via the Endpoint Controller).

#### Step 11: Endpoint Controller Updates Services

1.  If the Pod becomes **Ready**, the Endpoints Controller (from `kube-controller-manager`) updates the associated **Endpoints** or **EndpointSlices**. It also removes unhealthy pods from the endpoints.
2.  This update is crucial for enabling load balancing via the `kube-proxy` or Ingress controller.

#### Step 12: `kube-proxy` Updates IPTables/IPVS

1.  On each node, `kube-proxy` watches for updates to Services and Endpoints.
2.  Whenever a Service is created or updated, it programs **IPTables** or **IPVS** rules to forward traffic from the Service's ClusterIP to the Pod's IP addresses.

#### Step 13: Final Running State

At this stage:

*   The container is running.
*   The Service is routing traffic to the container.
*   `kubelet` ensures continuous health checks.
*   Metrics, logs, and events related to the Pod are available to the user.

---