# Kubernetes - Pods, RC, RS, Deployment

---

## PODS

*   A **POD** creates a logical layer to group one or more containers to have a **common network namespace** and **shared storage**.
*   It is the **single instance of an application** and the smallest object you can create in Kubernetes.
*   Pods have a **one-to-one relationship with containers** running the application. To scale up, you create new pods; to scale down, you delete existing pods. You **do not add additional containers to an existing pod** (except in the case of multi-container pods/helper containers).
*   A Pod has a unique IP address assigned from the cluster's Pod network CIDR (e.g., `--pod-network-cidr=10.244.0.0/16`). This IP address is **ephemeral**; if the Pod gets deleted, the IP is removed.
*   Containers inside a Pod talk to each other on `localhost/127.0.0.1:<port_no>` because they share the same network stack. The port number for each container must be unique to aid in communication.
*   **Replication of data** among containers inside the Pod can be achieved using **shared storage**.
*   You need to create containers inside a POD which are **dependent to each other** in some way.

### PODS - COMMANDS

1.  **To create a pod** with an nginx image from the DockerHub repository:
    ```bash
    kubectl run nginx --image nginx
    ```
2.  **To get the pods**:
    ```bash
    kubectl get pods
    ```
3.  **To get pods with their IP or with yaml/json output**:
    ```bash
    kubectl get po -o wide
    kubectl get po -o yaml
    ```
4.  **To delete and recreate an existing pod**:
    ```bash
    kubectl replace --force -f app.yaml
    ```
5.  **To get all the pods in a particular namespace**:
    ```bash
    kubectl get po -n <namespace>
    ```
6.  **To get detailed information** about a pod (labels, containers, events):
    ```bash
    kubectl describe pod <pod-name>
    ```
7.  **To check logs of a pod**:
    ```bash
    kubectl logs po <podname>
    kubectl logs po <podname> -c <containername>
    ```
8.  **To delete a pod** (Pods are ephemeral):
    ```bash
    kubectl delete po <podname>
    ```
9.  **To apply a yaml file**:
    ```bash
    kubectl create -f app.yaml  # Creates the resource
    kubectl apply -f app.yaml   # Creates or updates the resource
    ```

### BASIC YAML FILE:

#### Parameters:

| Field | Description |
| :--- | :--- |
| `apiVersion` | Defines the Kubernetes API version (for Pod, it is usually `v1`). |
| `kind` | Type of object being created. For a pod, it is `Pod`. |
| `metadata` | Contains identifying data like `name`, `labels`, etc. |
| `metadata.name` | Name of the pod (must be DNS-compliant). |
| `spec` | Main configuration block for the pod. |
| `spec.containers` | List of containers in the pod. Each pod must have at least one container. |
| `containers.name` | Name of the container inside the pod. |
| `containers.image` | Docker image to run in the container (e.g., `nginx`, `busybox`). |

#### Example Pod YAML:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod
  labels:
    app: my-app
    environment: dev
spec:
  containers:
  - name: main-container
    image: nginx:1.23.4
    ports:
    - containerPort: 80
      name: http
      protocol: TCP
    env:
    - name: ENV_VAR_1
      value: "value1"
    - name: ENV_VAR_2
      value: "value2"
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
    - name: data-volume
      mountPath: /var/data
  volumes:
  - name: config-volume
    configMap:
      name: app-config
  - name: data-volume
    emptyDir: {}
```

---

## REPLICATION CONTROLLER

#### What is a ReplicationController?

*   Ensures that a specified **number of pod replicas** are always running.
*   If a pod crashes or is deleted, the RC will **create a new one**.
*   It is an **older concept**, replaced by `ReplicaSet`, but still available.

##### Key Features:

*   Used to maintain **pod availability**.
*   **Watches** pod health and **replaces** failed pods automatically.
*   Cannot manage pods created manually (outside its definition).
*   Pods are matched using **selector** labels.

#### Example ReplicationController YAML:

```yaml
apiVersion: v1
kind: ReplicationController
metadata:
  name: myapp-rc
spec:
  replicas: 3
  selector:
    app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp-container
        image: nginx
        ports:
        - containerPort: 80
