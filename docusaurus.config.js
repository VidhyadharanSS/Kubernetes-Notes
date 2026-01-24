// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  // --- General Info (Using your updated details) ---
  title: "Vidhya Dharan Blog",
  tagline: "Hi, I am Vidhya Dharan S S",
  favicon: "img/favicon_io/337b1ccca70a7a173f9f0f0acecc8586 (1).jpg",

  // Future flags
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // --- Deployment Settings (Using your specified repo details) ---
  url: "https://VidhyadharanSS.github.io", // Set to standard GitHub Pages URL
  baseUrl: "/Kubernetes-Notes/", // Set to your repository name as baseUrl
  organizationName: "VidhyadharanSS", // Your GitHub username
  projectName: "Kubernetes-Notes", // Your repository name
  trailingSlash: false,

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  // i18n Settings
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Set route base path to root for cleaner URLs
          routeBasePath: "/",
          sidebarPath: require.resolve("./sidebars.js"),
          // Link to edit on GitHub using your new repo details
          editUrl:
            "https://github.com/VidhyadharanSS/Kubernetes-Notes/tree/main/",
        },
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "img/neon-genesis-evangelion-ayanami-rei-moon.jpg", // Kept your image
      navbar: {
        title: "Vidhya Dharan's Blog", // Cleaned up title
        logo: {
          alt: "K8s Logo",
          src: "img/favicon_io/337b1ccca70a7a173f9f0f0acecc8586 (1).jpg", // Kept your logo path
        },
        items: [
          {
            type: "docSidebar",
            sidebarId: "kubernetesSidebar", // <--- CORRECTED ID HERE
            position: "left",
            label: "Documentation", // Cleaned up label
          },
          {
            href: "https://github.com/VidhyadharanSS/Kubernetes-Notes", // Updated GitHub link
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Copyright © ${new Date().getFullYear()} Kubernetes Study Notes. Built with Docusaurus.`, // Cleaned up copyright
      },
      prism: {
        theme: prismThemes.dracula, // Reverted to original theme as requested
        darkTheme: prismThemes.dracula,
        // Added common languages from the merge for completeness
        additionalLanguages: ["bash", "yaml", "json", "docker"],
      },
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
    }),
  markdown: {
    format: "detect",
  },
  plugins: [
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        language: ["en"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],
};

export default config;
