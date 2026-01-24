# Kubernetes Architecture

Kubernetes is an **open source container orchestration platform** that automates many of the manual processes involved in deploying, managing, and scaling containerized applications.

---

### OVERVIEW

![Advanced Kubernetes Workflow Diagram](../static/images/01-architecture-workflow/image.png)

*   **Node Types:** There are 2 types of nodes in the entire cluster: **control plane (master)** and **compute plane (worker) nodes**. Each node's components will be running only on their nodes, except **kubelet** which runs as an agent/systemd service/daemonset in each and every node.
*   **HA Setup:** In **HA (High availability environments)** or multi-master setups for a large cluster, we deploy **3-5 control plane nodes** and multiple worker nodes to run workloads for **fault tolerance and reliability** purposes.

---

### CONTROL PLANE NODE COMPONENTS

In on-premise setups, we typically have 4 components in the control plane nodes, but in case of cloud-based setups, we will additionally have a **cloud-controller manager** (node, route, service controllers, etc.).

#### 1. KUBE API SERVER:

*   **Role:** Acts as the **front-end component** of the Kubernetes cluster and is the **first point of contact** for all client requests.
*   **Handles:**
    *   **Authentication** (e.g., via username/password with LDAP, certificates, or tokens/IAM).
    *   **Authorization** (via RBAC, ABAC, Webhooks, or Node-based policies).
    *   **Admission Control** (Mutating & validating) and object schema **Validation** before persisting the workload object in the **etcd**.
*   **HA:** In HA setups, the kube-API Server runs on multiple nodes with a load balancing mechanism.
*   **Communication:** It communicates with all the other components (Kube Controller Manager, kube-scheduler, etcd) exclusively through **authenticated requests**.
*   **Execution & Port:** By default, it runs as a **static pod** and listens on port **6443**.

*(Diagram: API Request flow - API HTTP handler -> Auth/Authz -> Mutating Admission -> Object Schema Validation -> Validating Admission -> Persisted to etcd)*

---

#### 2. ETCD SERVICE

*  **etcd** is a **highly available, distributed, schemaless key-value store** used to store all Kubernetes cluster data such as nodes, pods, config maps, secrets, service accounts, etc.
* It is used by components like **Kubernetes**, **CoreDNS**, **Rook (Ceph)**, and more.
*   etcd is written in **Go** and uses the **RAFT consensus algorithm** for high availability, fault tolerance, and consistency.

##### Key Characteristics

*   **Key-Value Store:** Stores data in simple key-value pairs (not documents or tables).
*   **Schema-less:** Each key is independent. Updating one key doesn't affect others, unlike rigid schema designs in traditional SQL systems.
*   **Highly Available:** In production, etcd is deployed on an **odd number of nodes** (e.g., 3 or 5) to ensure quorum-based leader election via RAFT.
*   **Cluster Communication:**
    *   Client communication happens on port **2379**.
    *   Peer (internal) communication between different etcd nodes happens on port **2380**.
*   **Execution:** Runs as a **static pod** on control plane nodes and is managed by kubelet (`/etc/kubernetes/manifests/etcd.yaml`).
*   **Write Operations:** Only the **Kubernetes API Server** performs write operations on etcd. Other components use the API Server to access the cluster state. etcd has its own command-line tool - `etcdctl`.
*   **Data Format:** etcd stores all the Kubernetes cluster data in key/value format, for example:

| Key | Value |
| :--- | :--- |
| `/registry/pods/default/nginx` | (Pod definition in JSON format) |
| `/registry/nodes/node1` | (Node object data) |
| `/registry/configmaps/kube-system/coredns` | (CoreDNS ConfigMap) |

##### Commands:

```bash
# To get etcdctl version
./etcdctl --version

# To store a key-value pair (V2.0/V3.0)
./etcdctl set key1 value1 (V2.0)
./etcdctl put key1 value1 (v3.0)

# To retrieve the stored data
./etcdctl get key1

# To list all keys
./etcdctl get "" --prefix --keys-only

# To view more options
./etcdctl --help

# Disaster Recovery: Regular etcd snapshots are essential.
etcdctl snapshot save (Take a snapshot)
etcdctl snapshot status (Check snapshot status)
etcdctl snapshot restore (Restore a snapshot)
```

---

#### 3. KUBE CONTROLLER MANAGER (KCM)

*   **Role:** KCM will be having controllers/informers/watches, which ensures the **desired state** of the resource object stored in etcd matches the **current state** of the resource object in the cluster. It also informs the API Server if any discrepancies are found.
*   **Manages various controllers:**
    *   **Node Controller:** Monitors the state of the node every **5s** through API server. If it stops receiving heartbeats, the node is marked as **unreachable** but waits for **40 seconds** before marking it unreachable. After a node is marked unreachable, it gives **5 minutes** to come back up, and if it doesn't, it **removes the pods associated with the nodes** and provisions them to a healthy node.
    *   **Replication Controller:** Responsible for monitoring the status of replicasets, ensuring the desired number of pods are available anytime within the set.
    *   **Job Controller**
    *   **ServiceAccount Controller**
    *   **Deployment Controller**
*   **Execution & Port:** Runs as a **static pod** and listens on port **10257**.

---

#### 4. CLOUD CONTROLLER MANAGER

*   **Role:** Provides Kubernetes integration with cloud provider services (e.g., **AWS, Azure**).
*   **Handles:**
    *   Node lifecycle management
    *   Route creation
    *   Load balancer and service management
*   **Functionality:** Functions similarly to the Kube Controller Manager.
*   **Execution & Port:** Runs as a **static pod** and also listens on port **10257**.

