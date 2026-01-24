import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true
  },
  {
    path: '/search',
    component: ComponentCreator('/search', '822'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', 'ac1'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', '3c3'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '8ef'),
            routes: [
              {
                path: '/architecture-workflow/architecture',
                component: ComponentCreator('/architecture-workflow/architecture', '0f5'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/architecture-workflow/workflow',
                component: ComponentCreator('/architecture-workflow/workflow', '110'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/authentication/symmetric-asymmetric-encryption-https',
                component: ComponentCreator('/authentication/symmetric-asymmetric-encryption-https', '77e'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/authentication/tls-in-kubernetes',
                component: ComponentCreator('/authentication/tls-in-kubernetes', 'e24'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/authorization/admission-controllers',
                component: ComponentCreator('/authorization/admission-controllers', '030'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/authorization/authorization-mechanisms',
                component: ComponentCreator('/authorization/authorization-mechanisms', 'a73'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/authorization/rbac',
                component: ComponentCreator('/authorization/rbac', '92c'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/authorization/service-accounts',
                component: ComponentCreator('/authorization/service-accounts', '21b'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/crds-operators/crds',
                component: ComponentCreator('/crds-operators/crds', '0c3'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/crds-operators/operators',
                component: ComponentCreator('/crds-operators/operators', 'c5f'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/ingress-gateway/gateway-api',
                component: ComponentCreator('/ingress-gateway/gateway-api', '3ae'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/ingress-gateway/ingress',
                component: ComponentCreator('/ingress-gateway/ingress', '5f4'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/kustomize-helm/helm',
                component: ComponentCreator('/kustomize-helm/helm', 'e6d'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/kustomize-helm/kustomize',
                component: ComponentCreator('/kustomize-helm/kustomize', '791'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/kustomize-helm/statefulsets',
                component: ComponentCreator('/kustomize-helm/statefulsets', 'e31'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/networking/dns-coredns',
                component: ComponentCreator('/networking/dns-coredns', '79c'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/networking/network-policies',
                component: ComponentCreator('/networking/network-policies', '147'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/resource-management/core-extensions-plugins',
                component: ComponentCreator('/resource-management/core-extensions-plugins', 'e74'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/resource-management/health-probes',
                component: ComponentCreator('/resource-management/health-probes', '464'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/resource-management/hpa-vpa',
                component: ComponentCreator('/resource-management/hpa-vpa', '888'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/resource-management/multi-container-pod-patterns',
                component: ComponentCreator('/resource-management/multi-container-pod-patterns', 'b50'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/resource-management/pod-termination-lifecycle-restart-imagepull',
                component: ComponentCreator('/resource-management/pod-termination-lifecycle-restart-imagepull', '10d'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/resource-management/resource-limits-ranges-quotas',
                component: ComponentCreator('/resource-management/resource-limits-ranges-quotas', 'ea2'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/scheduling/manual-scheduling-static-pods',
                component: ComponentCreator('/scheduling/manual-scheduling-static-pods', '9fb'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/scheduling/taints-tolerations-node-selectors-affinity',
                component: ComponentCreator('/scheduling/taints-tolerations-node-selectors-affinity', '164'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/security/image-pull-secrets',
                component: ComponentCreator('/security/image-pull-secrets', 'a2b'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/security/pod-security-standards',
                component: ComponentCreator('/security/pod-security-standards', '177'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/security/priority-classes',
                component: ComponentCreator('/security/priority-classes', '407'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/storage/configmaps-secrets',
                component: ComponentCreator('/storage/configmaps-secrets', '3d7'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/storage/daemonsets-jobs-cronjobs',
                component: ComponentCreator('/storage/daemonsets-jobs-cronjobs', '1b8'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/storage/docker-volumes-revisited',
                component: ComponentCreator('/storage/docker-volumes-revisited', '1d3'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/storage/volumes-ephemeral-emptydir-downward-api',
                component: ComponentCreator('/storage/volumes-ephemeral-emptydir-downward-api', 'df7'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/storage/volumes-persistent-in-tree-csi-hostpath',
                component: ComponentCreator('/storage/volumes-persistent-in-tree-csi-hostpath', '7ab'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/storage/volumes-persistent-pv-pvc-storage-classes',
                component: ComponentCreator('/storage/volumes-persistent-pv-pvc-storage-classes', '3c3'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/workloads-services/design-patterns-microservices',
                component: ComponentCreator('/workloads-services/design-patterns-microservices', '6ca'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/workloads-services/imperative-commands',
                component: ComponentCreator('/workloads-services/imperative-commands', '044'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/workloads-services/pods-rc-rs-deployment',
                component: ComponentCreator('/workloads-services/pods-rc-rs-deployment', '021'),
                exact: true,
                sidebar: "kubernetesSidebar"
              },
              {
                path: '/workloads-services/services-namespaces',
                component: ComponentCreator('/workloads-services/services-namespaces', '8e3'),
                exact: true,
                sidebar: "kubernetesSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
