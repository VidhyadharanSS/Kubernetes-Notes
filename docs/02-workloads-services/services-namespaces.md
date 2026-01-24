# Kubernetes - Services, Namespaces


## SERVICES

Kubernetes Pods are **ephemeral**; they can be created, destroyed, or rescheduled at any time. Each pod gets its own IP address, but these **IPs are not stable**.

**Services** provide a **stable network endpoint** and **load balancing mechanism** to access a group of pods, abstracting away the dynamic nature of pod lifecycles.

### Features:

*   A Service identifies its backend Pods by using **labels**, defined under a `selector` (e.g., `app=A`).
*   Every Service has an IP address called a **Virtual IP Address (VIP)** and a **DNS Name**.
*   We can create different Services using the `.spec.type` field: `ClusterIP`, `NodePort`, `LoadBalancer`, etc.
*   Backend Pods are integrated with the Service using the **EndPoint object** (or **EndpointSlice object**). The flow is: *Frontend app $\rightarrow$ Service $\rightarrow$ Endpoint $\rightarrow$ Backend pods*.
*   Service DNS names are controlled by the **CoreDNS** add-on in the k8s cluster.
*   Default protocols supported by a Service are: **TCP**, **UDP**, **SCTP**.
*   A Service can be identified by two primary modes: **Environment variables** (inside the container of the pod) and **DNS** (`<service-name>.<namespace>.svc.cluster.local`).

### Types (Service Access Scopes):

| Type | Access Scope | Description |
| :--- | :--- | :--- |
| **ClusterIP** | Internal (default) | Accessible **only within the cluster**. |
| **NodePort** | External via `<NodeIP>:<port>` | Exposes the service on a **static port** on **each node**. |
| **LoadBalancer** | External via cloud LB (AWS/GCP) | Creates an **external cloud provider load balancer**. |
| **ExternalName** | Maps to an external DNS name | Does **DNS aliasing**, no selector, does not proxy traffic. |

### 1. ClusterIP (default):

*(Diagram: User/Service communication flow using ClusterIP $\rightarrow$ Service maps to Pod via Selector `App:myapp`)*

*   **Purpose:** Exposes the service on an **internal IP address** within the cluster. Used for communication between services *inside* the cluster.
*   **Why Use It:** Default service type; provides secure, private communication without exposing to external traffic.
*   **How to Access:** Via the `spec.clusterIP` IP address (e.g., `http://<cluster-ip>:<port>`).
*   **Example:** A backend database service (e.g., MySQL) accessed only by application pods within the cluster.

#### ClusterIP Example YAML:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: database-service
spec:
  type: ClusterIP
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```
This service makes a MySQL database accessible only to other services within the cluster at `database-service:3306`. To test it, you need an utility pod and use `nslookup <clusterip>`.

### 2. NodePort

*   **Purpose:** Exposes the service on the same port across **all worker nodes**. It extends `ClusterIP` by allowing external traffic.

*(Diagram illustrates external user traffic hitting NodePort (e.g., 30007) on any Node $\rightarrow$ Service $\rightarrow$ Pod)*

*   **Why Use It:** When external access is needed but **without a cloud provider's load balancer** (e.g., in dev/test environments).
*   **Note:** NodePort IP can only be between **30000 to 32767**.
*   **How to Access:** Via any node's IP address and the assigned `nodePort` (e.g., `http://<node-ip>:30007`).
*   **Example:** Testing a web application (e.g., NGINX) externally in a non-cloud environment.

#### NodePort Example YAML:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-nodeport
spec:
  type: NodePort
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080
```
This exposes a web application on port `30080` of every cluster node, accessible via `http://<node-ip>:30080`.

### 3. LoadBalancer

*   **Purpose:** Integrates with cloud providers (e.g., AWS, GCP) to create an **external load balancer**.
*   **Why Use It:** For production-grade external access with high availability, SSL termination, and advanced routing.
*   **How to Access:** Via the cloud provider's load balancer IP (e.g., `http://<loadbalancer-ip>:<port>`).
*   **Example:** Public-facing web application (e.g., an e-commerce site) requiring global accessibility.

