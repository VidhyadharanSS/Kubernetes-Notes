# Pod Termination, Restart Policy, Image Pull Policy, and Lifecycle Phases

---

## Pod Termination (Graceful Shutdown)

When a Pod is deleted (via `kubectl delete pod` or scaling down), Kubernetes initiates a **graceful termination sequence** rather than an abrupt shutdown.

![SigTerm Policy](../static/images/2-scheduling/1756481329550.png)

1.  **SIGTERM Signal:** Kubernetes first sends a `SIGTERM` signal to the main process of *each container* inside the Pod, instructing the application to shut down gracefully.
2.  **Termination Grace Period:** By default, Kubernetes waits for **30 seconds** (`terminationGracePeriodSeconds` defined in the Pod spec) for the container to exit cleanly after receiving `SIGTERM`.
3.  **SIGKILL Signal:** If the container does not exit within the grace period, Kubernetes sends a **`SIGKILL`** signal to force an immediate, abrupt shutdown.

### Forcing Immediate Deletion (Bypassing Grace Period)

You can force an immediate deletion, which sends `SIGKILL` right away without waiting for the grace period:

```bash
kubectl delete po <pod-name> --force=true --grace-period=0
```
This immediately removes the Pod from the API server and instructs the container runtime to kill the container without giving the application time to shut down gracefully.

---

## RESTART POLICY


The `restartPolicy` is defined at the **Pod-level** and applies to all containers within that Pod. Kubernetes watches the container's **exit code**: **0** indicates success, and a **non-zero** status code indicates failure.


| Restart Policy | Behavior | Use Case |
| :--- | :--- | :--- |
| **`Always`** | The container will be **restarted regardless of its exit code** (0 or non-zero). | Continuous availability needs (e.g., web servers, application pods). |
| **`OnFailure`** | The container will be **restarted only if it exits with a non-zero status code**. | Data processing, batch jobs, or cronjobs that should only be retried upon failure. |
| **`Never`** | The container will **not be restarted** regardless of its exit code. | One-time diagnosis pods or tasks that should terminate permanently upon completion or failure. |

---

## IMAGE PULL POLICY

This is defined at the **Container-level** (`spec.containers.imagePullPolicy`).

| Policy | Behavior | Use Case |
| :--- | :--- | :--- |
| **`Always`** | Kubernetes will **always pull the image** from the registry, even if a matching image is already present on the node. | Development/Testing: Ensures you are working with the absolute latest image changes from the registry. |
| **`IfNotPresent`** | Kubernetes will pull the image **only if the image is not present** on the Node. If it's already cached locally, it will use the cached version. | Production: Ideal for faster startup times when using specific tags (like `v1.2.3`). |
| **`Never`** | Kubernetes will **never pull** the image from the registry, assuming the image is preloaded on the Node. | Air-gapped environments where nodes are preloaded with container images. |

### Effect of `imagePullPolicy: IfNotPresent` with `:latest` Tag

For containers using the `:latest` tag, **the default `imagePullPolicy` is `Always`**, regardless of what is explicitly written in the spec. This is a safety measure to ensure that `:latest` always pulls the absolute latest version available.

---

## POD LIFECYCLE PHASES

Pods move through distinct phases throughout their existence, tracked internally by Kubernetes.

| Phase | Description |
| :--- | :--- |
| **Pending** | The Pod has been accepted by the cluster, but one or more containers have not been created yet (e.g., waiting for resources, pulling images). |
| **ContainerCreating** | (Internal Tracking) The Kubelet is in the process of pulling images and creating the containers. |
| **Running** | The Pod has been bound to a Node, and all containers have been created. At least one container is running or is in the process of starting or restarting. |
| **Succeeded** | (Internal Tracking) All containers in the Pod terminated successfully (only for Pods with `restartPolicy: Never` or if they are Jobs). |
| **Completed** | (User-friendly representation) The Pod has finished its work successfully (corresponds to the internal `Succeeded` phase). |
| **Failed** | All containers in the Pod have terminated, and at least one container terminated in failure (non-zero exit code). |
| **Unknown** | The state of the Pod could not be obtained (usually due to node failure). |

**Default Phase Flow:** `Pending` $\rightarrow$ `ContainerCreating` $\rightarrow$ `Running` (or `Failed`/`Succeeded`).

---