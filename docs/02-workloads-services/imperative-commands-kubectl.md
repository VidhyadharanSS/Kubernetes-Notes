# Kubernetes - Imperative commands, Kubectl apply working


## KUBERNETES - DECLARATIVE VS IMPERATIVE APPROACH

### 1. Imperative Approach

*   **Definition:** Directly issue commands to modify cluster state. Focuses on **how** to achieve changes.
*   **Use Cases:** Quick debugging, one-off tasks, learning.

### 2. Declarative Approach

*   **Definition:** Define the **desired state** in **YAML/JSON** manifests. Kubernetes reconciles the actual state to match the desired state.
*   **Use Cases:** Production environments, CI/CD, version-controlled infrastructure.

---

## SOME USEFUL COMMANDS - IMPERATIVE APPROACH

These commands are useful for quickly interacting with the cluster or generating manifests.

*   `--dry-run`: By default, as soon as the command is run, the resource will be created. If you simply want to test your command, use the `--dry-run=client` option. This will **not create the resource**; instead, it tells you whether the resource *can* be created and if your command syntax is correct.
*   `-o yaml`: This will output the resource definition in YAML format on screen.

You can use these two options in combination to generate a resource definition file quickly, which you can then modify and create resources from, instead of creating the files from scratch.

### POD

*   **Create an NGINX Pod** (Imperative):
    ```bash
    kubectl run nginx --image=nginx
    ```
*   **Generate POD Manifest YAML file** (`-o yaml`). **Don't create it** (`--dry-run=client`):
    ```bash
    kubectl run nginx --image=nginx --dry-run=client -o yaml
    ```

### Deployment

*   **Create a deployment** (Imperative):
    ```bash
    kubectl create deployment --image=nginx nginx
    ```
*   **Generate Deployment YAML file** (`-o yaml`). **Don't create it** (`--dry-run=client`):
    ```bash
    kubectl create deployment --image=nginx nginx --dry-run=client -o yaml
    ```
*   **Generate Deployment with 4 Replicas**:
    ```bash
    kubectl create deployment nginx --image=nginx --replicas=4
    ```
*   **Scale a deployment** using the `kubectl scale` command:
    ```bash
    kubectl scale deployment nginx --replicas=4
    ```
*   **Save the YAML definition to a file** and modify it later:
    ```bash
    kubectl create deployment nginx --image=nginx --dry-run=client -o yaml > nginx-deployment.yaml
    ```
    You can then update the YAML file with the replicas or any other field before creating the deployment.

### Service

*   **Create a Service named `redis-service` of type `ClusterIP`** to expose pod `redis` on port `6379`:
    ```bash
    kubectl expose pod redis --port=6379 --name=redis-service --dry-run=client -o yaml
    ```
    *(This will automatically use the pod's labels as selectors).*

    **OR**

    ```bash
    kubectl create service clusterip redis --tcp=6379:6379 --dry-run=client -o yaml
    ```
    *(This will **not** use the pod's labels as selectors, instead it assumes selectors like `app=redis`. This can cause issues if your pod has a different label set. It's recommended to generate the file and modify selectors manually before creation.)*

*   **Create a Service named `nginx` of type `NodePort`** to expose pod `nginx`'s port 80 on port `30080` on the nodes:
    ```bash
    kubectl expose pod nginx --type=NodePort --port=80 --name=nginx-service --dry-run=client -o yaml
    ```
    *(This automatically uses the pod's labels as selectors, but **you cannot specify the NodePort** via `expose`. You must generate the file and manually add the `nodePort` field before creation.)*

    **OR**

    ```bash
    kubectl create service nodeport nginx --tcp=80:80 --node-port=30080 --dry-run=client -o yaml
    ```
    *(This will **not** use the pod's labels as selectors.)*

> **Recommendation:** Both imperative commands have challenges. For specifying a NodePort, generate the definition file using `kubectl expose` and manually input the `nodePort` before creating the service.

---

## HOW KUBECTL APPLY WORKS IN THE BACKEND

When using `kubectl apply`, Kubernetes internally manages three states to determine what changes to make to the live resource:

| Name | Location | Purpose |
| :--- | :--- | :--- |
| **Local Object Definition** | Your YAML file (`.yaml`) | What you **want** the resource to be (your desired state). |
| **Last Applied Configuration** | Stored in **annotations** on the object | **Snapshot** of the last time you ran `kubectl apply`. |
| **Live Object Configuration** | Stored in the cluster | The **current actual state** of the resource in the cluster. |

### Internal Storage Example (Local Object Definition)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: httpd
  labels:
    type: web-server
spec:
  app: my-app
  containers:
  - name: nginx-web-server
    image: nginx:1.17
```

*   When you run `kubectl apply -f local-object-definition.yml` and the object does not exist, it is **created**.
*   When created, a "**live object configuration**" (the initial actual state) is also generated with status fields added.

### The Role of `last-applied-configuration`

When you use `kubectl apply`, it performs a three-way merge comparison: **Local Object Definition**, **Last Applied Configuration**, and **Live Object Configuration**.

*   **Updates:** If the image is updated locally (e.g., to `nginx:1.18`), the difference between the **Local** and **Live** configurations is computed, and the live configuration is updated.
*   **Crucial for Deletions:** The **Last Applied Configuration** is essential for detecting fields that were **deleted** from your local YAML file.
    *   If a field (like a label) exists in the **Last Applied Configuration** but is **missing** from the **Local Object Definition**, `kubectl apply` knows that field must be **removed** from the **Live Object Configuration**.
    *   If a field is in **Live** but missing from both **Local** and **Last Applied**, it is left alone.

---