#### LoadBalancer Example YAML:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-loadbalancer
spec:
  type: LoadBalancer
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 8080
```
This creates a cloud load balancer that distributes traffic to web application pods, providing a stable external IP address.

### 4. ExternalName

*   **Purpose:** Maps the service to an **external DNS name**, acting as a **CNAME record**.
*   **Why Use It:** Allows services within the cluster to access external services using Kubernetes service discovery mechanisms. It **doesn't proxy traffic** but provides DNS resolution.
*   **When to Use:**
    *   Accessing external databases or APIs.
    *   Migrating services gradually (some internal, some external).
    *   Creating service abstractions for external dependencies.

#### ExternalName Example YAML:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-database
spec:
  type: ExternalName
  externalName: db.example.com
```

---

## NAMESPACES

A namespace is a **virtual cluster** within a physical Kubernetes cluster, providing **logical isolation** for resources (Pods, Services, Deployments, etc.).

### Why Use Namespaces?

*   **Resource Isolation:** Separate environments (e.g., `dev`/`prod`).
*   **Avoid Name Collisions:** The same resource name can exist in different namespaces.
*   **Access Control:** Apply **RBAC rules** per namespace.
*   **Resource Quotas:** Limit CPU/memory/storage per namespace.
*   **Not for Network Isolation:** Use **Network Policies** instead for traffic control between namespaces.

**Note:**
*   **Default Namespaces:** `default`, `kube-system`, `kube-public`.
*   **Service DNS Format:** `<service>.<namespace>.svc.cluster.local`.

### Example Namespace YAML:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
```

### Commands:

| Command | Description |
| :--- | :--- |
| `kubectl create ns <name>` | Create a namespace |
| `kubectl get namespaces` | List all namespaces |
| `kubectl describe ns <name>` | Show namespace details |
| `kubectl delete ns <name>` | Delete a namespace (cascades to all resources within) |
| `kubectl get pods -n <ns>` | List pods in a specific namespace |
| `kubectl config set-context --current --namespace=<ns>` | Set default namespace for the current context |

**Note on Checking Pod Namespace:**
To check which namespace a particular pod exists across the cluster:
```bash
kubectl get po --all-namespaces
# OR
kubectl get po -A
```

### Applying Frontend and Backend YAMLs (Namespace Specific)

*   **Frontend YAML** (`frontend-deploy.yaml`) applied to `app1-ns`:
    ```bash
    kubectl apply -f frontend-deploy.yaml -n app1-ns
    ```
*   **Backend YAML** (`backend-deploy.yaml`) applied to `app1-ns`:
    ```bash
    kubectl apply -f backend-deploy.yaml -n app1-ns
    ```

### Testing Namespace Isolation

1.  **Test Pod in default Namespace** (e.g., for testing outside namespaces):
    ```bash
    kubectl run test-pod --image=busybox -it --rm --restart=Never -- /bin/sh
    curl backend-svc:9090 # X Will not work (due to default namespace context)
    ```
2.  **For cross-namespace access**, use the fully qualified DNS format:
    ```bash
    curl http://backend-svc.app1-ns:9090
    ```

**Format for Cross-Namespace Access:**
`curl http://<service-name>.<namespace-name>:<service-port>`

*   `<service-name>`: Name of the Kubernetes Service (e.g., `backend-svc`).
*   `<namespace-name>`: Namespace where the service is deployed (e.g., `app1-ns`).
*   `<service-port>`: The **ClusterIP port** exposed by the service (e.g., `9090`).

### Setting a Default Namespace in Kubernetes Context

**Why?** It's cumbersome to use `-n <namespace>` with every command. You can set a default namespace in the current context.

```bash
kubectl config set-context --current --namespace=app1-ns
```
*   Now, you don't need to use `-n app1-ns` with every command.
*   To check the current context:
    ```bash
    kubectl config get-contexts
    ```

### Best Practices for Using Namespaces

*   **Segregate Workloads:** Separate `dev`, `test`, and `prod` environments.
*   **Use Namespaces for Multi-Tenancy:** Avoid resource conflicts by isolating teams or projects.
*   **Resource Quotas:** Set limits on CPU, memory, and storage per namespace.
*   **Namespace Naming Conventions:** Use clear and consistent names (e.g., `team-app-env` $\rightarrow$ `frontend-prod-ns`).
*   **Avoid Manual Deletion:** Use `kubectl delete namespace` carefully, as it removes **all** resources within it.
*   **Apply Network Policies:** Secure namespaces by using network policies to control traffic flow.