---

#### 5. KUBE SCHEDULER

*   **Role:** Determines on which node a pod should be deployed based on:
    *   Available hardware resources
    *   Resource usage
    *   Affinity/anti-affinity rules
    *   Other node characteristics

> **Note:** It only decides/determines the node for the pods to be deployed on. The actual work is done by **kubelet** running on that node. If no suitable node is found or a node name mismatch happens, the pod status remains **Pending**.

*   **Process:** It uses a four-step process:
    *   **Pre-filter:** Filter out all the nodes which are schedulable.
    *   **Filtering nodes:** Eliminate nodes that do not meet requirements. For example, eliminating the nodes that do not have sufficient CPU and memory requested by the POD.
    *   **Scoring:** Uses a priority function to assign a score (0-10) to eligible nodes to find the best fit.
    *   **Reserve and bind:** Reserve the workload object on the particular node and send a bind request to the Kube API Server, which then updates the pod spec with the node name.
*   **Execution & Port:** Runs as a **static pod** and listens on port **10259**.

---

### COMPUTE PLANE COMPONENTS

*(Diagram: Compute Plane Node - kubelet, CRI containerd, kube-proxy, POD)*

#### 1. KUBELET:

*   **Role:** **kubelet** is the **primary agent** that runs on every node (both control and compute).
*   **Execution:** It runs as a **systemd service/daemonset (not a static pod)** on each and every node in the cluster.
*   **Functionality:**
    *   Once the kube-scheduler assigns a pod/workload to a node, kubelet pulls the necessary container images by communicating with the CR through **CRI** via **gRPC v3 API** and starts containers, thus creating the pods. It also sends regular pod status updates to `kube-apiserver`.
    *   Stores all Kubernetes configuration files under: `/var/lib/kubelet`
    *   Manages **static pods** (e.g., system-level/control plane node component pods like kube api server, etcd).
    *   Automatically **restarts failed pods** by recreating their containers inside that pod.
    *   Handles **storage management** for pod volumes.
*   **Port:** By default, kubelet listens on port **10250**.

> **Note:** Unlike other components, `kubeadm` does not deploy kubelet. The kubelet must be installed manually and running separately on each node before using kubeadm.

---

#### 2. CRI (CONTAINER RUNTIME INTERFACE):

*   **Role:** A **plugin interface** that allows **kubelet** (Kubernetes itself) to communicate with different container runtimes.
*   **Supported Runtimes:**
    *   **containerd** (default runtime from Kubernetes v1.24+)
    *   Docker (deprecated from v1.24 onward)
    *   **CRI-O**
    *   Mirantis container runtime etc.

##### OCI - Open Container Initiative

*   `imagespec` (spec of how the image must be built)
*   `runtimespec` (how any CR must be developed)

##### crictl (ctr):

*   **Role:** Tool maintained by the Kubernetes community to inspect and debug container runtimes.

```bash
$ crictl
$ crictl pull busybox
$ crictl images
$ crictl ps -a
$ crictl exec -i -t 3e025dd50a72d956c4f14881fbb5b1080c9275674e95fb67f965f6478a957d60 ls
$ crictl logs 3e025dd50a72d956c4f1
$ crictl pods
```

*(Diagram: DOCKER VS CONTAINERD architecture flow)*

*   **containerd** is now preferred over Docker due to **lower latency and fewer abstraction layers (no need for dockershim)**.
*   **containerd** is an official **CNCF** project.

---

#### 3. KUBE PROXY

*   **Role:** It is a **process/systemd service/daemonset** that **runs on each node** and looks for new services. Whenever a new service is created, it **creates the appropriate rules on each node** with the help of proxy modes to forward traffic/packets from those services to the backend pods. It acts like a **traffic distributor**.
*   **Functionality:**
    *   Watches the control plane for updates on **Services** and **EndpointSlices**.
    *   Uses **iptables** or **IPVS** or **userspace** (depending on configuration) to route traffic to appropriate backend pods.
    *   Implements **round-robin load balancing** for service traffic.
    *   Ensures external and internal cluster traffic reaches the right pods based on the service definitions.
*   **Proxy Modes Supported:**
    *   `userspace` (deprecated)
    *   `iptables` (Linux kernel-level packet filtering)
    *   `IPVS` (**IP Virtual Server**; more scalable and faster)
*   **Service Routing:**
    *   When traffic is sent to a Service (via **ClusterIP** or DNS), `kube-proxy` routes the request to one of the backend pods using the defined proxy mode and load balancing strategy.

*(Diagram: Service Routing - Client Pod -> IP address for Service -> kube-proxy -> Backend Pod 1, 2, or 3)*

---

### PORTS AND PROTOCOLS

#### Control plane

| Protocol | Direction | Port Range | Purpose | Used By |
| :--- | :--- | :--- | :--- | :--- |
| TCP | Inbound | 6443 | Kubernetes API server | All |
| TCP | Inbound | 2379-2380 | etcd server client API | kube-apiserver, etcd |
| TCP | Inbound | 10250 | Kubelet API | Self, Control plane |
| TCP | Inbound | 10259 | kube-scheduler | Self |
| TCP | Inbound | 10257 | kube-controller-manager | Self |

#### Worker node(s)

| Protocol | Direction | Port Range | Purpose | Used By |
| :--- | :--- | :--- | :--- | :--- |
| TCP | Inbound | 10250 | Kubelet API | Self, Control plane |
| TCP | Inbound | 30000-32767 | NodePort Services | All |