```

#### Commands:

1.  **Create RC**:
    ```bash
    kubectl apply -f rc.yaml
    ```
2.  **List RCs**:
    ```bash
    kubectl get rc
    ```
3.  **Describe RC**:
    ```bash
    kubectl describe rc myapp-rc
    ```
4.  **View managed pods**:
    ```bash
    kubectl get pods -l app=myapp
    ```
5.  **Delete RC (pods also go)**:
    ```bash
    kubectl delete rc myapp-rc
    ```

---

## REPLICASET

#### What is a ReplicaSet?

*   **Next-generation** `ReplicationController`.
*   Maintains a stable set of **replica pods**.
*   Supports **set-based selectors** (more powerful).
*   Backbone of **Deployments** in modern Kubernetes.

##### Key Features:

*   Maintains desired pod count.
*   Matches pods using **label selectors**.
*   Commonly used **indirectly via Deployments**.

#### Example ReplicaSet YAML:

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: myapp-rs
spec:
  replicas: 2
  selector:
    matchExpressions:
    - key: tier
      operator: In
      values:
      - frontend
      - backend
  template:
    metadata:
      labels:
        app: myapp
        tier: frontend
    spec:
      containers:
      - name: nginx-container
        image: nginx
        ports:
        - containerPort: 80
```

#### Commands:

*   **To get all replicasets**:
    ```bash
    kubectl get rs -o wide
    ```
*   **To get all pods with labels**:
    ```bash
    kubectl get po -o wide --show-labels
    ```
*   **To scale out**:
    ```bash
    kubectl scale --replicas=5 rs/nginx-demo-rs
    ```
*   **To edit the replicaset**:
    ```bash
    kubectl edit rs/nginx-demo-rs
    ```
*   **To delete the replicaset with pods**:
    ```bash
    kubectl delete rs nginx-demo-rs
    ```
*   **To delete the replicaset without the pods (Orphan)**:
    ```bash
    kubectl delete --cascade=orphan rs nginx-demo-rs
    ```

*   **To unlabel a pod**:
    ```bash
    kubectl label po <podname> app- (Unlabel a pod)
    ```
*   **To label/re-label a pod again**:
    ```bash
    kubectl label po <podname> app=nginx [--overwrite] (Label/re-label a pod)
    ```

---

## DEPLOYMENT

#### What is a Deployment?

*   A **higher-level abstraction** that manages **ReplicaSets**, which in turn manage **Pods**.
*   Flow: **Deployment → ReplicaSet → Pods**.
*   Supports 2 update strategies:
    *   **Rolling updates** (zero downtime, gradually replaces old pods with new ones).
    *   **Recreate** (Stops all old pods, then starts new ones, causes downtime).
    *   *Strategy Parameters (for RollingUpdate):*
        *   `maxUnavailable`: (Default 25%) Max number/percentage of Pods that can be unavailable during the update.
        *   `maxSurge`: (Default 25%) Max number/percentage of Pods that can be created above the desired number of Pods during an update.
*   Supports **Rollout** (upgrading to a higher version) and **Rollback** (reverting to an older version).
*   Deployments add a `pod-template-hash` label to the ReplicaSets they create (and thus to the pods). This hash distinguishes between different revisions (default `revisionHistoryLimit: 10`). **Do not modify this label.**

#### Example Deployment YAML:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp-container
        image: nginx:1.21
        ports:
        - containerPort: 80
```

#### COMMANDS:

| Action | Command |
| :--- | :--- |
| View details of a deployment | `kubectl describe deployment <name>` |
| View YAML of deployment | `kubectl get deployment <name> -o yaml` |
| Edit deployment live | `kubectl edit deployment <name>` |
| Delete deployment | `kubectl delete deployment <name>` |
| Scale deployment | `kubectl scale deployment <name> --replicas=4` |
| Update image (rolling update) | `kubectl set image deployment/<name> <container>=<new-image>` |
| Pause rollout | `kubectl rollout pause deployment <name>` |
| Resume rollout | `kubectl rollout resume deployment <name>` |
| Check rollout status | `kubectl rollout status deployment <name>` |
| View rollout history | `kubectl rollout history deployment <name>` |
| Rollback to previous version | `kubectl rollout undo deployment <name>` |
| Rollback to specific revision | `kubectl rollout undo deployment <name> --to-revision=<rev>` |

---
